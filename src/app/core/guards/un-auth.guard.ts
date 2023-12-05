import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs/operators';

// Auth Services
import { AuthenticationService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class UnAuthGuard {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
    ) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        this.authenticationService.currentUser$().pipe(
            map(currentUser => {
                if (!currentUser) {
                    return true;
                } else {
                    this.router.navigate(['./']);
                    return false;
                }
            })
        ).subscribe();
    }
}