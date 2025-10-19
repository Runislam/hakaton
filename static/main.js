console.log("✅ main.js загружен!");
console.log("Функция getRegionColor доступна:", typeof getRegionColor);

document.addEventListener("DOMContentLoaded", () => {
    const map = document.querySelector(".rf-map");
    const regions = map.querySelectorAll("[data-code]");

    const regionMap = {
        "Московская область": "RUMOW",
        "Москва": "RUMOS",
        "Санкт-Петербург": "RUSPE",
        "Ленинградская область": "RULEN",
        "Республика Коми": "RUKO",
        "Республика Татарстан": "RUTA",
        "Республика Башкортостан": "RUBA",
        "Республика Саха (Якутия)": "RUSA",
        "Краснодарский край": "RUKDA",
        "Красноярский край": "RUKYA",
        "Ставропольский край": "RUSTA",
        "Приморский край": "RUPRI",
        "Хабаровский край": "RUKHA",
        "Амурская область": "RUAMU",
        "Архангельская область": "RUARK",
        "Астраханская область": "RUAST",
        "Белгородская область": "RUBEL",
        "Брянская область": "RUBRY",
        "Владимирская область": "RUVLA",
        "Волгоградская область": "RUVGG",
        "Вологодская область": "RUVLG",
        "Воронежская область": "RUVOR",
        "Ивановская область": "RUIVA",
        "Иркутская область": "RUIRK",
        "Калининградская область": "RUKGD",
        "Калужская область": "RUKLU",
        "Камчатский край": "RUKAM",
        "Кемеровская область": "RUKEM",
        "Кировская область": "RUKIR",
        "Костромская область": "RUKOS",
        "Курганская область": "RUKGN",
        "Курская область": "RUKRS",
        "Липецкая область": "RULIP",
        "Магаданская область": "RUMAG",
        "Мурманская область": "RUMUR",
        "Нижегородская область": "RUNIZ",
        "Новгородская область": "RUNGR",
        "Новосибирская область": "RUNVS",
        "Омская область": "RUOMS",
        "Оренбургская область": "RUORE",
        "Орловская область": "RUORL",
        "Пензенская область": "RUPNZ",
        "Пермский край": "RUPER",
        "Псковская область": "RUPSK",
        "Ростовская область": "RUROS",
        "Рязанская область": "RURYA",
        "Самарская область": "RUSAM",
        "Саратовская область": "RUSAR",
        "Сахалинская область": "RUSAK",
        "Свердловская область": "RUSVE",
        "Смоленская область": "RUSMO",
        "Тамбовская область": "RUTAM",
        "Тверская область": "RUTVE",
        "Томская область": "RUTOM",
        "Тульская область": "RUTUL",
        "Тюменская область": "RUTYU",
        "Ульяновская область": "RUULY",
        "Челябинская область": "RUCHE",
        "Забайкальский край": "RUZAB",
        "Ярославская область": "RUYAR",
        "Республика Алтай": "RUAL",
        "Республика Бурятия": "RUBU",
        "Республика Дагестан": "RUDA",
        "Республика Ингушетия": "RUIN",
        "Республика Калмыкия": "RUKL",
        "Карачаево-Черкесская Республика": "RUKC",
        "Республика Карелия": "RUKR",
        "Кабардино-Балкарская Республика": "RUKB",
        "Республика Мордовия": "RUMO",
        "Республика Северная Осетия — Алания": "RUSE",
        "Республика Тыва": "RUTY",
        "Республика Хакасия": "RUKK",
        "Республика Крым": "RUCR",
        "Республика Адыгея": "RUAD",
        "Чеченская Республика": "RUCE",
        "Чувашская Республика": "RUCU",
        "Удмуртская Республика": "RUUD",
        "Республика Марий Эл": "RUME",
        "Еврейская автономная область": "RUYEV",
        "Ненецкий автономный округ": "RUNEN",
        "Ханты-Мансийский автономный округ — Югра": "RUKHM",
        "Ямало-Ненецкий автономный округ": "RUYAN",
        "Чукотский автономный округ": "RUCHU",
        "Запорожская область": "RUZP",
        "Алтайский край": "RUALT",
        "Донецкая Народная Республика": "RUDON",
        "Луганская Народная Республика": "RULUG",
        "Херсонская область": "RUHR",
        "Севастополь": "RUSV"
    };

    // Создаём модальное окно
    panel = document.createElement("div");
    panel.className = "region-modal";
    panel.id = "region-info-panel";
    panel.style.display = "none";
    panel.innerHTML = `
        <div class="region-modal-backdrop"></div>
        <div class="region-modal-content">
            <div class="region-modal-header">
                <h2 id="region-title"></h2>
                <span class="region-close">&times;</span>
            </div>
            <div class="region-modal-body" id="region-body"></div>
        </div>
    `;

    document.body.appendChild(panel);

    // Инициализируем глобальные переменные для functions.js
    regionTitle = panel.querySelector("#region-title");
    regionBody = panel.querySelector("#region-body");
    const closeBtn = panel.querySelector(".region-close");

    // Создаём тултип
    const tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);

    // Создаём контейнер списка регионов
    const regionsListContainer = document.createElement("div");
    regionsListContainer.className = "regions-list-container";
    regionsListContainer.innerHTML = `
        <div class="regions-list-toggle" id="regions-list-toggle">
            <span id="regions-toggle-text">Показать список регионов</span>
            <span id="regions-toggle-arrow" class="toggle-arrow">▼</span>
        </div>
        <div class="regions-list-content" id="regions-list-content" style="display: none;">
            <div class="regions-list-grid" id="regions-list-grid"></div>
        </div>
    `;

    map.parentElement.insertBefore(regionsListContainer, map.nextSibling);

    // Генерируем список регионов
    const regionsList = Object.keys(regionMap).sort((a, b) => a.localeCompare(b, 'ru'));
    const regionsListGrid = document.getElementById("regions-list-grid");

    regionsList.forEach(regionName => {
        const regionItem = document.createElement("div");
        regionItem.className = "region-list-item";
        regionItem.textContent = regionName;
        regionItem.dataset.code = regionMap[regionName];

        regionItem.addEventListener("click", () => {
            loadRegionData(regionName, regionMap[regionName]);
        });

        regionsListGrid.appendChild(regionItem);
    });

    // Переключатель списка регионов
    const regionsListToggle = document.getElementById("regions-list-toggle");
    const regionsListContent = document.getElementById("regions-list-content");
    const regionsToggleText = document.getElementById("regions-toggle-text");
    const regionsToggleArrow = document.getElementById("regions-toggle-arrow");

    let regionsListVisible = false;

    regionsListToggle.addEventListener("click", () => {
        regionsListVisible = !regionsListVisible;
        regionsListContent.style.display = regionsListVisible ? "block" : "none";
        regionsToggleText.textContent = regionsListVisible ? "Скрыть список регионов" : "Показать список регионов";
        regionsToggleArrow.style.transform = regionsListVisible ? "rotate(180deg)" : "rotate(0deg)";
    });

    // Загружаем общую статистику
    fetch("/flights/stats")
        .then(res => res.json())
        .then(stats => {
            const totalFlights = document.getElementById("total-flights");
            const totalHours = document.getElementById("total-hours");
            const avgTime = document.getElementById("avg-time");
            const avgFlightsDay = document.getElementById("avg-flights-day");

            if (totalFlights) totalFlights.textContent = stats.total_flights.toLocaleString();
            if (totalHours) totalHours.textContent = stats.total_hours.toLocaleString();
            if (avgTime) avgTime.textContent = stats.avg_minutes;
            if (avgFlightsDay) avgFlightsDay.textContent = stats.avg_flights_per_day;
        })
        .catch(err => {
            console.error("Ошибка загрузки статистики:", err);
        });

    // Загружаем счётчики для регионов
    fetch("/flights/counts")
        .then(res => res.json())
        .then(countData => {
            regions.forEach(region => {
                const title = region.getAttribute("data-title");
                const codeInDb = regionMap[title];
                if (codeInDb && countData[codeInDb] !== undefined) {
                    const count = countData[codeInDb];
                    region.style.fill = getRegionColor(count);
                }
            });
        })
        .catch(err => {
            console.error("Ошибка загрузки счётчиков регионов:", err);
        });

    // Обработчики событий для регионов на карте
    regions.forEach(region => {
        const title = region.getAttribute("data-title");
        const code = region.getAttribute("data-code");

        region.addEventListener("mouseenter", (e) => {
            region.classList.add("region-hover");
            tooltip.innerHTML = `
                <h3 class="font-bold text-blue-600 mb-1">${title}</h3>
                <p class="text-sm text-gray-600">Код: ${code}</p>
                <p class="text-xs text-gray-500 mt-1">Нажмите для подробной информации</p>
            `;
            tooltip.style.opacity = "1";
            tooltip.style.left = e.pageX + 15 + "px";
            tooltip.style.top = e.pageY + 15 + "px";
        });

        region.addEventListener("mouseleave", () => {
            region.classList.remove("region-hover");
            tooltip.style.opacity = "0";
        });

        region.addEventListener("click", () => {
            const codeInDb = regionMap[title];
            if (codeInDb) {
                loadRegionData(title, codeInDb);
            }
        });
    });

    // Секция графиков по регионам
    const container = document.getElementById("regions-charts");
    if (container) {
        const toggleButton = document.createElement("div");
        toggleButton.className = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg cursor-pointer transition-all duration-300 text-center mb-6";
        toggleButton.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <span id="charts-toggle-text">📊 Показать статистику по регионам</span>
                <span id="charts-toggle-arrow" class="transform transition-transform duration-300">▼</span>
            </div>
        `;

        const chartsContainer = document.createElement("div");
        chartsContainer.id = "charts-content";
        chartsContainer.style.display = "none";
        chartsContainer.className = "space-y-6 transition-all duration-500";

        container.appendChild(toggleButton);
        container.appendChild(chartsContainer);

        let chartsLoaded = false;
        let chartsVisible = false;

        toggleButton.addEventListener("click", () => {
            const toggleText = document.getElementById("charts-toggle-text");
            const toggleArrow = document.getElementById("charts-toggle-arrow");

            chartsVisible = !chartsVisible;

            if (chartsVisible) {
                chartsContainer.style.display = "block";
                toggleText.textContent = "📊 Скрыть статистику по регионам";
                toggleArrow.style.transform = "rotate(180deg)";

                setTimeout(() => {
                    smoothScrollTo(chartsContainer, 600);
                }, 100);

                if (!chartsLoaded) {
                    loadRegionCharts();
                    chartsLoaded = true;
                }
            } else {
                chartsContainer.style.display = "none";
                toggleText.textContent = "📊 Показать статистику по регионам";
                toggleArrow.style.transform = "rotate(0deg)";
            }
        });
    }

    // Обработчик закрытия модального окна
    closeBtn.addEventListener("click", () => {
        panel.classList.remove("open");
        setTimeout(() => {
            panel.style.display = "none";
        }, 300);
        regions.forEach(r => r.classList.remove("region-active"));
    });

    // Закрытие по клику на фон
    panel.addEventListener("click", (e) => {
        if (e.target.classList.contains("region-modal-backdrop")) {
            closeBtn.click();
        }
    });

    // Закрытие по Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && panel.style.display === "flex") {
            closeBtn.click();
        }
    });

    // Следование тултипа за курсором
    document.addEventListener("mousemove", e => {
        if (tooltip.style.opacity === "1") {
            tooltip.style.left = e.pageX + 15 + "px";
            tooltip.style.top = e.pageY + 15 + "px";
        }
    });
});