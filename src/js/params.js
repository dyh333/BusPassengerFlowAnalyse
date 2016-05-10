//all params used
var params = {
    days: [
        { num: 1, cn: "周一", en: "Mon" },
        { num: 2, cn: "周二", en: "Tue" },
        { num: 3, cn: "周三", en: "Wed" },
        { num: 4, cn: "周四", en: "Thu" },
        { num: 5, cn: "周五", en: "Fri" },
        { num: 6, cn: "周六", en: "Sat" },
        { num: 0, cn: "周日", en: "Sun" }
    ],
    months: [
        { days: 31, short: { cn: "1", en: "Jan"}, long: { cn: "一月", en: "Jan"} },
        { days: 28, short: { cn: "2", en: "Feb"}, long: { cn: "二月", en: "February"} },
        { days: 31, short: { cn: "3", en: "Mar"}, long: { cn: "三月", en: "March"} },
        { days: 30, short: { cn: "4", en: "Apr"}, long: { cn: "四月", en: "April"} },
        { days: 31, short: { cn: "5", en: "May"}, long: { cn: "五月", en: "May"} },
        { days: 30, short: { cn: "6", en: "Jun"}, long: { cn: "六月", en: "June"} },
        { days: 31, short: { cn: "7", en: "Jul"}, long: { cn: "七月", en: "July"} },
        { days: 31, short: { cn: "8", en: "Aug"}, long: { cn: "八月", en: "August"} },
        { days: 30, short: { cn: "9", en: "Sep"}, long: { cn: "九月", en: "September"} },
        { days: 31, short: { cn: "10", en: "Oct"}, long: { cn: "十月", en: "October"} },
        { days: 30, short: { cn: "11", en: "Nov"}, long: { cn: "十一月", en: "November"} },
        { days: 31, short: { cn: "12", en: "Dec"}, long: { cn: "十二月", en: "December"} }
    ],
    colors: {
        base: "#00eeec",
        negative: "#FFFF00",
        selected: "#FFFFFF",
        route: "#FFFFFF",
        months: [
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#10E0A1", //june
            "#F8E71C", //july
            "#C979D9", //august
            "#C979D9", //september
            "#C979D9", //october
            "#C979D9", //november
            "#FFFFFF" //december
        ],
        background: "#444444",
        hot: "#BD3535",
        warm: "#CC7832",
        normal: "#CDA86A",
        chilly: "#64A2A2",
        cold: "#7587A6",
        darkbg: "#222222"
    },
    labels: {
        docTitle: { ru: "Статистика поездок на Велобайках по Москве. Статистика велопрокатов в Москве за 2014", en: "Bike share stats in Moscow, season 2014"},
        menuRoutes: { ru: "Маршруты", en: "Routes" },
        menuHeatmap: { ru: "Активность", en: "Activity" },
        menuCalendar: { ru: "Календарь", en: "Timeline" },
        menuAbout: { ru: "О проекте", en: "About" },
        hcDays: { ru: "Дни", en: "Days" },
        hcHours: { ru: "Часы", en: "Hours" },
        activity: { ru: "Активность за день", en: "Activity per day"},
        temperature: { ru: "Температура воздуха,°C", en: "Temperature,°C"},
        rain: { ru: "Дождь", en: "Rain"},
        rentsPerHour: { ru: "в час", en: "rides per hour"},
        rentsPerDay: { ru: "в день", en: "per day"},
        switchLang: { ru: "in English", en: "По-русски" },
        switchLangShort: { ru: "En", en: "Рус" },
        about: { ru: "О проекте", en: "About" },
        loaderWelcome: { ru: "Поездки на Велобайках в Москве", en: "Bike shares in Moscow"},
        loaderWelcome2: { ru: "Stats c 9 июня по 11 ноября 2014", en: "Stats from 9 June to 11 November 2014"},
        stateLoading: { ru: "Загружаем данные", en: "Loading data" },
        stateAnalyzing: { ru: "Анализируем", en: "Analyzing data" },
        stateMapping: { ru: "Добавляем на карту", en: "Adding data on map" },
        stateDone: { ru: "Готово!", en: "Done" },
        roundtrip: { ru: "Возврат на ту же станцию", en: "Return at the same station"},
        totalTrips: { ru: "всего", en: "total"},
        activitiesByDay: { ru: "Активность станции по дням", en: "Station activity by days"},
        activitiesByHour: { ru: "Активность станции по часам", en: "Station activity by hours"},
        baseDirections: { ru: "Основные направления", en: "Base directions"},
        totalHeatmap: { ru: "Всего", en: "Total"},
        since: { ru: "c ", en: "since " },
        rides: {ru: "поездок", en: "rides"},
        rides1: {ru: "поездкa", en: "ride"},
        rides2: {ru: "поездки", en: "rides"}
    }
};