import { Timestamp } from "@angular/fire/firestore";
import { Client, License, Period } from "src/app/core/models/all.models";
import { Subset } from '../../core/helpers/utils';
import { Contractor } from '../../shared/contractor/contractor.model';
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
    licenseId: License['id'];
    amountTotal: number;
    amountTotalRanges: OrderAmountRange['id'][];
    operation: OrderOperationType;
    status: OrderStatus;
    createdDate: Timestamp;
    localSolutionSrc: {
        id: LocalSolution['id'];
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
        id: Client['id'];
        taxCode: Client['taxCode'];
        name: Client['name'];
    };
    contact: {
        name: string;
        phone: string;
        email: string;
    };
}

export type CreateOrder = Subset<Order, {
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
    amountTotal: number;
    operation: OrderOperationType;
    status: OrderStatus;
    localSolutionSrc: {
        id: LocalSolution['id'];
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
        id: Client['id'];
        taxCode: Client['taxCode'];
        name: Client['name'];
    };
    contact: {
        name: string;
        phone: string;
        email: string;
    };
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
