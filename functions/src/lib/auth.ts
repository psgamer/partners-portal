import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { auth } from '../admin';
import { region } from '../util';

export const assignContractorToUser = onCall<{ contractorId: string }, Promise<boolean>>({
    cors: true,
    region
}, async ({ data: { contractorId }, auth: authData }) => {
    if (!(authData && authData.uid && contractorId)) {
        throw new HttpsError('unauthenticated', 'User is not signed in');
    }
    if (!contractorId) {
        throw new HttpsError('invalid-argument', 'contractorId not specified');
    }

    const { uid } = authData;

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
