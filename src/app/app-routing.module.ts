import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthlayoutComponent } from './authlayout/authlayout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { UnAuthGuard } from './core/guards/un-auth.guard';

// Component
import { LayoutComponent } from './layouts/layout.component';

const routes: Routes = [
    {
        path: '',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        loadChildren: () => import('./pages/pages.module').then(({PagesModule}) => PagesModule),
    },
    {
        path: 'auth',
        canActivate: [UnAuthGuard],
        component: AuthlayoutComponent,
        loadChildren: () => import('./account/account.module').then(({ AccountModule }) => AccountModule),
    },
    {
        path: '**',
        redirectTo: '',
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top', onSameUrlNavigation: 'reload' })],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
