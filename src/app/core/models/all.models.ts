import { Timestamp } from '@angular/fire/firestore';
import { LocalSolution } from '../../shared/local-solution/local-solution.model';

interface Contractor {
    id: string;
    name: string;
    contractorIds: Contractor['id'][];
}

interface Payer {
    id: string;
    name: string;
}

interface License {
    id: string;
    expirationDate: Timestamp;
    login: string;
    publicKey: string;
    ordersContractorIds: Contractor['id'][];
    localSolution: {
        id: LocalSolution['id'];
        count: number;
    }
    client: {
        id: Client['id'];
        taxCode: Client['taxCode'];
        name: Client['name'];
    };
}

interface LicensePrivateKey {
    id: string;
    licenseId: License['id'];
    privateKey: string;
}

interface LicensePassword {
    id: string;
    password: string;
}

interface Client {
    id: string;
    taxCode: number;
    name: string;
    contractorIds: Contractor['id'][];
}

interface Period {
    count: number;
    type: PeriodType;
}

enum PeriodType {
    YEAR = 'YEAR',
    MONTH = 'MONTH',
    DAY = 'DAY',
}

interface UserNotification {
    id: string;
    creationDate: Timestamp;
    isRead: boolean;
    title: string;
    text: string;
    type: UserNotificationType;
}

enum UserNotificationType {
    ORDER = 'ORDER',
}

interface NewsArticle {
    id: string;
    author: string;
    content: string;
    created: Timestamp;
    imgUrl: string;
    previewText: string;
    thumbnailUrl: string;
    title: string;
}

export {
    Contractor, Client, License, LicensePassword, LicensePrivateKey, Period, PeriodType, UserNotificationType, UserNotification, Payer,
    NewsArticle,
}
