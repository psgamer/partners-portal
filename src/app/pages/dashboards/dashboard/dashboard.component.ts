import { DecimalPipe } from '@angular/common';
import { Component, QueryList, ViewChildren } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { NgbdIndexsSortableHeader, OrderSortEvent } from './dashboard-sortable.directive';
import { ordersModel } from './dashboard.model';
import { DashboardService } from './dashboard.service';

@UntilDestroy()
@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    providers: [DecimalPipe, DashboardService]
})
export class DashboardComponent {
    sortValue: any = 'Order Date';
    LatestOrders!: Observable<ordersModel[]>;
    orderList: ordersModel[] = [];

    @ViewChildren(NgbdIndexsSortableHeader) headers!: QueryList<NgbdIndexsSortableHeader>;

    constructor(private service: DashboardService) {
        this.LatestOrders = service.countries$;
    }

    ngOnInit(): void {
        setTimeout(() => {
            this.LatestOrders.pipe(untilDestroyed(this)).subscribe(x => {
                this.orderList = Object.assign([], x);
            });
            document.getElementById('elmLoader')?.classList.add('d-none')
        }, 1200);
    }

    sortBy({ column, direction }: OrderSortEvent, value: any) {
        this.sortValue = value
        this.onSort({ column, direction })
    }

    onSort({ column, direction }: OrderSortEvent) {
        // resetting other headers
        this.headers.forEach(header => {
            if (header.Ordersortable !== column) {
                header.direction = '';
            }
        });

        this.service.sortColumn = column;
        this.service.sortDirection = direction;
    }
}
