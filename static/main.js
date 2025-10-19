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


       // Создаём контейнер под картой
    // === Блок фильтров под картой (поиск + календарь) ===

        // === Контейнер под картой ===

    const mapContainer = document.getElementById("regions-charts");
    //const chartsContainer = document.getElementById("regions-charts");
    const filtersContainer = document.createElement("div");
    filtersContainer.className = "filters-container";
    filtersContainer.innerHTML = `
      <div class="filters-bar">
        <!-- Поиск -->
        <div class="search-block relative">
          <input
            type="text"
            id="region-search-input"
            placeholder="Введите название региона..."
            class="region-search-input"
            autocomplete="off"
          />
          <ul id="region-suggestions" class="region-suggestions"></ul>
        </div>

        <!-- Даты -->
        <div class="date-filters">
          <label>От:
            <input type="date" id="start-date" class="date-input" />
          </label>
          <label>До:
            <input type="date" id="end-date" class="date-input" />
          </label>
        </div>

        <!-- Кнопка -->
        <button id="apply-filters" class="filter-button">Применить</button>
      </div>
    `;

    mapContainer.parentElement.insertBefore(filtersContainer, mapContainer);


    // === Стили (можно потом вынести в CSS) ===
    const style = document.createElement("style");
    style.textContent = `
      .filters-container {
        width: 100%;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        padding: 18px 22px;
        margin-top: 18px;
      }

      .filters-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 18px;
      }

      .search-block {
        flex: 1;
        min-width: 320px;
      }

      .region-search-input {
        width: 100%;
        font-size: 16px;
        padding: 12px 14px;
        border: 1px solid #ccc;
        border-radius: 8px;
      }

      .region-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        list-style: none;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin-top: 4px;
        padding: 0;
        max-height: 240px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
      }

      .region-suggestions li {
        padding: 10px 14px;
        cursor: pointer;
      }

      .region-suggestions li:hover {
        background-color: #f0f4ff;
      }

      .date-filters {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: nowrap;
      }

      .date-input {
        font-size: 15px;
        padding: 9px 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
      }

      .filter-button {
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 18px;
        font-size: 16px;
        cursor: pointer;
        transition: 0.2s;
      }

      .filter-button:hover {
        background-color: #0066d6;
      }
    `;
    document.head.appendChild(style);

    // === Логика ===
    const searchInput = document.getElementById("region-search-input");
    const suggestionsList = document.getElementById("region-suggestions");
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const applyButton = document.getElementById("apply-filters");

    const regionsList = Object.keys(regionMap).sort((a, b) => a.localeCompare(b, "ru"));

    // --- Поиск с подсказками ---
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      suggestionsList.innerHTML = "";

      if (query.length < 2) {
        suggestionsList.style.display = "none";
        return;
      }

      const matches = regionsList.filter(region =>
        region.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        suggestionsList.style.display = "none";
        return;
      }

      matches.forEach(regionName => {
        const li = document.createElement("li");
        li.textContent = regionName;
        li.addEventListener("click", () => {
          searchInput.value = regionName;
          suggestionsList.style.display = "none";
        });
        suggestionsList.appendChild(li);
      });

      suggestionsList.style.display = "block";
    });

    // --- Скрытие при клике вне подсказок ---
    document.addEventListener("click", (e) => {
      if (!filtersContainer.contains(e.target)) {
        suggestionsList.style.display = "none";
      }
    });

    // --- Кнопка "Применить" ---
    applyButton.addEventListener("click", () => {
      const regionName = searchInput.value.trim();
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (!regionMap[regionName]) {
        alert("Выберите корректный регион.");
        return;
      }

      if (startDate && endDate && startDate > endDate) {
        alert("Дата начала не может быть позже даты конца.");
        return;
      }

      console.log("▶ Применён фильтр:", { regionName, startDate, endDate });
      loadRegionData(regionName, regionMap[regionName]); // ✅ используем старую рабочую функцию
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