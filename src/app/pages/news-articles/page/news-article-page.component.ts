import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { concatWith, EMPTY, Observable, of, ReplaySubject, tap } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { PageTitleService } from '../../../core/page-title-service';
import { getContent, hasContent, NewsArticle, NewsArticleContentType, newsArticleRouteParam } from '../news-articles.model';
import { NewsArticlesService } from '../news-articles.service';

@UntilDestroy()
@Component({
    templateUrl: './news-article-page.component.html',
    styleUrls: ['./news-article-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsArticlePageComponent {
    private readonly routeParam$ = this.route.paramMap.pipe(
        untilDestroyed(this),
        map(map => map.get(newsArticleRouteParam)),
        filter(param => !!param),
        map(param => param as NonNullable<typeof param>),
    );

    readonly newsArticle$ = new ReplaySubject<NewsArticle>();
    readonly breadcrumbs$ = this.routeParam$.pipe(
        untilDestroyed(this),
        switchMap(param => (this.translate.get('NEWS.LABELS.DETAILS.TITLE', { [newsArticleRouteParam]: param }) as Observable<string>)
            .pipe(concatWith(this.newsArticle$.pipe(map(({ title }) => title))))),
        map(finalBreadcrumb => [
            'MENUITEMS.NEWS.TEXT',
            finalBreadcrumb,
        ]),
    );
    readonly NewsArticleContentType = NewsArticleContentType;
    readonly hasContent = hasContent;
    readonly getContent = getContent;
    readonly safe = this.sanitizer.bypassSecurityTrustHtml;

    constructor(
        private route: ActivatedRoute,
        private translate: TranslateService,
        private newsArticlesService: NewsArticlesService,
        private router: Router,
        private pageTitleService: PageTitleService,
        private sanitizer: DomSanitizer,
    ) {
        this.routeParam$.pipe(
            untilDestroyed(this),
            switchMap(param => fromPromise(this.newsArticlesService.findNewsArticle(param)).pipe(
                switchMap(newsArticle => {
                    if (!newsArticle) {
                        console.log(`newsArticle by param ${param} not found`);
                        this.router.navigate(['../']);
                        return EMPTY;
                    } else {
                        return of(newsArticle);
                    }
                }),
            )),
            catchError(error => {
                console.error('An error occurred while querying order:', error);
                this.router.navigate(['../']);
                return EMPTY;
            }),
            tap(newsArticle => this.newsArticle$.next(newsArticle))
        ).subscribe();

        this.newsArticle$.pipe(
            untilDestroyed(this),
            tap(({title}) => this.pageTitleService.updateTitle(of(title)))
        ).subscribe();
    }
}
