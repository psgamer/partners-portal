import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, ReplaySubject, take, tap, zip } from 'rxjs';

export const translateParamsSeparator = '::';

@Injectable()
export class PageTitleStrategy extends TitleStrategy {
    private readonly siteNameSubject = new ReplaySubject<string>(1);

    constructor(private readonly title: Title, private readonly translate: TranslateService) {
        super();
        (<Observable<string>>translate.get('NAME')).subscribe(siteName => this.siteNameSubject.next(siteName));
    }

    override updateTitle(routerState: RouterStateSnapshot) {
        const titleKey = this.buildTitle(routerState);

        if (titleKey) {
            const [titlePart, paramsPart] = titleKey.split(translateParamsSeparator);

            zip([
                this.siteNameSubject,
                <Observable<string>>this.translate.get(titlePart, paramsPart !== undefined ? JSON.parse(paramsPart) : undefined)
            ])
                .pipe(
                    take(1),
                    tap(([siteName, title]) => this.title.setTitle(`${title} - ${siteName}`))
                ).subscribe();
        }
    }
}
