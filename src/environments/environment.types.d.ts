import {FirebaseConfig} from '../firebase.config';

interface Config {
  production: boolean,
  useEmulators: boolean,
  defaultauth: 'firebase', // TODO dispose of this, always firebase
  firebase: Readonly<FirebaseConfig>,
}
export type EnvironmentConfig = Readonly<Config>;
