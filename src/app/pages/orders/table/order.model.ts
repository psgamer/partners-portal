import { Timestamp } from "@angular/fire/firestore";
import { Client, Contractor, License, LocalSolution, Payer, Period } from "src/app/core/models/all.models";

export interface OrderModel {
    id?: any;
    category?: any;
    img?: any;
    name?: any;
    instructor?: any;
    lessons?: any;
    duration?: any;
    students?: any;
    fees?: any;
    rating?: any;
    status?: any;
}

interface Order {
    id: string;
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
    operation: OrderOperationType;
    status: OrderStatus;
    createdDate: Timestamp;
    localSolutionSrc: {
        id: LocalSolution['id'];
        count: number;
        expirationDate: Timestamp;
    };
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

enum OrderOperationType {
    NEW_PURCHASE = 'NEW_PURCHASE',
    PROLONGATION = 'PROLONGATION',
}

enum OrderStatus {
    NEW = 'NEW',
    ACTIVE = 'ACTIVE',
}

export { Order, OrderOperationType, OrderStatus }
