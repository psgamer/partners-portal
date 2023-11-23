/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import {
    and, CollectionReference, DocumentSnapshot, endBefore, getCountFromServer, getDocs, limit, limitToLast, orderBy, query,
    QueryCompositeFilterConstraint, QueryFieldFilterConstraint, QueryNonFilterConstraint, startAfter
} from '@angular/fire/firestore';
import { FieldPath, OrderByDirection } from '@firebase/firestore';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { BehaviorSubject, Observable, of, Subject, throwError, zip } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { FirebaseDoc } from '../models/util.models';

interface SearchParams<SortColumn, SortDirection> {
    page: number;
    pageSize: number;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
}

interface PagingState<DOC> {
    firstDocSnap?: DocumentSnapshot<FirebaseDoc<DOC>>;
    lastDocSnap?: DocumentSnapshot<FirebaseDoc<DOC>>;
}

type SearchRequest<SortColumn, SortDirection, FilterParams> = Partial<SearchParams<SortColumn, SortDirection> & FilterParams>;

interface SearchResult<SortColumn, SortDirection, DOC, FilterParams> {
    searchParams: SearchParams<SortColumn, SortDirection>,
    pagingState: PagingState<DOC>,
    filterParams: FilterParams,
    docs: DOC[],
    totalRecords: number,
}

export type SortEvent<SortColumn, SortDirection> = Omit<Sort<SortColumn, SortDirection>, 'direction'> & {direction: SortDirection};
export interface Sort<SortColumn, SortDirection> {
    column: SortColumn;
    direction: SortDirection | '';
}

export interface QueryFilterConstraints {
    fieldFilterConstraints: QueryFieldFilterConstraint[];
    compositeFilterConstraints: QueryCompositeFilterConstraint[];
}

@UntilDestroy()
export class QueryHandler<
    DOC,
    SortColumn extends (string | FieldPath),
    SortDirection extends (OrderByDirection | undefined),
    FilterParams,
> {
    private readonly _docs$ = new BehaviorSubject<DOC[]>([]);
    private readonly _totalRecords$ = new BehaviorSubject<number>(0);
    private readonly _filterParams$ = new BehaviorSubject<FilterParams>(this.defaultFilters);
    private readonly _loading$ = new BehaviorSubject<boolean>(true);
    private readonly _searchRequest$ = new Subject<SearchRequest<SortColumn, SortDirection, FilterParams>>();
    private readonly _searchParams$ = new BehaviorSubject<SearchParams<SortColumn, SortDirection>>({
        page: 1,
        pageSize: 10,
        sortColumn: this.defaultSort.column,
        sortDirection: this.defaultSort.direction,
    });

    private pagingState: PagingState<DOC> = {
        firstDocSnap: undefined,
        lastDocSnap: undefined,
    }

    constructor(
        private readonly collRef$: Observable<CollectionReference<DOC, FirebaseDoc<DOC>>>,
        private readonly defaultSort: Readonly<SortEvent<SortColumn, SortDirection>>,
        private readonly defaultFilters: Readonly<FilterParams>,
        private readonly mergeFilters: (newFilters: Partial<FilterParams>, currentFilters: FilterParams) => FilterParams,
        private readonly buildQueryConstraints: (filters: FilterParams) => QueryFilterConstraints,
    ) {
        this._searchRequest$.pipe(
            untilDestroyed(this),
            tap(() => this._loading$.next(true)),
            switchMap(state => this.getDocs(state)),
            catchError(error => {
                console.error('An error occurred while querying documents:', error);
                this._loading$.next(false);
                return of(undefined);
            }),
            filter(result => result !== undefined),
            map(result => result as NonNullable<typeof result>),
            tap(() => this._loading$.next(false)),
            tap(({ searchParams, pagingState, docs, totalRecords }) => {
                this.pagingState = pagingState;

                this._searchParams$.next(searchParams);

                this._docs$.next(docs);
                this._totalRecords$.next(totalRecords);
            }),
        ).subscribe();
    }

    get docs$() {
        return this._docs$.asObservable();
    }

    get totalRecords$() {
        return this._totalRecords$.asObservable();
    }

    get loading$() {
        return this._loading$.asObservable();
    }

    get filterParams$() {
        return this._filterParams$.asObservable();
    }

    get searchParams$() {
        return this._searchParams$.asObservable();
    }

    sort({ column, direction }: SortEvent<SortColumn, SortDirection>) {
        this._search({ sortColumn: column, sortDirection: direction });
    }

    gotoPage(page: SearchParams<SortColumn, SortDirection>['page']) {
        this._search({ page });
    }

    search(changes: Partial<FilterParams> = {}) {
        this._searchRequest$.next({
            ...changes,
            page: 1,
        } as SearchRequest<SortColumn, SortDirection, FilterParams>);// ts issue with generics
    }

    private _search(changes: Partial<SearchParams<SortColumn, SortDirection>> = {}) {
        this._searchRequest$.next(changes as SearchRequest<SortColumn, SortDirection, FilterParams>);// ts issue with generics
    }

    private getDocs(changes: SearchRequest<SortColumn, SortDirection, FilterParams>): Observable<SearchResult<SortColumn, SortDirection, DOC, FilterParams>> {
        const {
            firstDocSnap,
            lastDocSnap,
        } = this.pagingState;

        const {
            page: oldPage,
        } = this._searchParams$.value;

        const {
            page,
            pageSize,
            sortColumn,
            sortDirection,
        } = this.mergeState(changes);

        const filterParams = this.mergeFilters(changes, this._filterParams$.value);

        return this.collRef$
            .pipe(
                map(collRef => {
                    const {
                        fieldFilterConstraints,
                        compositeFilterConstraints,
                    } = this.buildQueryConstraints(filterParams);
                    const nonFilterConstraints: QueryNonFilterConstraint[] = [];

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

                    const result: SearchResult<SortColumn, SortDirection, DOC, FilterParams> = {
                        searchParams: {
                            page,
                            pageSize,
                            sortDirection,
                            sortColumn,
                        },
                        pagingState: {
                            firstDocSnap,
                            lastDocSnap,
                        },
                        filterParams,
                        docs: docs.map(doc => doc.data()),
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
    }: Partial<SearchParams<SortColumn, SortDirection>>): SearchParams<SortColumn, SortDirection> {
        const {
            pageSize: oldPageSize,
            sortColumn: oldSortColumn,
            sortDirection: oldSortDirection,
            page: oldPage,
        } = this._searchParams$.value;

        return {
            page: page || oldPage,
            sortDirection: sortDirection || oldSortDirection,
            sortColumn: sortColumn || oldSortColumn,
            pageSize: pageSize || oldPageSize,
        }
    }
}
