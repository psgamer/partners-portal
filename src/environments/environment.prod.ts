import { firebaseProdConfig } from '../firebase.config';
import { EnvironmentConfig } from './environment.types';

export const environment: EnvironmentConfig = {
  production: true,
  useEmulators: false,
  defaultauth: 'firebase',
  firebase: firebaseProdConfig
};
