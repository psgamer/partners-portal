type FirebaseDoc<T> = Omit<T, 'id'>;

type Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`
    }[keyof T]
    : never;

const extractByPath = <T extends {[key: string]: any}>(path: Paths<T>, obj: T) => path
    .split('.')
    .reduce((acc, pathPiece) => acc[pathPiece], obj);

export {FirebaseDoc, Paths, extractByPath};
