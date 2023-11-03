import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

// Page Route
import {AppRoutingModule} from './app-routing.module';
import {LayoutsModule} from './layouts/layouts.module';
import {ToastrModule} from 'ngx-toastr';

// Laguage
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

// component
import {AppComponent} from './app.component';
import {AuthlayoutComponent} from './authlayout/authlayout.component';

// firebase
import {firebase, FirebaseUIModule} from 'firebaseui-angular-i18n';
import {firebaseui} from 'firebaseui-angular-i18n/lib/firebaseui-angular-library.helper';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {Auth, connectAuthEmulator, getAuth, provideAuth} from '@angular/fire/auth';
import {
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';

// env
import {environment} from '../environments/environment';
import {initFirebaseBackend} from './authUtils';
import {CommonModule} from '@angular/common';
import {FIREBASE_OPTIONS} from '@angular/fire/compat';


export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

const firebaseUiAuthConfig: firebaseui.auth.Config = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    // {
    //     scopes: [
    //         'public_profile',
    //         'email',
    //         'user_likes',
    //         'user_friends'
    //     ],
    //     customParameters: {
    //         'auth_type': 'reauthenticate'
    //     },
    //     provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID
    // },
    // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    {
      requireDisplayName: false,
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
    },
    // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ],


  // tosUrl: '<your-tos-link>',
  // privacyPolicyUrl: '<your-privacyPolicyUrl-link>',
  // credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO
};

@NgModule({
  declarations: [
    AppComponent,
    AuthlayoutComponent
  ],
  imports: [
    CommonModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // provideAnalytics(() => getAnalytics()),
    provideAuth(() => {
      const auth = getAuth();
      // setPersistence(auth, browserSessionPersistence);
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      }
      initFirebaseBackend(environment.firebase, auth);
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
        // TODO investigate this, probably refactor as recommended after version upgrade
        enableMultiTabIndexedDbPersistence(firestore)
          .then(e => console.log('enabled multi-tab db persistence'))
          .catch(e => console.error('failed to enable multi-tab db persistence', e));
      }
      return firestore;
    }),
    // provideDatabase(() => {
    //   const database = getDatabase();
    //   if (environment.useEmulators) {
    //     connectDatabaseEmulator(database, "127.0.0.1", 9000);
    //   }
    //   return database;
    // }),
    // provideFunctions(() => {
    //   const functions = getFunctions();
    //   if (environment.useEmulators) {
    //     connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    //   }
    //   return functions;
    // }),
    // provideMessaging(() => getMessaging()),
    // provideRemoteConfig(() => {
    //   const remoteConfig = getRemoteConfig();
    //   if (!environment.production) {
    //     remoteConfig.settings.minimumFetchIntervalMillis = 30 * 1000;
    //   }
    //   return remoteConfig;
    // }),
    // provideStorage(() => {
    //   const storage = getStorage();
    //   if (environment.useEmulators) {
    //     connectStorageEmulator(storage, "127.0.0.1", 9199);
    //   }
    //   return storage;
    // }),
    FirebaseUIModule.forRoot(firebaseUiAuthConfig),
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LayoutsModule,
    ToastrModule.forRoot(),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [{provide: FIREBASE_OPTIONS, useValue: environment.firebase}],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(auth: Auth) {}
}
