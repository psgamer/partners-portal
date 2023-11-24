import { Injectable } from '@angular/core';
import { collection, Firestore, getDocs, orderBy, query } from '@angular/fire/firestore';
import { FirebaseDoc, getBaseConverter, Paths } from '../../core/helpers/utils';
import { LocalSolution } from './local-solution.model';

@Injectable({ providedIn: 'root' })
export class LocalSolutionService {
    private readonly collRef = collection(this.db, 'local-solutions').withConverter(getBaseConverter<LocalSolution>());
    constructor(private db: Firestore) {}

    async findAll(): Promise<LocalSolution[]> {
        const { docs } = await getDocs(query(this.collRef, orderBy('name' as Paths<FirebaseDoc<LocalSolution>>, 'asc')));
        return docs.map(doc => doc.data());
    }
}
