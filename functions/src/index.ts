/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { App, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { DocumentSnapshot, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall, onRequest } from 'firebase-functions/v2/https';

const app: () => App = (() => {
    let app: App | undefined;

    return () => {
        if (!app) {
            app = initializeApp();
        }
        return app;
    }
})();
const auth: () => Auth = (() => {
    let auth: Auth | undefined;

    return () => {
        if (!auth) {
            auth = getAuth(app());
        }
        return auth;
    }
})();
const db: () => Firestore = (() => {
    let db: Firestore | undefined;

    return () => {
        if (!db) {
            db = getFirestore(app());
        }
        return db;
    }
})();

export const reTestFn = onRequest((request, response) => {
    logger.info("Hello logs!");
    response.send("Hello from Firebase!");
});

/**
 * TODO
 * do NOT pass auth and just use event.auth
 * https://github.com/firebase/firebase-tools/issues/5210
 */
export const assignContractorToUser = onCall<_Payload, Promise<boolean>>({cors: true}, async ({data}) => {
    logger.info('assignContractorToUser args passed', data);
    if (!(data && data.uid && data.contractorId)) {
        return false;
    }

    const {uid, contractorId} = data;

    return await auth().setCustomUserClaims(uid, {contractorId}).then(() => true);
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

            if (getRangesSortedAsString(oldDocumentData) === getRangesSortedAsString(documentData)) {
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
