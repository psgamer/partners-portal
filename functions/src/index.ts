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
import {
    CollectionGroup, CollectionReference, DocumentData, DocumentReference, FieldPath, FieldValue, FirestoreDataConverter, getFirestore,
    QueryDocumentSnapshot, Timestamp, UpdateData, WithFieldValue,
} from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { DocumentSnapshot, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { SupportedRegion } from 'firebase-functions/v2/options';

const region: SupportedRegion = 'europe-west1';
const getBaseConverter = <T extends DocumentData>(): FirestoreDataConverter<_WebClientDoc<T>> => ({
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

export const generateOrderAmountRanges = onCall<void, Promise<void>>({ cors: true, region }, async ({auth}) => {
    if (!(auth && auth.uid && auth.token.contractorId)) {
        logger.error('Insufficient permissions to generateOrderAmountRanges, should never happen, listing auth arg', auth);
        return;
    }

    const docs: _OrderAmountRange[] = [{
        from: null,
        to: 999,
    }, {
        from: 1000,
        to: 9999,
    }, {
        from: 10000,
        to: 99999,
    }, {
        from: 100000,
        to: 999999,
    }, {
        from: 1000000,
        to: null,
    }];

    const collRef = db().collection('order-amount-ranges');
    const empty = await collRef.get().then(({ empty }) => empty);

    if (!empty) {
        logger.error("Unexpected call when docs already exist");
        return;
    }

    const batch = db().batch();

    docs.map(doc => batch.create(collRef.doc(), doc));

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
 * TODO
 * check and probably reject if no event.auth
 * https://github.com/firebase/firebase-tools/issues/5210
 */
export const findByLicensePrivateKey = onCall<{ privateKey: _LicensePrivateKey['privateKey'], }, Promise<_WebClientDoc<_License>[]>>({
    cors: true,
    region
}, async ({ data: {privateKey} }) => {
    const licensePrivateKeyCollGroup = db().collectionGroup('license-private-key') as CollectionGroup<_LicensePrivateKey>;
    const licensesCollRef = db().collection('licenses').withConverter(getBaseConverter<_License>());

    if (!privateKey || privateKey.length < 8) {
        throw new HttpsError('invalid-argument', 'minimum privateKey length is 8');
    }

    const licenseIds = await licensePrivateKeyCollGroup
        .where('privateKey' as _Paths<_LicensePrivateKey>, '==', privateKey)
        .get()
        .then(({docs}) => docs.map(doc => doc.data().licenseId));

    if (!licenseIds.length) {
        return [];
    }

    const licenses = await licensesCollRef
        .where(FieldPath.documentId(), 'in', licenseIds)
        .get()
        .then(({docs}) => docs.map(doc => doc.data()));

    return licenses;
});

/**
 * 1. assigns amountTotalRanges on create or if amountTotal has changed on update
 * 2. assigns number = documentId
 */
export const onOrderWritten = onDocumentWritten({ document: 'contractors/{contractorId}/orders/{orderId}', region }, async (event) => {
    const docSnap = event.data.after as DocumentSnapshot;
    const oldDocSnap = event.data.before as DocumentSnapshot;

    let opType: 'create' | 'update' | 'delete';

    if (!docSnap.exists) {
        opType = 'delete';
    } else if (oldDocSnap.exists) {
        opType = 'update';
    } else {
        opType = 'create';
    }

    const operations = {
        assign_number: false,
        assign_amountTotalRanges: false,
        assign_status: false,
        assign_client: false,
        update_license_contractors: false,
        unAssign_from_clients: false,
        unAssign_from_licenses: false,
    }

    switch (opType) {
        case "create": {
            operations.assign_number = true;
            operations.assign_amountTotalRanges = true;
            operations.assign_status = true;
            operations.assign_client = true;

            const licenseId = docSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
            if (licenseId != null) {
                operations.update_license_contractors = true;
            }
            break;
        }
        case "update": {
            const docData = docSnap.data() as _Order;
            const oldDocData = oldDocSnap.data() as _Order;

            if (oldDocData.amountTotal !== docData.amountTotal) {
                operations.assign_amountTotalRanges = true;
            }
            if (oldDocData.licenseId == null && docData.licenseId != null) {
                operations.update_license_contractors = true;
            }
            break;
        }
        case 'delete': {
            operations.unAssign_from_clients = true;

            const licenseId = oldDocSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
            if (licenseId != null) {
                operations.unAssign_from_licenses = true;
            }
            break;
        }
        default:
            break;
    }

    if (Object.values(operations).every(doOperation => !doOperation)) {
        return;
    }

    const docChanges: UpdateData<_Order> = {};
    const batch = db().batch();

    if (operations.assign_number) {
        docChanges.number = docSnap.id;
    }
    if (operations.assign_status) {
        docChanges.status = _OrderStatus.NEW;
    }
    if (operations.assign_client) {
        const {name, taxCode} = docSnap.get('client' as _Paths<_Order>) as _Order['client'];

        const clientCollRef = db().collection('clients') as CollectionReference<_Client>;

        const foundClientSnaps = await clientCollRef
            .where('taxCode' as _Paths<_Client>, '==', taxCode)
            .where('name' as _Paths<_Client>, '==', name)
            .get()
            .then(({docs}) => docs);

        if (foundClientSnaps.length > 1) {
            logger.error("Found multiple client with same name and taxCode, DB is inconsistent, skipping assignment of client.id to order, listing: taxCode, name, clientIds", taxCode, name, foundClientSnaps);
        } else {
            const foundClientSnap = foundClientSnaps[0];
            let clientId: string;
            const contractorId = docSnap.get('contractor.id' as _Paths<_Order>);

            if (!foundClientSnap) {
                logger.info(`Creating a client to assign to order`);
                const newClientRef = clientCollRef.doc();

                clientId = newClientRef.id;
                batch.create(newClientRef, {
                    name,
                    taxCode,
                    contractorIds: [contractorId]
                });
            } else {
                clientId = foundClientSnap.id;
                batch.update(foundClientSnap.ref, { contractorIds: FieldValue.arrayUnion(contractorId) })
            }

            logger.info(`Assigning client.id of ${clientId} to order with id ${docSnap.id}`)
            docChanges['client.id'] = clientId;
        }
    }
    if (operations.assign_amountTotalRanges) {
        const currentAmountTotal = (docSnap.data() as _Order).amountTotal;

        const newOrderAmountRangesEntries = await db()
            .collection('order-amount-ranges')
            .get()
            .then(({ docs }) => docs.filter(doc => {
                const { from, to } = doc.data() as _OrderAmountRange;

                return (from === undefined || from <= currentAmountTotal) && (to === undefined || currentAmountTotal <= to);
            }).map(({ id }) => id));

        docChanges.amountTotalRanges = newOrderAmountRangesEntries;
    }
    if (operations.update_license_contractors) {
        const contractorId = docSnap.get('contractor.id' as _Paths<_Order>);
        const licenseId = docSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
        const licenseRef = db().doc(`licenses/${licenseId}`) as DocumentReference<_License>;

        logger.info(`assigning contractorId of ${contractorId} to license with id ${licenseId}`);
        batch.update(licenseRef, {ordersContractorIds: FieldValue.arrayUnion(contractorId)});
    }
    if (operations.unAssign_from_clients) {
        const contractorId = oldDocSnap.get('contractor.id' as _Paths<_Order>);
        const clientId = oldDocSnap.get('client.id' as _Paths<_Order>) as _Order['client']['id'];
        const clientRef = db().doc(`clients/${clientId}`) as DocumentReference<_Client>;
        const ordersCollRef = db().collection(`contractors/${contractorId}/orders`) as CollectionReference<_Order>

        const otherOrdersByClientCountSnap = await ordersCollRef
            .where('client.id' as _Paths<_Order>, '==', clientId)
            .count()
            .get();

        if (otherOrdersByClientCountSnap.data().count == 0) {
            logger.info(`unAssigning contractorId of ${contractorId} from client with id ${clientId}`);
            batch.update(clientRef, { contractorIds: FieldValue.arrayRemove(contractorId) });
        }
    }
    if (operations.unAssign_from_licenses) {
        const contractorId = oldDocSnap.get('contractor.id' as _Paths<_Order>);
        const licenseId = oldDocSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
        const licenseRef = db().doc(`licenses/${licenseId}`) as DocumentReference<_License>;
        const ordersCollRef = db().collection(`contractors/${contractorId}/orders`) as CollectionReference<_Order>

        const otherOrdersByLicenseCountSnap = await ordersCollRef
            .where('licenseId' as _Paths<_Order>, '==', licenseId)
            .count()
            .get();

        if (otherOrdersByLicenseCountSnap.data().count == 0) {
            logger.info(`unAssigning contractorId of ${contractorId} from license with id ${licenseId}`);
            batch.update(licenseRef, { ordersContractorIds: FieldValue.arrayRemove(contractorId) });
        }
    }

    if (Object.keys(docChanges).length) {
        batch.update(docSnap.ref, docChanges);
    }

    await batch.commit();
});


interface _Order {
    contractor: {
        id: string;
    }
    licenseId: string;
    number: string;
    amountTotal: number;
    amountTotalRanges: string[];
    status: _OrderStatus;
    client: {
        id: string;
        name: _Client['name'];
        taxCode: _Client['taxCode'];
    };
}

interface _OrderAmountRange {
    from: number | null;
    to: number | null;
}

interface _License {
    expirationDate: Timestamp;
    ordersContractorIds: string[];
}

interface _LicensePrivateKey {
    licenseId: string;
    privateKey: string;
}

interface _Client {
    taxCode: string;
    name: string;
    contractorIds: _Order['contractor']['id'][];
}

enum _OrderStatus {
    NEW = 'NEW',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

type _Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${_Paths<T[K]>}`}`
    }[keyof T]
    : never;

type _WebClientDoc<T> = T & {id: string};
