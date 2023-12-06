export interface _Order {
    contractor: {
        id: string;
    }
    licenseId: string;
    number: string;
    amountTotal: number;
    amountTotalRanges: string[];
    status: _OrderStatus;
    client: {
        id: string;
        name: _Client['name'];
        taxCode: _Client['taxCode'];
    };
    hasPendingChanges: boolean;
}

export interface _OrderAmountRange {
    from: number | null;
    to: number | null;
}

export type _License = Record<string, never>;
export type _ContractorLicense = _Subset<_License, Record<string, never>>

export interface _LicensePrivateKey {
    licenseId: string;
    privateKey: string;
}

export interface _Client {
    taxCode: string;
    name: string;
}

export type _ContractorClient = _Subset<_Client, {
    taxCode: _Client['taxCode'];
    name: _Client['name'];
}>

export enum _OrderStatus {
    NEW = 'NEW',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

// eslint-disable-next-line
export type _Subset<T extends U, U> = U;
export type _Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${_Paths<T[K]>}`}`
    }[keyof T]
    : never;
export type _WebClientDoc<T> = T & { id: string };
