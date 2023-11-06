import { MenuItem } from "./menu.model";

export const MENU: MenuItem[] = [
    {
        label: 'MENUITEMS.DASHBOARD.TEXT',
        icon: 'ph-gauge',
        link: '/',
    },
    {
        label: 'MENUITEMS.PROJECTS.TEXT',
        icon: 'ph-gauge',
        link: '/',
    },
    {
        label: 'MENUITEMS.ORDERS.TEXT',
        icon: 'ph-gauge',
        link: '/',
    },
    {
        label: 'MENUITEMS.NOTIFICATIONS.TEXT',
        icon: 'ph-gauge',
        link: '/',
    },
    {
        label: 'MENUITEMS.NEWS.TEXT',
        icon: 'ph-gauge',
        link: '/',
    },
].map((item, index) => ({
    ...item,
    id: index + 1,
}));
