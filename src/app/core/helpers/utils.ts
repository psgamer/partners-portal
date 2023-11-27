import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, WithFieldValue } from '@angular/fire/firestore';
import { FormArray, FormControl } from '@angular/forms';


type FirebaseDoc<T> = Omit<T, 'id'>;

type Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
    }[keyof T]
    : never;

type FormStructure<T> = {
    [K in keyof T]: NonNullable<T[K]> extends any[]
        ? FormArray<FormControl<NonNullable<T[K]>[0]>>
        : FormControl<NonNullable<T[K]>>;
};

type Subset<T extends U, U> = U;

const getSelectComparator = <T extends object>(key: keyof T) => ({[key]: key1}: T, {[key]: key2}: T) => key1 === key2;
const selectComparatorById = getSelectComparator<{id: any}>('id');

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

export {FirebaseDoc, Paths, FormStructure, Subset, selectComparatorById, getSelectComparator, getExtractByPath, getBaseConverter};
