import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DEFAULT_LANGUAGE, Language } from '../models/language.models';

@Injectable({ providedIn: 'root' })
export class LanguageService {
    private readonly languages: Language[] = [Language.UA];

    constructor(translate: TranslateService) {
        translate.addLangs(this.languages);
        translate.setDefaultLang(DEFAULT_LANGUAGE);
        translate.use(DEFAULT_LANGUAGE);
    }
}
