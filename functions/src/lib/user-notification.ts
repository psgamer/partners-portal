import { CollectionReference, DocumentReference, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { DocumentSnapshot, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { db, processedEventsCollRef } from '../admin';
import { defaultBatchOperationSizeLimit, defaultSlowOperationTimeoutSeconds, region } from '../util';
import { _Paths, _UserNotification, _UserNotificationMetadata } from '../util/types';

export const markAllUserNotificationsAsRead = onCall<void, Promise<void>>({ cors: true, region, timeoutSeconds: defaultSlowOperationTimeoutSeconds }, async ({ auth }) => {
    if (!(auth && auth.uid)) {
        logger.error('Insufficient permissions, listing auth arg', auth);
        return;
    }

    const {uid} = auth;

    const collRef = db().collection(`users/${uid}/user-notifications`) as CollectionReference<_UserNotification>;
    const metadataDocRef = db().collection(`users/${uid}/user-notifications-metadata`).doc(uid) as DocumentReference<_UserNotificationMetadata>;

    const getDocsBatch = async () => collRef
        .where('isRead' as _Paths<_UserNotification>, '==', false)
        .limit(defaultBatchOperationSizeLimit)
        .get();
    let markedCount = 0;

    logger.info(`Starting markAllAsRead userNotifications for uid ${uid}`);

    let docRefs = await getDocsBatch();

    while (!docRefs.empty) {
        const batch = db().batch();
        docRefs.forEach(({ref}) => batch.update(ref, {isRead: true, skipTriggers: true}));
        await batch.commit();

        markedCount += docRefs.size;
        docRefs = await getDocsBatch()
    }

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

    const getDocsBatch = async () => collRef.limit(defaultBatchOperationSizeLimit).get();
    let deletedCount = 0;

    logger.info(`Starting deleteAll userNotifications for uid ${uid}`);

    let docRefs = await getDocsBatch();

    while (!docRefs.empty) {
        const batch = db().batch();
        docRefs.forEach(({ref}) => batch.delete(ref));
        await batch.commit();

        deletedCount += docRefs.size;
        docRefs = await getDocsBatch()
    }

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

    if (((opType === 'create' || opType === 'update') && docSnap.get('skipTriggers' as _Paths<_UserNotification>))
        || (opType === 'delete' && oldDocSnap.get('skipTriggers' as _Paths<_UserNotification>))) {
        logger.info('Skip triggers is set, skipping processing' + (opType === 'delete' ? ' and clearing the skip flag' : ''));

        return opType === 'delete'
            ? null
            : (docSnap.ref as DocumentReference<_UserNotification>).update({ skipTriggers: FieldValue.delete() });
    }

    switch (opType) {
        case "create": {
            if (!isRead(docSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('increment');
            }
            return;
        }
        case "update": {
            if (isRead(oldDocSnap) && !isRead(docSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('increment');
            }
            if (!isRead(oldDocSnap) && isRead(docSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('decrement');
            }
            return;
        }
        case 'delete': {
            if (!isRead(oldDocSnap)) {
                await updateMetadataUnreadCountVersionIfNotDuplicate('decrement');
            }
            return;
        }
        default:
            return;
    }
});
