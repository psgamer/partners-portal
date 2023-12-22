import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { ServiceAccount } from 'firebase-admin/lib/app/credential';
import { getStorage } from 'firebase-admin/storage';
import { memoize } from 'lodash';

export const serviceAccountSecretKey = 'NEWS_PORTAL_STAGING_SERVICE_ACCOUNT';

const newsPortalApp = memoize((serviceAccountJsonString: string) => initializeApp({
    projectId: "news-portal-staging",
    storageBucket: "news-portal-staging.appspot.com",
    databaseAuthVariableOverride: { uid: "partners-portal-app" },
    credential: cert(JSON.parse(serviceAccountJsonString) as ServiceAccount),
}, 'news-portal-staging-app'));

export const newsPortalDb = memoize((serviceAccountJsonString: string) => getFirestore(newsPortalApp(serviceAccountJsonString)));
export const newsPortalStorage = memoize((serviceAccountJsonString: string) => getStorage(newsPortalApp(serviceAccountJsonString)));

export interface _NewsArticle {
    creationDate: Timestamp;
    image: string;
}
