/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import { Injectable } from '@angular/core';
import {
    collection, CollectionReference, endBefore, Firestore, getCountFromServer, getDocs, limit, orderBy, query, startAfter, where
} from '@angular/fire/firestore';
import { DocumentSnapshot, QueryConstraint } from '@firebase/firestore';

import { BehaviorSubject, Observable, Subject, throwError, zip } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Contractor } from '../../../core/models/all.models';
import { FirebaseDoc, fromFirebaseSnapshot, Paths } from '../../../core/models/util.models';
import { AuthenticationService } from '../../../core/services/auth.service';
import { LocalSolution } from '../../../shared/local-solution/local-solution.model';

import { Order, OrderOperationType, OrderStatus } from './order.model';
import { listSortEvent, SortColumn, SortDirection } from './orders-table-sortable.directive';

interface State {
    page: number;
    readonly pageSize: number;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
}

export interface FiltersState {
    localSolutionId: LocalSolution['id'] | '';
    amountRange: {
        from: number | undefined,
        to: number | undefined,
    };
    operations: OrderOperationType[];
    statuses: OrderStatus[];
}

interface PrivateState {
    firstDocSnap?: DocumentSnapshot<FirebaseDoc<Order>>;
    lastDocSnap?: DocumentSnapshot<FirebaseDoc<Order>>;
}

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
        amountRange: {
            from: undefined,
            to: undefined,
        },
        operations: [],
        statuses: [],
        localSolutionId: '',
    });
    private readonly _loading$ = new BehaviorSubject<boolean>(true);
    private readonly _searchRequest$ = new Subject<Partial<State & FiltersState>>();

    private state: State = {
        page: 1,
        pageSize: 10,
        sortColumn: 'createdDate',
        sortDirection: 'desc',
    };

    private privateState: PrivateState = {
        firstDocSnap: undefined,
        lastDocSnap: undefined,
    }

    constructor(private db: Firestore, private auth: AuthenticationService) {
        this._searchRequest$.pipe(
            tap(() => this._loading$.next(true)),
            switchMap(state => this.getOrders(state)),
            tap(() => this._loading$.next(false)),
            tap(({ state, privateState, orders, totalRecords }) => {
                this.state = state;
                this.privateState = privateState;

                this._orders$.next(orders);
                this._totalRecords$.next(totalRecords);
            }),
        ).subscribe();
    }

    get tableState() {
        const {page, pageSize, sortColumn, sortDirection} = this.state;

        return {
            page,
            pageSize,
            sortColumn,
            sortDirection,
        }
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

    sort({ column, direction }: listSortEvent) {
        this._search({ sortColumn: column, sortDirection: direction });
    }

    toFirstPage() {
        this._search({ page: 1 });
    }

    toPrevPage() {
        this._search({ page: this.state.page - 1 });
    }

    toNextPage() {
        this._search({ page: this.state.page + 1 });
    }

    search(changes: Partial<FiltersState> = {}) {
        this._searchRequest$.next(changes);
    }

    private _search(changes: Partial<State> = {}) {
        this._searchRequest$.next(changes);
    }

    private getOrdersCollectionRef(contractorId: Contractor['id']) {
        return collection(this.db, 'contractors', contractorId, 'orders') as CollectionReference<FirebaseDoc<Order>>;
    }

    private getOrders(changes: Partial<State & FiltersState>): Observable<SearchResult> {
        const {
            firstDocSnap,
            lastDocSnap,
        } = this.privateState;

        const {
            page: oldPage,
        } = this.state;
        const {
            amountRange: oldAmountRange,
            operations: oldOperations,
            statuses: oldStatuses,
            localSolutionId: oldLocalSolutionId
        } = this._filtersState$.value;

        let {
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

                    // filters
                    // TODO rewrite func
                    const isSameElementsArrays = <T>(arr1: T[], arr2:T[]) => [...arr1].sort().join(',') === [...arr2].sort().join(',');

                    if (amountRange.from !== oldAmountRange.from || amountRange.to !== oldAmountRange.to
                        || !isSameElementsArrays(operations, oldOperations)
                        || !isSameElementsArrays(statuses, oldStatuses)
                        || localSolutionId !== oldLocalSolutionId) {
                        // reset page, different search
                        page = 1;
                    }

                    if (amountRange.from || amountRange.to) {
                        if (amountRange.from) {
                            constraints.push(where('amountTotal' as Paths<Order>, '>=', amountRange.from));
                        }
                        if (amountRange.to) {
                            constraints.push(where('amountTotal' as Paths<Order>, '<=', amountRange.to));
                        }

                        // TODO look for workarounds? probably one query for 10 docs, then docId in (10 docIds)
                        // TODD reset paging on new query
                        sortColumn = 'amountTotal' as Paths<Order>;
                        sortDirection = 'asc';
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

                    // page
                    if (!(page === oldPage || page === 1)) {
                        if (page === oldPage - 1) {
                            constraints.push(endBefore(firstDocSnap));
                        } else if (page === oldPage + 1) {
                            constraints.push(startAfter(lastDocSnap));
                        } else {
                            throwError(() => new Error('jump of 2 pages or more'));
                        }
                    }

                    // pageSize
                    constraints.push(limit(pageSize));

                    return query(collRef, ...constraints);
                }),
                switchMap(collQuery => {
                    return zip([
                        getDocs(collQuery).then(({docs}) => docs),
                        getCountFromServer(collQuery).then(result => result.data().count),
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
                        orders: docs.map(fromFirebaseSnapshot),
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
        } = this.state;

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
            amountRange: amountRange || oldAmountRange,
            operations: operations || oldOperations,
            statuses: statuses || oldStatuses,
            localSolutionId: localSolutionId !== undefined ? localSolutionId : oldLocalSolutionId,
        }
    }
}
