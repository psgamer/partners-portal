import { Injectable } from '@angular/core';
import { collection, CollectionReference, Firestore, getDocs, orderBy, query } from '@angular/fire/firestore';
import { FirebaseDoc, getBaseConverter, Paths } from '../../core/models/util.models';
import { LocalSolution } from './local-solution.model';

@Injectable({ providedIn: 'root' })
export class LocalSolutionService {
    constructor(private db: Firestore) {}

    async findAll(): Promise<LocalSolution[]> {
        // TODO converter?
        const { docs } = await getDocs(query(this.getCollectionRef(), orderBy('name' as Paths<FirebaseDoc<LocalSolution>>, 'asc')).withConverter(getBaseConverter<LocalSolution>()));
        return docs.map(doc => doc.data());
    }

    private getCollectionRef() {
        return collection(this.db, 'local-solutions') as CollectionReference<FirebaseDoc<LocalSolution>>;
    }
}
