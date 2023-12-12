import { CollectionGroup, CollectionReference, DocumentReference, UpdateData, WithFieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { DocumentSnapshot, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { v4 as uuid } from 'uuid';
import { db } from '../admin';
import { defaultSlowOperationTimeoutSeconds, every10MinutesCron, nowPlusPeriodAsTimestamp, processInBatches, region } from '../util';
import {
    _Client, _ContractorClient, _ContractorLicense, _License, _LicensePassword, _LicensePrivateKey, _Order, _OrderAmountRange, _OrderStatus,
    _Paths
} from '../util/types';

const completeOrderAmount = 10000;
const cancelOrderAmount = 20000;

export const generateOrderAmountRanges = onCall<void, Promise<void>>({ cors: true, region }, async ({ auth }) => {
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

export const processOrders = onSchedule({
    schedule: every10MinutesCron,
    region,
    timeoutSeconds: defaultSlowOperationTimeoutSeconds,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}, async (event) => {
    logger.info("process orders start");

    const collGroup = db().collectionGroup('orders') as CollectionGroup<_Order>;
    const collQuery = collGroup
        .where('status' as _Paths<_Order>, '==', _OrderStatus.NEW)
        .where('hasPendingChanges' as _Paths<_Order>, '==', false);
    const licensesCollRef = db().collection('licenses') as CollectionReference<_License>;

    let cancelledCount = 0;
    let completedCount = 0;
    let createdLicensesCount = 0;

    const count = await processInBatches(
        (prevBatchLastDocSnap) => !prevBatchLastDocSnap
            ? collQuery
            : collQuery.startAfter(prevBatchLastDocSnap),
        async queryResultSnap => {
            logger.info(`received batch, size = ${queryResultSnap.size}`);
            const batch = db().batch();

            queryResultSnap.forEach(docRef => {
                const {
                    amountTotal,
                    licenseId,
                    contractor: {id: contractorId},
                    client: { id: clientId, name: clientName, taxCode: clientTaxCode },
                    localSolutionRes: {
                        id: localSolutionId,
                        name: localSolutionName,
                        count: localSolutionCount,
                        period: localSolutionPeriod,
                    },
                } = docRef.data();
                const contractorLicensesCollRef = db().collection(`contractors/${contractorId}/contractor-licenses`) as CollectionReference<_ContractorLicense>;

                switch (amountTotal) {
                    case completeOrderAmount: {
                        completedCount++
                        if (licenseId) {
                            batch.update(docRef.ref, { status: _OrderStatus.COMPLETED });
                        } else {
                            const newLicenseRef = licensesCollRef.doc();
                            const newLicenseId = newLicenseRef.id;

                            const licensePrivateKeyCollRef = db().collection(`licenses/${newLicenseId}/license-private-key`) as CollectionReference<_LicensePrivateKey>;
                            const licensePasswordCollRef = db().collection(`licenses/${newLicenseId}/license-password`) as CollectionReference<_LicensePassword>;
                            const contractorLicenseRef = contractorLicensesCollRef.doc(newLicenseId);

                            const license: WithFieldValue<_License | _ContractorLicense> = {
                                expirationDate: nowPlusPeriodAsTimestamp(localSolutionPeriod),
                                login: uuid(), // generated
                                publicKey: uuid(), // generated
                                localSolution: {
                                    id: localSolutionId,
                                    name: localSolutionName,
                                    count: localSolutionCount,
                                },
                                client: {
                                    id: clientId,
                                    taxCode: clientTaxCode,
                                    name: clientName,
                                },
                            };
                            const licensePrivateKey: WithFieldValue<_LicensePrivateKey> = {
                                licenseId: newLicenseId,
                                privateKey: uuid(), // generated
                            };
                            const licensePassword: WithFieldValue<_LicensePassword> = {
                                licenseId: newLicenseId,
                                password: uuid(), // generated
                            };

                            logger.info("Creating license, contractorLicense and all license's private data for order processing")

                            createdLicensesCount++;
                            batch.update(docRef.ref, {
                                status: _OrderStatus.COMPLETED,
                                licenseId: newLicenseId,
                            });
                            batch.create(
                                newLicenseRef,
                                license,
                            );
                            batch.create(
                                contractorLicenseRef,
                                license,
                            );
                            batch.create(
                                licensePrivateKeyCollRef.doc(newLicenseId),
                                licensePrivateKey,
                            );
                            batch.create(
                                licensePasswordCollRef.doc(newLicenseId),
                                licensePassword,
                            );
                        }
                        break;
                    }
                    case cancelOrderAmount: {
                        cancelledCount++;
                        batch.update(docRef.ref, {
                            status: _OrderStatus.CANCELLED,
                        });
                        break;
                    }
                    default:
                        break;
                }
            });

            await batch.commit();
        },
        100,
    );

    logger.info(`process orders end, cancelled: ${cancelledCount}, completed: ${completedCount}, created licenses in process: ${licensesCollRef}, total processed including skipped: ${count}`);

    return;
});
