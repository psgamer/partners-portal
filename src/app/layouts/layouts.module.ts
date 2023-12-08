import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Offcanvas
// import { NgxAsideModule } from 'ngx-aside';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';

// Spinner
import { NgxSpinnerModule } from "ngx-spinner";

// Simplebar
import { SimplebarAngularModule } from 'simplebar-angular';
import { UserNotificationPanelComponent } from '../pages/user-notifications/panel/user-notification-panel.component';
import { SharedModule } from '../shared/shared.module';

// Language
import { FooterComponent } from './footer/footer.component';
import { HorizontalTopbarComponent } from './horizontal-topbar/horizontal-topbar.component';
import { HorizontalComponent } from './horizontal/horizontal.component';


// component
import { LayoutComponent } from './layout.component';
import { RightsidebarComponent } from './rightsidebar/rightsidebar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { TwoColumnSidebarComponent } from './two-column-sidebar/two-column-sidebar.component';
import { TwoColumnComponent } from './two-column/two-column.component';
import { VerticalComponent } from './vertical/vertical.component';

@NgModule({
    declarations: [
        LayoutComponent,
        VerticalComponent,
        TopbarComponent,
        SidebarComponent,
        FooterComponent,
        RightsidebarComponent,
        TwoColumnComponent,
        TwoColumnSidebarComponent,
        HorizontalComponent,
        HorizontalTopbarComponent,
        UserNotificationPanelComponent,
    ],
    imports: [
        CommonModule,
        BrowserAnimationsModule,
        RouterModule,
        SimplebarAngularModule,
        BsDropdownModule.forRoot(),
        TranslateModule,
        // NgxAsideModule,
        FormsModule,
        ReactiveFormsModule,
        ModalModule,
        NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
        SharedModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LayoutsModule {
}
