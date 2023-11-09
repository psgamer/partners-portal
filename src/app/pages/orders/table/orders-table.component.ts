import { Component, QueryList, ViewChildren } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { getExtractByPath, Paths } from '../../../core/models/util.models';
import { Order, OrderStatus } from './order.model';
import { OrderService } from './order.service';

import { listSortEvent, NgbdListSortableHeader } from './orders-table-sortable.directive';

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
    readonly state = this.orderService.tableState;
    readonly loading$ = this.orderService.loading$;
    readonly totalRecords$ = this.orderService.totalRecords$;
    readonly orders$ = this.orderService.orders$;
    checkboxItems: {[key: Order['id']]: boolean} = {};

    @ViewChildren(NgbdListSortableHeader) tableHeaders!: QueryList<NgbdListSortableHeader>;
    // @ViewChild('addCourse', { static: false }) addCourse?: ModalDirective;
    // @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

    // deleteID: any;

    readonly getSortDirection = (colPath: Paths<Order>) => {
        const { sortColumn, sortDirection } = this.orderService.tableState;

        return colPath === sortColumn ? sortDirection : '';
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

    constructor(private orderService: OrderService) {
        this.orderService.search();
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
