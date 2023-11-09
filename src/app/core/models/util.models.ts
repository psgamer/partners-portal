import { QueryDocumentSnapshot } from '@firebase/firestore';


type FirebaseDoc<T> = Omit<T, 'id'>;

type Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
    }[keyof T]
    : never;

const getExtractByPath = <T extends {[key: string]: any}>() => <R = any>(obj: T, path: Paths<T>): R => path
    .split('.')
    .reduce((acc, pathPiece) => acc[pathPiece], obj as any);

// const getBaseConverter = <T extends {id: any}>(): FirestoreDataConverter<T> => ({
//     toFirestore({id, ...rest}: WithFieldValue<T>): DocumentData {
//         return {
//             ...rest,
//         };
//     },
//     fromFirestore(snapshot: QueryDocumentSnapshot<T>, options: SnapshotOptions): T {
//         return ({
//             ...snapshot.data() as FirebaseDoc<T>,
//             id: snapshot.id,
//         }) as T;
//     },
// });
// TODO test converter and maybe use

const fromFirebaseSnapshot = <T extends object>(doc: QueryDocumentSnapshot<FirebaseDoc<T>>): T => ({
    ...doc.data() as FirebaseDoc<T>,
    id: doc.id,
}) as T;

export {FirebaseDoc, Paths, getExtractByPath, fromFirebaseSnapshot};
