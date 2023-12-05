import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { NonNullableFormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AutocompleteComponent } from 'angular-ng-autocomplete';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { BehaviorSubject, distinctUntilChanged, EMPTY, Observable, of, ReplaySubject, startWith, Subject, take, tap } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import {
    autoCompleteLocalFilter, buildUpdateObj, formToTimestamp, isEmptyUpdateObj, NonNullableFields, selectComparatorById, showError,
    validateForm
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
import { CreateOrder, getOrderTagItemClass, Order, OrderOperationType, orderRouteParam, OrderStatus, UpdateOrder } from '../order.model';
import { OrderService } from '../order.service';

const nonEmptyStringRequiredValidator: ValidatorFn = ({value}) => value === '' ? {required: true} : null;
const requiredLicenseValidator: ValidatorFn = ({value}) => (typeof value === 'string' || value === null) ? {required: true} : null;

type AutoCompleteLicense = Pick<ContractorLicense, 'id' | 'expirationDate' | 'localSolution'>;
interface UpdateOrderData {
    number: Order['number'];
    updateOrder: Partial<Omit<UpdateOrder, 'hasPendingChanges'>>;
}

@UntilDestroy()
@Component({
    templateUrl: './order-page.component.html',
    styleUrls: ['./order-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPageComponent {
    private readonly routeNumber$ = this.route.paramMap.pipe(
        untilDestroyed(this),
        map(map => map.get(orderRouteParam)),
    );
    private readonly loadOrderRequest$ = new Subject<Order['number']>();

    readonly order$ = new ReplaySubject<Order>(1);

    readonly getOrderTagItemClass = getOrderTagItemClass;
    readonly selectComparator = selectComparatorById;
    readonly autoCompleteLocalFilter = autoCompleteLocalFilter<ContractorLicense>;
    readonly periodTypes = Object.values(PeriodType);
    readonly OrderStatus = OrderStatus;
    readonly showError = showError;
    readonly updateSubmitDisabled$ = this.updateOrderData.pipe(untilDestroyed(this), map(({updateOrder}) => isEmptyUpdateObj(updateOrder)));
    readonly formToTimestamp = formToTimestamp;
    readonly breadcrumbs$ = this.routeNumber$.pipe(
        untilDestroyed(this),
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

    private get updateOrderData(): Observable<UpdateOrderData> {
        return this.order$.pipe(
            untilDestroyed(this),
            map(order => {
                const { number, client: { id, name, taxCode } } = order;
                const { name: newName, taxCode: newTaxCode } = this.form.controls.client.value;

                const clientId = ((newName === name) && (newTaxCode === taxCode))
                    ? id
                    : null;

                return {
                    number,
                    clientId,
                    order,
                }
            }),
            switchMap(({ number, clientId, order }) => this.form.valueChanges.pipe(
                startWith(this.form.value),
                map(currentFormValue => {
                    const {contractor, ...formValue} = currentFormValue as any as (Omit<UpdateOrder, 'hasPendingChanges'> & { contractor: Order['contractor'] });
                    const { localSolutionRes: { count } } = formValue;
                    const formUpdateOrder: Omit<UpdateOrder, 'hasPendingChanges'> = {
                        ...formValue,
                        localSolutionRes: {
                            ...formValue.localSolutionRes,
                            count: parseInt(count as any as string),
                        },
                        client: {
                            ...formValue.client,
                            id: clientId,
                        },
                    };
                    const updateOrder = buildUpdateObj(formUpdateOrder, order) as Partial<Omit<UpdateOrder, 'hasPendingChanges'>>;

                    return {
                        number,
                        updateOrder,
                    };
                })
            )),
        );
    }

    form = this.fb.group({
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
        contractor: this.fb.control(null as Contractor | null, [Validators.required]),
        contractorPayer: this.fb.control(null as Payer | null, [Validators.required]),
        distributor: this.fb.control(null as Contractor | null, [Validators.required]),
        distributorPayer: this.fb.control(null as Payer | null, [Validators.required]),
        operation: this.fb.control(OrderOperationType.NEW_PURCHASE, [Validators.required]),
        licenseId: this.fb.control(null as Order['licenseId'], []),
    });
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
    @ViewChild('confirmCreateOrderModal') confirmCreateOrderDialog?: ModalDirective;
    @ViewChild('confirmUpdateOrderModal') confirmUpdateOrderDialog?: ModalDirective;
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
        this.order$.pipe(
            untilDestroyed(this),
            tap(order => this.resetFormToOrder(order)),
        ).subscribe();

        this.loadOrderRequest$.pipe(
            untilDestroyed(this),
            switchMap(number => this.orderService.findOne(number).pipe(
                switchMap(order => {
                    if (!order) {
                        console.log(`order with number ${number} not found`)
                        this.router.navigate(['../']);
                        return EMPTY;
                    } else {
                        return of(order);
                    }
                }),
            )),
            catchError(error => {
                console.error('An error occurred while querying order:', error);
                this.router.navigate(['../']);
                return EMPTY;
            }),
            tap(order => this.order$.next(order))
        ).subscribe();

        this.routeNumber$.pipe(
            untilDestroyed(this),
            map(number => {
                if (number) {
                    this.loadOrderRequest$.next(number);
                }

                this.contractorService.findCurrentUserContractor().pipe(
                    untilDestroyed(this),
                    take(1),
                    tap(({ id, name }) => {
                        if (!number) {
                            this.form.controls.contractor.reset({
                                id,
                                name,
                            })
                        }
                    }),
                    switchMap(({id}) => this.payerService.findAllForContractor(id)),
                    tap((payers) => this.contractorPayers$.next(payers)),
                    filter(payers => !!payers.length),
                    tap(([{ id, name }]) => {
                        if (!number) {
                            this.form.controls.contractorPayer.reset({
                                id,
                                name,
                            })
                        }
                    }),
                ).subscribe();

                this.form.controls.distributor.valueChanges.pipe(
                    untilDestroyed(this),
                    distinctUntilChanged(),
                    filter(distributor => !!distributor),
                    map(distributor => distributor as NonNullable<typeof distributor>),
                    switchMap(({id}) => this.payerService.findAllForContractor(id)),
                    tap(distributorPayers => this.distributorPayers$.next(distributorPayers)),
                    filter((_, i) => !(i === 0 && number)),
                    filter(distributorPayers => !!distributorPayers.length),
                    tap(([{id, name}]) => this.form.controls.distributorPayer.reset({id, name})),
                ).subscribe();

                this.contractorService.findDistributors().pipe(
                    untilDestroyed(this),
                    take(1),
                    tap(distributors => this.distributors$.next(distributors)),
                    filter(distributors => !!distributors.length),
                    tap(([{id, name}]) => {
                        if (!number) {
                            this.form.controls.distributor.reset({
                                id,
                                name,
                            })
                        }
                    }),
                ).subscribe();
            }),
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

    resetFormToOrder(order: Order) {
        const {
            amountTotal,
            operation,
            status,
            localSolutionSrc,
            contractor: { id: contractorId, name: contractorName },
            contractorPayer: { id: contractorPayerId, name: contractorPayerName },
            distributor: { id: distributorId, name: distributorName },
            distributorPayer: { id: distributorPayerId, name: distributorPayerName },
            licenseId,
            contact: { name: contactName, email: contactEmail, phone: contactPhone },
            client: { name: clientName, taxCode: clientTaxCode },
            localSolutionRes: {id: localSolutionResId, name: localSolutionResName, count: localSolutionResCount, period: localSolutionResPeriod },
        } = order;

        let localSolutionSrcFormValue: typeof this.form.controls.localSolutionSrc.value = null;

        if (localSolutionSrc) {
            const {
                id: localSolutionSrcId,
                name: localSolutionSrcName,
                count: localSolutionSrcCount,
                expirationDate: localSolutionSrcExpirationDate,
            } = localSolutionSrc;

            localSolutionSrcFormValue = {
                id: localSolutionSrcId,
                name: localSolutionSrcName,
                count: localSolutionSrcCount,
                expirationDate: localSolutionSrcExpirationDate,
            }
        }

        this.form.reset({
            contractor: {
                id: contractorId,
                name: contractorName,
            },
            contractorPayer: {
                id: contractorPayerId,
                name: contractorPayerName,
            },
            distributor: {
                id: distributorId,
                name: distributorName,
            },
            distributorPayer: {
                id: distributorPayerId,
                name: distributorPayerName,
            },
            amountTotal: `${amountTotal}`,
            operation,
            licenseId,
            localSolutionSrc: localSolutionSrcFormValue,
            localSolutionRes: {
                id: localSolutionResId,
                name: localSolutionResName,
                count: localSolutionResCount,
                period: localSolutionResPeriod,
            },
            client: {
                name: clientName,
                taxCode: clientTaxCode,
            },
            contact: {
                name: contactName,
                email: contactEmail,
                phone: contactPhone,
            },
        });

        if (status !== OrderStatus.NEW) {
            this.form.disable();
        }
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
        const formValue = this.form.value as any as Omit<CreateOrder, 'createdDate' | 'status' | 'hasPendingChanges'>;
        const { localSolutionRes: { count } } = formValue;
        const createOrder: Omit<CreateOrder, 'createdDate' | 'hasPendingChanges'> = {
            ...formValue,
            localSolutionRes: {
                ...formValue.localSolutionRes,
                count: parseInt(count as any as string),
            },
            status: OrderStatus.NEW,
        };

        this.orderService.createOrder(createOrder).pipe(
            untilDestroyed(this),
            take(1),
            tap(({ number }) => {
                this.confirmCreateOrderDialog!.hide();
                this.router.navigate(['../', number], { relativeTo: this.route });
            }),
        ).subscribe();
    }

    updateOrder() {
        if (this.form.invalid) {
            validateForm(this.form);
        } else {
            this.updateSubmitDisabled$.pipe(
                take(1),
                filter(isDisabled => !isDisabled),
                tap(() => this.confirmUpdateOrderDialog!.show())
            ).subscribe();
        }
    }

    confirmUpdateOrder() {
        this.updateOrderData.pipe(
            take(1),
            switchMap(({ number, updateOrder }) => this.orderService.updateOrder(number, updateOrder)),
            tap(order => {
                this.confirmUpdateOrderDialog!.hide();
                this.order$.next(order);
            }),
        ).subscribe();
    }
}
