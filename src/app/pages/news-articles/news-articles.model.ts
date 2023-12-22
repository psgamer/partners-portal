import { Timestamp } from '@angular/fire/firestore';

export interface NewsArticle {
    id: string;
    creationDate: Timestamp;
    imageUrl: string;
    title: string;
    content: [{type: NewsArticleContentType, value: string}]
}

export enum NewsArticleContentType {
    TEXT = 'text',
    QUOTE = 'quote',
}

export const newsArticleRouteParam = 'id';

export const hasContent = (article: NewsArticle, contentType: NewsArticleContentType): boolean =>
    article.content.some(({type}) => type === contentType);
export const getContent = (article: NewsArticle, contentType: NewsArticleContentType): string =>
    article.content.find(({type}) => type === contentType)!.value;
