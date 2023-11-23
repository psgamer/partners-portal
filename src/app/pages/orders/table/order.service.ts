/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import { Injectable } from '@angular/core';
import {
    AggregateField, collection, count, doc, Firestore, getAggregateFromServer, or, OrderByDirection, query, QueryCompositeFilterConstraint,
    QueryConstraint, QueryFieldFilterConstraint, setDoc, sum, where, writeBatch
} from '@angular/fire/firestore';
import { map, switchMap } from 'rxjs/operators';
import { QueryFilterConstraints, QueryHandler, Sort, SortEvent } from '../../../core/helpers/query.handler';
import { getBaseConverter, Paths } from '../../../core/models/util.models';
import { AuthenticationService } from '../../../core/services/auth.service';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';

import { Order, OrderAmountRange, OrderOperationType, OrderStatus } from './order.model';

export interface OrderFilterParams {
    localSolutionId: LocalSolution['id'] | '';
    amountRange: OrderAmountRange['id'] | '';
    operations: OrderOperationType[];
    statuses: OrderStatus[];
}

export type OrderSortColumn = Paths<Order>;
export type OrderSortDirection = OrderByDirection;
export type OrderSort = Sort<OrderSortColumn, OrderSortDirection>;
export type OrderSortEvent = SortEvent<OrderSortColumn, OrderSortDirection>

export type OrderAggregationOption = 'count' | 'amount' | OrderStatus;
export type OrderAggregationTimePeriod = 'currentYear';

const allowedOrderSorts: Readonly<OrderSortEvent>[] = [
    {
        column: 'createdDate',
        direction: 'asc',
    },
    {
        column: 'createdDate',
        direction: 'desc',
    },
    {
        column: 'localSolutionRes.count',
        direction: 'desc',
    },
    {
        column: 'amountTotal',
        direction: 'desc',
    },
];

export const getAllowedDirections = (column: OrderSortColumn) => allowedOrderSorts
    .filter(sort => sort.column === column)
    .map(({ direction }) => direction)

@Injectable({ providedIn: 'root' })
export class OrderService {
    private readonly defaultSort: Readonly<SortEvent<OrderSortColumn, OrderSortDirection>> = {
        column: 'createdDate',
        direction: 'desc',
    };
    private readonly defaultFilters: Readonly<OrderFilterParams> = {
        amountRange: '',
        operations: [],
        statuses: [],
        localSolutionId: '',
    }

    private get collRef$() {
        return this.auth
            .currentUserContractorId()
            .pipe(
                map(contractorId => contractorId as NonNullable<typeof contractorId>),
                map(contractorId => collection(this.db, 'contractors', contractorId, 'orders').withConverter(getBaseConverter<Order>())),
            );
    }

    constructor(private db: Firestore, private auth: AuthenticationService) {}

    get queryHandler() {
        return new QueryHandler<Order, OrderSortColumn, OrderSortDirection, OrderFilterParams>(
            this.collRef$,
            this.defaultSort,
            this.defaultFilters,
            this.mergeFilters,
            this.buildQueryConstraints,
        );
    }

    getOrdersAggregation<T extends OrderAggregationOption>(option: T, timePeriod: OrderAggregationTimePeriod = 'currentYear') {
        const constraints: QueryConstraint[] = [];

        switch (timePeriod) {
            case 'currentYear':
                const startOfYear = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);

                constraints.push(where('createdDate' as Paths<Order>, '>=', startOfYear));
                break;
            default:
                throw new Error('timePeriod not supported');
        }

        let aggregation: AggregateField<number>;

        if (option in OrderStatus) {
            aggregation = count();
            constraints.push(where('status' as Paths<Order>, '==', option));
        } else {
            switch (option) {
                case "count":
                    aggregation = count();
                    break;
                case "amount":
                    aggregation = sum('amountTotal' as Paths<Order>);
                    break;
                default:
                    throw new Error('aggregation option not supported');
            }
        }

        const aggregationSpec = { [option]: aggregation } as { [key in T]: AggregateField<number> };

