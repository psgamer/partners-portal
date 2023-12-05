import { Timestamp } from "@angular/fire/firestore";
import { ContractorClient, Period } from "src/app/core/models/all.models";
import { Subset } from '../../core/helpers/utils';
import { Contractor } from '../../shared/contractor/contractor.model';
import { ContractorLicense } from '../../shared/license/license.model';
import { LocalSolution } from '../../shared/local-solution/local-solution.model';
import { Payer } from '../../shared/payer/payer.model';
import { OrderAmountRange } from './order-amount-range.model';

export interface Order {
    id: string;
    number: Order['id'];
    contractor: {
        id: Contractor['id'];
        name: Contractor['name'];
    };
    distributor: {
        id: Contractor['id'];
        name: Contractor['name'];
    };
    contractorPayer: {
        id: Payer['id'];
        name: Payer['name'];
    };
    distributorPayer: {
        id: Payer['id'];
        name: Payer['name'];
    };
    licenseId: ContractorLicense['id'] | null;
    amountTotal: number;
    amountTotalRanges: OrderAmountRange['id'][];
    operation: OrderOperationType;
    status: OrderStatus;
    createdDate: Timestamp;
    localSolutionSrc: {
        id: LocalSolution['id'];
        name: LocalSolution['name'];
        count: number;
        expirationDate: Timestamp;
    } | null;
    localSolutionRes: {
        id: LocalSolution['id'];
        name: LocalSolution['name'];
        count: number;
        period: Period;
    };
    client: {
        id: ContractorClient['id'];
        taxCode: ContractorClient['taxCode'];
        name: ContractorClient['name'];
    };
    contact: {
        name: string;
        phone: string;
        email: string;
    };
    hasPendingChanges: boolean;
}

export type CreateOrder = Subset<Order, {
    contractor: Order['contractor'];
    distributor: Order['distributor'];
    contractorPayer: Order['contractorPayer'];
    distributorPayer: Order['distributorPayer'];
    licenseId: Order['licenseId'];
    amountTotal: Order['amountTotal'];
    operation: Order['operation'];
    status: Order['status'];
    createdDate: Order['createdDate'];
    localSolutionSrc: Order['localSolutionSrc'];
    localSolutionRes: Order['localSolutionRes'];
    client: {
        taxCode: Order['client']['taxCode'];
        name: Order['client']['name'];
    };
    contact: Order['contact'];
    hasPendingChanges: Order['hasPendingChanges'];
}>;

export type UpdateOrder = Subset<Order, {
    distributor: Order['distributor'];
    contractorPayer: Order['contractorPayer'];
    distributorPayer: Order['distributorPayer'];
    licenseId: Order['licenseId'];
    amountTotal: Order['amountTotal'];
    operation: Order['operation'];
    localSolutionSrc: Order['localSolutionSrc'];
    localSolutionRes: Order['localSolutionRes'];
    client: {
        id: Order['client']['id'] | null;
        taxCode: Order['client']['taxCode'];
        name: Order['client']['name'];
    };
    contact: Order['contact'];
    hasPendingChanges: Order['hasPendingChanges'];
}>;

export enum OrderOperationType {
    NEW_PURCHASE = 'NEW_PURCHASE',
    PROLONGATION = 'PROLONGATION',
}

export enum OrderStatus {
    NEW = 'NEW',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export const getOrderTagItemClass = ({status}: Pick<Order, 'status'>): string => {
    switch (status) {
        case OrderStatus.NEW:
            return 'bg-secondary-subtle text-secondary';
        case OrderStatus.PENDING:
            return 'bg-primary-subtle text-primary';
        case OrderStatus.CANCELLED:
            return 'bg-danger-subtle text-danger';
        case OrderStatus.COMPLETED:
            return 'bg-success-subtle text-success';
        default:
            return '';
    }
};

export const orderRouteParam = 'number';