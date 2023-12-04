import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { serverTimestamp } from '@angular/fire/firestore';
import { NonNullableFormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AutocompleteComponent } from 'angular-ng-autocomplete';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { BehaviorSubject, distinctUntilChanged, Observable, of, ReplaySubject, Subject, take, tap } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import {
    autoCompleteLocalFilter, formToTimestamp, NonNullableFields, selectComparatorById, showError, validateForm
} from '../../../core/helpers/utils';
import { PeriodType } from '../../../core/models/all.models';
import { Contractor } from '../../../shared/contractor/contractor.model';
import { ContractorService } from '../../../shared/contractor/contractor.service';
import { ContractorLicense } from '../../../shared/license/license.model';
import { LicenseService } from '../../../shared/license/license.service';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';
import { LocalSolutionService } from '../../../shared/local-solution/local-solution.service';
import { Payer } from '../../../shared/payer/payer.model';
import { PayerService } from '../../../shared/payer/payer.service';
import { CreateOrder, Order, OrderOperationType, orderRouteParam, OrderStatus } from '../order.model';
import { OrderService } from '../order.service';

const nonEmptyStringRequiredValidator: ValidatorFn = ({value}) => value === '' ? {required: true} : null;
const requiredLicenseValidator: ValidatorFn = ({value}) => (typeof value === 'string' || value === null) ? {required: true} : null;

type AutoCompleteLicense = Pick<ContractorLicense, 'id' | 'expirationDate' | 'localSolution'>;

