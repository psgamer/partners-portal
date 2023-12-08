import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, combineLatest, finalize, map, take, tap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { getOrderTagItemIconClass, getUserNotificationTagItemClass, UserNotification } from '../user-notification.model';
import { UserNotificationService } from '../user-notification.service';

@UntilDestroy()
@Component({
    selector: 'user-notification-panel',
    templateUrl: './user-notification-panel.component.html',
    styleUrls: ['./user-notification-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserNotificationPanelComponent {
    private readonly queryHandler = this.userNotificationService.queryHandler;
    private readonly operationLoading$ = new BehaviorSubject<boolean>(false);

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
    userNotifications$ = this.queryHandler.docs$;
    readonly unreadCountGlobal$ = this.userNotificationService.userNotificationsUnreadCount$;
    readonly getUserNotificationTagItemClass = getUserNotificationTagItemClass;
    readonly getOrderTagItemIconClass = getOrderTagItemIconClass;
    get checkedCount() {
        return Object.values(this.checkboxItems).filter(checked => checked).length;
    }

    @ViewChild('notificationDropdown', {read: BsDropdownDirective}) dropdown?: BsDropdownDirective;

    constructor(private userNotificationService: UserNotificationService) {
        this.queryHandler.docs$.pipe(
            untilDestroyed(this),
            tap(() => {
                this.headerCheckboxSelected = false;
                this.checkboxItems = {};
            }),
        ).subscribe();
    }

    markAsRead({id, isRead}: UserNotification) {
        this.loading$.pipe(
            untilDestroyed(this),
            take(1),
            filter(loading => !loading),
            tap(() => {
                if (!isRead) {
                    this.operationLoading$.next(true);
                    this.userNotificationService.markUserNotificationRead(id).pipe(
                        untilDestroyed(this),
                        finalize(() => this.operationLoading$.next(false)),
                        take(1),
                        tap(() => console.log('markAsRead success')),
                        tap(() => this.search()),
                    ).subscribe();
                }
            })
        ).subscribe();
    }

    deleteSelected() {
        this.loading$.pipe(
            untilDestroyed(this),
            take(1),
            filter(loading => !loading),
            tap(() => {
                const notificationIds: UserNotification['id'][] = Object.entries(this.checkboxItems)
                    .filter(([, checked]) => checked)
                    .map(([notificationId]) => notificationId);

                if (notificationIds.length) {
                    this.operationLoading$.next(true);
                    this.userNotificationService.deleteUserNotifications(notificationIds).pipe(
                        untilDestroyed(this),
                        finalize(() => this.operationLoading$.next(false)),
                        take(1),
                        tap(() => console.log('delete success')),
                        tap(() => this.search()),
                    ).subscribe();
                }
            })
        ).subscribe();
    }

    onCheckboxChange() {
        if (Object.values(this.checkboxItems).every(checked => checked)) {
            this.headerCheckboxSelected = true;
        } else if (this.headerCheckboxSelected) {
            this.headerCheckboxSelected = false;
        }
    }

    search() {
        this.queryHandler.search();
    }

    headerCheckboxSelected = false;
    checkboxItems: {[key: UserNotification['id']]: boolean} = {};
}
