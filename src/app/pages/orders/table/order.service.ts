/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import {ChangeDetectorRef, Injectable} from '@angular/core';
import {
    collection,
    CollectionReference,
    DocumentSnapshot,
    endBefore,
    Firestore,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    QueryConstraint,
    startAfter,
    where,
} from '@angular/fire/firestore';

import {BehaviorSubject, Observable, of, Subject, take, throwError, zip} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {Contractor} from '../../../core/models/all.models';
import {FirebaseDoc, getBaseConverter, Paths} from '../../../core/models/util.models';
import {AuthenticationService} from '../../../core/services/auth.service';
import {LocalSolution} from '../../../shared/local-solution/local-solution.model';

import {Order, OrderAmountRange, OrderOperationType, OrderStatus} from './order.model';
import {listSortEvent, SortColumn, SortDirection} from './orders-table-sortable.directive';

interface State {
    page: number;
    readonly pageSize: number;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
}

export interface FiltersState {
    localSolutionId: LocalSolution['id'] | '';
    amountRange: OrderAmountRange['id'] | '';
    operations: OrderOperationType[];
    statuses: OrderStatus[];
}

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
        pageSize: 1,// TODO change to 10
        sortColumn: 'createdDate',
        sortDirection: 'desc',
    });

    private privateState: PrivateState = {
        firstDocSnap: undefined,
        lastDocSnap: undefined,
    }

    constructor(private db: Firestore, private auth: AuthenticationService, private cd: ChangeDetectorRef) {
        this._searchRequest$.pipe(
            tap(() => this._loading$.next(true)),
            switchMap(state => this.getOrders(state)),
            tap(() => this._loading$.next(false)),
            tap(({ state, privateState, orders, totalRecords }) => {
                this.privateState = privateState;

                this._state$.next(state);

                this._orders$.next(orders);
                this._totalRecords$.next(totalRecords);

                this.cd.markForCheck();
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

    sort({ column, direction }: listSortEvent) {
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

    private _search(changes: Partial<State> = {}) {
        this._searchRequest$.next(changes);
    }

    private getOrdersCollectionRef(contractorId: Contractor['id']) {
        return collection(this.db, 'contractors', contractorId, 'orders') as CollectionReference<FirebaseDoc<Order>>;
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

        return this.auth
            .currentUserContractorId()
            .pipe(
                map(contractorId => contractorId as NonNullable<typeof contractorId>),
                map(contractorId => this.getOrdersCollectionRef(contractorId)),
                map(collRef => {
                    const constraints: QueryConstraint[] = [];

                    if (amountRange !== '') {
                        constraints.push(where('amountTotalRanges' as Paths<Order>, 'array-contains', amountRange));
                    }
                    if (!!operations.length && operations.length !== Object.values(OrderOperationType).length) {
                        constraints.push(where('operation' as Paths<Order>, 'in', operations));
                    }
                    if (!!statuses.length && statuses.length !== Object.values(OrderStatus).length) {
                        constraints.push(where('status' as Paths<Order>, 'in', statuses));
                    }
                    if (localSolutionId !== '') {
                        constraints.push(where('localSolutionRes.id' as Paths<Order>, '==', localSolutionId));
                    }

                    // ordering
                    constraints.push(orderBy(sortColumn, sortDirection));

                    const countQuery = query(collRef, ...constraints);

                    // page
                    if (!(page === oldPage || page === 1)) {
                        if (page === oldPage - 1) {
                            constraints.push(endBefore(firstDocSnap));
                        } else if (page === oldPage + 1) {
                            constraints.push(startAfter(lastDocSnap));
                        } else {
                            const text = 'jump of 2 pages or more';
                            console.error(text);
                            throwError(() => new Error(text));
                        }
                    }

                    // pageSize
                    constraints.push(limit(pageSize));

                    const collQuery = query(collRef, ...constraints).withConverter(getBaseConverter<Order>());

                    return [
                        collQuery,
                        countQuery
                    ] as const;
                }),
                switchMap(([collQuery, countQuery]) => {
                    return zip([
                        getDocs(collQuery).then(({docs}) => docs),
                        getCountFromServer(countQuery).then(result => result.data().count),
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

        const sortCols: paramType['sortColumn'][] = [
            'createdDate',
            'number',
            'localSolutionRes.name',
            'operation',
            'localSolutionRes.count',
            'amountTotal',
            'contractor.name',
            'client.name',
            'status',
        ];
        const sortDirs: paramType['sortDirection'][] = [
            'asc',
            'desc',
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
            '3N8ZkaAkqTxZFGPwzxXa',
        ];
        const locSolutionsArr: paramType['localSolutionId'][] = [
            '',
            'localSolution2Id',
        ];

        const searches: paramType[] = [];

        for (let sortColumn of sortCols) {
            for (let sortDirection of sortDirs) {
                for (let statuses of statusesArr) {
                    for (let operations of opTypes) {
                        for (let amountRange of amountRangesArr) {
                            for (let localSolutionId of locSolutionsArr) {
                                searches.push(getSearchObj({
                                    sortColumn,
                                    sortDirection: sortDirection as any,
                                    statuses: statuses as any,
                                    operations: operations as any,
                                    amountRange,
                                    localSolutionId,
                                }));
                            }
                        }
                    }
                }
            }
        }

        const obs = zip(
            searches
                .map(search => this.getOrders(search).pipe(
                    map(() => undefined),
                    catchError((err, obs) => {
                        console.error(err);
                        return of(undefined);
                    })),
                )
        ).pipe(
            take(1),
            tap(() => console.timeEnd('requests')),
        );

        console.time('requests');
        obs.subscribe();
    }
}
