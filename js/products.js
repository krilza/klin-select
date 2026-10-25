// ============================================
// КАТАЛОГ ТОВАРОВ
// ============================================
// Обязательные поля: id (уникальный), name, description, price, images, sizes, category
// Необязательные поля:
//   authenticity: 'original' | 'replica'      — бейдж «Оригинал» / «Реплика» в карточке
//   soldOut: ['XL']                           — размеры, которых нет в наличии
//   sizeChart: {                              — таблица размеров (в см)
//       columns: ['Размер', 'Ширина', 'Длина'],
//       rows: [['M', '58', '70'], ['L', '61', '72']]
//   }
//   hidden: true                              — скрыть товар из каталога

const PRODUCTS = [
    {
        id: 1,
        name: "Худи undercover x grace 2009",
        description: "Эксклюзивное худи. Оверсайз крой, качественный хлопок.",
        price: 4990,
        images: [
            "images/hoodie-1.jpg",
            "images/hoodie-1-2.jpg",
            "images/hoodie-1-3.jpg"
        ],
        sizes: ["L", "M", "XL"],
        category: "clothes"
    },
    {
        id: 2,
        name: "Лонгслив Gr Project x Nine Inch Nails",
        description: "Коллаборация с легендарной группой.",
        price: 3990,
        images: [
            "images/longsleeve-nin.jpg",
            "images/longsleeve-nin-2.jpg"
        ],
        sizes: ["L", "M", "XL"],
        category: "clothes"
    },
    {
        id: 3,
        name: "Худи undercover 1994",
        description: "Классическая модель, проверенная временем.",
        price: 5990,
        images: [
            "images/hoodie-1994.png",
            "images/hoodie-1994-2.png"
        ],
        sizes: ["L", "M", "XL"],
        category: "clothes"
    },
    {
        id: 8,
        name: "Набор носков Adidas",
        description: "Классическая модель, проверенная временем. 3 пары, размер 37-41.",
        price: 400,
        images: [
            "images/socks-1.png"
        ],
        sizes: ["37-41"],
        category: "clothes"
    },
    {
        id: 4,
        name: "Часы WCS2 Серебро",
        description: "Кварцевый механизм. Гравировки на застёжке. Застёжка-клипса.",
        price: 1500,
        images: [
            "images/watch-1.jpg",
            "images/watch-1-2.jpg"
        ],
        sizes: ["ONE SIZE"],
        category: "watches"
    },
    {
        id: 5,
        name: "Часы WCS2 Серебро с чёрным циферблатом",
        description: "Кварцевый механизм. Гравировки на застёжке. Застёжка-клипса.",
        price: 1500,
        images: [
            "images/watch-2.jpg",
            "images/watch-2-2.jpg"
        ],
        sizes: ["ONE SIZE"],
        category: "watches"
    },
    {
        id: 6,
        name: "AirPods Pro 2",
        description: "Активное шумоподавление, до 6 часов работы.",
        price: 5000,
        images: [
            "images/tech-1.jpg"
        ],
        sizes: ["ONE SIZE"],
        category: "tech"
    },
    {
        id: 7,
        name: "Беспроводной геймпад DualShock для PS4",
        description: "Контроллер для комфортного управления в играх. Беспроводное подключение Bluetooth.",
        price: 1999,
        images: [
            "images/tech-2.jpg"
        ],
        sizes: ["ONE SIZE"],
        category: "tech"
    }
];
