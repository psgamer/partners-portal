import { Predicate } from '@angular/core';
import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, Timestamp, WithFieldValue } from '@angular/fire/firestore';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';


export type FirebaseDoc<T> = Omit<T, 'id'>;

export type Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
    }[keyof T]
    : never;

export type FormStructure<T> = {
    [K in keyof T]: NonNullable<T[K]> extends any[]
        ? FormArray<FormControl<NonNullable<T[K]>[0]>>
        : FormControl<NonNullable<T[K]>>;
};

export type Subset<T extends U, U> = U;

export type NonNullableFields<T> = {
    [K in keyof T]-?: NonNullable<T[K]>;
}

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export const showError: Predicate<AbstractControl> = ({dirty, touched, invalid}) => dirty && touched && invalid;
export const validateForm = (formGroup: FormGroup): void => {
    Object.values(formGroup.controls)
        .forEach((c) => {
            c.markAsTouched({ onlySelf: true });
            c.markAsDirty({ onlySelf: true });
            if (c.asyncValidator) {
                c.updateValueAndValidity();
            }
            if (c instanceof FormGroup) {
                validateForm(c);
            }
        });
};

export const getSelectComparator = <T extends object>(key: keyof T) => (obj1: T, obj2: T) => (!obj1 && !obj2) || (obj1 && obj2 && obj1[key] === obj2[key]);
export const selectComparatorById = getSelectComparator<{id: any}>('id');

export const getExtractByPath = <T extends {[key: string]: any}>() => <R = any>(obj: T, path: Paths<T>): R => path
    .split('.')
    .reduce((acc, pathPiece) => acc[pathPiece], obj as any);

export const getBaseConverter = <T extends ({id: any} & DocumentData)>(): FirestoreDataConverter<T, FirebaseDoc<T>> => ({
    toFirestore({id, ...rest}: WithFieldValue<T>): WithFieldValue<FirebaseDoc<T>> {
        return {
            ...rest,
        } as FirebaseDoc<T>;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<T>): T {
        return ({
            ...snapshot.data() as FirebaseDoc<T>,
            id: snapshot.id,
        }) as T;
    },
});

export const autoCompleteLocalFilter = <T>(a: T[]) => a;

export const formToTimestamp = ({_seconds, _nanoseconds}: any) => new Timestamp(_seconds, _nanoseconds);

export const buildUpdateObj = <T extends object>(target: Partial<T> | Subset<T, any>, comparisonObj: T): Partial<typeof target> => buildDiffObject(target, comparisonObj);

export const isEmptyUpdateObj: Predicate<Record<string, any>> = obj => {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
};

export const updateObjToPayload = <T extends object>(obj: T): any => flattenObject(obj);

const flattenObject = (obj: any, prefix = ''): any => {
    return Object.keys(obj).reduce((acc, key) => {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
            return { ...acc, ...flattenObject(obj[key], newKey) };
        } else {
            return { ...acc, [newKey]: obj[key] };
        }
    }, {});
};

const buildDiffObject = (target: any, comparisonValue: any): any => {
    const diffObject: any = {};

    for (const key in target) {
        if (target.hasOwnProperty(key)) {
            if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                if (comparisonValue[key] !== undefined && typeof comparisonValue[key] === 'object' && comparisonValue[key] !== null && !Array.isArray(comparisonValue[key])) {
                    const nestedDiff = buildDiffObject(target[key], comparisonValue[key]);
                    if (Object.keys(nestedDiff).length > 0) {
                        diffObject[key] = nestedDiff;
                    }
                } else if (comparisonValue[key] !== target[key]) {
                    diffObject[key] = target[key];
                }
            } else if (Array.isArray(target[key])) {
                if (comparisonValue[key] !== undefined && Array.isArray(comparisonValue[key])) {
                    const arrayDiff = buildArrayDiff(target[key], comparisonValue[key]);
                    if (arrayDiff.length > 0) {
                        diffObject[key] = arrayDiff;
                    }
                } else {
                    diffObject[key] = target[key];
                }
            } else if (!(key in comparisonValue) || comparisonValue[key] !== target[key]) {
                diffObject[key] = target[key];
            }
        }
    }

    return diffObject;
}

export const flattenArray = <T>(arr: T[][]): T[]  => [].concat(...arr as any);

export const MAX_FIRESTORE_DISJUNCTION_AMOUNT = 30;

const buildArrayDiff = (arr1: any[], arr2: any[]): any[] => {
    const diffArray: any[] = [];

    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();

    if (JSON.stringify(sortedArr1) !== JSON.stringify(sortedArr2)) {
        return arr1;
    }

    arr1.forEach((item, index) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            if (arr2[index] !== undefined && typeof arr2[index] === 'object' && arr2[index] !== null && !Array.isArray(arr2[index])) {
                const nestedDiff = buildDiffObject(item, arr2[index]);
                if (Object.keys(nestedDiff).length > 0) {
                    diffArray.push(nestedDiff);
                }
            } else if (arr2[index] !== item) {
                diffArray.push(item);
            }
        } else if (Array.isArray(item)) {
            if (arr2[index] !== undefined && Array.isArray(arr2[index])) {
                const arrayDiff = buildArrayDiff(item, arr2[index]);
                if (arrayDiff.length > 0) {
                    diffArray.push(arrayDiff);
                }
            } else {
                diffArray.push(item);
            }
        } else if (!(index in arr2) || arr2[index] !== item) {
            diffArray.push(item);
        }
    });

    return diffArray;
}
