/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { DocumentSnapshot, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';

export const reTestFn = onRequest((request, response) => {
  logger.info("Hello logs!");
  response.send("Hello from Firebase!");
});

export const onOrderWritten = onDocumentWritten('contractors/{contractorId}/orders/{orderId}', (event) => {
    const documentSnap = event.data.after as DocumentSnapshot;

    // doc deleted
    if (!documentSnap.exists) {
        return;
    }

    const oldDocumentSnap = event.data.before as DocumentSnapshot;
    const documentData = documentSnap.data() as docData_Order;

    // doc updated
    if (oldDocumentSnap.exists) {
        const oldDocumentData = oldDocumentSnap.data() as docData_Order;
        const getRangesSortedAsString = (docData: docData_Order): string => docData.amountTotalRanges.sort().join(',');

        if (getRangesSortedAsString(oldDocumentData) === getRangesSortedAsString(documentData)) {
            return;
        }
    }

    // doc created or amountTotal changed
    const app = initializeApp();
    const db = getFirestore(app);
    const currentAmountTotal = (documentSnap.data() as docData_Order).amountTotal;

    // generate new ranges
    const newRangesPromise = db
        .collection('order-amount-ranges')
        .get()
        .then(({ docs }) => docs.filter(doc => {
            const { from, to } = doc.data() as docData_OrderAmountRange;

            return (from === undefined || from <= currentAmountTotal) && (to === undefined || currentAmountTotal <= to);
        }).map(({id}) => id));

    // update order
    return newRangesPromise.then(newRanges => documentSnap.ref.update('amountTotalRanges' as keyof docData_Order, newRanges));
});

interface docData_Order {
    amountTotal: number;
    amountTotalRanges: string[];
}

interface docData_OrderAmountRange {
    from: number | null;
    to: number | null;
}
