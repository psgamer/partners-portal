import { Component, OnInit } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ActivatedRoute } from "@angular/router";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take, tap, throwError } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { catchError } from "rxjs/operators";
import { AuthenticationService } from "../../core/services/auth.service";
import { Contractor } from "../../shared/contractor/contractor.model";

// Register Auth

@UntilDestroy()
@Component({
    template: `{{text}}`,
})

// Register Component
export class AssignUserContractorComponent implements OnInit {
    text: string = 'Please add /contractorId to url and go';
    private readonly assignContractorToUser = httpsCallable<Payload, boolean>(this.functions, 'assignContractorToUser');

    constructor(
        private authService: AuthenticationService,
        private route: ActivatedRoute,
        private functions: Functions,
    ) {
    }

    ngOnInit() {
        const contractorId = this.route.snapshot.paramMap.get('contractorId');

        if (contractorId != null && contractorId !== '') {
            this.text = 'Please wait...';
            fromPromise(this.assignContractorToUser({contractorId})).pipe(
                untilDestroyed(this),
                catchError((err) => {
                    this.text = 'Failure trying to assign contractor to user';
                    console.error('Failure trying to assign contractor to user', err);
                    return throwError(() => err);
                }),
                tap(({data: success}) => {
                    this.text = `assigned contractor to user success: ${success}`;
                    console.log(`assigned contractor to user success: ${success}`);
                    if (success) {
                        this.authService.currentUserContractorId(true).pipe(untilDestroyed(this), take(1)).subscribe();
                    }
                }),
            ).subscribe();
        }
    }
}

interface Payload {
    contractorId: Contractor['id'];
}
