// Проверка загрузки
console.log("✅ functions.js загружен успешно!");

// Глобальные переменные
let regionTitle, regionBody, panel;

function getRegionColor(count) {
    if (count > 10000) return "#0a0a5e";
    if (count > 5000) return "#1e3a8a";
    if (count > 2000) return "#2563eb";
    if (count > 1000) return "#3b82f6";
    if (count > 500) return "#60a5fa";
    if (count > 100) return "#93c5fd";
    if (count > 10) return "#bfdbfe";
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

    const colors = [];
    for (let i = 0; i < count; i++) {
        if (i < baseColors.length) {
            colors.push(baseColors[i]);
        } else {
            const hue = (i * 137.508) % 360;
            const saturation = 60 + (i % 3) * 10;
            const lightness = 50 + (i % 4) * 5;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
    }
    return colors;
}

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

    const uavSection = document.createElement("div");
    uavSection.id = "region-uav-section";
    uavSection.className = "region-uav-chart-section";
    uavSection.innerHTML = `
        <h4 class="region-chart-title">Топ 10 БВС в регионе</h4>
        <div class="region-chart-wrapper region-pie-wrapper">
            <canvas id="region-uav-chart"></canvas>
        </div>
    `;

    containerElement.appendChild(chartsContainer);
    containerElement.appendChild(uavSection);

    setTimeout(() => {
        const flightsCtx = document.getElementById("region-flights-chart");
        if (flightsCtx && typeof Chart !== 'undefined') {
            new Chart(flightsCtx.getContext("2d"), {
                type: "bar",
                data: {
                    labels: statsData.months,
                    datasets: [{
                        label: "Количество полётов",
                        data: statsData.flights,
                        backgroundColor: "rgba(59, 130, 246, 1)",
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
                                label: (ctx) => `Полётов: ${ctx.raw.toLocaleString()}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: "#f3f4f6" },
                            ticks: {
                                color: "#6b7280",
                                callback: value => value.toLocaleString()
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: "#6b7280" }
                        }
                    }
                }
            });
        }
    }, 100);

    setTimeout(() => {
        const hoursCtx = document.getElementById("region-hours-chart");
        if (hoursCtx && typeof Chart !== 'undefined') {
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
                            grid: { color: "#f3f4f6" },
                            ticks: {
                                color: "#6b7280",
                                callback: value => value.toLocaleString()
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: "#6b7280" }
                        }
                    }
                }
            });
        }
    }, 200);

    setTimeout(() => {
        const uavCtx = document.getElementById("region-uav-chart");
        if (uavCtx && uavData.length > 0 && typeof Chart !== 'undefined') {
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
                            labels: {
                                usePointStyle: true,
                                font: { size: 10 },
                                padding: 8,
                                generateLabels: function (chart) {
                                    const data = chart.data.datasets[0].data;
                                    const total = data.reduce((sum, val) => sum + val, 0);
                                    return chart.data.labels.map((label, i) => ({
                                        text: `${label} (${data[i]} - ${((data[i] / total) * 100).toFixed(1)}%)`,
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
                                title: (tooltipItems) => tooltipItems[0].label,
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
                    }
                }
            });
        } else if (uavCtx) {
            const noDataMsg = document.createElement("div");
            noDataMsg.className = "no-uav-data";
            noDataMsg.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <p>📊 Нет данных о БВС для этого региона</p>
                </div>
            `;
            uavCtx.parentElement.appendChild(noDataMsg);
            uavCtx.style.display = 'none';
        }
    }, 300);
}

function loadRegionData(regionName, codeInDb) {
    if (!regionTitle || !regionBody || !panel) {
        console.error("Глобальные переменные не инициализированы!");
        return;
    }

    regionTitle.textContent = regionName;
    regionBody.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Загрузка данных...</p>
        </div>
    `;

    panel.style.display = "flex";
    setTimeout(() => panel.classList.add("open"), 10);

    Promise.all([
        fetch(`/region/${codeInDb}`).then(res => res.json()),
        fetch(`/region/${codeInDb}/monthly_stats`).then(res => res.json()),
        fetch(`/region/${codeInDb}/top-uav-types`).then(res => res.json()),
        fetch(`/region/${codeInDb}/top-operators`).then(res => res.json())
    ])
        .then(([flightsData, monthlyStats, uavData, operatorsData]) => {
            regionBody.innerHTML = "";

            if (monthlyStats && !monthlyStats.error) {
                createRegionCharts(monthlyStats, uavData || [], regionBody);
            }

            const mainContainer = document.createElement("div");
            mainContainer.className = "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6";

            const uavWrapper = document.createElement("div");
            uavWrapper.className = "space-y-4";
            const uavSection = regionBody.querySelector("#region-uav-section");
            if (uavSection) {
                uavWrapper.appendChild(uavSection);
            }

            const mapWrapper = document.createElement("div");
            mapWrapper.className = "region-map-column";
            mapWrapper.innerHTML = `
                <div id="region-map-container" class="bg-white p-4 rounded-lg shadow">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-gray-800">Карта полётов</h3>
                    </div>
                    <div id="region-leaflet-map" style="height: 350px; border-radius: 6px;"></div>
                </div>
            `;

            const statsColumn = document.createElement("div");
            statsColumn.id = "region-stats-summary";
            statsColumn.className = "space-y-4";

            if (operatorsData && operatorsData.length > 0) {
                const operatorsSection = document.createElement("div");
                operatorsSection.className = "bg-white rounded-lg shadow-lg p-6";
                operatorsSection.innerHTML = `
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Топ 5 операторов БВС</h3>
                    <div class="space-y-3" id="operators-list"></div>
                `;
                statsColumn.appendChild(operatorsSection);

                setTimeout(() => {
                    const operatorsList = operatorsSection.querySelector('#operators-list');
                    if (operatorsList) {
                        operatorsData.forEach((operator, index) => {
                            const badgeColors = ['#fbbf24', '#9ca3af', '#cd7f32', '#6b7280', '#6b7280'];
                            const badgeColor = badgeColors[index] || '#6b7280';

                            const operatorItem = document.createElement('div');
                            operatorItem.className = 'operator-item';
                            operatorItem.innerHTML = `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200">
                                    <div class="flex items-center gap-3 flex-1 min-w-0">
                                        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" 
                                            style="background-color: ${badgeColor};">
                                            ${index + 1}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-semibold text-gray-800 truncate" title="${operator.operator}">
                                                ${operator.operator}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex-shrink-0 ml-3">
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            ${operator.flights_count.toLocaleString()} полётов
                                        </span>
                                    </div>
                                </div>
                            `;
                            operatorsList.appendChild(operatorItem);
                        });
                    }
                }, 100);
            } else {
                const noOperatorsMsg = document.createElement("div");
                noOperatorsMsg.className = "bg-white rounded-lg shadow-lg p-6";
                noOperatorsMsg.innerHTML = `
                    <div class="text-center text-gray-500">
                        <p class="text-lg mb-2">👥</p>
                        <p>Нет данных об операторах для этого региона</p>
                    </div>
                `;
                statsColumn.appendChild(noOperatorsMsg);
            }

            mainContainer.appendChild(uavWrapper);
            mainContainer.appendChild(mapWrapper);
            mainContainer.appendChild(statsColumn);
            regionBody.appendChild(mainContainer);

            loadRegionMap(codeInDb);
        })
        .catch(error => {
            console.error("Ошибка загрузки данных региона:", error);
            regionBody.innerHTML = `
                <div class="error-message">
                    <p>Ошибка при загрузке данных региона. Попробуйте позже.</p>
                </div>
            `;
        });
}

async function loadRegionMap(regionCode) {
    try {
        const response = await fetch(`/region/${regionCode}/geojson`);
        const data = await response.json();

        if (data.error) {
            console.error('Ошибка загрузки карты:', data.error);
            return;
        }

        const mapElement = document.getElementById('region-leaflet-map');
        if (!mapElement || typeof L === 'undefined') return;

        if (window.currentRegionMap) {
            window.currentRegionMap.remove();
        }

        const leafletMap = L.map('region-leaflet-map', {
            zoomControl: true,
            dragging: true,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            attributionControl: false
        });

        window.currentRegionMap = leafletMap;
        mapElement.style.backgroundColor = '#ffffff';

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

            leafletMap.fitBounds(regionLayer.getBounds().pad(0.1));
        }

        if (data.flights && Array.isArray(data.flights)) {
            data.flights.forEach(flight => {
                if (flight.dep) {
                    try {
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
                                <b>SID:</b> ${flight.sid || 'N/A'}<br>
                                <b>Оператор:</b> ${flight.operator || 'Не указан'}<br>
                                <b>Модель:</b> ${flight.model || 'Не указана'}<br>
                                <b>Тип:</b> Вылет
                            `)
                            .addTo(leafletMap);
                    } catch (e) {
                        console.error('Ошибка парсинга координат вылета:', e);
                    }
                }

                if (flight.arr) {
                    try {
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
                                <b>SID:</b> ${flight.sid || 'N/A'}<br>
                                <b>Оператор:</b> ${flight.operator || 'Не указан'}<br>
                                <b>Модель:</b> ${flight.model || 'Не указана'}<br>
                                <b>Тип:</b> Прилёт
                            `)
                            .addTo(leafletMap);
                    } catch (e) {
                        console.error('Ошибка парсинга координат прилёта:', e);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки карты региона:', error);
    }
}

function loadRegionCharts() {
    const chartsContainer = document.getElementById('charts-content');
    if (!chartsContainer) {
        console.error("Элемент #charts-content не найден");
        return;
    }

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

            const sortedFlightsData = flightsStats.sort((a, b) => b.total_flights - a.total_flights);
            const flightsNames = sortedFlightsData.map(d => d.region);
            const flightsCounts = sortedFlightsData.map(d => d.total_flights);

            const sortedHoursData = hoursStats.sort((a, b) => b.total_hours - a.total_hours);
            const hoursNames = sortedHoursData.map(d => d.region);
            const hoursCounts = sortedHoursData.map(d => d.total_hours);

            setTimeout(() => {
                mainChartDiv.style.opacity = "0";
                mainChartDiv.style.transform = "translateY(20px)";
                mainChartDiv.style.transition = "all 0.6s ease";

                setTimeout(() => {
                    mainChartDiv.style.opacity = "1";
                    mainChartDiv.style.transform = "translateY(0)";
                }, 50);
            }, 100);

            setTimeout(() => {
                if (typeof Chart !== 'undefined') {
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
                }
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

console.log("✅ Все функции из functions.js загружены!");