import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { License, LicensePrivateKey } from './license.model';

@Injectable({ providedIn: 'root' })
export class LicenseService {
    private readonly findByLicensePrivateKey = httpsCallable<{privateKey: LicensePrivateKey['privateKey']}, License[]>(this.functions, 'findByLicensePrivateKey');

    // private readonly collRef = collection(this.db, 'licenses').withConverter(getBaseConverter<License>());
    constructor(private functions: Functions) {}

    async findByPrivateKey(privateKey: LicensePrivateKey['privateKey']): Promise<License[]> {
        const { data } = await this.findByLicensePrivateKey({ privateKey });

        data.sort((l1, l2) => l1.expirationDate.toMillis() - l2.expirationDate.toMillis());

        return data;
    }
}