        return this.collRef$.pipe(
            switchMap(collRef => getAggregateFromServer(query(collRef, ...constraints), aggregationSpec)),
            map(result => result.data()),
        );
    }

    cancelOrder(id: Order['id']) {
        return this.collRef$.pipe(
            map(collRef => doc(collRef, id)),
            switchMap(docRef => setDoc(docRef, { status: OrderStatus.CANCELLED }, { merge: true })),
        );
    }

    deleteOrder(ids: Order['id'][]) {
        return this.collRef$.pipe(
            map(collRef => ids.map(id => doc(collRef, id))),
            switchMap(docRefs => {
                const batch = writeBatch(this.db);

                docRefs.forEach(docRef => batch.delete(docRef));

                return batch.commit();
            }),
        );
    }

    private readonly mergeFilters = ({
        amountRange,
        operations,
        statuses,
        localSolutionId
    }: Partial<OrderFilterParams>, {
        amountRange: oldAmountRange,
        operations: oldOperations,
        statuses: oldStatuses,
        localSolutionId: oldLocalSolutionId
    }: OrderFilterParams): OrderFilterParams => ({
        amountRange: amountRange !== undefined ? amountRange : oldAmountRange,
            operations: operations || oldOperations,
            statuses: statuses || oldStatuses,
            localSolutionId: localSolutionId !== undefined ? localSolutionId : oldLocalSolutionId,
    });

    private readonly buildQueryConstraints = ({
        amountRange,
        operations,
        statuses,
        localSolutionId
    }: OrderFilterParams): QueryFilterConstraints => {
        const fieldFilterConstraints: QueryFieldFilterConstraint[] = [];
        const compositeFilterConstraints: QueryCompositeFilterConstraint[] = [];

        if (amountRange !== '') {
            fieldFilterConstraints.push(where('amountTotalRanges' as Paths<Order>, 'array-contains', amountRange));
        }
        if (!!operations.length && operations.length !== Object.values(OrderOperationType).length) {
            compositeFilterConstraints.push(
                or(...operations.map(operation => where('operation' as Paths<Order>, '==', operation)))
            );
        }
        if (!!statuses.length && statuses.length !== Object.values(OrderStatus).length) {
            compositeFilterConstraints.push(
                or(...statuses.map(status => where('status' as Paths<Order>, '==', status)))
            );
        }
        if (localSolutionId !== '') {
            fieldFilterConstraints.push(where('localSolutionRes.id' as Paths<Order>, '==', localSolutionId));
        }

        return {
            fieldFilterConstraints,
            compositeFilterConstraints,
        }
    }

    // TODO sample code to test for new indexes
    // private runAllPossibleQueriesForIndexes() {
    //     type paramType = Parameters<typeof this.getOrders>[0];
    //
    //     const getSearchObj = (params: Omit<paramType, 'page' | 'pageSize'>): paramType => ({
    //         ...params,
    //         page: 1,
    //         pageSize: 1,
    //     });
    //
    //     const sorts: [paramType['sortColumn'], paramType['sortDirection']][] = [
    //         ['createdDate', 'asc'],
    //         ['createdDate', 'desc'],
    //         ['localSolutionRes.count', 'desc'],
    //         ['amountTotal', 'desc'],
    //     ];
    //
    //     const statusesArr: paramType['statuses'][] = [
    //         [],
    //         [OrderStatus.NEW],
    //     ];
    //     const opTypes: paramType['operations'][] = [
    //         [],
    //         [OrderOperationType.NEW_PURCHASE],
    //     ];
    //     const amountRangesArr: paramType['amountRange'][] = [
    //         '',
    //         'first',
    //     ];
    //     const locSolutionsArr: paramType['localSolutionId'][] = [
    //         '',
    //         'localSolution2Id',
    //     ];
    //
    //     const searches: paramType[] = [];
    //
    //     for (let sort of sorts) {
    //         for (let statuses of statusesArr) {
    //             for (let operations of opTypes) {
    //                 for (let amountRange of amountRangesArr) {
    //                     for (let localSolutionId of locSolutionsArr) {
    //                         searches.push(getSearchObj({
    //                             sortColumn: sort[0],
    //                             sortDirection: sort[1],
    //                             statuses: statuses,
    //                             operations: operations,
    //                             amountRange,
    //                             localSolutionId,
    //                         }));
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //
    //     let errEncountered = false;
    //     let counter = 0;
    //
    //     const obs = concat(
    //         ...searches
    //             .map(search => this.queryHandler.getDocs(search).pipe(
    //                 // map(() => undefined),
    //                 takeWhile(() => !errEncountered),
    //                 catchError((err, obs) => {
    //                     errEncountered = true;
    //                     console.error(err);
    //                     return throwError(() => err);
    //                 })),
    //             )
    //     ).pipe(
    //         tap(v => counter++, e => counter++),
    //         finalize(() => setTimeout(() => console.log('finished all order request, count', counter), 100)),
    //         tap({error: e => console.log('err encountered', e)}),
    //     );
    //
    //     console.time('allOrderRequests');
    //
    //     obs.subscribe({complete: () => console.timeEnd('allOrderRequests')});
    // }
}
