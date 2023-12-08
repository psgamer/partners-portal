import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { tap } from 'rxjs';

// Register Auth
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { environment } from 'src/environments/environment';

@UntilDestroy()
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

// Register Component
export class RegisterComponent {
  // Login Form
  signupForm!: UntypedFormGroup;
  submitted = false;
  successmsg = false;
  error = '';
  // set the current year
  year: number = new Date().getFullYear();

  fieldTextType!: boolean;

  constructor(private formBuilder: UntypedFormBuilder, private router: Router,
    private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    /**
     * Form Validatyion
     */
    this.signupForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      // name: ['', [Validators.required]],
      password: ['', [Validators.required,
          // Validators.pattern('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}')
      ]],
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.signupForm.controls; }

  /**
   * Register submit form
   */
  onSubmit() {
    this.submitted = true;

    //Register Api
    // this.authenticationService.register(this.f['email'].value, this.f['name'].value, this.f['password'].value).pipe(first()).subscribe(
    //   (data: any) => {
    //     this.successmsg = true;
    //     if (this.successmsg) {
    //       this.router.navigate(['/auth/login']);
    //     }
    //   },
    //   (error: any) => {
    //     this.error = error ? error : '';
    //   });

    // stop here if form is invalid
    if (this.signupForm.invalid) {
        console.error(Object.values(this.signupForm.controls).map(c => c.errors));
      return;
    } else {
      if (environment.defaultauth === 'firebase') {
        this.authenticationService.register(
            this.f['email'].value,
            // this.f['name'].value,
            undefined as any,// name isn't used
            this.f['password'].value
        ).then((res: any) => {
          this.successmsg = true;
          if (this.successmsg) {
              this.authenticationService.currentUserContractorId()
                  .pipe(tap(contractorId => {
                      if (!!contractorId) {
                          this.router.navigate(['/']);
                      } else {
                          this.router.navigate(['/auth/register-contractor']);
                      }
                  }))
                  .subscribe();
          }
        })
          .catch((error: string) => {
            this.error = error ? error : '';
          });
      }
    }
  }

    loginWithFb() {
        this.authenticationService.loginWithFb().then((res: any) => {
            this.router.navigate(['/']);
        })
            .catch(error => {
                this.error = error ? error : '';
            });
    }

    loginWithTwitter() {
        this.authenticationService.loginWithTwitter().then((res: any) => {
            this.router.navigate(['/']);
        })
            .catch(error => {
                this.error = error ? error : '';
            });
    }

  /**
 * Password Hide/Show
 */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

}
