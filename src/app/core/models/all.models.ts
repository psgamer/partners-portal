import { Timestamp } from '@angular/fire/firestore';
import { Contractor } from '../../shared/contractor/contractor.model';

interface Client {
    id: string;
    taxCode: string;
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
    Client, Period, PeriodType, UserNotificationType, UserNotification, NewsArticle,
}
