import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssignUserContractorComponent } from "./assign-user-contractor/assign-user-contractor.component";

// Component
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RegisterComponent } from './register/register.component';

const routes: Routes = [
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
    {
        path: 'assign-user-contractor',
        component: AssignUserContractorComponent,
        title: 'assign user contractor'
    },
    {
        path: 'assign-user-contractor/:contractorId',
        component: AssignUserContractorComponent,
        title: 'assign user contractor'
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountRoutingModule {
}
