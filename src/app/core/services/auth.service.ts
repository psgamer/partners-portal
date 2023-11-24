import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '@angular/fire/auth';
import { Observable, of, take } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { getFirebaseBackend } from '../../authUtils';
import { GlobalComponent } from "../../global-component";

import { Contractor } from "../../shared/contractor/contractor.model";

const AUTH_API = GlobalComponent.AUTH_API;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};


@Injectable({ providedIn: 'root' })

/**
 * Auth-service Component
 */
export class AuthenticationService {
    register(email: string, first_name: string, password: string) {
        return getFirebaseBackend()!.registerUser(email, password);
    }

    login(email: string, password: string) {
        return getFirebaseBackend()!.loginUser(email, password);
    }

    loginWithFb() {
        return getFirebaseBackend()!.loginWithFb();
    }

    loginWithTwitter() {
        return getFirebaseBackend()!.loginWithTwitter();
    }

    currentUser(): Observable<User | null> {
        // TODO refactor to return after init
        return getFirebaseBackend()!.getAuthenticatedUser();
    }

    currentUserContractorId(forceTokenRefresh = false) {
        return this
            .currentUser()
            .pipe(
                take(1),
                switchMap(user => user
                    ? user.getIdTokenResult(forceTokenRefresh).then(({ claims: { contractorId } }) => contractorId as Contractor['id'])
                    : of(null)
                ),
            );
    }

    logout() {
        return getFirebaseBackend()!.logout();
    }

    resetPassword(email: string) {
        return getFirebaseBackend()!.forgetPassword(email).then((response: any) => response.data);
    }

}

