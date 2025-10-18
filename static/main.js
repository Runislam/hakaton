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


    const panel = document.createElement("div");
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

    const regionTitle = panel.querySelector("#region-title");
    const regionBody = panel.querySelector("#region-body");
    const closeBtn = panel.querySelector(".region-close");

    const tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);

    function getRegionColor(count) {
        if (count > 10000) return "#0a0a5e";
        if (count > 5000)  return "#1e3a8a";
        if (count > 2000)  return "#2563eb";
        if (count > 1000)  return "#3b82f6";
        if (count > 500)   return "#60a5fa";
        if (count > 100)   return "#93c5fd";
        if (count > 10)    return "#bfdbfe";
        return "#e0f2fe";
    }

    function smoothScrollTo(element, duration = 800) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    function generatePieColors(count) {
        const baseColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
            '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6', '#34495E',
            '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#C0392B',
            '#D35400', '#7F8C8D', '#BDC3C7', '#F1C40F', '#E8DAEF'
        ];

        // Расширяем палитру
        const colors = [];
        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                // Генерируем дополнительные цвета с вариацией насыщенности и яркости
                const hue = (i * 137.508) % 360;
                const saturation = 60 + (i % 3) * 10;
                const lightness = 50 + (i % 4) * 5;
                colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
            }
        }
        return colors;
    }

    // Создание диаграмм для региона
    function createRegionCharts(statsData, uavData, containerElement) {
        const chartsContainer = document.createElement("div");
        chartsContainer.className = "region-charts-container";
        chartsContainer.innerHTML = `
            <div class="region-charts-grid">
                <div class="region-chart-item">
                    <h4 class="region-chart-title">Количество полётов по месяцам</h4>
                    <div class="region-chart-wrapper">
                        <canvas id="region-flights-chart"></canvas>
                    </div>
                </div>
                <div class="region-chart-item">
                    <h4 class="region-chart-title">Часы полётов по месяцам</h4>
                    <div class="region-chart-wrapper">
                        <canvas id="region-hours-chart"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Нижняя часть: слева — только блок с БВС, справа — карта
        const bottomGrid = document.createElement("div");
        bottomGrid.className = "region-bottom-grid";

        // Левая колонка: только раздел UAV (убрана region-stats-summary)
        const leftCol = document.createElement("div");
        leftCol.className = "region-uav-col";
        leftCol.innerHTML = `
            <div class="region-uav-chart-section">
                <h4 class="region-chart-title">Топ 10 БВС в регионе</h4>
                <div class="region-chart-wrapper region-pie-wrapper">
                    <canvas id="region-uav-chart"></canvas>
                </div>
            </div>
        `;

        // Правая колонка: контейнер карты
        const rightCol = document.createElement("div");
        rightCol.className = "region-map-column";
        rightCol.innerHTML = `
            <div id="region-map-container" class="bg-white p-4 rounded-lg shadow">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800">Карта полётов</h3>
                </div>
                <div id="region-leaflet-map" style="height: 350px; border-radius: 6px;"></div>
                <div class="mt-2 text-xs text-gray-500">
                    Последние полёты по региону (до 1000 записей)
                </div>
            </div>
        `;

        bottomGrid.appendChild(leftCol);
        bottomGrid.appendChild(rightCol);

        containerElement.appendChild(chartsContainer);
        containerElement.appendChild(bottomGrid);

        // Создание диаграммы полётов
        setTimeout(() => {
            const flightsCtx = document.getElementById("region-flights-chart");
            if (flightsCtx) {
                new Chart(flightsCtx.getContext("2d"), {
                    type: "bar",
                    data: {
                        labels: statsData.months,
                        datasets: [{
                            label: "Количество полётов",
                            data: statsData.flights,
                            backgroundColor: "rgba(59, 130, 246, 1)",
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: "rgba(59, 130, 246, 1)",
                            pointBorderColor: "#ffffff",
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                titleColor: "#374151",
                                bodyColor: "#6b7280",
                                cornerRadius: 8,
                                displayColors: false,
                                callbacks: {
                                    title: (ctx) => ctx[0].label,
                                    label: (ctx) => `Полётов: ${ctx.raw.toLocaleString()}`
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: "#f3f4f6"
                                },
                                ticks: {
                                    color: "#6b7280",
                                    callback: value => value.toLocaleString()
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: "#6b7280"
                                }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        }
                    }
                });
            }
        }, 100);

        // Создание диаграммы часов
        setTimeout(() => {
            const hoursCtx = document.getElementById("region-hours-chart");
            if (hoursCtx) {
                new Chart(hoursCtx.getContext("2d"), {
                    type: "bar",
                    data: {
                        labels: statsData.months,
                        datasets: [{
                            label: "Часы полёта",
                            data: statsData.hours,
                            backgroundColor: "rgba(16, 185, 129, 0.8)",
                            borderColor: "rgba(16, 185, 129, 1)",
                            borderWidth: 1,
                            borderRadius: 4,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                titleColor: "#374151",
                                bodyColor: "#6b7280",
                                cornerRadius: 8,
                                displayColors: false,
                                callbacks: {
                                    title: (ctx) => ctx[0].label,
                                    label: (ctx) => `Часов: ${ctx.raw.toLocaleString()}`
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: "#f3f4f6"
                                },
                                ticks: {
                                    color: "#6b7280",
                                    callback: value => value.toLocaleString()
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: "#6b7280"
                                }
                            }
                        }
                    }
                });
            }
        }, 200);

        // Создание круговой диаграммы БВС
        setTimeout(() => {
            const uavCtx = document.getElementById("region-uav-chart");
            if (uavCtx && uavData.length > 0) {
                const labels = uavData.map(item => item.uav_type);
                const data = uavData.map(item => item.count);
                const colors = generatePieColors(uavData.length);

                new Chart(uavCtx.getContext("2d"), {
                    type: "doughnut",
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            hoverBorderWidth: 3,
                            hoverBorderColor: '#ffffff',
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: '60%',
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right',
                                padding: 15,
                                labels: {
                                    usePointStyle: true,
                                    font: { size: 10 },
                                    padding: 8,
                                    generateLabels: function(chart) {
                                        const data = chart.data.datasets[0].data;
                                        const total = data.reduce((sum, val) => sum + val, 0);
                                        return chart.data.labels.map((label, i) => ({
                                            text: `${label} (${data[i]} - ${((data[i]/total)*100).toFixed(1)}%)`,
                                            fillStyle: chart.data.datasets[0].backgroundColor[i],
                                            strokeStyle: chart.data.datasets[0].backgroundColor[i],
                                            index: i
                                        }));
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                titleColor: "#374151",
                                bodyColor: "#6b7280",
                                borderColor: "#e5e7eb",
                                borderWidth: 1,
                                cornerRadius: 8,
                                displayColors: true,
                                callbacks: {
                                    title: (tooltipItems) => {
                                        return tooltipItems[0].label;
                                    },
                                    label: (context) => {
                                        const count = context.raw;
                                        const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                        const percentage = ((count / total) * 100).toFixed(1);
                                        return `Полётов: ${count.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        animation: {
                            animateRotate: true,
                            animateScale: true,
                            duration: 1000
                        },
                        interaction: {
                            intersect: false
                        }
                    }
                });
            } else if (uavCtx) {
                // Показываем сообщение, если нет данных о БВС
                const noDataMsg = document.createElement("div");
                noDataMsg.className = "no-uav-data";
                noDataMsg.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                        <p>📊 Нет данных о БВС для этого региона</p>
                        <p style="font-size: 0.9em; margin-top: 10px;">Возможно, отсутствует информация о моделях воздушных судов</p>
                    </div>
                `;
                uavCtx.parentElement.appendChild(noDataMsg);
                uavCtx.style.display = 'none';
            }
        }, 300);
    }

    // Создание списка регионов
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

    // Вставляем список после карты
    map.parentElement.insertBefore(regionsListContainer, map.nextSibling);

    // Генерируем список регионов в алфавитном порядке
    const regionsList = Object.keys(regionMap).sort((a, b) => a.localeCompare(b, 'ru'));
    const regionsListGrid = document.getElementById("regions-list-grid");

    regionsList.forEach(regionName => {
        const regionItem = document.createElement("div");
        regionItem.className = "region-list-item";
        regionItem.textContent = regionName;
        regionItem.dataset.code = regionMap[regionName];

        regionItem.addEventListener("click", () => {
            const codeInDb = regionMap[regionName];
            regionTitle.textContent = regionName;
            regionBody.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Загрузка данных...</p>
                </div>
            `;

            panel.style.display = "flex";
            setTimeout(() => {
                panel.classList.add("open");
            }, 10);

            Promise.all([
                fetch(`/region/${codeInDb}`).then(res => res.json()),
                fetch(`/region/${codeInDb}/monthly_stats`).then(res => res.json()),
                fetch(`/region/${codeInDb}/top-uav-types`).then(res => res.json())
            ])
            .then(([flightsData, monthlyStats, uavData]) => {
                regionBody.innerHTML = "";

                if (monthlyStats && !monthlyStats.error) {
                    createRegionCharts(monthlyStats, uavData || [], regionBody);
                }
            })
            .catch(error => {
                console.error("Ошибка загрузки данных региона:", error);
                regionBody.innerHTML = `
                    <div class="error-message">
                        <p>Ошибка при загрузке данных региона. Попробуйте позже.</p>
                    </div>
                `;
            });
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
        if (!regionsListVisible) {
            regionsListContent.style.display = "block";
            regionsToggleText.textContent = "Скрыть список регионов";
            regionsToggleArrow.style.transform = "rotate(180deg)";
            regionsListVisible = true;
        } else {
            regionsListContent.style.display = "none";
            regionsToggleText.textContent = "Показать список регионов";
            regionsToggleArrow.style.transform = "rotate(0deg)";
            regionsListVisible = false;
        }
    });

    fetch("/flights/stats")
        .then(res => res.json())
        .then(stats => {
            document.getElementById("total-flights").textContent = stats.total_flights.toLocaleString();
            document.getElementById("total-hours").textContent = stats.total_hours.toLocaleString();
            document.getElementById("avg-time").textContent = stats.avg_minutes;
            document.getElementById("avg-flights-day").textContent = stats.avg_flights_per_day;
        })
        .catch(err => {
            console.error("Ошибка загрузки статистики:", err);
        });

    fetch("/flights/counts")
        .then(res => res.json())
        .then(countData => {
            regions.forEach(region => {
                const title = region.getAttribute("data-title");
                const codeInDb = regionMap[title];
                const count = countData[codeInDb] || 0;
                region.style.fill = getRegionColor(count);
            });
        });

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
            regionTitle.textContent = title;
            regionBody.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Загрузка данных...</p>
                </div>
            `;

            panel.style.display = "flex";
            setTimeout(() => {
                panel.classList.add("open");
            }, 10);

            // Параллельная загрузка данных о полётах, месячной статистики и БВС
            Promise.all([
                fetch(`/region/${codeInDb}`).then(res => res.json()),
                fetch(`/region/${codeInDb}/monthly_stats`).then(res => res.json()),
                fetch(`/region/${codeInDb}/top-uav-types`).then(res => res.json())
            ])
            .then(([flightsData, monthlyStats, uavData]) => {
                regionBody.innerHTML = "";

                // Помещаем блок с графиками в верхнюю часть модального окна (растягивает на всю ширину)
                if (monthlyStats && !monthlyStats.error) {
                    createRegionCharts(monthlyStats, uavData || [], regionBody);
                }

                // Создаем основной контейнер с двумя колонками под дополнительную статистику/контент
                const mainContainer = document.createElement("div");
                mainContainer.className = "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6";

                // Левая колонка — дополнительная статистика / списки
                const statsColumn = document.createElement("div");
                statsColumn.id = "region-stats-summary";
                statsColumn.className = "space-y-4";

                // Правая колонка — оставляем как контейнер для дополнительного контента (без карты)
                const mapColumn = document.createElement("div");
                mapColumn.className = "space-y-4";

                mainContainer.appendChild(statsColumn);
                mainContainer.appendChild(mapColumn);

                // Вставляем основной контейнер под блоком графиков
                regionBody.appendChild(mainContainer);

                // (Удалена ручная вставка mapContainer — карта теперь создаётся внутри createRegionCharts
                //  и располагается справа от блока статистики под region-charts-grid)

                let leafletMap = null;

                // Автоматически загружаем карту (createRegionCharts уже добавил DOM-контейнер #region-leaflet-map)
                loadRegionMap(codeInDb);

                // Функция загрузки карты региона
                async function loadRegionMap(regionCode) {
                    try {
                        const response = await fetch(`/region/${regionCode}/geojson`);
                        const data = await response.json();

                        if (data.error) {
                            console.error('Ошибка загрузки карты:', data.error);
                            return;
                        }

                        // Инициализируем карту Leaflet
                        if (leafletMap) {
                            leafletMap.remove();
                        }

                        leafletMap = L.map('region-leaflet-map', {
                            zoomControl: true,
                            dragging: true,
                            scrollWheelZoom: false,
                            doubleClickZoom: false,
                            boxZoom: false,
                            keyboard: false,
                            tap: false,
                            touchZoom: false,
                            attributionControl: false
                        });

                        // Устанавливаем белый фон для карты без тайлов
                        const mapContainerEl = document.getElementById('region-leaflet-map');
                        if (mapContainerEl) {
                            mapContainerEl.style.backgroundColor = '#ffffff';
                        }

                        // Добавляем контур региона
                        if (data.region_geom) {
                            const regionGeom = JSON.parse(data.region_geom);
                            const regionLayer = L.geoJSON(regionGeom, {
                                style: {
                                    color: 'blue',
                                    weight: 2,
                                    fillColor: 'lightblue',
                                    fillOpacity: 0.2
                                }
                            }).addTo(leafletMap);

                            // Центруем карту по региону
                            leafletMap.fitBounds(regionLayer.getBounds().pad(0.1));
                        }

                        // Добавляем точки полётов
                        data.flights.forEach(flight => {
                            // Точки вылета
                            if (flight.dep) {
                                const depCoords = JSON.parse(flight.dep);
                                const lat = depCoords.coordinates[1];
                                const lon = depCoords.coordinates[0];

                                L.circleMarker([lat, lon], {
                                    color: '#ff001863',
                                    radius: 3,
                                    stroke: false,
                                    fillOpacity: 0.8
                                })
                                .bindPopup(`
                                    <b>SID:</b> ${flight.sid}<br>
                                    <b>Оператор:</b> ${flight.operator || 'Не указан'}<br>
                                    <b>Модель:</b> ${flight.model || 'Не указана'}<br>
                                    <b>Тип:</b> Вылет
                                `)
                                .addTo(leafletMap);
                            }

                            // Точки прилёта (красные)
                            if (flight.arr) {
                                const arrCoords = JSON.parse(flight.arr);
                                const lat = arrCoords.coordinates[1];
                                const lon = arrCoords.coordinates[0];

                                L.circleMarker([lat, lon], {
                                    color: '#ff001863',
                                    radius: 3,
                                    stroke: false,
                                    fillOpacity: 0.8
                                })
                                .bindPopup(`
                                    <b>SID:</b> ${flight.sid}<br>
                                    <b>Оператор:</b> ${flight.operator || 'Не указан'}<br>
                                    <b>Модель:</b> ${flight.model || 'Не указана'}<br>
                                    <b>Тип:</b> Прилёт
                                `)
                                .addTo(leafletMap);
                            }
                        });

                    } catch (error) {
                        console.error('Ошибка загрузки карты региона:', error);
                    }
                }

            })
            .catch(error => {
                console.error("Ошибка загрузки данных региона:", error);
                regionBody.innerHTML = `
                    <div class="error-message">
                        <p>Ошибка при загрузке данных региона. Попробуйте позже.</p>
                    </div>
                `;
            });
        });
    });

    const container = document.getElementById("regions-charts");

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

        if (!chartsVisible) {
            chartsContainer.style.display = "block";
            toggleText.textContent = "📊 Скрыть статистику по регионам";
            toggleArrow.style.transform = "rotate(180deg)";
            chartsVisible = true;

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
            chartsVisible = false;
        }
    });

    function loadRegionCharts() {
        chartsContainer.innerHTML = `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600">Загружаем статистику...</span>
            </div>
        `;

        Promise.all([
            fetch("/flights/admin_regions_flights").then(res => res.json()),
            fetch("/flights/admin_regions_hours").then(res => res.json())
        ])
        .then(([flightsStats, hoursStats]) => {
            chartsContainer.innerHTML = "";

            const mainChartDiv = document.createElement("div");
            mainChartDiv.className = "bg-white rounded-lg shadow-lg p-8";

            const mainTitle = document.createElement("h3");
            mainTitle.className = "text-2xl font-bold text-gray-800 mb-6 text-center";
            mainTitle.textContent = "Статистика по регионам";
            mainChartDiv.appendChild(mainTitle);

            const chartsGrid = document.createElement("div");
            chartsGrid.className = "grid grid-cols-1 gap-8";

            // --- СЕКЦИЯ ПОЛЁТОВ ---
            const flightsSection = document.createElement("div");
            flightsSection.className = "flex flex-col";

            const flightsTitle = document.createElement("h4");
            flightsTitle.className = "text-xl font-semibold text-blue-600 mb-4 text-center";
            flightsTitle.textContent = "Полёты по регионам";

            const flightsCanvas = document.createElement("canvas");
            flightsCanvas.id = "flights-chart";
            flightsCanvas.style.height = "1500px";

            flightsSection.appendChild(flightsTitle);
            flightsSection.appendChild(flightsCanvas);

            // --- СЕКЦИЯ ЧАСОВ ---
            const hoursSection = document.createElement("div");
            hoursSection.className = "flex flex-col";

            const hoursTitle = document.createElement("h4");
            hoursTitle.className = "text-xl font-semibold text-green-600 mb-4 text-center";
            hoursTitle.textContent = "Часы полётов по регионам";

            const hoursCanvas = document.createElement("canvas");
            hoursCanvas.id = "hours-chart";
            hoursCanvas.style.height = "1500px";

            hoursSection.appendChild(hoursTitle);
            hoursSection.appendChild(hoursCanvas);

            chartsGrid.appendChild(flightsSection);
            chartsGrid.appendChild(hoursSection);
            mainChartDiv.appendChild(chartsGrid);
            chartsContainer.appendChild(mainChartDiv);

            // --- ПОДГОТОВКА ДАННЫХ ---
            // Полёты
            const sortedFlightsData = flightsStats.sort((a, b) => b.total_flights - a.total_flights);
            const flightsNames = sortedFlightsData.map(d => d.region);
            const flightsCounts = sortedFlightsData.map(d => d.total_flights);

            // Часы
            const sortedHoursData = hoursStats.sort((a, b) => b.total_hours - a.total_hours);
            const hoursNames = sortedHoursData.map(d => d.region);
            const hoursCounts = sortedHoursData.map(d => d.total_hours);

            // --- Анимация появления ---
            setTimeout(() => {
                mainChartDiv.style.opacity = "0";
                mainChartDiv.style.transform = "translateY(20px)";
                mainChartDiv.style.transition = "all 0.6s ease";

                setTimeout(() => {
                    mainChartDiv.style.opacity = "1";
                    mainChartDiv.style.transform = "translateY(0)";
                }, 50);
            }, 100);

            // --- СОЗДАНИЕ ДИАГРАММ ---
            setTimeout(() => {
                // Диаграмма полётов
                new Chart(flightsCanvas.getContext("2d"), {
                    type: "bar",
                    data: {
                        labels: flightsNames,
                        datasets: [{
                            label: "Количество полётов",
                            data: flightsCounts,
                            backgroundColor: "#3b82f6",
                            borderColor: "#1e40af",
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: true,
                        barThickness: 10,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    title: ctx => ctx[0].label,
                                    label: ctx => `Полётов: ${ctx.raw.toLocaleString()}`
                                }
                            }
                        },
                        scales: {
                            x: {
                                type: 'logarithmic',
                                min: 1,
                                ticks: {
                                    callback: value => value.toLocaleString()
                                }
                            },
                            y: {
                                ticks: { font: { size: 10 } }
                            }
                        }
                    }
                });

                // Диаграмма часов
                new Chart(hoursCanvas.getContext("2d"), {
                    type: "bar",
                    data: {
                        labels: hoursNames,
                        datasets: [{
                            label: "Часы полёта",
                            data: hoursCounts,
                            backgroundColor: "#10b981",
                            borderColor: "#065f46",
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: true,
                        barThickness: 10,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    title: ctx => ctx[0].label,
                                    label: ctx => `Часов: ${ctx.raw.toLocaleString()}`
                                }
                            }
                        },
                        scales: {
                            x: {
                                type: 'logarithmic',
                                min: 0.1,
                                ticks: {
                                    callback: value => value.toLocaleString()
                                }
                            },
                            y: {
                                ticks: { font: { size: 10 } }
                            }
                        }
                    }
                });
            }, 400);
        })
        .catch(err => {
            console.error("Ошибка загрузки диаграмм:", err);
            chartsContainer.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p class="text-red-600">Ошибка при загрузке статистики по регионам</p>
                    <button onclick="location.reload()" class="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        Попробовать снова
                    </button>
                </div>
            `;
        });
    }

    closeBtn.addEventListener("click", () => {
        panel.classList.remove("open");
        setTimeout(() => {
            panel.style.display = "none";
        }, 300);
        regions.forEach(r => r.classList.remove("region-active"));
    });

    panel.addEventListener("click", (e) => {
        if (e.target.classList.contains("region-modal-backdrop")) {
            closeBtn.click();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && panel.style.display === "flex") {
            closeBtn.click();
        }
    });

    document.addEventListener("mousemove", e => {
        if (tooltip.style.opacity === "1") {
            tooltip.style.left = e.pageX + 15 + "px";
            tooltip.style.top = e.pageY + 15 + "px";
        }
    });
});