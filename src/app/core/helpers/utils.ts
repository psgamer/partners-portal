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
