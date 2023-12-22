import { MenuItem } from "./menu.model";

export const MENU: MenuItem[] = [
    {
        label: 'MENUITEMS.DASHBOARD.TEXT',
        icon: 'ph-gauge',
        link: '/',
    },
    {
        label: 'MENUITEMS.PROJECTS.TEXT',
        icon: 'ph-notebook',
        link: '/',
    },
    {
        label: 'MENUITEMS.ORDERS.TEXT',
        icon: 'ph-clipboard',
        link: '/orders',
    },
    {
        label: 'MENUITEMS.USER_NOTIFICATIONS.TEXT',
        icon: 'ph-notification',
        link: '/user-notifications',
    },
    {
        label: 'MENUITEMS.NEWS.TEXT',
        icon: 'ph-article',
        link: '/news',
    },
].map((item, index) => ({
    ...item,
    id: index + 1,
}));
