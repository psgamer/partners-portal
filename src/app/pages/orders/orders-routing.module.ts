import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { translateParamsSeparator } from '../../core/page-title-service';
import { orderRouteParam } from './order.model';
import { OrderPageComponent } from './page/order-page.component';

// Component
import { OrdersTableComponent } from './table/orders-table.component';

const routes: Routes = [
    {
        path: "",
        component: OrdersTableComponent,
        title: 'MENUITEMS.ORDERS.TABLE.TITLE',
    },{
        path: "create",
        component: OrderPageComponent,
        title: 'ORDER.LABELS.CREATE.TITLE',
    },{
        path: `:${orderRouteParam}`,
        component: OrderPageComponent,
        title: ({ params }) => `ORDER.LABELS.DETAILS.TITLE${translateParamsSeparator}${JSON.stringify({ [orderRouteParam]: params[orderRouteParam] })}`,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OrdersRoutingModule {
}
