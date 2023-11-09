/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import { Injectable } from '@angular/core';
import {
    collection, CollectionReference, endBefore, Firestore, getCountFromServer, getDocs, limit, orderBy, query, startAfter
} from '@angular/fire/firestore';
import { DocumentSnapshot, QueryConstraint } from '@firebase/firestore';

import { BehaviorSubject, Observable, Subject, throwError, zip } from 'rxjs';
import { delay, map, switchMap, tap } from 'rxjs/operators';
import { Contractor } from '../../../core/models/all.models';
import { FirebaseDoc, fromFirebaseSnapshot } from '../../../core/models/util.models';
import { AuthenticationService } from '../../../core/services/auth.service';

import { Order } from './order.model';
import { listSortEvent, SortColumn, SortDirection } from './orders-table-sortable.directive';

interface State {
    page: number;
    readonly pageSize: number;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
}

interface PrivateState {
    firstDocSnap?: DocumentSnapshot<FirebaseDoc<Order>>;
    lastDocSnap?: DocumentSnapshot<FirebaseDoc<Order>>;
}

interface SearchResult {
    state: State,
    privateState: PrivateState,
    orders: Order[],
    totalRecords: number,
}

@Injectable({ providedIn: 'root' })
export class OrderService {
    private readonly _orders$ = new BehaviorSubject<Order[]>([]);
    private readonly _totalRecords$ = new BehaviorSubject<number>(0);
    private readonly _loading$ = new BehaviorSubject<boolean>(true);
    private readonly _searchRequest$ = new Subject<Partial<State>>();

    private state: State = {
        page: 1,
        pageSize: 10,
        sortColumn: 'createdDate',
        sortDirection: 'desc',

        // TODO filters
    };

    private privateState: PrivateState = {
        firstDocSnap: undefined,
        lastDocSnap: undefined,
    }

    constructor(private db: Firestore, private auth: AuthenticationService) {
        this._searchRequest$.pipe(
            tap(() => this._loading$.next(true)),
            switchMap(state => this.getOrders(state)),
            delay(1000),// TODO
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

    sort({ column, direction }: listSortEvent) {
        this.search({ sortColumn: column, sortDirection: direction });
    }

    toFirstPage() {
        this.search({ page: 1 });
    }

    toPrevPage() {
        this.search({ page: this.state.page - 1 });
    }

    toNextPage() {
        this.search({ page: this.state.page + 1 });
    }

    search(changes: Partial<State> = {}) {
        this._searchRequest$.next(changes);
    }

    private getOrdersCollectionRef(contractorId: Contractor['id']) {
        return collection(this.db, 'contractors', contractorId, 'orders') as CollectionReference<FirebaseDoc<Order>>;
    }

    private getOrders(changes: Partial<State>): Observable<SearchResult> {
        const {
            pageSize,
            sortColumn: oldSortColumn,
            sortDirection: oldSortDirection,
            page: oldPage,
        } = this.state;

        const {
            firstDocSnap,
            lastDocSnap,
        } = this.privateState;

        const {
            sortColumn,
            sortDirection,
            page,
        } = changes;

        return this.auth
            .currentUserContractorId()
            .pipe(
                map(contractorId => contractorId as NonNullable<typeof contractorId>),
                map(contractorId => this.getOrdersCollectionRef(contractorId)),
                map(collRef => {
                    const constraints: QueryConstraint[] = [];

                    // filters
                    // TODO

                    // ordering
                    constraints.push(orderBy(sortColumn || oldSortColumn, sortDirection || oldSortDirection));

                    // page
                    if (page && !(page === oldPage || page === 1)) {
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
                            page: page || oldPage,
                            pageSize,
                            sortDirection: sortDirection || oldSortDirection,
                            sortColumn: sortColumn || oldSortColumn,
                        },
                        privateState: {
                            firstDocSnap,
                            lastDocSnap,
                        },
                        orders: docs.map(fromFirebaseSnapshot),
                        totalRecords,
                    };

                    return result;
                }),
            );
    }
}
