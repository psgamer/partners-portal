import { User as FirebaseUser } from '@firebase/auth';

// export class User {
//   id?: number;
//   username?: string;
//   password?: string;
//   firstName?: string;
//   lastName?: string;
//   token?: string;
//   email?: string;
// }

export interface User {
    id: FirebaseUser['uid'];
}
