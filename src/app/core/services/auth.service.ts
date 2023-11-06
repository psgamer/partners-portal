import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getFirebaseBackend } from '../../authUtils';
import { GlobalComponent } from "../../global-component";
import { User } from '../models/auth.models';

const AUTH_API = GlobalComponent.AUTH_API;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };


@Injectable({ providedIn: 'root' })

/**
 * Auth-service Component
 */
export class AuthenticationService {

    user!: User;
    currentUserValue: any;

    // private currentUserSubject: BehaviorSubject<User>;
    // public currentUser: Observable<User> | undefined;

    constructor(private http: HttpClient) {
        // this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')!));
        // this.currentUser = this.currentUserSubject.asObservable();
     }

    /**
     * Performs the register
     * @param email email
     * @param password password
     */
    register(email: string, first_name: string, password: string) {
        return getFirebaseBackend()!.registerUser(email, password).then((response: any) => {
            const user = response;
            return user;
        });

        // Register Api
        // return this.http.post(AUTH_API + 'signup', {
        //     email,
        //     first_name,
        //     password,
        //   }, httpOptions);
    }

    /**
     * Performs the auth
     * @param email email of user
     * @param password password of user
     */
    login(email: string, password: string) {
        return getFirebaseBackend()!.loginUser(email, password).then((response: any) => {
            const user = response;
            return user;
        });

        // return this.http.post(AUTH_API + 'signin', {
        //     email,
        //     password
        //   }, httpOptions);
    }

    loginWithFb() {
        return getFirebaseBackend()!.loginWithFb().then((response: any) => {
            const user = response;
            return user;
        });
    }

    /**
     * Returns the current user
     */
    public currentUser(): any {
        return getFirebaseBackend()!.getAuthenticatedUser();
    }

    /**
     * Logout the user
     */
    logout() {
        // logout the user
        return getFirebaseBackend()!.logout();
        // localStorage.removeItem('currentUser');
        // localStorage.removeItem('token');
        // this.currentUserSubject.next(null!);
    }

    /**
     * Reset password
     * @param email email
     */
    resetPassword(email: string) {
        return getFirebaseBackend()!.forgetPassword(email).then((response: any) => {
            const message = response.data;
            return message;
        });
    }

}

