import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AggregateField, AggregateSpecData } from '@firebase/firestore';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProgressbarType } from 'ngx-bootstrap/progressbar';
import { BehaviorSubject, distinctUntilChanged, map, Subject, switchMap, tap, zip } from 'rxjs';
import { getExtractByPath, Paths } from '../../../core/helpers/utils';
import { getOrderTagItemClass, Order, OrderStatus } from '../../orders/order.model';
import { getAllowedDirections, OrderAggregationTimePeriod, OrderService, OrderSortDirection } from '../../orders/order.service';

type StatusCounts = AggregateSpecData<{ [key in OrderStatus]: AggregateField<number> }>;
interface ColConfig {
    column: Paths<Order>;
    sortDirections: OrderSortDirection[];
}

@UntilDestroy()
@Component({
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.scss'],
    providers: [DecimalPipe, OrderService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent {
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
    readonly orderStatuses: OrderStatus[] = Object.values(OrderStatus);
    readonly timePeriodOptions: {period: OrderAggregationTimePeriod, labelKey: string}[] = [{period: 'currentYear', labelKey: 'currentYear'}];

    private readonly timePeriodSubjectToObservable = (timePeriodSubject: Subject<OrderAggregationTimePeriod>) => timePeriodSubject.asObservable().pipe(
        untilDestroyed(this),
        distinctUntilChanged(),
    );

    private readonly amountTimePeriod$ = new BehaviorSubject<OrderAggregationTimePeriod>('currentYear');
    private readonly countTimePeriod$ = new BehaviorSubject<OrderAggregationTimePeriod>('currentYear');
    private readonly statusesTimePeriod$ = new BehaviorSubject<OrderAggregationTimePeriod>('currentYear');

    private readonly _amount$ = new BehaviorSubject<number>(0);
    private readonly _count$ = new BehaviorSubject<number>(0);
    private readonly _statuses$ = new BehaviorSubject<AggregateSpecData<{ [key in OrderStatus]: AggregateField<number> }>>(Object.values(OrderStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
    }, {} as AggregateSpecData<{ [key in OrderStatus]: AggregateField<number> }>));

    readonly orders$ = this.queryHandler.docs$;
    readonly loading$ = this.queryHandler.loading$;
    readonly extractByPath = getExtractByPath<Order>();
    readonly getOrderTagItemClass = getOrderTagItemClass;

    constructor(private orderService: OrderService) {
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
        this.queryHandler.search();
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
}
