import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { NewsArticle } from './news-articles.model';

const limit = 10;
const fromDto = ({creationDateMillis, ...rest}: NewsArticleDto): NewsArticle => ({
    ...rest,
    creationDate: Timestamp.fromMillis(creationDateMillis),
});

@Injectable({ providedIn: 'root' })
export class NewsArticlesService {
    private readonly _findNewsArticle = httpsCallable<string, NewsArticleDto | undefined>(this.functions, 'findNewsArticle');
    private readonly _findNewsArticles = httpsCallable<NewsArticlesSearch, NewsArticlesSearchResponse>(this.functions, 'findNewsArticles');

    constructor(private functions: Functions) {}

    async findNewsArticle(id: NewsArticle['id']) {
        const { data } = await this._findNewsArticle(id);
        return data ? fromDto(data) : undefined;
    }

    async findNewsArticles(lastDocCreationDate?: Timestamp) {
        const { data: { hasMore, docs } } = await this._findNewsArticles({
            limit,
            lastDocCreationDateMillis: lastDocCreationDate ? lastDocCreationDate.toMillis() : undefined
        });

        return {
            hasMore,
            docs: docs.map(fromDto),
        };
    }
}

interface NewsArticlesSearchResponse {
    docs: NewsArticleDto[];
    hasMore: boolean;
}

export interface NewsArticlesSearch {
    limit: number;
    lastDocCreationDateMillis?: number;
}

type NewsArticleDto = Omit<NewsArticle, 'creationDate'> & {creationDateMillis: number};
