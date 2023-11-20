import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, WithFieldValue } from '@angular/fire/firestore';


type FirebaseDoc<T> = Omit<T, 'id'>;

type Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
    }[keyof T]
    : never;

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

export {FirebaseDoc, Paths, getExtractByPath, getBaseConverter};
