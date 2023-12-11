import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserNotificationListComponent } from './list/user-notification-list.component';

const routes: Routes = [
    {
        path: "",
        component: UserNotificationListComponent,
        title: 'MENUITEMS.USER_NOTIFICATIONS.TEXT',
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserNotificationsRoutingModule {}
