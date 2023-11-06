import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Component
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RegisterComponent } from './register/register.component';

const routes: Routes = [
    // {
    //     path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
    // },
    {
        path: 'login',
        component: LoginComponent,
        title: 'ACCOUNT.SIGNIN',
    },
    {
        path: 'logout',
        component: LogoutComponent,
        title: 'ACCOUNT.SIGNOUT',
    },
    {
        path: 'register',
        component: RegisterComponent,
        title: 'ACCOUNT.SIGNUP',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountRoutingModule {
}
