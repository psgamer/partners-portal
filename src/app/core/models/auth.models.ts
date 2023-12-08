import { User as FirebaseUser } from '@angular/fire/auth';

export interface User {
    id: FirebaseUser['uid'];
}
