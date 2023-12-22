import { CommonModule, DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// lang
import localeUk from '@angular/common/locales/uk';
import { LOCALE_ID, NgModule, Predicate } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Auth, connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { connectFirestoreEmulator, enableMultiTabIndexedDbPersistence, getFirestore, provideFirestore, } from '@angular/fire/firestore';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from "@angular/fire/functions";
import { connectStorageEmulator, getStorage, provideStorage } from "@angular/fire/storage";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';

// Laguage
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TimeagoCustomFormatter, TimeagoFormatter, TimeagoIntl, TimeagoModule } from 'ngx-timeago';
import { strings as uaStrings } from "ngx-timeago/language-strings/uk";

// firebase
import { ToastrModule } from 'ngx-toastr';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';

// env
import { environment } from '../environments/environment';
import { FirebaseEmulatedServiceName } from '../environments/environment.types';

// Page Route
import { AppRoutingModule } from './app-routing.module';

// component
import { AppComponent } from './app.component';
import { AuthlayoutComponent } from './authlayout/authlayout.component';
import { initFirebaseBackend } from './authUtils';
import { DEFAULT_LANGUAGE } from './core/models/language.models';
import { PageTitleService } from './core/page-title-service';
import { PageTitleStrategy } from './core/page-title-strategy';
import { LayoutsModule } from './layouts/layouts.module';

registerLocaleData(localeUk, 'ua');
const functionsRegion = 'europe-west1';
const shouldUseEmulator: Predicate<FirebaseEmulatedServiceName> = serviceName =>
    environment.useEmulators === true || (environment.useEmulators !== false && environment.useEmulators.includes(serviceName));

export function createTranslateLoader(http: HttpClient): any {
    return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

export class MyIntl extends TimeagoIntl {
    constructor() {
        super();
        this.strings = uaStrings;
        this.changes.next();
    }
}

@NgModule({
    declarations: [
        AppComponent,
        AuthlayoutComponent
    ],
    imports: [
        CommonModule,
        TranslateModule.forRoot({
            defaultLanguage: DEFAULT_LANGUAGE,
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            },
            compiler: {
                provide: TranslateCompiler,
                useClass: TranslateMessageFormatCompiler,
            }
        }),
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        // provideAnalytics(() => getAnalytics()),
        provideAuth(() => {
            const auth = getAuth();
            // setPersistence(auth, browserSessionPersistence);
            if (shouldUseEmulator('auth')) {
                connectAuthEmulator(auth, 'http://127.0.0.1:9099');
            }
            initFirebaseBackend(environment.firebase, auth);
            return auth;
        }),
        provideFirestore(() => {
            const firestore = getFirestore();
            if (shouldUseEmulator('firestore')) {
                connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
                // TODO investigate this, probably refactor as recommended after version upgrade
                enableMultiTabIndexedDbPersistence(firestore)
                    .then(() => console.log('enabled multi-tab db persistence'))
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
        provideFunctions(() => {
            const functions = getFunctions(undefined, functionsRegion);
            if (shouldUseEmulator('functions')) {
                connectFunctionsEmulator(functions, "127.0.0.1", 5001);
            }
            return functions;
        }),
        // provideMessaging(() => getMessaging()),
        // provideRemoteConfig(() => {
        //   const remoteConfig = getRemoteConfig();
        //   if (!environment.production) {
        //     remoteConfig.settings.minimumFetchIntervalMillis = 30 * 1000;
        //   }
        //   return remoteConfig;
        // }),
        provideStorage(() => {
            const storage = getStorage();
            if (shouldUseEmulator('storage')) {
                connectStorageEmulator(storage, "127.0.0.1", 9199);
            }
            return storage;
        }),
        HttpClientModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        LayoutsModule,
        ToastrModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
        TimeagoModule.forRoot({
            intl: { provide: TimeagoIntl, useClass: MyIntl },
            formatter: {provide: TimeagoFormatter, useClass: TimeagoCustomFormatter},
        }),
    ],
    providers: [{
        provide: FIREBASE_OPTIONS,
        useValue: environment.firebase,
    }, {
        provide: TitleStrategy,
        useClass: PageTitleStrategy
    }, {
        provide: LOCALE_ID, useValue: 'ua'
    }, {
        provide: DATE_PIPE_DEFAULT_OPTIONS,
        useValue: {dateFormat: 'short'}
    }, PageTitleService],
    bootstrap: [AppComponent]
})
export class AppModule {
    /**
     *
     * @param _auth do not remove - required for firebase auth init to be available on login
     */
    constructor(_auth: Auth) {
    }
}
