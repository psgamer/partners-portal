import { Injectable, NgZone } from '@angular/core';
import { collection, doc, Firestore, onSnapshot, OrderByDirection, updateDoc, writeBatch, } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { distinctUntilChanged, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { QueryHandler } from '../../core/helpers/query.handler';
import { getBaseConverter, Paths } from '../../core/helpers/utils';
import { AuthenticationService } from '../../core/services/auth.service';
import { UserNotification, UserNotificationMetadata } from './user-notification.model';

@Injectable({ providedIn: 'root' })
export class UserNotificationService {
    private readonly markAllAsRead = httpsCallable<void, void>(this.functions, 'markAllUserNotificationsAsRead');
    private readonly deleteAll = httpsCallable<void, void>(this.functions, 'deleteAllUserNotifications');

    private get collRef$() {
        return this.auth
            .currentUser$()
            .pipe(
                map(user => user as NonNullable<typeof user>),
                map(({uid}) => collection(this.db, 'users', uid, 'user-notifications').withConverter(getBaseConverter<UserNotification>())),
            );
    }
    private get metadataDocRef$() {
        return this.auth
            .currentUser$()
            .pipe(
                map(user => user as NonNullable<typeof user>),
                map(({uid}) => doc(collection(this.db, 'users', uid, 'user-notifications-metadata').withConverter(getBaseConverter<UserNotificationMetadata>()), uid)),
            );
    }

    constructor(private db: Firestore, private auth: AuthenticationService, private functions: Functions, private zone: NgZone) {}

    get queryHandler() {
        return new QueryHandler<UserNotification, Paths<UserNotification>, OrderByDirection, {}>(
            this.collRef$,
            {
                column: 'creationDate',
                direction: 'desc',
            },
            {},
            (_new, old) => old,
            () => ({
                fieldFilterConstraints: [],
                compositeFilterConstraints: [],
            }),
        );
    }

    get userNotificationsUnreadCount$() {
        return this.metadataDocRef$.pipe(switchMap(metadataDocRef =>
            new Observable<UserNotificationMetadata['unreadCount']>(observer => {

                const snapshotSub = onSnapshot(metadataDocRef, {
                    next: orderSnap => {
                        this.zone.run(() => {
                            if (orderSnap.exists()) {
                                const unreadCount = orderSnap.get('unreadCount' as Paths<UserNotificationMetadata>) as UserNotificationMetadata['unreadCount'];

                                this.zone.run(() => observer.next(unreadCount));
                            }
                        });
                    },
                    error: e => this.zone.run(() => {
                        observer.error(e);
                        observer.complete();
                    }),
                });

                return () => this.zone.run(() => snapshotSub());
            })), distinctUntilChanged());
    }

    markUserNotificationRead(id: UserNotification['id']) {
        return this.collRef$.pipe(
            map(collRef => doc(collRef, id)),
            switchMap(docRef => updateDoc(docRef, { isRead: true })),
        );
    }

    markAllUserNotificationsRead() {
        return this.markAllAsRead();
    }

    deleteUserNotifications(ids: UserNotification['id'][]) {
        return this.collRef$.pipe(
            map(collRef => ids.map(id => doc(collRef, id))),
            switchMap(docRefs => {
                const batch = writeBatch(this.db);

                docRefs.forEach(docRef => batch.delete(docRef));

                return batch.commit();
            }),
        );
    }

    deleteAllUserNotifications() {
        return this.deleteAll();
    }
}
