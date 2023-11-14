/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
import { Injectable } from '@angular/core';
import { collection, CollectionReference, Firestore, getDocs, orderBy, query } from '@angular/fire/firestore';

import { BehaviorSubject, Subject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { FirebaseDoc, getBaseConverter, Paths } from '../../../core/models/util.models';

import { OrderAmountRange } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderAmountRangeService {
    private readonly collRef = collection(this.db, 'order-amount-ranges') as CollectionReference<FirebaseDoc<OrderAmountRange>>;
    private readonly _orderAmountRanges$ = new BehaviorSubject<OrderAmountRange[]>([]);
    private readonly _searchRequest = new Subject<void>();

    constructor(private db: Firestore) {
        this._searchRequest
            .pipe(
                switchMap(() => this.search()),
                tap(docs => this._orderAmountRanges$.next(docs)))
            .subscribe();
        this._searchRequest.next();
    }

    get orderAmountRanges$() {
        return this._orderAmountRanges$.asObservable();
    }

    private search() {
        return getDocs(query(this.collRef, orderBy('from' as Paths<FirebaseDoc<OrderAmountRange>>, 'asc'))
            .withConverter(getBaseConverter<OrderAmountRange>()))
            .then(({ docs }) => docs.map(doc => doc.data()));
    }
}
