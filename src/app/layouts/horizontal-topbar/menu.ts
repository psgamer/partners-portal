import {MenuItem} from "./menu.model";

export const MENU: MenuItem[] = [
    {
        id: 1,
        label: 'MENUITEMS.MENU.TEXT',
        isTitle: true
    },
    {
        id: 2,
        label: 'MENUITEMS.DASHBOARD.TEXT',
        icon: 'ph-gauge',
        subItems: [
            {
                id: 3,
                label: 'MENUITEMS.DASHBOARD.LIST.ANALYTICS',
                link: '/',
                parentId: 2
            },
            {
                id: 4,
                label: 'MENUITEMS.DASHBOARD.LIST.CRM',
                link: '/',
                parentId: 2
            },
            {
                id: 5,
                label: 'MENUITEMS.DASHBOARD.LIST.ECOMMERCE',
                link: '/',
                parentId: 2
            },
            {
                id: 6,
                label: 'MENUITEMS.DASHBOARD.LIST.LEARNING',
                link: '/',
                parentId: 2
            },
            {
                id: 7,
                label: 'MENUITEMS.DASHBOARD.LIST.REALESTATE',
                link: '/',
                parentId: 2
            }
        ]
    },
    {
        id: 8,
        label: 'MENUITEMS.APPS.TEXT',
        isTitle: true
    },
    {
        id: 9,
        label: 'MENUITEMS.APPS.LIST.CALENDAR',
        icon: 'ph-calendar',
        link: '/',
        parentId: 8
    },
    {
        id: 10,
        label: 'MENUITEMS.APPS.LIST.CHAT',
        icon: 'ph-chats',
        link: '/',
        parentId: 8
    },
    {
        id: 11,
        label: 'MENUITEMS.APPS.LIST.EMAIL',
        icon: 'ph-envelope',
        link: '/',
        parentId: 8,
    },
    {
        id: 12,
        label: 'MENUITEMS.APPS.LIST.ECOMMERCE',
        icon: 'ph-storefront',
        parentId: 8,
        subItems: [
            {
                id: 13,
                label: 'MENUITEMS.APPS.LIST.PRODUCTS',
                link: '/',
                parentId: 12
            },
            {
                id: 13,
                label: 'MENUITEMS.APPS.LIST.PRODUCTGRID',
                link: '/',
                parentId: 12
            },
            {
                id: 14,
                label: 'MENUITEMS.APPS.LIST.PRODUCTDETAILS',
                link: '/',
                parentId: 12
            },
            {
                id: 15,
                label: 'MENUITEMS.APPS.LIST.CREATEPRODUCT',
                link: '/',
                parentId: 12
            },
            {
                id: 16,
                label: 'MENUITEMS.APPS.LIST.ORDERS',
                link: '/',
                parentId: 12
            },
            {
                id: 17,
                label: 'MENUITEMS.APPS.LIST.ORDEROVERVIEW',
                link: '/',
                parentId: 12
            },
            {
                id: 18,
                label: 'MENUITEMS.APPS.LIST.CUSTOMERS',
                link: '/',
                parentId: 12
            },
            {
                id: 19,
                label: 'MENUITEMS.APPS.LIST.SHOPPINGCART',
                link: '/',
                parentId: 12
            },
            {
                id: 20,
                label: 'MENUITEMS.APPS.LIST.CHECKOUT',
                link: '/',
                parentId: 12
            },
            {
                id: 21,
                label: 'MENUITEMS.APPS.LIST.SELLERS',
                link: '/',
                parentId: 12
            },
            {
                id: 22,
                label: 'MENUITEMS.APPS.LIST.SELLEROVERVIEW',
                link: '/',
                parentId: 12
            }
        ]
    },
    {
        id: 23,
        label: 'MENUITEMS.APPS.LIST.FILEMANAGER',
        icon: 'ph-folder-open',
        link: '/',
        parentId: 8,
    },
    {
        id: 24,
        label: 'MENUITEMS.APPS.LIST.LEARNING',
        icon: 'ph-graduation-cap',
        parentId: 8,
        subItems: [
            {
                id: 25,
                label: 'MENUITEMS.APPS.LIST.COURSES',
                parentId: 24,
                subItems: [
                    {
                        id: 26,
                        label: 'MENUITEMS.APPS.LIST.LISTVIEW',
                        link: '/',
                        parentId: 25
                    },
                    {
                        id: 27,
                        label: 'MENUITEMS.APPS.LIST.GRIDVIEW',
                        link: '/',
                        parentId: 25
                    },
                    {
                        id: 28,
                        label: 'MENUITEMS.APPS.LIST.CATEGORY',
                        link: '/',
                        parentId: 25
                    },
                    {
                        id: 29,
                        label: 'MENUITEMS.APPS.LIST.OVERVIEW',
                        link: '/',
                        parentId: 25
                    },
                    {
                        id: 30,
                        label: 'MENUITEMS.APPS.LIST.CREATECOURSE',
                        link: '/',
                        parentId: 25
                    },
                ]
            },
            {
                id: 31,
                label: 'MENUITEMS.APPS.LIST.STUDENTS',
                parentId: 24,
                subItems: [
                    {
                        id: 32,
                        label: 'MENUITEMS.APPS.LIST.MYSUBSCRIPTIONS',
                        link: '/',
                        parentId: 31
                    },
                    {
                        id: 33,
                        label: 'MENUITEMS.APPS.LIST.MYCOURSES',
                        link: '/',
                        parentId: 31
                    }
                ]
            },
            {
                id: 34,
                label: 'MENUITEMS.APPS.LIST.INSTRUCTORS',
                parentId: 24,
                subItems: [
                    {
                        id: 35,
                        label: 'MENUITEMS.APPS.LIST.LISTVIEW',
                        link: '/',
                        parentId: 34
                    },
                    {
                        id: 36,
                        label: 'MENUITEMS.APPS.LIST.GRIDVIEW',
                        link: '/',
                        parentId: 34
                    },
                    {
                        id: 37,
                        label: 'MENUITEMS.APPS.LIST.OVERVIEW',
                        link: '/',
                        parentId: 34
                    },
                    {
                        id: 38,
                        label: 'MENUITEMS.APPS.LIST.CREATEINSTRUCTOR',
                        link: '/',
                        parentId: 34
                    }
                ]
            },

        ]
    },
    {
        id: 39,
        label: 'MENUITEMS.APPS.LIST.INVOICES',
        icon: 'ph-file-text',
        parentId: 8,
        subItems: [
            {
                id: 40,
                label: 'MENUITEMS.APPS.LIST.LISTVIEW',
                link: '/',
                parentId: 39
            },
            {
                id: 41,
                label: 'MENUITEMS.APPS.LIST.OVERVIEW',
                link: '/',
                parentId: 39
            },
            {
                id: 42,
                label: 'MENUITEMS.APPS.LIST.CREATEINVOICE',
                link: '/',
                parentId: 39
            }
        ]
    },
    {
        id: 43,
        label: 'MENUITEMS.APPS.LIST.SUPPORTTICKETS',
        icon: 'ph-ticket',
        parentId: 8,
        subItems: [
            {
                id: 44,
                label: 'MENUITEMS.APPS.LIST.LISTVIEW',
                link: '/',
                parentId: 43
            },
            {
                id: 45,
                label: 'MENUITEMS.APPS.LIST.OVERVIEW',
                link: '/',
                parentId: 43
            }
        ]
    },
    {
        id: 46,
        label: 'MENUITEMS.APPS.LIST.REALESTATE',
        icon: 'ph-buildings',
        parentId: 8,
        subItems: [
            {
                id: 47,
                label: 'MENUITEMS.APPS.LIST.LISTINGGRID',
                link: '/',
                parentId: 46
            },
            {
                id: 48,
                label: 'MENUITEMS.APPS.LIST.LISTINGLIST',
                link: '/',
                parentId: 46
            },
            {
                id: 49,
                label: 'MENUITEMS.APPS.LIST.LISTINGMAP',
                link: '/',
                parentId: 46
            },
            {
                id: 50,
                label: 'MENUITEMS.APPS.LIST.PROPERTYOVERVIEW',
                link: '/',
                parentId: 46
            },
            {
                id: 51,
                label: 'MENUITEMS.APPS.LIST.AGENT',
                parentId: 46,
                subItems: [
                    {
                        id: 52,
                        label: 'MENUITEMS.APPS.LIST.LISTVIEW',
                        link: '/',
                        parentId: 51
                    },
                    {
                        id: 53,
                        label: 'MENUITEMS.APPS.LIST.GRIDVIEW',
                        link: '/',
                        parentId: 51
                    },
                    {
                        id: 54,
                        label: 'MENUITEMS.APPS.LIST.OVERVIEW',
                        link: '/',
                        parentId: 51
                    },
                ]
            },
            {
                id: 55,
                label: 'MENUITEMS.APPS.LIST.AGENCIES',
                parentId: 46,
                subItems: [
                    {
                        id: 56,
                        label: 'MENUITEMS.APPS.LIST.LISTVIEW',
                        link: '/',
                        parentId: 55
                    },
                    {
                        id: 57,
                        label: 'MENUITEMS.APPS.LIST.OVERVIEW',
                        link: '/',
                        parentId: 55
                    },
                ]
            },
            {
                id: 58,
                label: 'MENUITEMS.APPS.LIST.ADDPROPERTY',
                link: '/',
                parentId: 46
            },
            {
                id: 59,
                label: 'MENUITEMS.APPS.LIST.EARNINGS',
                link: '/',
                parentId: 46
            },
        ]
    },
    {
        id: 61,
        label: 'MENUITEMS.AUTHENTICATION.TEXT',
        icon: 'ph-user-circle',
        subItems: [
            {
                id: 62,
                label: 'MENUITEMS.AUTHENTICATION.LIST.SIGNIN',
                link: '/',
                parentId: 61,
            },
            {
                id: 63,
                label: 'MENUITEMS.AUTHENTICATION.LIST.SIGNUP',
                link: '/',
                parentId: 61,
            },
            {
                id: 64,
                label: 'MENUITEMS.AUTHENTICATION.LIST.PASSWORDRESET',
                link: '/',
                parentId: 61,
            },
            {
                id: 65,
                label: 'MENUITEMS.AUTHENTICATION.LIST.PASSWORDCREATE',
                link: '/',
                parentId: 61,
            },
            {
                id: 66,
                label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN',
                link: '/',
                parentId: 61
            },
            {
                id: 67,
                label: 'MENUITEMS.AUTHENTICATION.LIST.LOGOUT',
                link: '/',
                parentId: 61
            },
            {
                id: 68,
                label: 'MENUITEMS.AUTHENTICATION.LIST.SUCCESSMESSAGE',
                link: '/',
                parentId: 61
            },
            {
                id: 69,
                label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION',
                link: '/',
                parentId: 61
            },
            {
                id: 70,
                label: 'MENUITEMS.AUTHENTICATION.LIST.ERRORS',
                parentId: 61,
                subItems: [
                    {
                        id: 71,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.404ERROR',
                        link: '/',
                        parentId: 70
                    },
                    {
                        id: 72,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.500',
                        link: '/',
                        parentId: 70
                    },
                    {
                        id: 73,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.503',
                        link: '/',
                        parentId: 70
                    },
                    {
                        id: 74,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.OFFLINE',
                        link: '/',
                        parentId: 70
                    },
                ]
            },
        ]
    },
    {
        id: 75,
        label: 'MENUITEMS.EXTRAPAGES.TEXT',
        icon: 'ph-address-book',
        subItems: [
            {
                id: 76,
                label: 'MENUITEMS.EXTRAPAGES.LIST.STARTER',
                link: '/',
                parentId: 75
            },
            {
                id: 77,
                label: 'MENUITEMS.EXTRAPAGES.LIST.PROFILE',
                link: '/',
                parentId: 75,
            },
            {
                id: 78,
                label: 'MENUITEMS.EXTRAPAGES.LIST.PROFILESETTINGS',
                link: '/',
                parentId: 75,
            },
            {
                id: 79,
                label: 'MENUITEMS.EXTRAPAGES.LIST.CONTACTS',
                link: '/',
                parentId: 75
            },
            {
                id: 80,
                label: 'MENUITEMS.EXTRAPAGES.LIST.TIMELINE',
                link: '/',
                parentId: 75
            },
            {
                id: 81,
                label: 'MENUITEMS.EXTRAPAGES.LIST.FAQS',
                link: '/',
                parentId: 75
            },
            {
                id: 82,
                label: 'MENUITEMS.EXTRAPAGES.LIST.PRICING',
                link: '/',
                parentId: 75
            },
            {
                id: 83,
                label: 'MENUITEMS.EXTRAPAGES.LIST.MAINTENANCE',
                link: '/',
                parentId: 75
            },
            {
                id: 84,
                label: 'MENUITEMS.EXTRAPAGES.LIST.COMINGSOON',
                link: '/',
                parentId: 75
            },
            {
                id: 85,
                label: 'MENUITEMS.EXTRAPAGES.LIST.PRIVACYPOLICY',
                link: '/',
                parentId: 75
            },
            {
                id: 86,
                label: 'MENUITEMS.EXTRAPAGES.LIST.TERMS&CONDITIONS',
                link: '/',
                parentId: 75
            }
        ]
    },
    {
        id: 88,
        label: 'MENUITEMS.BOOTSTRAPUI.TEXT',
        icon: "ph-bandaids",
        subItems: [
            {
                id: 89,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.ALERTS',
                link: '/',
                parentId: 88
            },
            {
                id: 90,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.BADGES',
                link: '/',
                parentId: 88
            },
            {
                id: 91,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.BUTTONS',
                link: '/',
                parentId: 88
            },
            {
                id: 92,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.COLORS',
                link: '/',
                parentId: 88
            },
            {
                id: 93,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.CARDS',
                link: '/',
                parentId: 88
            },
            {
                id: 94,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.CAROUSEL',
                link: '/',
                parentId: 88
            },
            {
                id: 95,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.DROPDOWNS',
                link: '/',
                parentId: 88
            },
            {
                id: 96,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.GRID',
                link: '/',
                parentId: 88
            },
            {
                id: 97,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.IMAGES',
                link: '/',
                parentId: 88
            },
            {
                id: 98,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.TABS',
                link: '/',
                parentId: 88
            },
            {
                id: 99,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.ACCORDION&COLLAPSE',
                link: '/',
                parentId: 88
            },
            {
                id: 100,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.MODALS',
                link: '/',
                parentId: 88
            },
            {
                id: 102,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.PLACEHOLDERS',
                link: '/',
                parentId: 88
            },
            {
                id: 103,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.PROGRESS',
                link: '/',
                parentId: 88
            },
            {
                id: 104,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.NOTIFICATIONS',
                link: '/',
                parentId: 88
            },
            {
                id: 105,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.MEDIAOBJECT',
                link: '/',
                parentId: 88
            },
            {
                id: 106,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.EMBEDVIDEO',
                link: '/',
                parentId: 88
            },
            {
                id: 107,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.TYPOGRAPHY',
                link: '/',
                parentId: 88
            },
            {
                id: 108,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.LISTS',
                link: '/',
                parentId: 88
            },
            {
                id: 109,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.LINKS',
                link: '/',
                parentId: 88
            },
            {
                id: 110,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.GENERAL',
                link: '/',
                parentId: 88
            },
            {
                id: 111,
                label: 'MENUITEMS.BOOTSTRAPUI.LIST.UTILITIES',
                link: '/',
                parentId: 88
            },
        ]
    },
    {
        id: 112,
        label: 'MENUITEMS.ADVANCEUI.TEXT',
        icon: "ph-stack-simple",
        subItems: [
            {
                id: 113,
                label: 'MENUITEMS.ADVANCEUI.LIST.SWEETALERTS',
                link: '/',
                parentId: 112
            },

            {
                id: 115,
                label: 'MENUITEMS.ADVANCEUI.LIST.SCROLLBAR',
                link: '/',
                parentId: 112
            },
            {
                id: 116,
                label: 'MENUITEMS.ADVANCEUI.LIST.SWIPERSLIDER',
                link: '/',
                parentId: 112
            },
            {
                id: 117,
                label: 'MENUITEMS.ADVANCEUI.LIST.RATTINGS',
                link: '/',
                parentId: 112
            },
            {
                id: 118,
                label: 'MENUITEMS.ADVANCEUI.LIST.HIGHLIGHT',
                link: '/',
                parentId: 112
            },
            {
                id: 119,
                label: 'MENUITEMS.ADVANCEUI.LIST.SCROLLSPY',
                link: '/',
                parentId: 112
            }
        ]
    },
    {
        id: 120,
        label: 'MENUITEMS.CUSTOMUI.TEXT',
        badge: 'MENUITEMS.CUSTOMUI.BADGE',
        icon: "ph-wrench",
        subItems: [
            {
                id: 121,
                label: 'MENUITEMS.CUSTOMUI.LIST.RIBBONS',
                link: '/',
                parentId: 120
            },
            {
                id: 122,
                label: 'MENUITEMS.CUSTOMUI.LIST.PROFILE',
                link: '/',
                parentId: 120
            },
            {
                id: 123,
                label: 'MENUITEMS.CUSTOMUI.LIST.COUNTER',
                link: '/',
                parentId: 120
            }
        ]
    },
    {
        id: 124,
        label: 'MENUITEMS.WIDGETS.TEXT',
        icon: "ph-paint-brush-broad",
        link: '/s'
    },
    {
        id: 125,
        label: 'MENUITEMS.FORMS.TEXT',
        icon: 'ri-file-list-3-line',
        subItems: [
            {
                id: 126,
                label: 'MENUITEMS.FORMS.LIST.BASICELEMENTS',
                link: '/',
                parentId: 125
            },
            {
                id: 127,
                label: 'MENUITEMS.FORMS.LIST.FORMSELECT',
                link: '/',
                parentId: 125
            },
            {
                id: 128,
                label: 'MENUITEMS.FORMS.LIST.CHECKBOXS&RADIOS',
                link: '/',
                parentId: 125
            },
            {
                id: 129,
                label: 'MENUITEMS.FORMS.LIST.PICKERS',
                link: '/',
                parentId: 125
            },
            {
                id: 130,
                label: 'MENUITEMS.FORMS.LIST.INPUTMASKS',
                link: '/',
                parentId: 125
            },
            {
                id: 131,
                label: 'MENUITEMS.FORMS.LIST.ADVANCED',
                link: '/',
                parentId: 125
            },
            {
                id: 132,
                label: 'MENUITEMS.FORMS.LIST.RANGESLIDER',
                link: '/',
                parentId: 125
            },
            {
                id: 133,
                label: 'MENUITEMS.FORMS.LIST.VALIDATION',
                link: '/',
                parentId: 125
            },
            {
                id: 134,
                label: 'MENUITEMS.FORMS.LIST.WIZARD',
                link: '/',
                parentId: 125
            },
            {
                id: 135,
                label: 'MENUITEMS.FORMS.LIST.EDITORS',
                link: '/',
                parentId: 125
            },
            {
                id: 136,
                label: 'MENUITEMS.FORMS.LIST.FILEUPLOADS',
                link: '/',
                parentId: 125
            },
            {
                id: 137,
                label: 'MENUITEMS.FORMS.LIST.FORMLAYOUTS',
                link: '/',
                parentId: 125
            }
        ]
    },
    {
        id: 138,
        label: 'MENUITEMS.TABLES.TEXT',
        icon: 'ph-table',
        subItems: [
            {
                id: 139,
                label: 'MENUITEMS.TABLES.LIST.BASICTABLES',
                link: '/',
                parentId: 138
            },
            {
                id: 140,
                label: 'MENUITEMS.TABLES.LIST.GRIDJS',
                link: '/',
                parentId: 138
            },
            {
                id: 141,
                label: 'MENUITEMS.TABLES.LIST.LISTJS',
                link: '/',
                parentId: 138
            }
        ]
    },
    {
        id: 142,
        label: 'MENUITEMS.CHARTS.TEXT',
        icon: 'ph-chart-pie-slice',
        subItems: [
            {
                id: 143,
                label: 'MENUITEMS.CHARTS.LIST.LINE',
                link: '/',
                parentId: 142
            },
            {
                id: 144,
                label: 'MENUITEMS.CHARTS.LIST.AREA',
                link: '/',
                parentId: 142
            },
            {
                id: 145,
                label: 'MENUITEMS.CHARTS.LIST.COLUMN',
                link: '/',
                parentId: 142
            },
            {
                id: 146,
                label: 'MENUITEMS.CHARTS.LIST.BAR',
                link: '/',
                parentId: 142
            },
            {
                id: 147,
                label: 'MENUITEMS.CHARTS.LIST.MIXED',
                link: '/',
                parentId: 142
            },
            {
                id: 148,
                label: 'MENUITEMS.CHARTS.LIST.TIMELINE',
                link: '/',
                parentId: 142
            },
            {
                id: 148,
                label: 'MENUITEMS.CHARTS.LIST.RANGEAREA',
                link: '/',
                parentId: 142
            },
            {
                id: 148,
                label: 'MENUITEMS.CHARTS.LIST.FUNNEL',
                link: '/',
                parentId: 142
            },
            {
                id: 149,
                label: 'MENUITEMS.CHARTS.LIST.CANDLSTICK',
                link: '/',
                parentId: 142
            },
            {
                id: 150,
                label: 'MENUITEMS.CHARTS.LIST.BOXPLOT',
                link: '/',
                parentId: 142
            },
            {
                id: 151,
                label: 'MENUITEMS.CHARTS.LIST.BUBBLE',
                link: '/',
                parentId: 142
            },
            {
                id: 152,
                label: 'MENUITEMS.CHARTS.LIST.SCATTER',
                link: '/',
                parentId: 142
            },
            {
                id: 153,
                label: 'MENUITEMS.CHARTS.LIST.HEATMAP',
                link: '/',
                parentId: 142
            },
            {
                id: 154,
                label: 'MENUITEMS.CHARTS.LIST.TREEMAP',
                link: '/',
                parentId: 142
            },
            {
                id: 155,
                label: 'MENUITEMS.CHARTS.LIST.PIE',
                link: '/',
                parentId: 142
            },
            {
                id: 156,
                label: 'MENUITEMS.CHARTS.LIST.RADIALBAR',
                link: '/',
                parentId: 142
            },
            {
                id: 157,
                label: 'MENUITEMS.CHARTS.LIST.RADAR',
                link: '/',
                parentId: 142
            },
            {
                id: 158,
                label: 'MENUITEMS.CHARTS.LIST.POLARAREA',
                link: '/',
                parentId: 142
            },
        ]
    },
    {
        id: 159,
        label: 'MENUITEMS.ICONS.TEXT',
        icon: 'ph-traffic-cone',
        subItems: [
            {
                id: 160,
                label: 'MENUITEMS.ICONS.LIST.REMIX',
                link: '/',
                parentId: 159
            },
            {
                id: 161,
                label: 'MENUITEMS.ICONS.LIST.BOXICONS',
                link: '/',
                parentId: 159
            },
            {
                id: 162,
                label: 'MENUITEMS.ICONS.LIST.MATERIALDESIGN',
                link: '/',
                parentId: 159
            },
            {
                id: 163,
                label: 'MENUITEMS.ICONS.LIST.BOOTSTRAP',
                link: '/',
                parentId: 159
            },
            {
                id: 164,
                label: 'MENUITEMS.ICONS.LIST.PHOSPHOR',
                link: '/',
                parentId: 159
            }
        ]
    },
    {
        id: 165,
        label: 'MENUITEMS.MAPS.TEXT',
        icon: 'ph-map-trifold',
        subItems: [
            {
                id: 166,
                label: 'MENUITEMS.MAPS.LIST.GOOGLE',
                link: '/',
                parentId: 165
            },
            {
                id: 167,
                label: 'MENUITEMS.MAPS.LIST.VECTOR',
                link: '/',
                parentId: 165
            },
            {
                id: 167,
                label: 'MENUITEMS.MAPS.LIST.LEAFLET',
                link: '/',
                parentId: 165
            }
        ]
    },
    {
        id: 168,
        label: 'MENUITEMS.MULTILEVEL.TEXT',
        icon: 'bi bi-share',
        subItems: [
            {
                id: 169,
                label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.1',
                parentId: 168
            },
            {
                id: 170,
                label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.2',
                parentId: 168,
                subItems: [
                    {
                        id: 171,
                        label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.LEVEL2.1',
                        parentId: 170
                    },
                    {
                        id: 172,
                        label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.LEVEL2.2',
                        parentId: 170,
                        subItems: [
                            {
                                id: 173,
                                label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.LEVEL2.LEVEL3.1',
                                parentId: 172
                            },
                            {
                                id: 174,
                                label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.LEVEL2.LEVEL3.2',
                                parentId: 172,

                            }
                        ]
                    }
                ]
            }
        ]
    }
]
