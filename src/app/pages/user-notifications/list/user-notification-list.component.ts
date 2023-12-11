import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest, finalize, map, switchMap, take, tap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SimplebarAngularComponent } from 'simplebar-angular';
import { getOrderTagItemIconClass, getUserNotificationTagItemClass, UserNotification } from '../user-notification.model';
import { UserNotificationService } from '../user-notification.service';

@UntilDestroy()
@Component({
    templateUrl: './user-notification-list.component.html',
    styleUrls: ['./user-notification-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserNotificationListComponent {
    private readonly queryHandler = this.userNotificationService.queryHandler;
    private readonly operationLoading$ = new BehaviorSubject<boolean>(false);
    private readonly _userNotifications$ = new BehaviorSubject<UserNotification[]>([]);


    readonly loading$ = combineLatest([
        this.queryHandler.loading$,
        this.operationLoading$,
    ]).pipe(
        map(([dataLoading, opLoading]) => dataLoading || opLoading),
    );
    readonly menuItems = [{
        labelKey: 'USER_NOTIFICATION.ACTION.MARK_READ',
        action: () => this.userNotificationService.markAllUserNotificationsRead()
            .then(() => console.log('markAllUserNotificationsRead success'))
            .catch(e => console.log('markAllUserNotificationsRead failed', e)),
    },{
        labelKey: 'USER_NOTIFICATION.ACTION.DELETE',
        action: () => this.userNotificationService.deleteAllUserNotifications()
            .then(() => console.log('deleteAllUserNotifications success'))
            .catch(e => console.log('deleteAllUserNotifications failed', e)),
    }];
    readonly unreadCountGlobal$ = this.userNotificationService.userNotificationsUnreadCount$;
    readonly showLoadMore$ = combineLatest([
        this.queryHandler.searchParams$,
        this.queryHandler.totalRecords$,
        this.loading$,
    ]).pipe(map(([{page, pageSize}, total, loading]) => !loading && (total > (page * pageSize))));
    readonly getUserNotificationTagItemClass = getUserNotificationTagItemClass;
    readonly getOrderTagItemIconClass = getOrderTagItemIconClass;
    get checkedCount() {
        return Object.values(this.checkboxItems).filter(checked => checked).length;
    }
    get userNotifications$() {
        return this._userNotifications$.asObservable();
    }

    checkboxItems: {[key: UserNotification['id']]: boolean} = {};

    private isReload = false;

    @ViewChild(SimplebarAngularComponent, {read: SimplebarAngularComponent}) simplebar?: SimplebarAngularComponent;

    constructor(private userNotificationService: UserNotificationService) {
        this.queryHandler.docs$.pipe(
            untilDestroyed(this),
            tap(docs => {
                this.checkboxItems = {};
                this._userNotifications$.next([...(this.isReload ? [] : this._userNotifications$.value), ...docs]);
                this.isReload = false;
            }),
        ).subscribe();
        this.search();
    }

    loadMore() {
        this.queryHandler.searchParams$.pipe(
            untilDestroyed(this),
            take(1),
            tap(({page}) => this.queryHandler.gotoPage(page + 1)),
        ).subscribe();
    }

    markAsRead({id, isRead}: UserNotification) {
        this.loading$.pipe(
            untilDestroyed(this),
            take(1),
            filter(loading => !loading && !isRead),
            tap(() => this.operationLoading$.next(true)),
            switchMap(() => this.userNotificationService.markUserNotificationRead(id).pipe(
                untilDestroyed(this),
                finalize(() => this.operationLoading$.next(false)),
                take(1),
                tap(() => {
                    console.log('markAsRead success');
                    this.search(true);
                }),
            )),
        ).subscribe();
    }

    deleteSelected() {
        this.loading$.pipe(
            untilDestroyed(this),
            take(1),
            filter(loading => !loading),
            map(() => Object.entries(this.checkboxItems)
                .filter(([, checked]) => checked)
                .map(([notificationId]) => notificationId)),
            filter(notificationIds => !!notificationIds.length),
            tap(() => this.operationLoading$.next(true)),
            switchMap(notificationIds => this.userNotificationService.deleteUserNotifications(notificationIds).pipe(
                untilDestroyed(this),
                finalize(() => this.operationLoading$.next(false)),
                take(1),
                tap(() => {
                    console.log('delete success');
                    this.search(true);
                }),
            ))
        ).subscribe();
    }

    search(isReload = false) {
        this.isReload = isReload;
        this.queryHandler.search();
    }
}
