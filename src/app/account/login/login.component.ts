import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { switchMap, tap, throwError } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { catchError } from "rxjs/operators";
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { AuthfakeauthenticationService } from 'src/app/core/services/authfake.service';
import { environment } from '../../../environments/environment';

@UntilDestroy()
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

// Login Component
export class LoginComponent {

    // Login Form
    loginForm!: UntypedFormGroup;
    submitted = false;
    fieldTextType!: boolean;
    error = '';
    returnUrl!: string;

    toast!: false;

    // set the current year
    year: number = new Date().getFullYear();

    constructor(private formBuilder: UntypedFormBuilder, private authenticationService: AuthenticationService, private router: Router,
                private authFackservice: AuthfakeauthenticationService, private route: ActivatedRoute) {
    }

    ngOnInit(): void {
        // if (localStorage.getItem('currentUser')) {
        //     this.router.navigate(['/']);
        // }
        /**
         * Form Validatyion
         */
        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
        });
        // get return url from route parameters or default to '/'
        // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    // convenience getter for easy access to form fields
    get f() {
        return this.loginForm.controls;
    }

    /**
     * Form submit
     */
    onSubmit() {
        this.submitted = true;

        // Login Api
        // this.authenticationService.login(this.f['email'].value, this.f['password'].value).subscribe((data: any) => {
        //   if (data.status == 'success') {
        //     localStorage.setItem('toast', 'true');
        //     localStorage.setItem('currentUser', JSON.stringify(data.data));
        //     localStorage.setItem('token', data.token);
        //     this.router.navigate(['/']);
        //   }
        // });

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        } else {
            if (environment.defaultauth === 'firebase') {
                this.handlePostLogin(this.authenticationService.login(this.f['email'].value, this.f['password'].value));
            } else {
                // this.authFackservice.login(this.f['email'].value, this.f['password'].value).pipe(first()).subscribe(data => {
                //       this.router.navigate(['/']);
                //     },
                //     error => {
                //       this.error = error ? error : '';
                //     });
            }
        }
    }

    loginWithFb() {
        this.handlePostLogin(this.authenticationService.loginWithFb());
    }

    loginWithTwitter() {
        this.handlePostLogin(this.authenticationService.loginWithTwitter());
    }

    handlePostLogin(loginAction: Promise<any>) {
        fromPromise(loginAction)
            .pipe(
                untilDestroyed(this),
                switchMap(() => this.authenticationService.currentUserContractorId()),
                tap(contractorId => {
                    if (!!contractorId) {
                        this.router.navigate(['/']);
                    } else {
                        this.router.navigate(['/auth/assign-user-contractor']);
                    }
                }),
                catchError((err, obs) => {
                    this.error = err ? err : '';
                    return throwError(() => err);
                })
            )
            .subscribe();
    }

    /**
     * Password Hide/Show
     */
    toggleFieldTextType() {
        this.fieldTextType = !this.fieldTextType;
    }
}
