/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {logger} from 'firebase-functions';
import {onRequest} from 'firebase-functions/v2/https';

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

// export const onAuth = user().onCreate((user) => {
//   logger.info("User signed in!", { structuredData: true });
//   return user;
// });

// export const onAuthUser = user().beforeSignIn(() => {
//   logger.info("new sign in before");
//   return {
//     customClaims: {
//       customData: 'somestr',
//     }
//   };
// });
