import { CollectionGroup, FieldPath, } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db } from '../admin';
import { getBaseConverter, region } from '../util';
import { _License, _LicensePrivateKey, _Paths, _WebClientDoc } from '../util/types';

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
        .then(({docs}) => docs.map(doc => doc.id));

    if (!licenseIds.length) {
        return [];
    }

    const licenses = await licensesCollRef
        .where(FieldPath.documentId(), 'in', licenseIds)
        .get()
        .then(({docs}) => docs.map(doc => doc.data()));

    return licenses;
});
