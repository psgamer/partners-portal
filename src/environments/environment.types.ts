import { FirebaseConfig } from '../firebase.config';

export type FirebaseEmulatedServiceName = 'auth' | 'firestore' | 'storage' | 'functions';

export type EnvironmentConfig = Readonly<{
  production: boolean,
  useEmulators: boolean | FirebaseEmulatedServiceName[],
  defaultauth: 'firebase', // TODO dispose of this, always firebase
  firebase: FirebaseConfig,
}>;
