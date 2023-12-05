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
    CollectionGroup, CollectionReference, DocumentData, DocumentReference, FieldPath, FirestoreDataConverter, getFirestore,
    QueryDocumentSnapshot, UpdateData, WithFieldValue,
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
        checkAndCreateAndAssign_contractorClientAndClient: false,
        checkAndCreate_contractorLicense: false,
        checkAndRemove_oldContractorClient: false,
        checkAndRemove_oldContractorLicense: false,
        unset_hasPendingChanges: false,
    }

    switch (opType) {
        case "create": {
            operations.assign_number = true;
            operations.assign_amountTotalRanges = true;
            operations.assign_status = true;
            operations.checkAndCreateAndAssign_contractorClientAndClient = true;

            const licenseId = docSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
            const hasPendingChanges = docSnap.get('hasPendingChanges' as _Paths<_Order>) as _Order['hasPendingChanges'];

            if (licenseId != null) {
                operations.checkAndCreate_contractorLicense = true;
            }
            if (hasPendingChanges) {
                operations.unset_hasPendingChanges = true;
            }

            break;
        }
        case "update": {
            const docData = docSnap.data() as _Order;
            const oldDocData = oldDocSnap.data() as _Order;

            if (oldDocData.amountTotal !== docData.amountTotal) {
                operations.assign_amountTotalRanges = true;
            }
            if (docData.client.id === null) {
                operations.checkAndCreateAndAssign_contractorClientAndClient = true;
                if (oldDocData.client.id != null) {
                    operations.checkAndRemove_oldContractorClient = true;
                }
            }
            if (oldDocData.licenseId !== docData.licenseId) {
                if (oldDocData.licenseId != null) {
                    operations.checkAndRemove_oldContractorLicense = true;
                }
                if (docData.licenseId != null) {
                    operations.checkAndCreate_contractorLicense = true;
                }
            }
            if (docData.hasPendingChanges) {
                operations.unset_hasPendingChanges = true;
            }
            break;
        }
        case 'delete': {
            operations.checkAndRemove_oldContractorClient = true;

            const licenseId = oldDocSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
            if (licenseId != null) {
                operations.checkAndRemove_oldContractorLicense = true;
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
    if (operations.checkAndCreateAndAssign_contractorClientAndClient) {
        const {name, taxCode} = docSnap.get('client' as _Paths<_Order>) as _Order['client'];

        const contractorId = docSnap.get('contractor.id' as _Paths<_Order>) as _Order['contractor']['id'];
        const contractorClientsCollRef = db().collection(`contractors/${contractorId}/contractor-clients`) as CollectionReference<_ContractorClient>;
        const clientCollRef = db().collection('clients') as CollectionReference<_Client>;

        const actions: ('createClient' | 'createContractorClient')[] = [];
        let clientId: _Order['client']['id'] | undefined;

        clientId = await clientCollRef
            .where('taxCode' as _Paths<_ContractorClient>, '==', taxCode)
            .where('name' as _Paths<_ContractorClient>, '==', name)
            .limit(1)
            .get()
            .then(({ docs }) => docs.map(({ id }) => id)[0]);

        if (!clientId) {
            actions.push('createContractorClient');

            clientId = await clientCollRef
                .where('taxCode' as _Paths<_Client>, '==', taxCode)
                .where('name' as _Paths<_Client>, '==', name)
                .limit(1)
                .get()
                .then(({ docs }) => docs.map(({ id }) => id)[0]);

            if (!clientId) {
                actions.push('createClient');
            }
        }

        if (actions.includes('createClient')) {
            logger.info(`Creating a client for order`);

            const newClientRef = clientCollRef.doc();
            clientId = newClientRef.id;

            batch.create(newClientRef, {
                name,
                taxCode,
            });
        }
        if (actions.includes('createContractorClient')) {
            logger.info(`Creating a contractorClient with id ${clientId} for contractorId ${contractorId}`);

            const newContractorClientRef = contractorClientsCollRef.doc(clientId);

            batch.set(newContractorClientRef, {
                name,
                taxCode,
            });
        }

        logger.info(`Assigning client.id of ${clientId} to order with id ${docSnap.id}`)
        docChanges['client.id'] = clientId;
    }
    if (operations.assign_amountTotalRanges) {
        const currentAmountTotal = (docSnap.data() as _Order).amountTotal;

        const newOrderAmountRangesEntries = await db()
            .collection('order-amount-ranges')
            .get()
            .then(({ docs }) => docs.filter(doc => {
                const { from, to } = doc.data() as _OrderAmountRange;

                return (from === null || from <= currentAmountTotal) && (to === null || currentAmountTotal <= to);
            }).map(({ id }) => id));

        docChanges.amountTotalRanges = newOrderAmountRangesEntries;
    }
    if (operations.checkAndCreate_contractorLicense) {
        const contractorId = docSnap.get('contractor.id' as _Paths<_Order>);
        const licenseId = docSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
        const licenseRef = (db().collection('licenses') as CollectionReference<_License>).doc(licenseId);
        const contractorLicenseRef = (db().collection(`contractors/${contractorId}/contractor-licenses`) as CollectionReference<_ContractorLicense>).doc(licenseId);

        const contractorLicenseExists = await contractorLicenseRef.get().then(({exists}) => exists);
        if (!contractorLicenseExists) {
            logger.info(`creating contractorLicense with id ${licenseId} for contractorId ${contractorId}`);

            const license = await licenseRef.get().then(licenseSnap => licenseSnap.data());

            batch.set(contractorLicenseRef, {
                // filter license fields here
                ...license,
            });
        }
    }
    if (operations.checkAndRemove_oldContractorClient) {
        const contractorId = oldDocSnap.get('contractor.id' as _Paths<_Order>) as _Order['contractor']['id'];
        const clientId = oldDocSnap.get('client.id' as _Paths<_Order>) as _Order['client']['id'];
        const contractorClientRef = db().doc(`contractors/${contractorId}/contractor-clients/${clientId}`) as DocumentReference<_Client>;
        const ordersCollRef = db().collection(`contractors/${contractorId}/orders`) as CollectionReference<_Order>

        const otherOrdersByClientCountSnap = await ordersCollRef
            .where('client.id' as _Paths<_Order>, '==', clientId)
            .count()
            .get();

        if (otherOrdersByClientCountSnap.data().count == 0) {
            logger.info(`deleting contractorClient with id ${clientId} for contractorId ${contractorId}`);
            batch.delete(contractorClientRef);
        }
    }
    if (operations.checkAndRemove_oldContractorLicense) {
        const contractorId = oldDocSnap.get('contractor.id' as _Paths<_Order>) as _Order['contractor']['id'];
        const licenseId = oldDocSnap.get('licenseId' as _Paths<_Order>) as _Order['licenseId'];
        const contractorLicenseRef = db().doc(`contractors/${contractorId}/contractor-licenses/${licenseId}`) as DocumentReference<_ContractorLicense>;
        const ordersCollRef = db().collection(`contractors/${contractorId}/orders`) as CollectionReference<_Order>

        const otherOrdersByLicenseCountSnap = await ordersCollRef
            .where('licenseId' as _Paths<_Order>, '==', licenseId)
            .count()
            .get();

        if (otherOrdersByLicenseCountSnap.data().count == 0) {
            logger.info(`deleting contractorLicense with id ${licenseId} for contractorId ${contractorId}`);
            batch.delete(contractorLicenseRef);
        }
    }
    if (operations.unset_hasPendingChanges) {
        docChanges.hasPendingChanges = false;
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
    hasPendingChanges: boolean;
}

interface _OrderAmountRange {
    from: number | null;
    to: number | null;
}

type _License = Record<string, never>;

type _ContractorLicense = _Subset<_License, Record<string, never>>

interface _LicensePrivateKey {
    licenseId: string;
    privateKey: string;
}

interface _Client {
    taxCode: string;
    name: string;
}

type _ContractorClient = _Subset<_Client, {
    taxCode: _Client['taxCode'];
    name: _Client['name'];
}>

enum _OrderStatus {
    NEW = 'NEW',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

// eslint-disable-next-line
type _Subset<T extends U, U> = U;

type _Paths<T> = T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${_Paths<T[K]>}`}`
    }[keyof T]
    : never;

type _WebClientDoc<T> = T & {id: string};
