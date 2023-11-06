import {
    createUserWithEmailAndPassword, FacebookAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword,
    signInWithPopup, signOut
} from '@angular/fire/auth';
import { Auth } from '@firebase/auth';


class FirebaseAuthBackend {
  auth!: Auth;

  constructor(firebaseConfig: any, auth: any) {
    if (firebaseConfig) {
      // Initialize Firebase
      // firebase.initializeApp(firebaseConfig);

      // if (environment.useEmulators) {
      //   connectAuthEmulator(firebase.auth(), "http://127.0.0.1:9099");
      // }

      console.log('auth init');
      this.auth = auth;
      onAuthStateChanged(this.auth, (user: any) => {
        if (user) {
          sessionStorage.setItem('authUser', JSON.stringify(user));
        } else {
          sessionStorage.removeItem('authUser');
        }
      });
    }
  }

  /**
   * Registers the user with given details
   */
  registerUser = (email: any, password: any) => {
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(this.auth, email, password).then((user: any) => {
        var user: any = this.auth.currentUser;
        resolve(user);
      }, (error: any) => {
        reject(this._handleError(error));
      });
    });
  }

  /**
   * Login user with given details
   */
  loginUser = (email: any, password: any) => {
    return new Promise((resolve, reject) => {
      signInWithEmailAndPassword(this.auth, email, password).then((user: any) => {
        // eslint-disable-next-line no-redeclare
        var user: any = this.auth.currentUser;
        resolve(user);
      }, (error: any) => {
        reject(this._handleError(error));
      });
    });
  }

  loginWithFb = () => {
    const provider = new FacebookAuthProvider();
    // TODO maybe move some of the configs
      provider.setDefaultLanguage('uk_UA');// TODO move
      provider.setCustomParameters({
          'auth_type': 'reauthenticate',
          'display': 'popup',
      });
      provider.addScope('public_profile');
      provider.addScope('email');
      provider.addScope('user_likes');
      provider.addScope('user_friends');

      return new Promise((resolve, reject) => {
          signInWithPopup(this.auth, provider).then((result: any) => {
              // eslint-disable-next-line no-redeclare
              var user: any = this.auth.currentUser;


              // The signed-in user info.
              const user2 = result.user;

              // This gives you a Facebook Access Token. You can use it to access the Facebook API.
              const credential = FacebookAuthProvider.credentialFromResult(result);
              const accessToken = credential?.accessToken;

              console.log(user2, credential, accessToken);// TODO remove


              resolve(user);
          }, (error: any) => {
              reject(this._handleError(error));
          });
      });
  }

  /**
   * Logout the user
   */
  logout = () => {
    return new Promise((resolve, reject) => {
      signOut(this.auth).then(() => {
        resolve(true);
      }).catch((error: any) => {
        reject(this._handleError(error));
      });
    });
  }

  /**
   * forget Password user with given details
   */
  forgetPassword = (email: any) => {
    return new Promise((resolve, reject) => {
      // tslint:disable-next-line: max-line-length
      sendPasswordResetEmail(this.auth, email, {url: window.location.protocol + '//' + window.location.host + '/login'}).then(() => {
        resolve(true);
      }).catch((error: any) => {
        reject(this._handleError(error));
      });
    });
  }

  setLoggeedInUser = (user: any) => {
    sessionStorage.setItem('authUser', JSON.stringify(user));
  }

  /**
   * Returns the authenticated user
   */
  getAuthenticatedUser = () => {
    if (!sessionStorage.getItem('authUser')) {
      return null;
    }
    return JSON.parse(sessionStorage.getItem('authUser')!);
  }

  /**
   * Handle the error
   * @param {*} error
   */
  _handleError(error: any) {
    // tslint:disable-next-line: prefer-const
    var errorMessage = error.message;
    return errorMessage;
  }
}

// tslint:disable-next-line: variable-name
let _fireBaseBackend: FirebaseAuthBackend | null = null;

/**
 * Initilize the backend
 * @param {*} config
 */
const initFirebaseBackend = (config: any, auth: any) => {
  if (!_fireBaseBackend) {
    _fireBaseBackend = new FirebaseAuthBackend(config, auth);
  }
  return _fireBaseBackend;
};

/**
 * Returns the firebase backend
 */
const getFirebaseBackend = () => {
  return _fireBaseBackend;
};

export {initFirebaseBackend, getFirebaseBackend};
