import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { TimeagoModule } from 'ngx-timeago';

// component
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
import { ContractorService } from './contractor/contractor.service';
import { LicenseService } from './license/license.service';
import { LocalSolutionService } from './local-solution/local-solution.service';
import { PayerService } from './payer/payer.service';

@NgModule({
    declarations: [
        BreadcrumbsComponent,
    ],
    imports: [
        CommonModule,
        TranslateModule.forChild(),
        FormsModule,
        ReactiveFormsModule,
        NgxMaskDirective,
        NgxMaskPipe,
        AutocompleteLibModule,
    ],
    exports: [BreadcrumbsComponent, TranslateModule, FormsModule, ReactiveFormsModule, AutocompleteLibModule, TimeagoModule],
    providers: [LocalSolutionService, ContractorService, PayerService, LicenseService, provideNgxMask()],
})
export class SharedModule {
}
