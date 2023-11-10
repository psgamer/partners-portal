import {
    Auth, createUserWithEmailAndPassword, FacebookAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword,
    signInWithPopup, signOut, TwitterAuthProvider
} from '@angular/fire/auth';
import { User } from '@firebase/auth';
import { BehaviorSubject, map, Observable, skipWhile, take } from 'rxjs';


class FirebaseAuthBackend {
    auth!: Auth;
    authInitialized$ = new BehaviorSubject<boolean>(false);

    constructor(firebaseConfig: any, auth: Auth) {
        if (firebaseConfig) {
            this.auth = auth;
            onAuthStateChanged(this.auth, () => this.authInitialized$.next(true));
        }
    }

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
        //   provider.setDefaultLanguage('uk_UA');// TODO move
        // provider.setCustomParameters({
        //     'auth_type': 'reauthenticate',
        //     'display': 'popup',
        // });
        provider.addScope('public_profile');
        provider.addScope('email');
        // provider.addScope('user_likes');
        // provider.addScope('user_friends');

        return new Promise((resolve, reject) => {
            signInWithPopup(this.auth, provider).then((result) => {
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
                console.log(error);
                reject(this._handleError(error));
            });
        });
    }

    loginWithTwitter = () => {
        const provider = new TwitterAuthProvider();

        provider.setCustomParameters({ 'lang': 'uk' });// TODO move this 'uk' to lang service

        return new Promise((resolve, reject) => {
            signInWithPopup(this.auth, provider).then((result: any) => {
                // eslint-disable-next-line no-redeclare
                var user: any = this.auth.currentUser;

                // const credential = TwitterAuthProvider.credentialFromResult(result);
                // const token = credential?.accessToken;
                // const secret = credential?.secret;
                // // ...
                //
                // // The signed-in user info.
                // const user2 = result.user;
                //
                // console.log(
                //     credential,
                //     token,
                //     secret,
                //     user2
                // );

                resolve(user);
            }, (error: any) => {
                console.log(error);
                reject(this._handleError(error));
            });
        });
    }

    logout = () => {
        return new Promise((resolve, reject) => {
            signOut(this.auth).then(() => {
                resolve(true);
            }).catch((error: any) => {
                reject(this._handleError(error));
            });
        });
    }

    forgetPassword = (email: any) => {
        return new Promise((resolve, reject) => {
            // tslint:disable-next-line: max-line-length
            sendPasswordResetEmail(this.auth, email, { url: window.location.protocol + '//' + window.location.host + '/login' }).then(() => {
                resolve(true);
            }).catch((error: any) => {
                reject(this._handleError(error));
            });
        });
    }

    getAuthenticatedUser = (): Observable<User | null> => {
        return this.authInitialized$.pipe(
            skipWhile(init => !init),
            take(1),
            map(() => this.auth.currentUser));
    }

    _handleError(error: any) {
        // tslint:disable-next-line: prefer-const
        var errorMessage = error.message;
        return errorMessage;
    }
}

// tslint:disable-next-line: variable-name
let _fireBaseBackend: FirebaseAuthBackend | null = null;

const initFirebaseBackend = (config: any, auth: Auth) => {
    if (!_fireBaseBackend) {
        _fireBaseBackend = new FirebaseAuthBackend(config, auth);
    }
    return _fireBaseBackend;
};

const getFirebaseBackend = () => {
    return _fireBaseBackend;
};

export { initFirebaseBackend, getFirebaseBackend };
