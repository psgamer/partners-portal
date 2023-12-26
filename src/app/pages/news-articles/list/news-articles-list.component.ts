import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Observable, of, ReplaySubject, scan, take, tap } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { getContent, hasContent, NewsArticle, NewsArticleContentType } from '../news-articles.model';
import { NewsArticlesService } from '../news-articles.service';

@UntilDestroy()
@Component({
    templateUrl: './news-articles-list.component.html',
    styleUrls: ['./news-articles-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsArticlesListComponent {
    private readonly _loading$ = new BehaviorSubject<boolean>(false);
    private readonly _canLoadMore$ = new BehaviorSubject<boolean>(false);
    private readonly _newsArticles$ = new ReplaySubject<NewsArticle[]>(1);
    private readonly searchRequest$ = new BehaviorSubject<{lastDocCreationDate?: NewsArticle['creationDate']}>({});

    readonly loading$ = this._loading$.asObservable();
    readonly canLoadMore$ = this._canLoadMore$.asObservable();
    readonly newsArticles$: Observable<NewsArticle[]> = this._newsArticles$.pipe(
        scan((currentDocs, incomingDocs) => [...currentDocs, ...incomingDocs]),
    );

    readonly Object = Object;
    readonly NewsArticleContentType = NewsArticleContentType;
    readonly hasContent = hasContent;
    readonly getContent = getContent;
    readonly safe = this.sanitizer.bypassSecurityTrustHtml;

    constructor(private newsArticlesService: NewsArticlesService, private sanitizer: DomSanitizer) {
        this.searchRequest$.pipe(
            untilDestroyed(this),
            tap(() => this._loading$.next(true)),
            switchMap(({lastDocCreationDate}) => this.newsArticlesService.findNewsArticles(lastDocCreationDate)),
            catchError(error => {
                console.error('An error occurred while querying documents:', error);
                this._loading$.next(false);
                return of({docs: [] as NewsArticle[], hasMore: true});
            }),
            tap(() => this._loading$.next(false)),
            tap(({docs, hasMore}) => {
                this._newsArticles$.next(docs);
                this._canLoadMore$.next(hasMore);
            }),
        ).subscribe();
    }

    loadMore() {
        this._newsArticles$.pipe(
            untilDestroyed(this),
            take(1),
            filter(data => !!data.length),
            map(newsArticles => newsArticles[newsArticles.length - 1].creationDate),
            tap(lastDocCreationDate => this.searchRequest$.next({lastDocCreationDate})),
        ).subscribe();
    }
}
