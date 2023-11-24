import { Injectable } from '@angular/core';
import { collection, Firestore, getDocs, orderBy, query } from '@angular/fire/firestore';
import { FirebaseDoc, getBaseConverter, Paths } from '../../core/helpers/utils';

import { Contractor } from '../contractor/contractor.model';
import { Payer } from './payer.model';

@Injectable({ providedIn: 'root' })
export class PayerService {
    constructor(private db: Firestore) {}

    private getCollRef(contractorId: Contractor['id']) {
        return collection(this.db, 'contractors', contractorId, 'payers').withConverter(getBaseConverter<Payer>());
    }

    async findAllForContractor(contractorId: Contractor['id']) {
        const { docs } = await getDocs(query(this.getCollRef(contractorId), orderBy('name' as Paths<FirebaseDoc<Payer>>, 'asc')));
        return docs.map(doc => doc.data());
    }
}
