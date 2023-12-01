import { ChangeDetectionStrategy, Component, Predicate, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { Observable, of, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { getExtractByPath, Paths } from '../../../core/helpers/utils';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';
import { LocalSolutionService } from '../../../shared/local-solution/local-solution.service';
import { OrderAmountRange } from '../order-amount-range.model';
import { OrderAmountRangeService } from '../order-amount-range.service';
import { getOrderTagItemClass, Order, OrderOperationType, OrderStatus } from '../order.model';
import { getAllowedDirections, OrderFilterParams, OrderService, OrderSortDirection, OrderSortEvent } from '../order.service';

import { OrderSortableTableHeaderDirective } from './order-sortable-table-header.directive';

interface Form {
    amountRange: FormControl<OrderAmountRange['id'] | ''>,
    operations: FormGroup<{
        [value in OrderOperationType]: FormControl<boolean>
    }>,
    statuses: FormGroup<{
        [value in OrderStatus]: FormControl<boolean>
    }>,
    localSolutionId: FormControl<LocalSolution['id'] | ''>,
}

interface ColConfig {
    column: Paths<Order>;
    sortDirections: OrderSortDirection[];
}

const canCancelOrderStatuses = [OrderStatus.NEW, OrderStatus.PENDING];
const canDeleteOrderStatuses = [OrderStatus.NEW];

@UntilDestroy()
@Component({
    templateUrl: './orders-table.component.html',
    styleUrls: ['./orders-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
// List Component
export class OrdersTableComponent {
    private readonly queryHandler = this.orderService.queryHandler;

    readonly colConfigs: ColConfig[] = (<Paths<Order>[]>[
        'createdDate',
        'number',
        'localSolutionRes.name',
        'operation',
        'localSolutionRes.count',
        'amountTotal',
        'contractor.name',
        'client.name',
        'status',
    ]).map(column => ({
        column,
        sortDirections: getAllowedDirections(column),
    }));
    readonly extractByPath = getExtractByPath<Order>();
    readonly canCancelOrder: Predicate<Order> = ({status}) => canCancelOrderStatuses.includes(status);
    readonly canDeleteOrder: Predicate<Order> = ({status}) => canDeleteOrderStatuses.includes(status);

    // bread crumb items
    // breadCrumbItems!: Array<{}>;
    // listForm!: UntypedFormGroup;
    // submitted = false;

    headerCheckboxSelected = false;
    // files: File[] = [];

    // Table data
    readonly state$ = this.queryHandler.searchParams$;
    readonly loading$ = this.queryHandler.loading$;
    readonly totalRecords$ = this.queryHandler.totalRecords$;
    readonly orders$ = this.queryHandler.docs$;
    readonly orderAmountRanges$ = this.orderAmountTotalService.orderAmountRanges$;
    readonly statuses = Object.values(OrderStatus);
    readonly operationTypes = Object.values(OrderOperationType);
    readonly localSolutions$ = this.localSolutionService.findAll();
    checkboxItems: {[key: Order['id']]: boolean} = {};
    searchForm: FormGroup<Form> = this.fb.group<Form>({
        amountRange: this.fb.control('', {nonNullable: true}),
        operations: this.fb.group(<{[value in OrderOperationType]: FormControl<boolean>}>Object
            .fromEntries(this.operationTypes
                .map(operation => [operation, this.fb.control(false, {nonNullable: true})]))),
        statuses: this.fb.group(<{[value in OrderStatus]: FormControl<boolean>}>Object
            .fromEntries(this.statuses
                .map(status => [status, this.fb.control(false, {nonNullable: true})]))),
        localSolutionId: this.fb.control('', {nonNullable: true}),
    });

    @ViewChildren(OrderSortableTableHeaderDirective) tableHeaders!: QueryList<OrderSortableTableHeaderDirective>;
    // @ViewChild('addCourse') addCourse?: ModalDirective;
    @ViewChild('cancelModal') cancelDialog?: ModalDirective;
    @ViewChild('deleteModal') deleteDialog?: ModalDirective;

    readonly getSortDirection$ = (colPath: Paths<Order>): Observable<OrderSortDirection | ''> => {
        return this.state$.pipe(map(({ sortColumn, sortDirection }) => colPath === sortColumn ? sortDirection : ''));
    }

    readonly getOrderTagItemClass = getOrderTagItemClass;

    get canDeleteCheckedOrders$() {
        const orderIds: Order['id'][] = Object.entries(this.checkboxItems)
            .filter(([, checked]) => checked)
            .map(([orderId]) => orderId);

        if (!orderIds.length) {
            return of(false);
        }

        return this.orders$.pipe(
            untilDestroyed(this),
            take(1),
            map(orders => orders.filter(({id}) => orderIds.includes(id))),
            map(orders => orders.length === orderIds.length && orders.every(this.canDeleteOrder))
        );
    }
    get deleteCount() {
        const state = this.deleteDialog?.config.initialState;

        if (!state) {
            return 0;
        }

        const ids = (state['ids'] as Order['id'][] | undefined) || [];

        return ids.length;
    }

    constructor(
        private orderService: OrderService, private fb: FormBuilder, private localSolutionService: LocalSolutionService,
        private orderAmountTotalService: OrderAmountRangeService,
    ) {
        this.queryHandler.filterParams$
            .pipe(
                untilDestroyed(this),
                map((filters, i) => {
                    this.updateForm(filters);
                    if (i === 0) {
                        // first time got filters state
                        this.search();
                    }
                }))
            .subscribe();
    }

    ngOnInit(): void {
        /**
         * Form Validation
         */
        // this.listForm = this.formBuilder.group({
        //     id: [''],
        //     img: [''],
        //     name: [''],
        //     category: ['', [Validators.required]],
        //     instructor: ['', [Validators.required]],
        //     lessons: ['', [Validators.required]],
        //     students: ['', [Validators.required]],
        //     duration: ['', [Validators.required]],
        //     fees: ['', [Validators.required]],
        //     status: ['', [Validators.required]]
        // });
    }

    reset() {
        this.searchForm.reset();
        this.search();
    }

    search() {
        this.closeoffcanvas();
        this.checkboxItems = {};
        this.headerCheckboxSelected = false;
        this.queryHandler.search(this.parseFilters());
    }

    onPageChange({page}: PageChangedEvent) {
        this.queryHandler.gotoPage(page);
    }

    private parseFilters(): OrderFilterParams {
        const {
            amountRange,
            operations,
            statuses,
            localSolutionId,
        } = this.searchForm.getRawValue();

        return {
            amountRange,
            operations: this.operationTypes.filter(operation => operations[operation]),
            statuses: this.statuses.filter(status => statuses[status]),
            localSolutionId,
        }
    }

    private updateForm({operations, amountRange, statuses, localSolutionId}: OrderFilterParams) {
        this.searchForm.reset({
            amountRange,
            operations: Object.fromEntries(this.operationTypes.map(operation => [operation, operations.includes(operation)])),
            statuses: Object.fromEntries(this.statuses.map(status => [status, statuses.includes(status)])),
            localSolutionId,
        });
    }

    //  Filter Offcanvas Set
    openEnd() {
        // TODO
        document.getElementById('courseFilters')?.classList.add('show')
        document.querySelector('.backdrop3')?.classList.add('show')
    }

    closeoffcanvas() {
        // TODO
        document.getElementById('courseFilters')?.classList.remove('show')
        document.querySelector('.backdrop3')?.classList.remove('show')
    }

    // File Upload
    // public dropzoneConfig: DropzoneConfigInterface = {
    //     clickable: true,
    //     addRemoveLinks: true,
    //     previewsContainer: false,
    // };

    // uploadedFiles: any[] = [];

    // File Upload
    // imageURL: any;

    // onUploadSuccess(event: any) {
    //     setTimeout(() => {
    //         this.uploadedFiles.push(event[0]);
    //         this.listForm.controls['img'].setValue(event[0].dataURL);
    //     }, 100);
    // }

    // File Remove
    // removeFile(event: any) {
    //     this.uploadedFiles.splice(this.uploadedFiles.indexOf(event), 1);
    // }

    // Sort Data
    onSort(sort: OrderSortEvent) {
        this.queryHandler.sort(sort);
    }

    // Edit Data
    // editList(id: any) {
    //     // this.addCourse?.show()
    //     // var modaltitle = document.querySelector('.modal-title') as HTMLAreaElement
    //     // modaltitle.innerHTML = 'Edit Product'
    //     // var modalbtn = document.getElementById('add-btn') as HTMLAreaElement
    //     // modalbtn.innerHTML = 'Update'
    //     //
    //     // var editData = this.tableItems[id]
    //     //
    //     // this.uploadedFiles.push({ 'dataURL': editData.img, 'name': editData.img_alt, 'size': 1024, });
    //     //
    //     // this.listForm.patchValue(this.tableItems[id]);
    // }

    /**
     * Save product
     */
    // saveProduct() {
    //     if (this.listForm.valid) {
    //         if (this.listForm.get('id')?.value) {
    //             this.service.products = courseList.map((order: {
    //                 id: any;
    //             }) => order.id === this.listForm.get('id')?.value ? { ...order, ...this.listForm.value } : order);
    //         } else {
    //             const name = this.listForm.get('name')?.value;
    //             const category = this.listForm.get('category')?.value;
    //             const instructor = this.listForm.get('instructor')?.value;
    //             const lessons = this.listForm.get('lessons')?.value;
    //             const students = this.listForm.get('students')?.value;
    //             const duration = this.listForm.get('duration')?.value;
    //             const fees = this.listForm.get('fees')?.value;
    //             const status = this.listForm.get('status')?.value;
    //             const img = this.listForm.get('img')?.value;
    //
    //             courseList.push({
    //                 id: this.tableItems.length + 1,
    //                 category,
    //                 img,
    //                 name,
    //                 instructor,
    //                 lessons,
    //                 students,
    //                 duration,
    //                 fees,
    //                 rating: '',
    //                 status
    //             })
    //
    //             var modaltitle = document.querySelector('.modal-title') as HTMLAreaElement
    //             modaltitle.innerHTML = 'Add Course'
    //             var modalbtn = document.getElementById('add-btn') as HTMLAreaElement
    //             modalbtn.innerHTML = 'Add Course'
    //
    //             this.service.products = courseList
    //
    //         }
    //         this.listForm.reset();
    //         this.uploadedFiles = [];
    //         this.addCourse?.hide()
    //     }
    //     this.submitted = true
    // }
    //
    // checkedValGet: any[] = [];

    // The master checkbox will check/ uncheck all items
    checkUncheckAll(ev: Event) {
        this.orders$.pipe(
            untilDestroyed(this),
            map(orders => orders.forEach(({id}) => this.checkboxItems[id] = (<HTMLInputElement>ev.target).checked))
        ).subscribe();
    }

    onCheckboxChange() {
        if (Object.values(this.checkboxItems).every(checked => checked)) {
            this.headerCheckboxSelected = true;
        } else if (this.headerCheckboxSelected) {
            this.headerCheckboxSelected = false;
        }
    }

    cancelOrder({id}: Order) {
        this.cancelDialog!.config = { initialState: { id } };
        this.cancelDialog!.show();
    }

    confirmCancelOrder() {
        const orderId = this.cancelDialog!.config.initialState!['id'] as Order['id'];
        this.cancelDialog!.hide();

        this.orderService.cancelOrder(orderId)
            .subscribe({
                complete: () => {
                    console.log("Successfully cancelled for id", orderId);
                    this.search();
                },
                error: e => console.error("Failed to cancel order", e)
            });
    }

    deleteCheckedOrders() {
        const orderIds = Object.entries(this.checkboxItems)
            .filter(([, checked]) => checked)
            .map(([orderId]) => ({id: orderId}));

        this.deleteOrders(orderIds);
    }

    deleteOrders(orders: Pick<Order, 'id'>[]) {
        const ids = orders.map(({id}) => id);
        this.deleteDialog!.config = { initialState: { ids } };
        this.deleteDialog!.show();
    }

    confirmDeleteOrders() {
        const orderIds = this.deleteDialog!.config.initialState!['ids'] as Order['id'][];
        this.deleteDialog!.hide();

        this.orderService.deleteOrder(orderIds)
            .subscribe({
                complete: () => {
                    console.log("Successfully deleted for ids", orderIds);
                    this.search();
                },
                error: e => console.error("Failed to delete orders", e)
            });
    }
}
