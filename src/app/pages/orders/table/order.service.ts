/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import { Injectable } from '@angular/core';
import {
    AggregateField, and, collection, count, doc, DocumentSnapshot, endBefore, Firestore, getAggregateFromServer, getCountFromServer,
    getDocs, limit, limitToLast, or, orderBy, query, QueryCompositeFilterConstraint, QueryConstraint, QueryFieldFilterConstraint,
    QueryNonFilterConstraint, setDoc, startAfter, sum, where, writeBatch
} from '@angular/fire/firestore';

import { BehaviorSubject, concat, finalize, Observable, of, Subject, throwError, zip } from 'rxjs';
import { catchError, filter, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { FirebaseDoc, getBaseConverter, Paths } from '../../../core/models/util.models';
import { AuthenticationService } from '../../../core/services/auth.service';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';

import { Order, OrderAmountRange, OrderOperationType, OrderStatus } from './order.model';
import { OrderSortColumn, OrderSortDirection, SortEvent } from './orders-table-sortable.directive';

interface State {
    page: number;
    readonly pageSize: number;
    sortColumn: OrderSortColumn;
    sortDirection: OrderSortDirection;
}

export interface FiltersState {
    localSolutionId: LocalSolution['id'] | '';
    amountRange: OrderAmountRange['id'] | '';
    operations: OrderOperationType[];
    statuses: OrderStatus[];
}

export type AggregationOption = 'count' | 'amount' | OrderStatus;
export type OrderAggregationTimePeriod = 'currentYear';

interface PrivateState {
    firstDocSnap?: DocumentSnapshot<FirebaseDoc<Order>>;
    lastDocSnap?: DocumentSnapshot<FirebaseDoc<Order>>;
}

type SearchRequest = Partial<State & FiltersState>;

interface SearchResult {
    state: State,
    privateState: PrivateState,
    filters: FiltersState,
    orders: Order[],
    totalRecords: number,
}

@Injectable({ providedIn: 'root' })
export class OrderService {
    private readonly _orders$ = new BehaviorSubject<Order[]>([]);
    private readonly _totalRecords$ = new BehaviorSubject<number>(0);
    private readonly _filtersState$ = new BehaviorSubject<FiltersState>({
        amountRange: '',
        operations: [],
        statuses: [],
        localSolutionId: '',
    });
    private readonly _loading$ = new BehaviorSubject<boolean>(true);
    private readonly _searchRequest$ = new Subject<SearchRequest>();

    private readonly _state$ = new BehaviorSubject<State>({
        page: 1,
        pageSize: 10,
        sortColumn: 'createdDate',
        sortDirection: 'desc',
    });

    private privateState: PrivateState = {
        firstDocSnap: undefined,
        lastDocSnap: undefined,
    }

    private get collRef() {
        return this.auth
            .currentUserContractorId()
            .pipe(
                map(contractorId => contractorId as NonNullable<typeof contractorId>),
                map(contractorId => collection(this.db, 'contractors', contractorId, 'orders').withConverter(getBaseConverter<Order>()))
            );
    }

    runMe = () => {
        this.runAllPossibleQueriesForIndexes();
    }

    constructor(private db: Firestore, private auth: AuthenticationService) {
        this._searchRequest$.pipe(
            tap(() => this._loading$.next(true)),
            switchMap(state => this.getOrders(state)),
            catchError(error => {
                console.error('An error occurred while fetching orders:', error);
                this._loading$.next(false);
                return of(undefined);
            }),
            filter(result => result !== undefined),
            map(result => result as NonNullable<typeof result>),
            tap(() => this._loading$.next(false)),
            tap(({ state, privateState, orders, totalRecords }) => {
                this.privateState = privateState;

                this._state$.next(state);

                this._orders$.next(orders);
                this._totalRecords$.next(totalRecords);
            }),
        ).subscribe();
    }

    get orders$() {
        return this._orders$.asObservable();
    }

    get totalRecords$() {
        return this._totalRecords$.asObservable();
    }

    get loading$() {
        return this._loading$.asObservable();
    }

    get filtersState$() {
        return this._filtersState$.asObservable();
    }

    get state$() {
        return this._state$.asObservable();
    }

    sort({ column, direction }: SortEvent) {
        this._search({ sortColumn: column, sortDirection: direction });
    }

    gotoPage(page: State['page']) {
        this._search({ page });
    }

    search(changes: Partial<FiltersState> = {}) {
        this._searchRequest$.next({
            ...changes,
            page: 1,
        });
    }

    getOrdersAggregation<T extends AggregationOption>(option: T, timePeriod: OrderAggregationTimePeriod = 'currentYear') {
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

        switch (option) {
            case "count":
                aggregation = count();
                break;
            case "amount":
                aggregation = sum('amountTotal' as Paths<Order>);
                break;
            case OrderStatus.NEW:
            case OrderStatus.CANCELLED:
            case OrderStatus.COMPLETED:
            case OrderStatus.PENDING:
                aggregation = count();
                constraints.push(where('status' as Paths<Order>, '==', option))
                break;
            default:
                throw new Error('option not supported');
        }

        const aggregationSpec = { [option]: aggregation } as {[key in T]: AggregateField<number>};

        return this.collRef.pipe(
            map(collRef => query(collRef, ...constraints)),
            switchMap(query => getAggregateFromServer(query, aggregationSpec)),
            map(result => result.data()),
        );
    }

    cancelOrder(id: Order['id']) {
        return this.collRef.pipe(
            map(collRef => doc(collRef, id)),
            switchMap(docRef => setDoc(docRef, { status: OrderStatus.CANCELLED }, { merge: true })),
        );
    }

    deleteOrder(ids: Order['id'][]) {
        return this.collRef.pipe(
            map(collRef => ids.map(id => doc(collRef, id))),
            switchMap(docRefs => {
                const batch = writeBatch(this.db);

                docRefs.forEach(docRef => batch.delete(docRef));

                return batch.commit();
            }),
        );
    }

    private _search(changes: Partial<State> = {}) {
        this._searchRequest$.next(changes);
    }

    private getOrders(changes: SearchRequest): Observable<SearchResult> {
        const {
            firstDocSnap,
            lastDocSnap,
        } = this.privateState;

        const {
            page: oldPage,
        } = this._state$.value;

        const {
            page,
            pageSize,
            sortColumn,
            sortDirection,
        } = this.mergeState(changes);

        const {
            amountRange,
            operations,
            statuses,
            localSolutionId,
        } = this.mergeFilters(changes);

        return this.collRef
            .pipe(
                map(collRef => {
                    const fieldFilterConstraints: QueryFieldFilterConstraint[] = [];
                    const compositeFilterConstraints: QueryCompositeFilterConstraint[] = [];
                    const nonFilterConstraints: QueryNonFilterConstraint[] = [];

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

                    // ordering
                    nonFilterConstraints.push(orderBy(sortColumn, sortDirection));

                    const docsQuery = query(collRef, and(...fieldFilterConstraints, ...compositeFilterConstraints));

                    // page
                    if (!(page === oldPage || page === 1)) {
                        if (page === oldPage - 1) {
                            nonFilterConstraints.push(endBefore(firstDocSnap));
                            nonFilterConstraints.push(limitToLast(pageSize));
                        } else if (page === oldPage + 1) {
                            nonFilterConstraints.push(startAfter(lastDocSnap));
                            nonFilterConstraints.push(limit(pageSize));
                        } else {
                            const text = 'jump of 2 pages or more';
                            console.error(text);
                            throwError(() => new Error(text));
                        }
                    } else if (page === 1) {
                        nonFilterConstraints.push(limit(pageSize));
                    }

                    const pagedDocsQuery = query(docsQuery, ...nonFilterConstraints);

                    return [
                        pagedDocsQuery,
                        docsQuery
                    ] as const;
                }),
                switchMap(([pagedDocsQuery, docsQuery]) => {
                    return zip([
                        getDocs(pagedDocsQuery).then(({docs}) => docs),
                        getCountFromServer(docsQuery).then(result => result.data().count),
                    ]);
                }),
                map(([docs, totalRecords]) => {
                    const firstDocSnap = docs[0];
                    const lastDocSnap = docs[docs.length-1];

                    const result: SearchResult = {
                        state: {
                            page,
                            pageSize,
                            sortDirection,
                            sortColumn,
                        },
                        privateState: {
                            firstDocSnap,
                            lastDocSnap,
                        },
                        filters: {
                            amountRange,
                            operations,
                            statuses,
                            localSolutionId,
                        },
                        orders: docs.map(doc => doc.data()),
                        totalRecords,
                    };

                    return result;
                }),
            );
    }

    private mergeState({
        page,
        pageSize,
        sortColumn,
        sortDirection,
    }: Partial<State>): State {
        const {
            pageSize: oldPageSize,
            sortColumn: oldSortColumn,
            sortDirection: oldSortDirection,
            page: oldPage,
        } = this._state$.value;

        return {
            page: page || oldPage,
            sortDirection: sortDirection || oldSortDirection,
            sortColumn: sortColumn || oldSortColumn,
            pageSize: pageSize || oldPageSize,
        }
    }

    private mergeFilters({
        amountRange,
        operations,
        statuses,
        localSolutionId
    }: Partial<FiltersState>): FiltersState {
        const {
            amountRange: oldAmountRange,
            operations: oldOperations,
            statuses: oldStatuses,
            localSolutionId: oldLocalSolutionId
        } = this._filtersState$.value;

        return {
            amountRange: amountRange !== undefined ? amountRange : oldAmountRange,
            operations: operations || oldOperations,
            statuses: statuses || oldStatuses,
            localSolutionId: localSolutionId !== undefined ? localSolutionId : oldLocalSolutionId,
        }
    }

    private runAllPossibleQueriesForIndexes() {
        type paramType = Parameters<typeof this.getOrders>[0];

        const getSearchObj = (params: Omit<paramType, 'page' | 'pageSize'>): paramType => ({
            ...params,
            page: 1,
            pageSize: 1,
        });

        const sorts: [paramType['sortColumn'], paramType['sortDirection']][] = [
            ['createdDate', 'asc'],
            ['createdDate', 'desc'],
            ['localSolutionRes.count', 'desc'],
            ['amountTotal', 'desc'],
        ];

        const statusesArr: paramType['statuses'][] = [
            [],
            [OrderStatus.NEW],
        ];
        const opTypes: paramType['operations'][] = [
            [],
            [OrderOperationType.NEW_PURCHASE],
        ];
        const amountRangesArr: paramType['amountRange'][] = [
            '',
            'first',
        ];
        const locSolutionsArr: paramType['localSolutionId'][] = [
            '',
            'localSolution2Id',
        ];

        const searches: paramType[] = [];

        for (let sort of sorts) {
            for (let statuses of statusesArr) {
                for (let operations of opTypes) {
                    for (let amountRange of amountRangesArr) {
                        for (let localSolutionId of locSolutionsArr) {
                            searches.push(getSearchObj({
                                sortColumn: sort[0],
                                sortDirection: sort[1],
                                statuses: statuses,
                                operations: operations,
                                amountRange,
                                localSolutionId,
                            }));
                        }
                    }
                }
            }
        }

        let errEncountered = false;
        let counter = 0;

        const obs = concat(
            ...searches
                .map(search => this.getOrders(search).pipe(
                    // map(() => undefined),
                    takeWhile(() => !errEncountered),
                    catchError((err, obs) => {
                        errEncountered = true;
                        console.error(err);
                        return throwError(() => err);
                    })),
                )
        ).pipe(
            tap(v => counter++, e => counter++),
            finalize(() => setTimeout(() => console.log('finished all order request, count', counter), 100)),
            tap({error: e => console.log('err encountered', e)}),
        );

        console.time('allOrderRequests');

        obs.subscribe({complete: () => console.timeEnd('allOrderRequests')});
    }
}
