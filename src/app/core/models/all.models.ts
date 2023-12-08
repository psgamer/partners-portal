import { Timestamp } from '@angular/fire/firestore';
import { Subset } from '../helpers/utils';

export interface Client {
    id: string;
    taxCode: string;
    name: string;
}

export type ContractorClient = Subset<Client, {
    id: Client['id'];
    taxCode: Client['taxCode'];
    name: Client['name'];
}>;

export interface Period {
    count: number;
    type: PeriodType;
}

export enum PeriodType {
    YEAR = 'YEAR',
    MONTH = 'MONTH',
    DAY = 'DAY',
}

export interface NewsArticle {
    id: string;
    author: string;
    content: string;
    created: Timestamp;
    imgUrl: string;
    previewText: string;
    thumbnailUrl: string;
    title: string;
}
