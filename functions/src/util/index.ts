import {
    DocumentData, FirestoreDataConverter, Query, QueryDocumentSnapshot, QuerySnapshot, WithFieldValue
} from 'firebase-admin/firestore';
import { SupportedRegion } from 'firebase-functions/v2/options';
import { _WebClientDoc } from './types';

export const region: SupportedRegion = 'europe-west1';
export const defaultBatchOperationSizeLimit = 500;
export const defaultSlowOperationTimeoutSeconds = 600;
export const memoize = <T>(initializer: () => T): () => T => {
    let instance: T | undefined;

    return () => {
        if (!instance) {
            instance = initializer();
        }
        return instance;
    };
}
export const getBaseConverter = <T extends DocumentData>(): FirestoreDataConverter<_WebClientDoc<T>> => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toFirestore({id, ...rest}: WithFieldValue<_WebClientDoc<T>>): T {
        return {
            ...(rest as unknown as T),
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<T>): _WebClientDoc<T> {
        return ({
            ...snapshot.data() as T,
            id: snapshot.id,
        });
    },
});

export const recursivelyProcess = async <T extends DocumentData>(
    collQuery: Query<T>,
    batchProcessor: (docRefs: QuerySnapshot<T>) => Promise<void>,
    limit: number = defaultBatchOperationSizeLimit
) => {
    const getDocsBatch = async () => collQuery.limit(limit).get();
    let count = 0;

    let docRefs = await getDocsBatch();

    while (!docRefs.empty) {
        await batchProcessor(docRefs);

        count += docRefs.size;
        docRefs = await getDocsBatch()
    }

    return count;
};

export const atStartOfMonthCron = '0 0 1 * *';

