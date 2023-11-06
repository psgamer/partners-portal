/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
// Date Format
import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, switchMap, tap } from 'rxjs/operators';
import { SortColumn, SortDirection } from './dashboard-sortable.directive';
import { orders } from './dashboard.data';

import { ordersModel } from './dashboard.model';

interface SearchResult {
  countries: ordersModel[];
}

interface State {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

function sort(countries: ordersModel[], column: SortColumn, direction: string): ordersModel[] {
  if (direction === '' || column === '') {
    return countries;
  } else {
    return [...countries].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _countries$ = new BehaviorSubject<ordersModel[]>([]);

  content?: any;
  products?: any;
  toppages?: any;

  private _state: State = {
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private pipe: DecimalPipe) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._countries$.next(result.countries);
    });

    this._search$.next();

    this.products = orders;
  }

  get countries$() { return this._countries$.asObservable(); }
  get product() { return this.products; }
  get toppage() { return this.toppages; }
  get loading$() { return this._loading$.asObservable(); }

  set sortColumn(sortColumn: SortColumn) { this._set({ sortColumn }); }
  set sortDirection(sortDirection: SortDirection) { this._set({ sortDirection }); }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search(): Observable<SearchResult> {
    const datas = (this.product) ?? [];
    const topdatas = (this.toppages) ?? [];
    const { sortColumn, sortDirection } = this._state;

    // 1. sort
    let countries = sort(datas, sortColumn, sortDirection);

    countries = countries;

    return of({ countries });
  }


}
