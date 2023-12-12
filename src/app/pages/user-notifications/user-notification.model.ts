import { Timestamp } from "@angular/fire/firestore";
import { User } from '../../core/models/auth.models';

export interface UserNotification {
    id: string;
    creationDate: Timestamp;
    isRead: boolean;
    title: string;
    text: string;
    type: UserNotificationType;
}

export interface UserNotificationMetadata {
    id: User['id'];
    unreadCount: number;
}

export enum UserNotificationType {
    ORDER = 'ORDER',
}

export const getUserNotificationTagItemClass = ({type}: Pick<UserNotification, 'type'>): string => {
    switch (type) {
        case UserNotificationType.ORDER:
            return 'bg-primary-subtle text-primary';
        default:
            return '';
    }
};

export const getOrderTagItemIconClass = ({type}: Pick<UserNotification, 'type'>): string => {
    switch (type) {
        case UserNotificationType.ORDER:
            return 'ph-clipboard';
        default:
            return '';
    }
};