import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { take, tap } from 'rxjs';

@Injectable()
export class PageTitleStrategy extends TitleStrategy {
    constructor(private readonly title: Title, private readonly translate: TranslateService) {
        super();
    }

    override updateTitle(routerState: RouterStateSnapshot) {
        const titleKey = this.buildTitle(routerState);
        if (titleKey) {
            this.translate
                .get(titleKey)
                .pipe(
                    take(1),
                    tap(title => this.title.setTitle(`SampleApp - ${title}`))
                ).subscribe();
        }
    }
}
