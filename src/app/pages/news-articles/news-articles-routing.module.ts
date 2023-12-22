import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { translateParamsSeparator } from '../../core/page-title-service';
import { NewsArticlesListComponent } from './list/news-articles-list.component';
import { newsArticleRouteParam } from './news-articles.model';
import { NewsArticlePageComponent } from './page/news-article-page.component';

const routes: Routes = [
    {
        path: "",
        component: NewsArticlesListComponent,
        title: 'MENUITEMS.NEWS.TEXT',
    },
    {
        path: `:${newsArticleRouteParam}`,
        component: NewsArticlePageComponent,
        title: ({ params }) => `NEWS.LABELS.DETAILS.TITLE${translateParamsSeparator}${JSON.stringify({ [newsArticleRouteParam]: params[newsArticleRouteParam] })}`,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class NewsArticlesRoutingModule {}
