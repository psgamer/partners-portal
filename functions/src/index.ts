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

export const reTestFn = onRequest((request, response) => {
  logger.info("Hello logs!");
  response.send("Hello from Firebase!");
});
