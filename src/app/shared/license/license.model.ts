import { Timestamp } from '@angular/fire/firestore';
import { Client } from '../../core/models/all.models';
import { Contractor } from '../contractor/contractor.model';
import { LocalSolution } from '../local-solution/local-solution.model';

export interface License {
    id: string;
    expirationDate: Timestamp;
    login: string;
    publicKey: string;
    ordersContractorIds: Contractor['id'][];
    localSolution: {
        id: LocalSolution['id'];
        name: LocalSolution['name'];
        count: number;
    }
    client: {
        id: Client['id'];
        taxCode: Client['taxCode'];
        name: Client['name'];
    };
}

export interface LicensePrivateKey {
    id: string;
    licenseId: License['id'];
    privateKey: string;
}

export interface LicensePassword {
    id: string;
    password: string;
}
