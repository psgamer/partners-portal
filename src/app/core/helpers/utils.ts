import {
    DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp, WithFieldValue
} from '@angular/fire/firestore';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';


type FirebaseDoc<T> = Omit<T, 'id'>;

type Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
    }[keyof T]
    : never;

type FormStructure<T> = {
    [K in keyof T]: NonNullable<T[K]> extends Timestamp
        ? AbstractControl<NonNullable<T[K]>>
        : (NonNullable<T[K]> extends object
            ? FormGroup<FormStructure<NonNullable<T[K]>>>
            : (NonNullable<T[K]> extends any[]
                ? FormArray<AbstractControl<NonNullable<T[K]>[0]>>
                : AbstractControl<NonNullable<T[K]>>));
};

const getExtractByPath = <T extends {[key: string]: any}>() => <R = any>(obj: T, path: Paths<T>): R => path
    .split('.')
    .reduce((acc, pathPiece) => acc[pathPiece], obj as any);

const getBaseConverter = <T extends ({id: any} & DocumentData)>(): FirestoreDataConverter<T, FirebaseDoc<T>> => ({
    toFirestore({id, ...rest}: WithFieldValue<T>): WithFieldValue<FirebaseDoc<T>> {
        return {
            ...rest,
        } as FirebaseDoc<T>;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<T>, options: SnapshotOptions): T {
        return ({
            ...snapshot.data() as FirebaseDoc<T>,
            id: snapshot.id,
        }) as T;
    },
});

export {FirebaseDoc, Paths, FormStructure, getExtractByPath, getBaseConverter};
