import { Injectable } from '@angular/core';
import { collection, doc, Firestore, getDoc, getDocs, orderBy, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FirebaseDoc, getBaseConverter, Paths } from '../../core/helpers/utils';
import { AuthenticationService } from '../../core/services/auth.service';

import { Contractor } from './contractor.model';

@Injectable({ providedIn: 'root' })
export class ContractorService {
    private readonly collRef = collection(this.db, 'contractors').withConverter(getBaseConverter<Contractor>());
    private readonly contractorId$ = this.auth.currentUserContractorId().pipe(map(contractorId => contractorId as NonNullable<typeof contractorId>));

    constructor(private db: Firestore, private auth: AuthenticationService) {}

    findCurrentUserContractor(): Observable<Contractor> {
        return this.contractorId$.pipe(
            map(contractorId => doc(this.collRef, contractorId).withConverter(getBaseConverter<Contractor>())),
            switchMap(docRef => getDoc(docRef)),
            map(doc => doc.data()!),
        );
    }

    findDistributors(): Observable<Contractor[]> {
        return this.contractorId$.pipe(
            map(contractorId => where('contractorIds' as Paths<Contractor>, 'array-contains', contractorId)),
            map(constraint => query(this.collRef, constraint, orderBy('name' as Paths<FirebaseDoc<Contractor>>, 'asc'))),
            switchMap(query => getDocs(query)),
            map(({ docs }) => docs.map(doc => doc.data())),
        );
    }
}
