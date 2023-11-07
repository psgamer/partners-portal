import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Component
import { OrdersTableComponent } from './table/orders-table.component';


const routes: Routes = [
    {
        path: "",
        component: OrdersTableComponent,
        title: 'MENUITEMS.ORDERS.TABLE.TITLE',
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OrdersRoutingModule {
}
