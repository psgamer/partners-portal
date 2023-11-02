import {FirebaseConfig} from '../firebase.config';

export type EnvironmentConfig = Readonly<{
  production: boolean,
  useEmulators: boolean,
  defaultauth: 'firebase', // TODO dispose of this, always firebase
  firebase: FirebaseConfig,
}>;
