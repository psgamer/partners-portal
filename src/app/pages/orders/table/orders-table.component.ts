import { Component, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { map } from 'rxjs/operators';
import { getExtractByPath, Paths } from '../../../core/models/util.models';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';
import { LocalSolutionService } from '../../../shared/local-solution/local-solution.service';
import { Order, OrderOperationType, OrderStatus } from './order.model';
import { FiltersState, OrderService } from './order.service';

import { listSortEvent, NgbdListSortableHeader } from './orders-table-sortable.directive';

interface Form {
    amountRange: FormGroup<{
        from: FormControl<number | undefined>,
        to: FormControl<number | undefined>,
    }>,
    operations: FormGroup<{
        [value in OrderOperationType]: FormControl<boolean>
    }>,
    statuses: FormGroup<{
        [value in OrderStatus]: FormControl<boolean>
    }>,
    localSolutionId: FormControl<LocalSolution['id'] | ''>,
}

@UntilDestroy()
@Component({
    templateUrl: './orders-table.component.html',
    styleUrls: ['./orders-table.component.scss'],
    providers: [OrderService]
})
// List Component
export class OrdersTableComponent {
    readonly tableColsToRender: Paths<Order>[] = [
        'createdDate',
        'id',
        'localSolutionRes.name',
        'operation',
        'localSolutionRes.count',
        'amountTotal',
        'contractor.name',
        'client.name',
        'status',
    ];
    readonly extractByPath = getExtractByPath<Order>();

    // bread crumb items
    // breadCrumbItems!: Array<{}>;
    // listForm!: UntypedFormGroup;
    // submitted = false;

    headerCheckboxSelected = false;
    // files: File[] = [];

    // Table data
    readonly state$ = this.orderService.state$;
    readonly loading$ = this.orderService.loading$;
    readonly totalRecords$ = this.orderService.totalRecords$;
    readonly orders$ = this.orderService.orders$;
    readonly statuses = Object.values(OrderStatus);
    readonly operationTypes = Object.values(OrderOperationType);
    readonly localSolutions$ = this.localSolutionService.findAll();
    checkboxItems: {[key: Order['id']]: boolean} = {};
    searchForm: FormGroup<Form> = this.fb.group<Form>({
        amountRange: this.fb.group({
            from: this.fb.control(undefined as number | undefined, {nonNullable: true}),
            to: this.fb.control(undefined as number | undefined, {nonNullable: true})
        }),
        operations: this.fb.group(<{[value in OrderOperationType]: FormControl<boolean>}>Object
            .fromEntries(this.operationTypes
                .map(operation => [operation, this.fb.control(false, {nonNullable: true})]))),
        statuses: this.fb.group(<{[value in OrderStatus]: FormControl<boolean>}>Object
            .fromEntries(this.statuses
                .map(status => [status, this.fb.control(false, {nonNullable: true})]))),
        localSolutionId: this.fb.control('', {nonNullable: true}),
    });

    @ViewChildren(NgbdListSortableHeader) tableHeaders!: QueryList<NgbdListSortableHeader>;
    // @ViewChild('addCourse', { static: false }) addCourse?: ModalDirective;
    // @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

    // deleteID: any;

    readonly getSortDirection$ = (colPath: Paths<Order>) => {
        return this.state$.pipe(map(({ sortColumn, sortDirection }) => colPath === sortColumn ? sortDirection : ''));
    }

    readonly getStatusClass = (status: OrderStatus): string => {
        switch (status) {
            case OrderStatus.NEW:
                return 'bg-secondary-subtle text-secondary';
            case OrderStatus.PENDING:
                return 'bg-primary-subtle text-primary';
            case OrderStatus.CANCELLED:
                return 'bg-danger-subtle text-danger';
            case OrderStatus.COMPLETED:
                return 'bg-success-subtle text-success';
            default:
                return '';
        }
    }

    get showActionBar() {
        return Object.values(this.checkboxItems).some(checked => checked);
    }

    constructor(private orderService: OrderService, private fb: FormBuilder, private localSolutionService: LocalSolutionService) {
        this.orderService.filtersState$
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
        this.orderService.search(this.parseFilters());
    }

    onPageChange({page}: PageChangedEvent) {
        this.orderService.gotoPage(page);
    }

    private parseFilters(): FiltersState {
        const {
            amountRange: { from, to },
            operations,
            statuses,
            localSolutionId,
        } = this.searchForm.getRawValue();

        return {
            amountRange: {
                from: from ? parseInt(`${from}`) : undefined,
                to: to ? parseInt(`${to}`) : undefined,
            },
            operations: this.operationTypes.filter(operation => operations[operation]),
            statuses: this.statuses.filter(status => statuses[status]),
            localSolutionId,
        }
    }

    private updateForm({operations, amountRange, statuses, localSolutionId}: FiltersState) {
        this.searchForm.reset({
            amountRange: {...amountRange},
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
    onSort(sort: listSortEvent) {
        this.orderService.sort(sort);
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

    onCheckboxChange(e: Event) {
        if (Object.values(this.checkboxItems).every(checked => checked)) {
            this.headerCheckboxSelected = true;
        } else if (this.headerCheckboxSelected) {
            this.headerCheckboxSelected = false;
        }
    }

    // Delete Product
    // removeItem(id: any) {
    //     this.deleteID = id
    //     this.deleteRecordModal?.show()
    // }
    //
    // confirmDelete() {
    //     if (this.deleteID) {
    //         this.service.products = this.service.products.filter((product: any) => {
    //             return this.deleteID != product.id;
    //         });
    //         this.deleteID = ''
    //     } else {
    //         this.service.products = this.service.products.filter((product: any) => {
    //             return !this.checkedValGet.includes(product.id);
    //         });
    //     }
    //     this.deleteRecordModal?.hide()
    //     this.masterSelected = false;
    // }

}
