import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { Observable, ReplaySubject, take, tap, zip } from 'rxjs';

export const translateParamsSeparator = '::';
const maxTitleLength = 60;

@Injectable({ providedIn: 'root' })
export class PageTitleService {
    private readonly siteNameSubject = new ReplaySubject<string>(1);

    constructor(private readonly title: Title, private readonly translate: TranslateService) {
        (<Observable<string>>translate.get('NAME')).subscribe(siteName => this.siteNameSubject.next(siteName));
    }

    updateTitle(titlePartObservable: Observable<string>) {
        zip([
            titlePartObservable,
            this.siteNameSubject,
        ])
            .pipe(
                take(1),
                tap(([title, siteName]) => {
                    const siteNameTitleSuffix = ` - ${siteName}`;
                    let trimmedTitle = title;

                    if (`${trimmedTitle}${siteNameTitleSuffix}`.length > maxTitleLength) {
                        const remainingSpace = maxTitleLength - siteNameTitleSuffix.length;

                        trimmedTitle = `${title.substring(0, remainingSpace - 3)}...`;
                    }

                    this.title.setTitle(`${trimmedTitle}${siteNameTitleSuffix}`);
                })
            ).subscribe();
    }
}
