/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { DocumentSnapshot, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { SupportedRegion } from 'firebase-functions/v2/options';

const region: SupportedRegion = 'europe-west1';

const memoize = <T>(initializer: () => T): () => T => {
    let instance: T | undefined;

    return () => {
        if (!instance) {
            instance = initializer();
        }
        return instance;
    };
}

const app = memoize(initializeApp);
const auth = memoize(() => getAuth(app()));
const db = memoize(() => getFirestore(app()));

export const generateOrderAmountRanges = onCall<void, Promise<void>>({ cors: true, region }, async (event) => {
    const docs: { [key: string]: _OrderAmountRange } = {
        first: {
            from: null,
            to: 999,
        }, second: {
            from: 1000,
            to: 9999,
        }, third: {
            from: 10000,
            to: 99999,
        }, fourth: {
            from: 100000,
            to: 999999,
        }, fifth: {
            from: 1000000,
            to: null,
        }
    };

    const collRef = db().collection('order-amount-ranges');
    const empty = await collRef.get().then(({ empty }) => empty);

    if (!empty) {
        logger.error("Unexpected call when docs already exist");
        return;
    }

    const batch = db().batch();

    Object.entries(docs).map(([id, doc]) => batch.create(collRef.doc(id), doc));

    await batch.commit();

    return;
});

/**
 * TODO
 * do NOT pass auth and just use event.auth
 * https://github.com/firebase/firebase-tools/issues/5210
 */
export const assignContractorToUser = onCall<{ uid: string; contractorId: string; }, Promise<boolean>>({
    cors: true,
    region
}, async ({ data }) => {
    if (!(data && data.uid && data.contractorId)) {
        logger.error('Insufficient data to assign contractorId to user, listing args', data);
        return false;
    }

    const { uid, contractorId } = data;

    return await auth().setCustomUserClaims(uid, { contractorId })
        .then(() => {
            logger.info(`Assigned contractorId of ${contractorId} to user with uid ${uid}`);
            return true;
        })
        .catch(e => {
            logger.error(`Failed to assign contractorId of ${contractorId} to user with uid ${uid}`, e);
            return false;
        });
});

/**
 * 1. assigns amountTotalRanges on create or if amountTotal has changed on update
 * 2. assigns number = documentId
 */
export const onOrderWritten = onDocumentWritten({ document: 'contractors/{contractorId}/orders/{orderId}', region }, async (event) => {
    const documentSnap = event.data.after as DocumentSnapshot;
    const oldDocumentSnap = event.data.before as DocumentSnapshot;

    let opType: 'create' | 'update' | 'delete';

    if (!documentSnap.exists) {
        opType = 'delete';
    } else if (oldDocumentSnap.exists) {
        opType = 'update';
    } else {
        opType = 'create';
    }

    const operations = {
        assign_number: false,
        assign_amountTotalRanges: false,
    }

    switch (opType) {
        case "create":
            operations.assign_number = true;
            operations.assign_amountTotalRanges = true;
            break;
        case "update": {
            const documentData = documentSnap.data() as _Order;
            const oldDocumentData = oldDocumentSnap.data() as _Order;

            if (oldDocumentData.amountTotal !== documentData.amountTotal) {
                operations.assign_amountTotalRanges = true;
            }
            break;
        }
        default:
            break;
    }

    if (Object.values(operations).every(doOperation => !doOperation)) {
        return;
    }

    const docChanges: Partial<_Order> = {};

    if (operations.assign_number) {
        docChanges.number = documentSnap.id;
    }
    if (operations.assign_amountTotalRanges) {
        const currentAmountTotal = (documentSnap.data() as _Order).amountTotal;

        const newOrderAmountRangesEntries = await db()
            .collection('order-amount-ranges')
            .get()
            .then(({ docs }) => docs.filter(doc => {
                const { from, to } = doc.data() as _OrderAmountRange;

                return (from === undefined || from <= currentAmountTotal) && (to === undefined || currentAmountTotal <= to);
            }).map(({ id }) => [id, true]));

        docChanges.amountTotalRanges = Object.fromEntries(newOrderAmountRangesEntries);
    }

    if (!Object.keys(docChanges).length) {
        return;
    }

    await documentSnap.ref.update(docChanges);
});

interface _Order {
    number: string;
    amountTotal: number;
    amountTotalRanges: {
        [key: string]: true;
    };
}

interface _OrderAmountRange {
    from: number | null;
    to: number | null;
}
