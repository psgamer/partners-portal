/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import { Injectable } from '@angular/core';
import { collection, Firestore, getDocs, orderBy, query } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';

import { BehaviorSubject, of, Subject } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { switchMap, tap } from 'rxjs/operators';
import { getBaseConverter, Paths } from '../../../core/models/util.models';

import { OrderAmountRange } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderAmountRangeService {
    private readonly generateOrderAmountRanges = httpsCallable<void, boolean>(this.functions, 'generateOrderAmountRanges');
    private readonly collRef = collection(this.db, 'order-amount-ranges').withConverter(getBaseConverter<OrderAmountRange>());
    private readonly _orderAmountRanges$ = new BehaviorSubject<OrderAmountRange[]>([]);
    private readonly _searchRequest = new Subject<void>();

    constructor(private db: Firestore, private functions: Functions) {
        this._searchRequest
            .pipe(
                switchMap(() => this.search()),
                switchMap((result) => {
                    if (!result.length) {
                        return fromPromise(this.generateOrderAmountRanges()).pipe(switchMap(() => this.search()));
                    }
                    return of(result);
                }),
                tap(docs => this._orderAmountRanges$.next(docs)))
            .subscribe();
        this._searchRequest.next();
    }

    get orderAmountRanges$() {
        return this._orderAmountRanges$.asObservable();
    }

    private async search() {
        const { docs } = await getDocs(query(this.collRef, orderBy('from' as Paths<OrderAmountRange>)));

        return docs.map(doc => doc.data());
    }
}
