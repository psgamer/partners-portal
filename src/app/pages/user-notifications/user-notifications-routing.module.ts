import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    // {
    //     path: "",
    //     component: UserNotificationsTableComponent,
    //     title: 'MENUITEMS.ORDERS.TABLE.TITLE',
    // }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserNotificationsRoutingModule {}
