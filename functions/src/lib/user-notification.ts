import { CollectionReference, DocumentReference, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { DocumentSnapshot, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { db, processedEventsCollRef } from '../admin';
import { defaultSlowOperationTimeoutSeconds, processInBatches, region } from '../util';
import { _Paths, _UserNotification, _UserNotificationMetadata } from '../util/types';

export const markAllUserNotificationsAsRead = onCall<void, Promise<void>>({ cors: true, region, timeoutSeconds: defaultSlowOperationTimeoutSeconds }, async ({ auth }) => {
    if (!(auth && auth.uid)) {
        logger.error('Insufficient permissions, listing auth arg', auth);
        return;
    }

    const {uid} = auth;

    const collRef = db().collection(`users/${uid}/user-notifications`) as CollectionReference<_UserNotification>;
    const metadataDocRef = db().collection(`users/${uid}/user-notifications-metadata`).doc(uid) as DocumentReference<_UserNotificationMetadata>;

    logger.info(`Starting markAllAsRead userNotifications for uid ${uid}`);

    const markedCount = await processInBatches(
        () => collRef.where('isRead' as _Paths<_UserNotification>, '==', false),
        async docRefs => {
            const batch = db().batch();
            docRefs.forEach(({ref}) => batch.update(ref, {isRead: true, skipUpdateTriggers: true}));
            await batch.commit();
        },
    );

    await metadataDocRef.update({ unreadCount: 0 });

    logger.info(`Marked a total of ${markedCount} userNotifications as read for uid ${uid}`);

    return;
});

export const deleteAllUserNotifications = onCall<void, Promise<void>>({ cors: true, region, timeoutSeconds: 600 }, async ({ auth }) => {
    if (!(auth && auth.uid)) {
        logger.error('Insufficient permissions, listing auth arg', auth);
        return;
    }

    const {uid} = auth;

    const collRef = db().collection(`users/${uid}/user-notifications`) as CollectionReference<_UserNotification>;

    logger.info(`Starting deleteAll userNotifications for uid ${uid}`);

    const deletedCount = await processInBatches(
        () => collRef,
        async docRefs => {
            const updateBatch = db().batch();
            const deleteBatch = db().batch();

            docRefs.forEach(({ref}) => {
                updateBatch.update(ref, { skipUpdateTriggers: true, skipDeleteTriggers: true });
                deleteBatch.delete(ref);
            });

            await updateBatch.commit();
            await deleteBatch.commit();
        },
    );

    logger.info(`Deleted a total of ${deletedCount} userNotifications for uid ${uid}`);

    return;
});

export const onUserNotificationWritten = onDocumentWritten({ document: 'users/{userId}/user-notifications/{userNotificationId}', region }, async (event) => {
    const processedEventDocRef = processedEventsCollRef().doc(event.id);
    const docSnap = event.data.after as DocumentSnapshot;
    const oldDocSnap = event.data.before as DocumentSnapshot;
    const { userId } = event.params;
    const metadataDocRef = db().collection(`users/${userId}/user-notifications-metadata`).doc(userId) as DocumentReference<_UserNotificationMetadata>;
    const isRead = (docSnap: DocumentSnapshot) => docSnap.get('isRead' as _Paths<_UserNotification>) as _UserNotification['isRead'];
    const updateMetadataUnreadCountVersionIfNotDuplicate = async (arg: 'increment' | 'decrement') => {
        const isDuplicate = await processedEventDocRef.get().then(({exists}) => exists);

        if (isDuplicate) {
            logger.info("Repeated fn run, skipping");
        } else {
            await db().batch()
                .set(metadataDocRef, { unreadCount: FieldValue.increment(arg === 'increment' ? 1 : -1) }, { merge: true })
                .create(processedEventDocRef, { timestamp: FieldValue.serverTimestamp() })
                .commit();
        }
    };

    let opType: 'create' | 'update' | 'delete';

    if (!docSnap.exists) {
        opType = 'delete';
    } else if (oldDocSnap.exists) {
        opType = 'update';
    } else {
        opType = 'create';
    }

    if ((opType === 'create' && docSnap.get('skipCreateTriggers' as _Paths<_UserNotification>))
        || (opType === 'update' && docSnap.get('skipUpdateTriggers' as _Paths<_UserNotification>))
        || (opType === 'delete' && oldDocSnap.get('skipDeleteTriggers' as _Paths<_UserNotification>))) {


        if (opType === 'delete') {
            return null;
        }
        if (opType === 'create') {
            return (docSnap.ref as DocumentReference<_UserNotification>).update({ skipCreateTriggers: FieldValue.delete() });
        }
        if (opType === 'update') {
            if (docSnap.get('skipDeleteTriggers' as _Paths<_UserNotification>)) {
                return null;
            }

            return (docSnap.ref as DocumentReference<_UserNotification>).update({ skipUpdateTriggers: FieldValue.delete() });
        }
    }

    switch (opType) {
        case "create": {
            if (!isRead(docSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('increment');
            }
            return;
        }
        case "update": {
            if (docSnap.get('skipUpdateTriggers' as _Paths<_UserNotification>)) {
                if (docSnap.get('skipDeleteTriggers' as _Paths<_UserNotification>)) {
                    // skip logic (update from another function) and don't clear the field - will delete as well from another function
                    return;
                }
                // skip logic (update from another function) but clear the field
                return (docSnap.ref as DocumentReference<_UserNotification>).update({ skipUpdateTriggers: FieldValue.delete() });
            }
            if (isRead(oldDocSnap) && !isRead(docSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('increment');
            }
            if (!isRead(oldDocSnap) && isRead(docSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('decrement');
            }
            return;
        }
        case 'delete': {
            if (oldDocSnap.get('skipDeleteTriggers' as _Paths<_UserNotification>)) {
                // skip logic (delete from another function)
                return;
            }
            if (!isRead(oldDocSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('decrement');
            }
            return;
        }
        default:
            return;
    }
});
