// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  useEmulators: false,
  defaultauth: 'firebase',
  firebase: {
    apiKey: "AIzaSyCKYIUmn8YK1s8jrMrqS-XK0S0YWqJcTfw",
    authDomain: "steex-starter.firebaseapp.com",
    projectId: "steex-starter",
    storageBucket: "steex-starter.appspot.com",
    messagingSenderId: "419348045459",
    appId: "1:419348045459:web:3da47bb5ba02cc5ca03766"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
