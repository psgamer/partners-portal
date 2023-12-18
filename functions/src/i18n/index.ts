import fs from 'fs';
import { memoize as _memoize } from 'lodash';
import path from 'path';
import { _Language } from '../util/types';

const getI18nJson = _memoize((lang: _Language) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `${lang}.json`), 'utf8')) as {[key: string]: string});

export const translate = (lang: _Language, key: string, params?: {[key: string]: string | number}) => {
    let text = getI18nJson(lang)[key];
    if (params) {
        Object.entries(params).map(([key, value]) => {
            text = text.replace(new RegExp(`\{${key}\}`, 'g'), `${value}`);
        });
    }
    return text;
};
