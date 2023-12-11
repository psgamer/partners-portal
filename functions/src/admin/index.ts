import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { CollectionReference, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { atStartOfMonthCron, memoize, recursivelyProcess } from '../util';
import { _Paths, _ProcessedEvent } from '../util/types';

export const app = memoize(initializeApp);
export const auth = memoize(() => getAuth(app()));
export const db = memoize(() => getFirestore(app()));

export const processedEventsCollRef = () => db().collection('processed-events') as CollectionReference<_ProcessedEvent>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const cleanupObsoleteEventData = onSchedule(atStartOfMonthCron, async (event) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    logger.info("event data cleanup start");

    const count = await recursivelyProcess(
        processedEventsCollRef()
            .where('timestamp' as _Paths<_ProcessedEvent>, '<', Timestamp.fromDate(oneMonthAgo)),
        async docRefs => {
            const batch = db().batch();
            docRefs.forEach(({ ref }) => batch.delete(ref));
            await batch.commit();
        },
    );

    logger.info(`event data cleanup end, total removed: ${count}`);

    return;
});
