import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Component
import { DashboardComponent } from './dashboard/dashboard.component';


const routes: Routes = [
    {
        path: "",
        component: DashboardComponent,
        title: 'MENUITEMS.DASHBOARD.TEXT',
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardsRoutingModule {
}
