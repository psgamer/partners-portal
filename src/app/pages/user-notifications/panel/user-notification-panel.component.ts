import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { BehaviorSubject, combineLatest, finalize, map, switchMap, take, tap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../../../core/services/language.service';
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
    readonly userNotifications$ = this.queryHandler.docs$;
    readonly unreadCountGlobal$ = this.userNotificationService.userNotificationsUnreadCount$;
    readonly getUserNotificationTagItemClass = getUserNotificationTagItemClass;
    readonly getOrderTagItemIconClass = getOrderTagItemIconClass;
    readonly language$ = this.languageService.language$;
    get checkedCount() {
        return Object.values(this.checkboxItems).filter(checked => checked).length;
    }

    checkboxItems: {[key: UserNotification['id']]: boolean} = {};

    @ViewChild('notificationDropdown', {read: BsDropdownDirective}) dropdown?: BsDropdownDirective;

    constructor(private userNotificationService: UserNotificationService, private languageService: LanguageService) {
        this.queryHandler.docs$.pipe(
            untilDestroyed(this),
            tap(() => this.checkboxItems = {}),
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
                    this.search();
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
                    this.search();
                }),
            ))
        ).subscribe();
    }

    search() {
        this.queryHandler.search();
    }
}
