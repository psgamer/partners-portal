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

/**
 * TODO
 * do NOT pass auth and just use event.auth
 * https://github.com/firebase/firebase-tools/issues/5210
 */
export const assignContractorToUser = onCall<_Payload, Promise<boolean>>({cors: true}, async ({data}) => {
    if (!(data && data.uid && data.contractorId)) {
        logger.error('Insufficient data to assign contractorId to user, listing args', data);
        return false;
    }

    const {uid, contractorId} = data;

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
export const onOrderWritten = onDocumentWritten('contractors/{contractorId}/orders/{orderId}', async (event) => {
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
        case "update":
            const documentData = documentSnap.data() as _Order;
            const oldDocumentData = oldDocumentSnap.data() as _Order;
            const getRangesSortedAsString = (docData: _Order): string => [...docData.amountTotalRanges].sort().join(',');

            if (getRangesSortedAsString(oldDocumentData) !== getRangesSortedAsString(documentData)) {
                operations.assign_amountTotalRanges = true;
            }
            break;
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

        docChanges.amountTotalRanges = await db()
            .collection('order-amount-ranges')
            .get()
            .then(({docs}) => docs.filter(doc => {
                const {from, to} = doc.data() as _OrderAmountRange;

                return (from === undefined || from <= currentAmountTotal) && (to === undefined || currentAmountTotal <= to);
            }).map(({id}) => id));
    }

    if (!Object.keys(docChanges).length) {
        return;
    }

    await documentSnap.ref.update(docChanges);
});

interface _Order {
    number: string;
    amountTotal: number;
    amountTotalRanges: string[];
}

interface _OrderAmountRange {
    from: number | null;
    to: number | null;
}

interface _Payload {
    uid: string;
    contractorId: string;
}
