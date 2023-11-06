import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Page Route
import { AccountRoutingModule } from './account-routing.module';
import { AuthModule } from './auth/auth.module';

// Component
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RegisterComponent } from './register/register.component';


@NgModule({
    declarations: [
        LoginComponent,
        RegisterComponent,
        LogoutComponent
    ],
    imports: [
        CommonModule,
        AccountRoutingModule,
        AuthModule,
        FormsModule,
        ReactiveFormsModule
    ]
})
export class AccountModule {
}
