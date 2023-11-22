import { DecimalPipe } from '@angular/common';
import { Component, QueryList, ViewChildren } from '@angular/core';
import { AggregateField, AggregateSpecData } from '@firebase/firestore';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProgressbarType } from 'ngx-bootstrap/progressbar';
import { BehaviorSubject, distinctUntilChanged, map, Observable, Subject, switchMap, tap, zip } from 'rxjs';
import { OrderStatus } from '../../orders/table/order.model';
import { OrderAggregationTimePeriod, OrderService } from '../../orders/table/order.service';
import { NgbdIndexsSortableHeader, OrderSortEvent } from './index-sortable.directive';
import { ordersModel } from './index.model';
import { IndexService } from './index.service';

const createTimePeriodSubject = (defaultValue: OrderAggregationTimePeriod = 'currentYear') => new BehaviorSubject<OrderAggregationTimePeriod>(defaultValue);

type StatusCounts = AggregateSpecData<{ [key in OrderStatus]: AggregateField<number> }>;

@UntilDestroy()
@Component({
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.scss'],
    providers: [DecimalPipe, IndexService, OrderService],
})
export class IndexComponent {
    sortValue: any = 'Order Date';
    LatestOrders!: Observable<ordersModel[]>;
    orderList: ordersModel[] = [];

    @ViewChildren(NgbdIndexsSortableHeader) headers!: QueryList<NgbdIndexsSortableHeader>;

    readonly orderStatuses: OrderStatus[] = Object.values(OrderStatus);
    readonly timePeriodOptions: {period: OrderAggregationTimePeriod, labelKey: string}[] = [{period: 'currentYear', labelKey: 'currentYear'}];

    private readonly timePeriodSubjectToObservable = (timePeriodSubject: Subject<OrderAggregationTimePeriod>) => timePeriodSubject.asObservable().pipe(
        untilDestroyed(this),
        distinctUntilChanged(),
    );

    private readonly amountTimePeriod$ = createTimePeriodSubject();
    private readonly countTimePeriod$ = createTimePeriodSubject();
    private readonly statusesTimePeriod$ = createTimePeriodSubject();

    private readonly _amount$ = new BehaviorSubject<number>(0);
    private readonly _count$ = new BehaviorSubject<number>(0);
    private readonly _statuses$ = new BehaviorSubject<AggregateSpecData<{ [key in OrderStatus]: AggregateField<number> }>>(Object.values(OrderStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
    }, {} as AggregateSpecData<{ [key in OrderStatus]: AggregateField<number> }>));

    constructor(private service: IndexService, private orderService: OrderService) {
        this.LatestOrders = service.countries$;

        this.timePeriodSubjectToObservable(this.amountTimePeriod$).pipe(
            switchMap((timePeriod) => this.orderService.getOrdersAggregation('amount', timePeriod)),
            map(({amount}) => amount),
            tap(value => this._amount$.next(value)),
        ).subscribe();
        this.timePeriodSubjectToObservable(this.countTimePeriod$).pipe(
            switchMap((timePeriod) => this.orderService.getOrdersAggregation('count', timePeriod)),
            map(({count}) => count),
            tap(value => this._count$.next(value)),
        ).subscribe();
        this.timePeriodSubjectToObservable(this.statusesTimePeriod$).pipe(
            switchMap(timePeriod => zip(...this.orderStatuses.map(status => this.orderService.getOrdersAggregation(status, timePeriod)))),
            map(result => Object.assign({}, ...result) as AggregateSpecData<{ [key in OrderStatus]: AggregateField<number> }>),
            tap(value => this._statuses$.next(value)),
        ).subscribe();
    }

    get amount$() {
        return this._amount$.asObservable();
    }
    get count$() {
        return this._count$.asObservable();
    }
    get statuses$() {
        return this._statuses$.asObservable();
    }

    setAmountTimePeriod(timePeriod: OrderAggregationTimePeriod) {
        this.amountTimePeriod$.next(timePeriod);
    }

    setCountTimePeriod(timePeriod: OrderAggregationTimePeriod) {
        this.countTimePeriod$.next(timePeriod);
    }
    setStatusesTimePeriod(timePeriod: OrderAggregationTimePeriod) {
        this.statusesTimePeriod$.next(timePeriod);
    }
    getRelativePercentage(status: OrderStatus, counts: StatusCounts): number {
        const max = Math.max(...Object.values(counts));
        const current = counts[status];

        return (current / max) * 100;
    }
    getProgressbarType(status: OrderStatus): ProgressbarType | undefined {
        switch (status) {
            case OrderStatus.NEW:
                return 'info';
            case OrderStatus.PENDING:
                return 'warning';
            case OrderStatus.CANCELLED:
                return 'danger';
            case OrderStatus.COMPLETED:
                return 'success';
            default:
                return undefined;
        }
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
