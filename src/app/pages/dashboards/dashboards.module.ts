import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Leaflet map
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

// Flat Picker
import { FlatpickrModule } from 'angularx-flatpickr';
import * as echarts from 'echarts';

// Apex Chart Package
import { NgApexchartsModule } from 'ng-apexcharts';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

// Count To
import { CountUpModule } from 'ngx-countup';
import { NgxEchartsModule } from 'ngx-echarts';

// Simplebar
import { SimplebarAngularModule } from 'simplebar-angular';
import { SharedModule } from 'src/app/shared/shared.module';

// Page route
import { DashboardsRoutingModule } from './dashboards-routing.module';
import { NgbdIndexsSortableHeader } from './index/index-sortable.directive';

// component
import { IndexComponent } from './index/index.component';

@NgModule({
    declarations: [
        IndexComponent,
        NgbdIndexsSortableHeader
    ],
    imports: [
        CommonModule,
        DashboardsRoutingModule,
        SharedModule,
        BsDropdownModule,
        CountUpModule,
        NgApexchartsModule,
        TabsModule.forRoot(),
        TooltipModule.forRoot(),
        PaginationModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
        SimplebarAngularModule,
        ProgressbarModule.forRoot(),
        LeafletModule,
        NgxEchartsModule.forRoot({ echarts }),
        ModalModule.forRoot(),
        BsDatepickerModule.forRoot(),
        FlatpickrModule.forRoot()
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardsModule {
}
