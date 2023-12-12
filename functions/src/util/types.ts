import { Timestamp } from 'firebase-admin/firestore'

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
    localSolutionRes: {
        id: string;
        name: _LocalSolution['name'];
        count: number;
        period: _Period;
    };
    hasPendingChanges: boolean;
}

export interface _OrderAmountRange {
    from: number | null;
    to: number | null;
}

export interface _LocalSolution {
    name: string;
}

export interface _License {
    expirationDate: Timestamp;
    login: string;
    publicKey: string;
    localSolution: {
        id: string;
        name: _LocalSolution['name'];
        count: number;
    }
    client: {
        id: string;
        taxCode: _Client['taxCode'];
        name: _Client['name'];
    }
}

export type _ContractorLicense = _Subset<_License, {
    expirationDate: Timestamp;
    login: string;
    publicKey: string;
    localSolution: {
        id: string;
        name: _LocalSolution['name'];
        count: number;
    }
    client: {
        id: string;
        taxCode: _ContractorClient['taxCode'];
        name: _ContractorClient['name'];
    }
}>

export interface _LicensePrivateKey {
    licenseId: string;
    privateKey: string;
}

export interface _LicensePassword {
    licenseId: string;
    password: string;
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

export interface _UserNotification {
    isRead: boolean;
    skipUpdateTriggers?: boolean;
    skipDeleteTriggers?: boolean;
}

export interface _UserNotificationMetadata {
    unreadCount: number;
}

export interface _ProcessedEvent {
    timestamp: Timestamp;
}

export interface _Period {
    count: number;
    type: _PeriodType;
}

export enum _PeriodType {
    YEAR = 'YEAR',
    MONTH = 'MONTH',
    DAY = 'DAY',
}

// eslint-disable-next-line
export type _Subset<T extends U, U> = U;
export type _Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${_Paths<T[K]>}`}`
    }[keyof T]
    : never;
export type _WebClientDoc<T> = T & { id: string };