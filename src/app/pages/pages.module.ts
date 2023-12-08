import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';

// page route
import { PagesRoutingModule } from './pages-routing.module';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        PagesRoutingModule,
        SharedModule
    ],
})
export class PagesModule {}
