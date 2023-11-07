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
        link: '/',
    },
    {
        label: 'MENUITEMS.NOTIFICATIONS.TEXT',
        icon: 'ph-notification',
        link: '/',
    },
    {
        label: 'MENUITEMS.NEWS.TEXT',
        icon: 'ph-article',
        link: '/',
    },
].map((item, index) => ({
    ...item,
    id: index + 1,
}));
