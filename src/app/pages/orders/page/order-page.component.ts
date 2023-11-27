import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { distinctUntilChanged, Observable, of, ReplaySubject, take, tap } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { FormStructure, selectComparatorById } from '../../../core/helpers/utils';
import { PeriodType } from '../../../core/models/all.models';
import { Contractor } from '../../../shared/contractor/contractor.model';
import { ContractorService } from '../../../shared/contractor/contractor.service';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';
import { LocalSolutionService } from '../../../shared/local-solution/local-solution.service';
import { Payer } from '../../../shared/payer/payer.model';
import { PayerService } from '../../../shared/payer/payer.service';
import { CreateOrder, OrderOperationType, orderRouteParam, OrderStatus } from '../order.model';

// data Get
import { addressList } from './data';

@UntilDestroy()
@Component({
    templateUrl: './order-page.component.html',
    styleUrls: ['./order-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class OrderPageComponent {
    readonly selectComparator = selectComparatorById;
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

    name: any;
    address: any;
    phone: any;
    type: any;

    addressData: any;

    @ViewChild('addAddressModal', { static: false }) addAddressModal?: ModalDirective;
    @ViewChild('removeItemModal', { static: false }) removeItemModal?: ModalDirective;
    id: any;
    deleteId: any;

    form = this.createOrderFormGroup;

    readonly localSolutions$ = new ReplaySubject<LocalSolution[]>(1);
    readonly contractorPayers$ = new ReplaySubject<Payer[]>(1);
    readonly distributors$ = new ReplaySubject<Contractor[]>(1);
    readonly distributorPayers$ = new ReplaySubject<Payer[]>(1);

    constructor(
        private route: ActivatedRoute,
        private fb: NonNullableFormBuilder,
        private localSolutionService: LocalSolutionService,
        private contractorService: ContractorService,
        private payerService: PayerService,
        private translate: TranslateService,
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
            map(({id}) => id),
            filter(distributorId => distributorId !== ''),
            switchMap(distributorId => this.payerService.findAllForContractor(distributorId)),
            tap(payers => this.distributorPayers$.next(payers)),
            filter(distributorPayers => !!distributorPayers.length),
            distinctUntilChanged(),
            map(([{id, name}]) => ({id, name})),
            filter(({id}) => this.form.controls.distributorPayer.value.id !== id),
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

        this.localSolutionService.findAll()
            .then(localSolutions => this.localSolutions$.next(localSolutions));

        // this.form.valueChanges.pipe(tap(v => setTimeout(() => console.log(this.form.value), 3000))).subscribe();
    }

    private get createOrderFormGroup() {
        return this.fb.group<FormStructure<CreateOrder>>({
            localSolutionSrc: this.fb.control({
                id: '',
                count: 0,
                expirationDate: Timestamp.now(),
            }),
            localSolutionRes: this.fb.control({
                id: '',
                count: 0,
                name: '',
                period: {
                    count: 1,
                    type: PeriodType.YEAR,
                },
            }, [Validators.required]),
            status: this.fb.control(OrderStatus.NEW, [Validators.required]),
            amountTotal: this.fb.control(0, Validators.required),
            client: this.fb.control({
                id: '',
                name: '',
                taxCode: 0,
            }, [Validators.required]),
            contact: this.fb.control({
                name: '',
                phone: '',
                email: '',
            }, [Validators.required]),
            contractor: this.fb.control({
                id: '',
                name: '',
            }, [Validators.required]),
            contractorPayer: this.fb.control({
                id: '',
                name: '',
            }, [Validators.required]),
            distributor: this.fb.control({
                id: '',
                name: '',
            }, [Validators.required]),
            distributorPayer: this.fb.control({
                id: '',
                name: '',
            }, [Validators.required]),
            operation: this.fb.control(OrderOperationType.NEW_PURCHASE, [Validators.required]),
        });
    }

    ngOnInit(): void {
        // Fetch Data
        this.addressData = addressList
    }

    // Add Address
    addAddress() {
        if (this.id) {
            var params = {
                id: this.id,
                name: this.name,
                address: this.address,
                phone: this.phone,
                type: this.type
            }
            this.addressData = this.addressData.map((address: {
                id: any;
            }) => address.id === this.id ? { ...address, ...params } : address);
        } else {
            this.addressData.push({
                id: this.addressData.length + 1,
                name: this.name,
                address: this.address,
                phone: this.phone,
                type: this.type
            })
        }
        this.id = ''
        this.name = ''
        this.address = ''
        this.phone = ''
        this.type = ''
        this.addAddressModal?.hide()
    }

    // Edit Address
    editAddress(id: any) {
        this.addAddressModal?.show()
        this.id = this.addressData[id].id
        this.name = this.addressData[id].name
        this.address = this.addressData[id].address
        this.phone = this.addressData[id].phone
        this.type = this.addressData[id].type
    }

    // Delete Address
    removeAddress(id: any) {
        this.deleteId = id;
        this.removeItemModal?.show()
    }

    deleteAddress() {
        addressList.splice(this.deleteId, 1)
        this.removeItemModal?.hide()
    }
}