@UntilDestroy()
@Component({
    templateUrl: './order-page.component.html',
    styleUrls: ['./order-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPageComponent {
    readonly selectComparator = selectComparatorById;
    readonly autoCompleteLocalFilter = autoCompleteLocalFilter<ContractorLicense>;
    readonly periodTypes = Object.values(PeriodType);
    readonly showError = showError;
    readonly formToTimestamp = formToTimestamp;
    readonly breadcrumbs$ = this.route.paramMap.pipe(
        untilDestroyed(this),
        map(map => map.get(orderRouteParam)),
        switchMap(number => !number
            ? of('ORDER.LABELS.CREATE.TITLE')
            : this.translate.get('ORDER.LABELS.DETAILS.TITLE', { number }) as Observable<string>),
        map(finalBreadcrumb => [
            'MENUITEMS.ORDERS.TEXT',
            finalBreadcrumb,
        ]),
    );
    readonly autocompleteSelectedValueRenderer = (license: string | null | AutoCompleteLicense): string => {
        if (license === null) {
            return '';
        } else if (typeof license === 'string') {
            return license;
        } else {
            const { localSolution: { name, count }, expirationDate } = license;

            return `${name} / ${count} / ${formToTimestamp(expirationDate).toDate().toLocaleDateString()}`;
        }
    };

    form = this.createOrderFormGroup;
    localSolutionSrcDialogForm = this.fb.group({
        license: this.fb.control(null as string | AutoCompleteLicense | null, [requiredLicenseValidator]),
    });
    localSolutionResDialogForm = this.fb.group({
        count: this.fb.control(null, [Validators.required, nonEmptyStringRequiredValidator, Validators.min(1)]),
        period: this.fb.group({
            count: this.fb.control(null, [Validators.required, nonEmptyStringRequiredValidator, Validators.min(1)]),
            type: this.fb.control(null, [Validators.required]),
        }),

        localSolution: this.fb.control(null as LocalSolution | null, [Validators.required]),
    });

    @ViewChild('localSolutionSrcModal') localSolutionSrcDialog?: ModalDirective;
    @ViewChild('localSolutionResModal') localSolutionResDialog?: ModalDirective;
    @ViewChild('confirmOrderModal') confirmCreateOrderDialog?: ModalDirective;
    @ViewChild(AutocompleteComponent) qwe?: AutocompleteComponent;

    readonly localSolutions$ = new BehaviorSubject<LocalSolution[]>([]);
    readonly contractorPayers$ = new ReplaySubject<Payer[]>(1);
    readonly distributors$ = new ReplaySubject<Contractor[]>(1);
    readonly distributorPayers$ = new ReplaySubject<Payer[]>(1);

    private readonly licenseSearchRequest$ = new Subject<string>();
    readonly licensesLoading$ = new BehaviorSubject<boolean>(false);
    licenseOptions: AutoCompleteLicense[] = [];

    constructor(
        private route: ActivatedRoute,
        private fb: NonNullableFormBuilder,
        private localSolutionService: LocalSolutionService,
        private contractorService: ContractorService,
        private payerService: PayerService,
        private translate: TranslateService,
        private licenseService: LicenseService,
        private orderService: OrderService,
        private router: Router,
    ) {
        this.contractorService.findCurrentUserContractor().pipe(
            untilDestroyed(this),
            take(1),
            tap(({ id, name }) => this.form.controls.contractor.reset({
                id,
                name,
            })),
            switchMap(({id}) => this.payerService.findAllForContractor(id)),
            tap((payers) => this.contractorPayers$.next(payers)),
            filter(payers => !!payers.length),
            tap(([{ id, name }]) => this.form.controls.contractorPayer.reset({
                id,
                name,
            })),
        ).subscribe();

        this.form.controls.distributor.valueChanges.pipe(
            untilDestroyed(this),
            distinctUntilChanged(),
            filter(distributor => !!distributor),
            map(distributor => distributor as NonNullable<typeof distributor>),
            map(({id}) => id),
            switchMap(distributorId => this.payerService.findAllForContractor(distributorId)),
            tap(payers => this.distributorPayers$.next(payers)),
            filter(distributorPayers => !!distributorPayers.length),
            distinctUntilChanged(),
            map(([{id, name}]) => ({id, name})),
            filter(({id}) => this.form.controls.distributorPayer.value?.id !== id),
            tap(distributorPayer => this.form.controls.distributorPayer.reset(distributorPayer)),
        ).subscribe();

        this.contractorService.findDistributors().pipe(
            untilDestroyed(this),
            take(1),
            tap(distributors => this.distributors$.next(distributors)),
            filter(distributors => !!distributors.length),
            tap(([{id, name}]) => this.form.controls.distributor.reset({
                id,
                name,
            })),
        ).subscribe();

        this.form.controls.localSolutionSrc.valueChanges.pipe(
            untilDestroyed(this),
            map(value => !!value),
            distinctUntilChanged(),
            map(hasSrc => hasSrc ? OrderOperationType.PROLONGATION : OrderOperationType.NEW_PURCHASE),
            tap(operation => this.form.controls.operation.reset(operation)),
        ).subscribe();

        this.licenseSearchRequest$.pipe(
            untilDestroyed(this),
            tap(() => this.licensesLoading$.next(true)),
            switchMap(query => this.licenseService.findByPrivateKey(query)),
            catchError(error => {
                console.error('An error occurred while querying documents:', error);
                this.licensesLoading$.next(false);
                return of(undefined);
            }),
            map(result => result as NonNullable<typeof result>),
            tap(() => this.licensesLoading$.next(false)),
            tap(licenses => this.licenseOptions = licenses),
        ).subscribe();
    }

    selectLocalSolutionSrcLicense(license: AutoCompleteLicense | null) {
        this.localSolutionSrcDialogForm.controls.license.setValue(license);
        this.licenseOptions = [];
    }

    autocompleteLicenses() {
        this.licenseSearchRequest$.next(this.localSolutionSrcDialogForm.controls.license.value as string);
    }

    private get createOrderFormGroup() {
        return this.fb.group({
            localSolutionSrc: this.fb.control(null as Order['localSolutionSrc']),
            localSolutionRes: this.fb.control(null as Order['localSolutionRes'] | null, [Validators.required]),
            amountTotal: this.fb.control('', Validators.required),
            client: this.fb.group({
                name: this.fb.control('', [Validators.required, Validators.minLength(3)]),
                taxCode: this.fb.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]),
            }),
            contact: this.fb.group({
                name: this.fb.control('', [Validators.required, Validators.minLength(3)]),
                phone: this.fb.control('', [Validators.required, Validators.pattern(/^380\d{2}\d{3}\d{2}\d{2}$/)]),
                email: this.fb.control('', [Validators.required, nonEmptyStringRequiredValidator, Validators.email]),
            }),
            contractor: this.fb.control(null as Omit<Contractor, 'contractorIds'> | null, [Validators.required]),
            contractorPayer: this.fb.control(null as Payer | null, [Validators.required]),
            distributor: this.fb.control(null as Omit<Contractor, 'contractorIds'> | null, [Validators.required]),
            distributorPayer: this.fb.control(null as Payer | null, [Validators.required]),
            operation: this.fb.control(OrderOperationType.NEW_PURCHASE, [Validators.required]),
            licenseId: this.fb.control(null as Order['licenseId'], []),
        });
    }

    beforeEditLocalSolutionSrc() {
        const {licenseId, localSolutionSrc} = this.form.value;

        if (!(licenseId && localSolutionSrc)) {
            this.localSolutionSrcDialogForm.reset();
        } else {
            const {id, name, count, expirationDate} = localSolutionSrc;

            this.localSolutionSrcDialogForm.reset({
                license: {
                    id: licenseId,
                    localSolution: {
                        id,
                        name,
                        count,
                    },
                    expirationDate,
                }
            });
        }

        this.localSolutionSrcDialog!.show();
    }

    confirmEditLocalSolutionSrc() {
        this.localSolutionSrcDialog!.hide();
        const {
            id: licenseId,
            localSolution: { id, name, count },
            expirationDate
        } = this.localSolutionSrcDialogForm.value.license as AutoCompleteLicense;

        this.form.controls.licenseId.reset(licenseId);
        this.form.controls.localSolutionSrc.reset({
            id,
            name,
            count,
            expirationDate: formToTimestamp(expirationDate),
        });
    }

    beforeEditLocalSolutionRes() {
        if (!this.localSolutions$.value.length) {
            this.localSolutionService.findAll().then(localSolutions => this.localSolutions$.next(localSolutions));
        }

        const {localSolutionRes} = this.form.value;

        this.localSolutionResDialogForm.reset({
            localSolution: localSolutionRes && localSolutionRes.id && localSolutionRes.name ? {
                id: localSolutionRes.id,
                name: localSolutionRes.name,
            } : null,
            count: localSolutionRes?.count as any,
            period: {
                count: localSolutionRes?.period.count || 1,
                type: localSolutionRes?.period.type || PeriodType.YEAR,
            } as any,
        });

        this.localSolutionResDialog!.show();
    }

    confirmEditLocalSolutionRes() {
        this.localSolutionResDialog!.hide();

        const {
            period,
            count,
            localSolution: { id, name, }
        } = this.localSolutionResDialogForm.value as NonNullableFields<typeof this.localSolutionResDialogForm.value>;

        this.form.controls.localSolutionRes.patchValue({
            period,
            count,
            id,
            name,
        } as any);
    }

    createOrder() {
        if (this.form.invalid) {
            validateForm(this.form);
        } else {
            this.confirmCreateOrderDialog!.show();
        }

    }

    confirmCreateOrder() {
        this.confirmCreateOrderDialog!.hide();

        const formValue = this.form.value as any as Omit<CreateOrder, 'createdDate' | 'status'>;
        const { localSolutionRes: { count } } = formValue;
        const order: CreateOrder = {
            ...formValue,
            localSolutionRes: {
                ...formValue.localSolutionRes,
                count: parseInt(count as any as string),
            },
            createdDate: serverTimestamp(),
            status: OrderStatus.NEW,
        };

        this.orderService.createOrder(order).pipe(
            untilDestroyed(this),
            tap(number => this.router.navigate(['../', number], {relativeTo: this.route})),
        ).subscribe();
    }
}
