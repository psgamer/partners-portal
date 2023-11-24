import { Component, ViewChild } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { BehaviorSubject, distinctUntilChanged, ReplaySubject, take, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { FormStructure } from '../../../core/helpers/utils';
import { PeriodType } from '../../../core/models/all.models';
import { Contractor } from '../../../shared/contractor/contractor.model';
import { ContractorService } from '../../../shared/contractor/contractor.service';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';
import { LocalSolutionService } from '../../../shared/local-solution/local-solution.service';
import { Payer } from '../../../shared/payer/payer.model';
import { PayerService } from '../../../shared/payer/payer.service';
import { Order, OrderOperationType, orderRouteParam, OrderStatus } from '../order.model';

// data Get
import { addressList } from './data';

@UntilDestroy()
@Component({
    templateUrl: './order-page.component.html',
    styleUrls: ['./order-page.component.scss']
})
export class OrderPageComponent {
    breadcrumbs?: string[];

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
    readonly contractor$ = new ReplaySubject<Contractor | undefined>(1);
    readonly payers$ = new ReplaySubject<Payer[]>(1);
    readonly distributors$ = new BehaviorSubject<Contractor[]>([]);
    readonly distributorPayers$ = new BehaviorSubject<Payer[]>([]);

    constructor(
        private route: ActivatedRoute,
        private fb: NonNullableFormBuilder,
        private localSolutionService: LocalSolutionService,
        private contractorService: ContractorService,
        private payerService: PayerService,
    ) {
        const orderId = this.route.snapshot.paramMap.get(orderRouteParam);// TODO for edit

        this.localSolutionService.findAll()
            .then(localSolutions => this.localSolutions$.next(localSolutions));
        this.contractorService.findCurrentUserContractor().pipe(
            untilDestroyed(this),
            tap(contractor => this.contractor$.next(contractor)),
        ).subscribe();
        this.contractorService.findDistributors().pipe(
            untilDestroyed(this),
            tap(distributors => this.distributors$.next(distributors)),
        ).subscribe();
        this.contractor$.pipe(
            untilDestroyed(this),
            take(1),
            filter(contractor => !!contractor),
            map(contractor => contractor as NonNullable<typeof contractor>),
            tap(({ id, name }) => this.form.controls.contractor!.reset({
                id,
                name,
            })),
        ).subscribe();

        this.form.controls.contractor!.controls.id.valueChanges.pipe(
            untilDestroyed(this),
            distinctUntilChanged(),
            filter(contractorId => contractorId !== ''),
            tap(contractorId => this.payerService
                .findAllForContractor(contractorId)
                .then(payers => this.payers$.next(payers)))
        ).subscribe();
        this.form.controls.distributor!.controls.id.valueChanges.pipe(
            untilDestroyed(this),
            distinctUntilChanged(),
            filter(distributorId => distributorId !== ''),
            tap(distributorId => this.payerService
                .findAllForContractor(distributorId)
                .then(payers => this.distributorPayers$.next(payers)))
        ).subscribe();
    }

    private get createOrderFormGroup() {
        return this.fb.group<FormStructure<Partial<Order>>>({
            localSolutionSrc: this.fb.group<FormStructure<NonNullable<Order['localSolutionSrc']>>>({
                id: this.fb.control(''),
                count: this.fb.control(0),
                expirationDate: this.fb.control(Timestamp.now(), []),
            }),
            localSolutionRes: this.fb.group<FormStructure<Order['localSolutionRes']>>({
                id: this.fb.control('', [Validators.required]),
                count: this.fb.control(0, [Validators.required]),
                name: this.fb.control('', [Validators.required]),
                period: this.fb.group<FormStructure<Order['localSolutionRes']['period']>>({
                    count: this.fb.control(1, [Validators.required]),
                    type: this.fb.control(PeriodType.YEAR, [Validators.required]),
                })
            }),
            status: this.fb.control(OrderStatus.NEW, [Validators.required]),
            amountTotal: this.fb.control(0, Validators.required),
            client: this.fb.group<FormStructure<Order['client']>>({
                id: this.fb.control('', [Validators.required]),
                name: this.fb.control('', [Validators.required]),
                taxCode: this.fb.control(0, [Validators.required]),
            }),
            contact: this.fb.group<FormStructure<Order['contact']>>({
                name: this.fb.control('', [Validators.required]),
                phone: this.fb.control('', [Validators.required]),
                email: this.fb.control('', [Validators.required]),
            }),
            contractor: this.fb.group<FormStructure<Order['contractor']>>({
                id: this.fb.control('', [Validators.required]),
                name: this.fb.control('', [Validators.required]),
            }),
            contractorPayer: this.fb.group<FormStructure<Order['contractorPayer']>>({
                id: this.fb.control('', [Validators.required]),
                name: this.fb.control('', [Validators.required]),
            }),
            distributor: this.fb.group<FormStructure<Order['distributor']>>({
                id: this.fb.control('', [Validators.required]),
                name: this.fb.control('', [Validators.required]),
            }),
            distributorPayer: this.fb.group<FormStructure<Order['distributorPayer']>>({
                id: this.fb.control('', [Validators.required]),
                name: this.fb.control('', [Validators.required]),
            }),
            operation: this.fb.control(OrderOperationType.NEW_PURCHASE, [Validators.required]),
        });
    }

    ngOnInit(): void {
        // orderNumberParam
        // const orderNumber = this.route.paramMap.pipe(tap(console.log)).subscribe();

        // if (!orderNumber) {
        //
        // }

        this.breadcrumbs = [
            'MENUITEMS.ORDERS.TEXT',
            'ORDER.LABELS.CREATE.TITLE',// TODO create or edit based on route
        ];


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
