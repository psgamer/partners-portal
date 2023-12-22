import { Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { PageTitleService, translateParamsSeparator } from './page-title-service';

@Injectable()
export class PageTitleStrategy extends TitleStrategy {
    constructor(private readonly translate: TranslateService, private pageTitleService: PageTitleService) {
        super();
    }

    override updateTitle(routerState: RouterStateSnapshot) {
        const titleKey = this.buildTitle(routerState);

        if (titleKey) {
            const [titlePart, paramsPart] = titleKey.split(translateParamsSeparator);

            const titlePartObservable = <Observable<string>>this.translate.get(titlePart, paramsPart !== undefined ? JSON.parse(paramsPart) : undefined);

            this.pageTitleService.updateTitle(titlePartObservable);
        }
    }
}
