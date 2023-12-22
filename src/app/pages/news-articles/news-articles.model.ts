import { Timestamp } from '@angular/fire/firestore';

export interface NewsArticle {
    id: string;
    creationDate: Timestamp;
    imageUrl: string;
    title: string;
    content: [{type: NewsArticleContentType, value: string}]
}

export enum NewsArticleContentType {
    TEXT = 'TEXT',
    QUOTE = 'QUOTE',
}

export const newsArticleRouteParam = 'id';
