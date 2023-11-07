import { DecimalPipe } from '@angular/common';
import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { Observable } from 'rxjs';
import { extractByPath, Paths } from '../../../core/models/util.models';
import { courseList } from './data';
import { Order, OrderModel } from './order.model';
import { OrderService } from './order.service';

import { listSortEvent, NgbdListSortableHeader } from './orders-table-sortable.directive';

@Component({
    templateUrl: './orders-table.component.html',
    styleUrls: ['./orders-table.component.scss'],
    providers: [OrderService, DecimalPipe]
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
    readonly extractByPath = extractByPath<Order>;

    // bread crumb items
    breadCrumbItems!: Array<{}>;
    listForm!: UntypedFormGroup;
    submitted = false;

    tableItems: Order[] = [];
    masterSelected!: boolean;
    files: File[] = [];

    // Table data
    CoursesList!: Observable<OrderModel[]>;
    total: Observable<number>;
    checkboxItems: {[key: Order['id']]: boolean} = {};

    @ViewChildren(NgbdListSortableHeader) headers!: QueryList<NgbdListSortableHeader>;
    @ViewChild('addCourse', { static: false }) addCourse?: ModalDirective;
    @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

    deleteID: any;

    get showActionBar() {
        return Object.values(this.checkboxItems).some(checked => checked);
    }

    constructor(public service: OrderService, private formBuilder: UntypedFormBuilder) {
        this.CoursesList = service.countries$;
        this.total = service.total$;
    }

    ngOnInit(): void {

        // Fetch Data
        setTimeout(() => {
            this.CoursesList.subscribe(x => {
                this.tableItems = Object.assign([], x);
            });
            document.getElementById('elmLoader')?.classList.add('d-none')
        }, 1000)

        /**
         * Form Validation
         */
        this.listForm = this.formBuilder.group({
            id: [''],
            img: [''],
            name: [''],
            category: ['', [Validators.required]],
            instructor: ['', [Validators.required]],
            lessons: ['', [Validators.required]],
            students: ['', [Validators.required]],
            duration: ['', [Validators.required]],
            fees: ['', [Validators.required]],
            status: ['', [Validators.required]]
        });
    }

    //  Filter Offcanvas Set
    openEnd() {
        document.getElementById('courseFilters')?.classList.add('show')
        document.querySelector('.backdrop3')?.classList.add('show')
    }

    closeoffcanvas() {
        document.getElementById('courseFilters')?.classList.remove('show')
        document.querySelector('.backdrop3')?.classList.remove('show')
    }

    // File Upload
    public dropzoneConfig: DropzoneConfigInterface = {
        clickable: true,
        addRemoveLinks: true,
        previewsContainer: false,
    };

    uploadedFiles: any[] = [];

    // File Upload
    imageURL: any;

    onUploadSuccess(event: any) {
        setTimeout(() => {
            this.uploadedFiles.push(event[0]);
            this.listForm.controls['img'].setValue(event[0].dataURL);
        }, 100);
    }

    // File Remove
    removeFile(event: any) {
        this.uploadedFiles.splice(this.uploadedFiles.indexOf(event), 1);
    }

    // Sort Data
    onSort({ column, direction }: listSortEvent) {
        // resetting other headers
        this.headers.forEach(header => {
            if (header.listsortable !== column) {
                header.direction = '';
            }
        });

        this.service.sortColumn = column;
        this.service.sortDirection = direction;
    }

    // Edit Data
    editList(id: any) {
        // this.addCourse?.show()
        // var modaltitle = document.querySelector('.modal-title') as HTMLAreaElement
        // modaltitle.innerHTML = 'Edit Product'
        // var modalbtn = document.getElementById('add-btn') as HTMLAreaElement
        // modalbtn.innerHTML = 'Update'
        //
        // var editData = this.tableItems[id]
        //
        // this.uploadedFiles.push({ 'dataURL': editData.img, 'name': editData.img_alt, 'size': 1024, });
        //
        // this.listForm.patchValue(this.tableItems[id]);
    }

    /**
     * Save product
     */
    saveProduct() {
        if (this.listForm.valid) {
            if (this.listForm.get('id')?.value) {
                this.service.products = courseList.map((order: {
                    id: any;
                }) => order.id === this.listForm.get('id')?.value ? { ...order, ...this.listForm.value } : order);
            } else {
                const name = this.listForm.get('name')?.value;
                const category = this.listForm.get('category')?.value;
                const instructor = this.listForm.get('instructor')?.value;
                const lessons = this.listForm.get('lessons')?.value;
                const students = this.listForm.get('students')?.value;
                const duration = this.listForm.get('duration')?.value;
                const fees = this.listForm.get('fees')?.value;
                const status = this.listForm.get('status')?.value;
                const img = this.listForm.get('img')?.value;

                courseList.push({
                    id: this.tableItems.length + 1,
                    category,
                    img,
                    name,
                    instructor,
                    lessons,
                    students,
                    duration,
                    fees,
                    rating: '',
                    status
                })

                var modaltitle = document.querySelector('.modal-title') as HTMLAreaElement
                modaltitle.innerHTML = 'Add Course'
                var modalbtn = document.getElementById('add-btn') as HTMLAreaElement
                modalbtn.innerHTML = 'Add Course'

                this.service.products = courseList

            }
            this.listForm.reset();
            this.uploadedFiles = [];
            this.addCourse?.hide()
        }
        this.submitted = true
    }

    checkedValGet: any[] = [];

    // The master checkbox will check/ uncheck all items
    checkUncheckAll(ev: Event) {
        this.tableItems.forEach(({id}) => this.checkboxItems[id] = (<HTMLInputElement>ev.target).checked);
    }

    onCheckboxChange(e: Event) {
        if (Object.values(this.checkboxItems).every(checked => checked)) {
            this.masterSelected = true;
        } else if (this.masterSelected) {
            this.masterSelected = false;
        }
    }

    // Delete Product
    removeItem(id: any) {
        this.deleteID = id
        this.deleteRecordModal?.show()
    }

    confirmDelete() {
        if (this.deleteID) {
            this.service.products = this.service.products.filter((product: any) => {
                return this.deleteID != product.id;
            });
            this.deleteID = ''
        } else {
            this.service.products = this.service.products.filter((product: any) => {
                return !this.checkedValGet.includes(product.id);
            });
        }
        this.deleteRecordModal?.hide()
        this.masterSelected = false;
    }

}
