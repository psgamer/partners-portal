import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// component
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
import { ContractorService } from './contractor/contractor.service';
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
    ],
    exports: [BreadcrumbsComponent, TranslateModule, FormsModule, ReactiveFormsModule],
    providers: [LocalSolutionService, ContractorService, PayerService],
})
export class SharedModule {
}
