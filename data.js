/**
 * ============================================================
 * DATA.JS — Главный файл данных сайта
 * ============================================================
 * Здесь хранится ВСЯ информация сайта.
 * Чтобы изменить контент — редактируйте только этот файл.
 *
 * Структура:
 *  - site        → общие настройки сайта
 *  - contacts    → контактные данные (телефон, Telegram)
 *  - categories  → разделы каталога
 *  - filters     → варианты фильтров
 *  - products    → все товары по категориям (минимум 8 в каждой)
 * ============================================================
 */

const SITE_DATA = {

  // ─── ОБЩАЯ ИНФОРМАЦИЯ О САЙТЕ ─────────────────────────────
  // Измените name и notice на свои
  site: {
    name: "Ритуальные товары",
    tagline: "Каталог ритуальных товаров",
    subtitle: "Венки · Корзины · Полянки · Гробницы",
    notice: "Каталог носит ознакомительный характер. Подробности по заказу, доставке, срокам изготовления, наличию и индивидуальным пожеланиям уточняйте по телефону.",
  },

  // ─── КОНТАКТЫ ─────────────────────────────────────────────
  // Замените phone и telegram на реальные данные
  contacts: {
    phone: "+7 (000) 000-00-00",
    phoneHref: "tel:+70000000000",
    telegram: "@ritual_shop",
    telegramHref: "https://t.me/ritual_shop",
  },

  // ─── РАЗДЕЛЫ КАТАЛОГА ─────────────────────────────────────
  // Не меняйте id и slug — они связаны с именами HTML-файлов
  categories: [
    {
      id: "venki",
      name: "Венки",
      slug: "venki.html",
      description: "Траурные венки из живых и искусственных цветов",
      icon: "wreath",
    },
    {
      id: "korziny",
      name: "Корзины",
      slug: "korziny.html",
      description: "Цветочные корзины для возложения",
      icon: "basket",
    },
    {
      id: "polyanki",
      name: "Полянки",
      slug: "polyanki.html",
      description: "Плоские цветочные композиции",
      icon: "meadow",
    },
    {
      id: "grobnicy",
      name: "Гробницы",
      slug: "grobnicy.html",
      description: "Украшения и оформление захоронений",
      icon: "tomb",
    },
  ],

  // ─── ПАРАМЕТРЫ ФИЛЬТРОВ ───────────────────────────────────
  // Можно добавлять новые цвета, формы, размеры
  filters: {
    colors: [
      { value: "all",      label: "Все цвета" },
      { value: "white",    label: "Белый" },
      { value: "red",      label: "Красный" },
      { value: "burgundy", label: "Бордовый" },
      { value: "pink",     label: "Розовый" },
      { value: "yellow",   label: "Жёлтый" },
      { value: "mix",      label: "Микс" },
    ],
    // Формы — отдельные для каждой категории
    shapes: {
      venki: [
        { value: "all",   label: "Все формы" },
        { value: "round", label: "Круглый" },
        { value: "oval",  label: "Овальный" },
        { value: "heart", label: "Сердце" },
        { value: "tear",  label: "Слеза" },
      ],
      korziny: [
        { value: "all",          label: "Все формы" },
        { value: "rectangular",  label: "Прямоугольная" },
        { value: "oval",         label: "Овальная" },
        { value: "heart",        label: "Сердце" },
        { value: "round",        label: "Круглая" },
      ],
      polyanki: [
        { value: "all",         label: "Все формы" },
        { value: "rectangular", label: "Прямоугольная" },
        { value: "oval",        label: "Овальная" },
        { value: "round",       label: "Круглая" },
      ],
      grobnicy: [
        { value: "all",         label: "Все формы" },
        { value: "rectangular", label: "Прямоугольная" },
        { value: "arch",        label: "С аркой" },
        { value: "cross",       label: "Крест" },
      ],
    },
    sizes: [
      { value: "all",    label: "Все размеры" },
      { value: "small",  label: "Малый" },
      { value: "medium", label: "Средний" },
      { value: "large",  label: "Большой" },
      { value: "xl",     label: "Очень большой" },
    ],
    priceRanges: [
      { value: "all",         label: "Любая цена",        min: 0,     max: 999999 },
      { value: "0-3000",      label: "До 3 000 ₽",        min: 0,     max: 3000   },
      { value: "3000-6000",   label: "3 000 – 6 000 ₽",   min: 3000,  max: 6000   },
      { value: "6000-10000",  label: "6 000 – 10 000 ₽",  min: 6000,  max: 10000  },
      { value: "10000-99999", label: "От 10 000 ₽",       min: 10000, max: 99999  },
    ],
  },

  // ─── ТОВАРЫ ───────────────────────────────────────────────
  // img: "" — путь к фото, например "img/products/v001.jpg"
  // Если img пустой — покажется серый плейсхолдер
  //
  // Для добавления нового товара скопируйте любой блок { ... }
  // и измените id, number, name, shape, color, size, price, img
  products: {

    // ── ВЕНКИ ──────────────────────────────────────────────
    venki: [
      {
        id: "v001", number: "В-001", name: "«Белая нить»",
        shape: "round",  shapeLabel: "Круглый",
        color: "white",  colorLabel: "Белый",
        size: "medium",  sizeLabel: "Средний (60 см)",
        price: 2500, img: "",
      },
      {
        id: "v002", number: "В-002", name: "«Красная роза»",
        shape: "oval",  shapeLabel: "Овальный",
        color: "red",   colorLabel: "Красный",
        size: "large",  sizeLabel: "Большой (80 см)",
        price: 4200, img: "",
      },
      {
        id: "v003", number: "В-003", name: "«Бархат»",
        shape: "round",    shapeLabel: "Круглый",
        color: "burgundy", colorLabel: "Бордовый",
        size: "small",     sizeLabel: "Малый (40 см)",
        price: 1800, img: "",
      },
      {
        id: "v004", number: "В-004", name: "«Нежность»",
        shape: "heart", shapeLabel: "Сердце",
        color: "pink",  colorLabel: "Розовый",
        size: "medium", sizeLabel: "Средний (60 см)",
        price: 3200, img: "",
      },
      {
        id: "v005", number: "В-005", name: "«Слеза»",
        shape: "tear",  shapeLabel: "Слеза",
        color: "white", colorLabel: "Белый",
        size: "large",  sizeLabel: "Большой (80 см)",
        price: 5800, img: "",
      },
      {
        id: "v006", number: "В-006", name: "«Рассвет»",
        shape: "oval", shapeLabel: "Овальный",
        color: "mix",  colorLabel: "Микс",
        size: "xl",    sizeLabel: "Очень большой (100 см)",
        price: 7500, img: "",
      },
      {
        id: "v007", number: "В-007", name: "«Солнечный»",
        shape: "round",  shapeLabel: "Круглый",
        color: "yellow", colorLabel: "Жёлтый",
        size: "medium",  sizeLabel: "Средний (65 см)",
        price: 2800, img: "",
      },
      {
        id: "v008", number: "В-008", name: "«Вечность»",
        shape: "oval", shapeLabel: "Овальный",
        color: "red",  colorLabel: "Красный",
        size: "xl",    sizeLabel: "Очень большой (110 см)",
        price: 9200, img: "",
      },
      {
        id: "v009", number: "В-009", name: "«Прощание»",
        shape: "tear",     shapeLabel: "Слеза",
        color: "burgundy", colorLabel: "Бордовый",
        size: "large",     sizeLabel: "Большой (85 см)",
        price: 6300, img: "",
      },
    ],

    // ── КОРЗИНЫ ────────────────────────────────────────────
    korziny: [
      {
        id: "k001", number: "К-001", name: "«Спокойствие»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "white",       colorLabel: "Белый",
        size: "medium",       sizeLabel: "Средняя (50×35 см)",
        price: 3800, img: "",
      },
      {
        id: "k002", number: "К-002", name: "«Память»",
        shape: "oval",  shapeLabel: "Овальная",
        color: "red",   colorLabel: "Красный",
        size: "large",  sizeLabel: "Большая (60×45 см)",
        price: 5500, img: "",
      },
      {
        id: "k003", number: "К-003", name: "«Нежный взгляд»",
        shape: "heart", shapeLabel: "Сердце",
        color: "pink",  colorLabel: "Розовый",
        size: "medium", sizeLabel: "Средняя (45×40 см)",
        price: 4200, img: "",
      },
      {
        id: "k004", number: "К-004", name: "«Бордо»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "burgundy",    colorLabel: "Бордовый",
        size: "large",        sizeLabel: "Большая (65×45 см)",
        price: 6800, img: "",
      },
      {
        id: "k005", number: "К-005", name: "«Весна»",
        shape: "oval",  shapeLabel: "Овальная",
        color: "mix",   colorLabel: "Микс",
        size: "small",  sizeLabel: "Малая (35×25 см)",
        price: 2400, img: "",
      },
      {
        id: "k006", number: "К-006", name: "«Солнце»",
        shape: "round",  shapeLabel: "Круглая",
        color: "yellow", colorLabel: "Жёлтый",
        size: "medium",  sizeLabel: "Средняя (45 см)",
        price: 3200, img: "",
      },
      {
        id: "k007", number: "К-007", name: "«Элегия»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "white",       colorLabel: "Белый",
        size: "xl",           sizeLabel: "Очень большая (80×60 см)",
        price: 9500, img: "",
      },
      {
        id: "k008", number: "К-008", name: "«Сердечная»",
        shape: "heart", shapeLabel: "Сердце",
        color: "red",   colorLabel: "Красный",
        size: "large",  sizeLabel: "Большая (60×55 см)",
        price: 7200, img: "",
      },
      {
        id: "k009", number: "К-009", name: "«Малиновая»",
        shape: "round",    shapeLabel: "Круглая",
        color: "burgundy", colorLabel: "Бордовый",
        size: "medium",    sizeLabel: "Средняя (50 см)",
        price: 4600, img: "",
      },
    ],

    // ── ПОЛЯНКИ ────────────────────────────────────────────
    polyanki: [
      {
        id: "p001", number: "П-001", name: "«Белое поле»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "white",       colorLabel: "Белый",
        size: "medium",       sizeLabel: "Средняя (60×40 см)",
        price: 4500, img: "",
      },
      {
        id: "p002", number: "П-002", name: "«Алый»",
        shape: "oval", shapeLabel: "Овальная",
        color: "red",  colorLabel: "Красный",
        size: "large", sizeLabel: "Большая (80×50 см)",
        price: 7800, img: "",
      },
      {
        id: "p003", number: "П-003", name: "«Тихий сад»",
        shape: "round", shapeLabel: "Круглая",
        color: "mix",   colorLabel: "Микс",
        size: "medium", sizeLabel: "Средняя (55×55 см)",
        price: 5200, img: "",
      },
      {
        id: "p004", number: "П-004", name: "«Малиновый закат»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "burgundy",    colorLabel: "Бордовый",
        size: "large",        sizeLabel: "Большая (90×60 см)",
        price: 9200, img: "",
      },
      {
        id: "p005", number: "П-005", name: "«Розовый»",
        shape: "oval",  shapeLabel: "Овальная",
        color: "pink",  colorLabel: "Розовый",
        size: "small",  sizeLabel: "Малая (40×30 см)",
        price: 3100, img: "",
      },
      {
        id: "p006", number: "П-006", name: "«Золотой»",
        shape: "round",  shapeLabel: "Круглая",
        color: "yellow", colorLabel: "Жёлтый",
        size: "large",   sizeLabel: "Большая (75×75 см)",
        price: 8500, img: "",
      },
      {
        id: "p007", number: "П-007", name: "«Вечный свет»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "white",       colorLabel: "Белый",
        size: "xl",           sizeLabel: "Очень большая (110×70 см)",
        price: 14500, img: "",
      },
      {
        id: "p008", number: "П-008", name: "«Лесная»",
        shape: "oval",  shapeLabel: "Овальная",
        color: "mix",   colorLabel: "Микс",
        size: "small",  sizeLabel: "Малая (35×25 см)",
        price: 2700, img: "",
      },
      {
        id: "p009", number: "П-009", name: "«Бархатная ночь»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "burgundy",    colorLabel: "Бордовый",
        size: "medium",       sizeLabel: "Средняя (65×45 см)",
        price: 6100, img: "",
      },
    ],

    // ── ГРОБНИЦЫ ───────────────────────────────────────────
    grobnicy: [
      {
        id: "g001", number: "Г-001", name: "«Классика»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "white",       colorLabel: "Белый",
        size: "medium",       sizeLabel: "Стандарт (100×60 см)",
        price: 8500, img: "",
      },
      {
        id: "g002", number: "Г-002", name: "«Арка памяти»",
        shape: "arch", shapeLabel: "С аркой",
        color: "mix",  colorLabel: "Микс",
        size: "large", sizeLabel: "Большой (120×80 см)",
        price: 14000, img: "",
      },
      {
        id: "g003", number: "Г-003", name: "«Святой крест»",
        shape: "cross", shapeLabel: "Крест",
        color: "white", colorLabel: "Белый",
        size: "medium", sizeLabel: "Стандарт (90×60 см)",
        price: 11200, img: "",
      },
      {
        id: "g004", number: "Г-004", name: "«Бордо»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "burgundy",    colorLabel: "Бордовый",
        size: "large",        sizeLabel: "Большой (130×80 см)",
        price: 16500, img: "",
      },
      {
        id: "g005", number: "Г-005", name: "«Аркада роз»",
        shape: "arch", shapeLabel: "С аркой",
        color: "red",  colorLabel: "Красный",
        size: "xl",    sizeLabel: "Очень большой (150×100 см)",
        price: 22000, img: "",
      },
      {
        id: "g006", number: "Г-006", name: "«Нежность»",
        shape: "rectangular", shapeLabel: "Прямоугольная",
        color: "pink",        colorLabel: "Розовый",
        size: "medium",       sizeLabel: "Стандарт (100×65 см)",
        price: 9800, img: "",
      },
      {
        id: "g007", number: "Г-007", name: "«Золотое сечение»",
        shape: "cross",  shapeLabel: "Крест",
        color: "yellow", colorLabel: "Жёлтый",
        size: "large",   sizeLabel: "Большой (110×75 см)",
        price: 13500, img: "",
      },
      {
        id: "g008", number: "Г-008", name: "«Великий покой»",
        shape: "arch",  shapeLabel: "С аркой",
        color: "white", colorLabel: "Белый",
        size: "xl",     sizeLabel: "Очень большой (160×120 см)",
        price: 26000, img: "",
      },
      {
        id: "g009", number: "Г-009", name: "«Траурный»",
        shape: "cross",    shapeLabel: "Крест",
        color: "burgundy", colorLabel: "Бордовый",
        size: "large",     sizeLabel: "Большой (115×80 см)",
        price: 17800, img: "",
      },
    ],
  },
};
