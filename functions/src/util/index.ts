import {
    DocumentData, FirestoreDataConverter, Query, QueryDocumentSnapshot, QuerySnapshot, Timestamp, WithFieldValue
} from 'firebase-admin/firestore';
import { SupportedRegion } from 'firebase-functions/v2/options';
import { _Period, _PeriodType, _WebClientDoc } from './types';

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

export const processInBatches = async <T extends DocumentData>(
    queryProvider: (prevBatchLastDocSnap?: QueryDocumentSnapshot<T>) => Query<T>,
    batchProcessor: (queryResultSnap: QuerySnapshot<T>) => Promise<void>,
    batchSize: number = defaultBatchOperationSizeLimit
) => {
    const getDocsBatch = async (prevBatchLastDocSnap?: QueryDocumentSnapshot<T>) =>
        await queryProvider(prevBatchLastDocSnap).limit(batchSize).get();

    let count = 0;
    let queryResultSnap = await getDocsBatch();

    while (!queryResultSnap.empty) {
        const lastDocSnap = queryResultSnap.docs[queryResultSnap.size - 1];

        await batchProcessor(queryResultSnap);
        count += queryResultSnap.size;
        queryResultSnap = await getDocsBatch(lastDocSnap);
    }

    return count;
};

export const nowPlusPeriodAsTimestamp = ({count, type}: _Period): Timestamp => {
    const targetDate = new Date();

    switch (type) {
        case _PeriodType.YEAR:
            targetDate.setFullYear(targetDate.getFullYear() + count);
            break;
        case _PeriodType.MONTH:
            targetDate.setMonth(targetDate.getMonth() + count);
            break;
        case _PeriodType.DAY:
            targetDate.setDate(targetDate.getDate() + count);
            break;
        default:
            throw new Error('Unsupported period type: ' + type);
    }

    return Timestamp.fromDate(targetDate);
};

export const atStartOfMonthCron = '0 0 1 * *';
export const every10MinutesCron = '*/10 * * * *';
