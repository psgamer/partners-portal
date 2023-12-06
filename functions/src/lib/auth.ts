import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { auth } from '../admin';
import { region } from '../util';

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
