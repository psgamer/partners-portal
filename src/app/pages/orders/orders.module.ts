//Wizard
import { CdkStepperModule } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Ck Editer
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

// Select Droup down
import { NgSelectModule } from '@ng-select/ng-select';
import { NgStepperModule } from 'angular-ng-stepper';
import { AccordionModule } from 'ngx-bootstrap/accordion';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { RatingModule } from 'ngx-bootstrap/rating';
import { TabsModule } from 'ngx-bootstrap/tabs';

// Drop Zone
import { DROPZONE_CONFIG, DropzoneConfigInterface, DropzoneModule } from 'ngx-dropzone-wrapper';

// Simplebar
import { SimplebarAngularModule } from 'simplebar-angular';

// Page Route
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderAmountRangeService } from './order-amount-range.service';
import { OrderService } from './order.service';
import { OrdersRoutingModule } from './orders-routing.module';
import { OrderPageComponent } from './page/order-page.component';
import { OrderSortableTableHeaderDirective } from './table/order-sortable-table-header.directive';
import { OrdersTableComponent } from './table/orders-table.component';

// Component

const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
    // Change this to your upload POST address:
    url: 'https://httpbin.org/post',
    maxFilesize: 50,
    acceptedFiles: 'image/*'
};

@NgModule({
    declarations: [
        OrdersTableComponent,
        OrderSortableTableHeaderDirective,
        OrderPageComponent,
    ],
    imports: [
        CommonModule,
        OrdersRoutingModule,
        SharedModule,
        BsDropdownModule.forRoot(),
        PaginationModule.forRoot(),
        ModalModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
        AccordionModule.forRoot(),
        TabsModule.forRoot(),
        SimplebarAngularModule,
        CKEditorModule,
        DropzoneModule,
        NgStepperModule,
        CdkStepperModule,
        RatingModule,
        NgSelectModule
    ],
    providers: [
        OrderService, OrderAmountRangeService,
        {
            provide: DROPZONE_CONFIG,
            useValue: DEFAULT_DROPZONE_CONFIG
        }
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrdersModule {}
