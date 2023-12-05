import { Injectable } from '@angular/core';
import { collection, doc, documentId, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { flattenArray, getBaseConverter, MAX_FIRESTORE_DISJUNCTION_AMOUNT } from '../../core/helpers/utils';
import { AuthenticationService } from '../../core/services/auth.service';

import { Contractor, ContractorDistributor } from './contractor.model';

@Injectable({ providedIn: 'root' })
export class ContractorService {
    private readonly contractorId$ = this.auth.currentUserContractorId().pipe(map(contractorId => contractorId as NonNullable<typeof contractorId>));

    private readonly collRef = collection(this.db, 'contractors').withConverter(getBaseConverter<Contractor>());
    private readonly contractorDistributorsRef$ = this.contractorId$.pipe(map(contractorId => doc(collection(this.db, `contractors/${contractorId}/contractor-distributors`).withConverter(getBaseConverter<ContractorDistributor>()), contractorId)));
    private readonly contractorRef$ = this.contractorId$.pipe(map(contractorId => doc(this.collRef, contractorId)));

    constructor(private db: Firestore, private auth: AuthenticationService) {}

    findCurrentUserContractor(): Observable<Contractor> {
        return this.contractorRef$.pipe(
            switchMap(docRef => getDoc(docRef)),
            map(doc => doc.data()!),
        );
    }

    findDistributors() {
        return this.contractorDistributorsRef$.pipe(
            switchMap(docRef => getDoc(docRef)),
            map(doc => doc.data()!),
            map(({distributorIds}) => {
                const remainingIds: (typeof distributorIds) = [...distributorIds];
                const idsBatches: (typeof distributorIds)[] = [];

                while (remainingIds.length) {
                    idsBatches.push(remainingIds.splice(0, MAX_FIRESTORE_DISJUNCTION_AMOUNT));
                }

                return idsBatches;
            }),
            map(idsBatches => idsBatches.map(idsBatch => getDocs(query(this.collRef, where(documentId(), 'in', idsBatch))))),
            switchMap(queries => Promise.all(queries)),
            map(results => results.map(({ docs }) => docs.map(doc => doc.data()))),
            map(results => flattenArray(results)),
            map(contractors => {
                const sorted = [...contractors];

                sorted.sort((c1, c2) => c1.name.localeCompare(c2.name));

                return sorted;
            })
        );
    }
}
