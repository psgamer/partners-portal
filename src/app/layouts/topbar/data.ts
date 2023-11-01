const notification = [
    {
        "title": "New",
        "items": [
            {
                "id": 1,
                "type": "notification",
                "background": "bg-info-subtle text-info",
                "icon": "bx bx-badge-check",
                "text": "Your Elite author Graphic Optimization reward is ready!",
                "link": "javascript:void(0);",
                "timestamp": "Just 30 sec ago",
                "checkboxId": "all-notification-check01",
                "state": false
            },
            {
                "id": 2,
                "type": "notification",
                "avatar": "assets/images/users/48/avatar-2.jpg",
                "activeBadge": "New alerts",
                "name": "Angela Bernier",
                "text": "Answered to your comment on the cash flow forecast's graph 🔔.",
                "link": "javascript:void(0);",
                "timestamp": "48 min ago",
                "checkboxId": "all-notification-check02",
                "state": false
            },
            {
                "id": 3,
                "type": "notification",
                "background": "bg-danger-subtle",
                "icon": "bx bx-message-square-dots",
                "text": "You have received 20 new messages in the conversation",
                "link": "javascript:void(0);",
                "timestamp": "2 hrs ago",
                "checkboxId": "all-notification-check03",
                "state": false
            }
        ]
    },
    {
        "title": "Read Before",
        "items": [
            {
                "id": 4,
                "type": "notification",
                "avatar": "assets/images/users/32/avatar-8.jpg",
                "activeBadge": "New alerts",
                "name": "Maureen Gibson",
                "text": "We talked about a project on LinkedIn.",
                "link": "javascript:void(0);",
                "timestamp": "4 hrs ago",
                "checkboxId": "all-notification-check04",
                "state": false
            }
        ]
    }
]

const cartList = [
    {
        id: '1',
        img:'assets/images/products/48/img-1.png',
        title: 'Branded T-Shirts',
        category: 'Fashion',
        size: 'XL',
        color: 'Blue',
        price: 161.25,
        qty: 3
    },
    {
        id: '2',
        img:'assets/images/products/48/img-3.png',
        title: 'Fossil gen 5E smart watch',
        category: 'Watchs',
        color: 'White',
        price: 69.60,
        qty: 2
    },
    {
        id: '3',
        img:'assets/images/products/48/img-6.png',
        title: 'Olive Printed Men Round Neck',
        category: 'Fashion',
        size: 'M',
        color: 'Brown',
        price: 250.00,
        qty: 6
    },
    {
        id: '4',
        img:'assets/images/products/48/img-9.png',
        title: 'Flip-Flops and House Slippers',
        category: 'Footwear',
        size: '8',
        color: 'Green',
        price: 150.00,
        qty: 1
    },
    {
        id: '5',
        img:'assets/images/products/48/img-2.png',
        title: 'Like style travel black handbag',
        category: 'Luggage',
        color: 'Green',
        price: 89.99,
        qty: 1
    }
]

export { notification, cartList }