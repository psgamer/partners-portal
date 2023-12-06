import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { memoize } from '../util';

export const app = memoize(initializeApp);
export const auth = memoize(() => getAuth(app()));
export const db = memoize(() => getFirestore(app()));
