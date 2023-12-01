import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '', loadChildren: () => import('./dashboards/dashboards.module').then(({ DashboardsModule }) => DashboardsModule)
    },
    {
        path: 'orders', loadChildren: () => import('./orders/orders.module').then(({ OrdersModule }) => OrdersModule)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PagesRoutingModule {
}
