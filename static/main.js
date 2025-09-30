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
        "Чукотский автономный округ": "RUCHU"
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
            regionBody.innerHTML = "<p>Загрузка данных...</p>";

            panel.style.display = "flex";
            setTimeout(() => {
                panel.classList.add("open");
            }, 10);

            fetch(`/region/${codeInDb}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.drones || data.drones.length === 0) {
                        regionBody.innerHTML = "<p>Нет данных о полётах дронов в этом регионе.</p>";
                        return;
                    }

                    let html = `
                        <p class="mb-4 font-semibold text-blue-700">
                            Общее количество полётов: ${data.total_count.toLocaleString()}
                        </p>
                    `;

                    const listItems = data.drones.map(d => `
                        <li class="mb-3">
                            <b>Время вылета:</b> ${d.dep_time || "—"}<br>
                            <b>Время посадки:</b> ${d.arr_time || "—"}<br>
                            <b>Координаты вылета:</b> ${d.dep_point || "—"}<br>
                            <b>Координаты посадки:</b> ${d.arr_point || "—"}<br>
                            <b>Оператор:</b> ${d.operator || "—"}<br>
                            <b>Тип БВС:</b> ${d.aircraft_type || "—"}<br>
                            <b>Модель БВС:</b> ${d.aircraft_model || "—"}<br>
                            <b>Примечание:</b> ${d.remarks_raw || "—"}<br>
                            <b>Телефоны:</b> ${d.phones || "—"}<br>
                            <b>Район полетной информации:</b> ${d.source_center || "—"}
                        </li>
                    `).join("");

                    regionBody.innerHTML = html + `<ul class="list-disc pl-4">${listItems}</ul>`;
                })
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

        fetch("/flights/admin_regions_stats")
            .then(res => res.json())
            .then(regionStats => {
                chartsContainer.innerHTML = "";

                const mainChartDiv = document.createElement("div");
                mainChartDiv.className = "bg-white rounded-lg shadow-lg p-8";

                const mainTitle = document.createElement("h3");
                mainTitle.className = "text-2xl font-bold text-gray-800 mb-6 text-center";
                mainTitle.textContent = "Статистика по регионам";
                mainChartDiv.appendChild(mainTitle);

                const chartsGrid = document.createElement("div");
                chartsGrid.className = "grid grid-cols-1 gap-8";

                // График полётов
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

                // График часов
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

                // Подготавливаем данные
                const sortedData = regionStats.sort((a, b) => b.total_flights - a.total_flights);
                const sortedNames = sortedData.map(d => d.region);
                const sortedFlights = sortedData.map(d => d.total_flights);
                const sortedHours = sortedData.map(d => d.total_hours);

                // Анимация появления
                setTimeout(() => {
                    mainChartDiv.style.opacity = "0";
                    mainChartDiv.style.transform = "translateY(20px)";
                    mainChartDiv.style.transition = "all 0.6s ease";

                    setTimeout(() => {
                        mainChartDiv.style.opacity = "1";
                        mainChartDiv.style.transform = "translateY(0)";
                    }, 50);
                }, 100);

                // Создаем диаграммы
                setTimeout(() => {
                    // График полётов
                    new Chart(flightsCanvas.getContext("2d"), {
                        type: "bar",
                        data: {
                            labels: sortedNames,
                            datasets: [{
                                label: "Количество полётов",
                                data: sortedFlights,
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
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        title: function(context) {
                                            return context[0].label;
                                        },
                                        label: function(context) {
                                            const regionName = context.label;
                                            const dataIndex = sortedNames.indexOf(regionName);
                                            const exactValue = sortedFlights[dataIndex];
                                            return `Полётов: ${exactValue.toLocaleString()}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    type: 'logarithmic',
                                    min: 1,
                                    ticks: {
                                        callback: function(value) {
                                            return value.toLocaleString();
                                        }
                                    }
                                },
                                y: {
                                    ticks: {
                                        font: {
                                            size: 10
                                        }
                                    }
                                }
                            }
                        }
                    });

                    // График часов
                    new Chart(hoursCanvas.getContext("2d"), {
                        type: "bar",
                        data: {
                            labels: sortedNames,
                            datasets: [{
                                label: "Часы полёта",
                                data: sortedHours,
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
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        title: function(context) {
                                            return context[0].label;
                                        },
                                        label: function(context) {
                                            const regionName = context.label;
                                            const dataIndex = sortedNames.indexOf(regionName);
                                            const exactValue = sortedHours[dataIndex];
                                            return `Часов: ${exactValue.toLocaleString()}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    type: 'logarithmic',
                                    min: 0.1,
                                    ticks: {
                                        callback: function(value) {
                                            return value.toLocaleString();
                                        }
                                    }
                                },
                                y: {
                                    ticks: {
                                        font: {
                                            size: 10
                                        }
                                    }
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