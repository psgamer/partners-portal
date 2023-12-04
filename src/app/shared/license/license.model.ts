import { Timestamp } from '@angular/fire/firestore';
import { Subset } from '../../core/helpers/utils';
import { Client, ContractorClient } from '../../core/models/all.models';
import { LocalSolution } from '../local-solution/local-solution.model';

export interface License {
    id: string;
    expirationDate: Timestamp;
    login: string;
    publicKey: string;
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

export type ContractorLicense = Subset<License, {
    id: License['id'];
    expirationDate: License['expirationDate'];
    login: License['login'];
    publicKey: License['publicKey'];
    localSolution: License['localSolution'];
    client: {
        id: ContractorClient['id'];
        taxCode: ContractorClient['taxCode'];
        name: ContractorClient['name'];
    };
}>

export interface LicensePrivateKey {
    id: string;
    licenseId: License['id'];
    privateKey: string;
}

export interface LicensePassword {
    id: string;
    licenseId: License['id'];
    password: string;
}
