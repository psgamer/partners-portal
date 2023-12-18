import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { distinctUntilChanged, ReplaySubject, tap } from 'rxjs';
import { DEFAULT_LANGUAGE, Language } from '../models/language.models';

@Injectable({ providedIn: 'root' })
export class LanguageService {
    private readonly languages: Language[] = [Language.UA];
    private readonly _language$ = new ReplaySubject<Language>();

    readonly language$ = this._language$.asObservable().pipe(distinctUntilChanged());

    constructor(translate: TranslateService) {
        translate.addLangs(this.languages);
        translate.setDefaultLang(DEFAULT_LANGUAGE);
        translate.use(DEFAULT_LANGUAGE);
        this._language$.next(DEFAULT_LANGUAGE)
        translate.onLangChange.pipe(tap(({lang}) => this._language$.next(lang as Language))).subscribe();
    }
}
