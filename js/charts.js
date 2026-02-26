// ==========================================
// ЛОГІКА ГРАФІКІВ (CHART.JS) - МАСШТАБОВАНА ВЕРСІЯ
// ==========================================

const crosshairPlugin = {
    id: 'crosshair',
    afterDraw: (chart) => {
        if (chart.tooltip?._active?.length) {
            const activePoint = chart.tooltip._active[0];
            const ctx = chart.ctx;
            const x = activePoint.element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
        }
    }
};

// 1. УНІВЕРСАЛЬНА ФУНКЦІЯ МАТЕМАТИКИ (Підходить для будь-якої хімії)
function generateChargeCurve(maxCurrent, cutoffCurrent, ccDuration, tau, maxHours) {
    let data = [];
    let ah = 0; 
    let prev_t = 0; 
    let prev_i = maxCurrent;
    let end_minute = Math.round(maxHours * 60);
    
    for (let m = 0; m <= end_minute; m++) {
        let t = m / 60;
        let i = maxCurrent;
        
        // Експоненційний спад (фаза CV)
        if (t > ccDuration) {
            i = maxCurrent * Math.exp(-(t - ccDuration) / tau);
        }
        
        // Обрив лінії при падінні струму нижче ліміту
        if (i < cutoffCurrent) break;

        // Інтеграція: рахуємо накопичену ємність (Аг)
        let dt = t - prev_t;
        if (dt > 0) ah += (prev_i + i) / 2 * dt;

        let clean_x = Math.round(t * 10000) / 10000;
        let soc = Math.min(100, Math.round(ah)); // Обмежуємо на 100%
        
        data.push({ x: clean_x, y: parseFloat(i.toFixed(2)), soc: soc });
        
        prev_t = t; 
        prev_i = i;
    }
    return data;
}

// 2. БАЗА ДАНИХ ДЛЯ ГРАФІКІВ (Легко додавати нові хімії)
const chartConfigs = {
    lifepo4: {
        title: "⏳ Графік Заряду LiFePO4",
        desc: "Ілюстрація процесу заряду комірки (режими CC-CV). Крива залежить від обраного максимального порогу напруги.",
        infoBoxClass: "bg-slate-50 border-l-4 border-slate-400 p-3 rounded-r-lg text-xs text-slate-700 mt-4 space-y-2",
        infoHtml: "<strong>Інформація:</strong><p>Для LiFePO4 характерна швидка стадія CC (постійний струм) та короткий етап абсорбції (CV) при високих напругах. Однак, при зниженні цільової напруги час балансування суттєво розтягується.</p>",
        axis: { maxX: 7.5, stepX: 1, maxY: 35 },
        params: { maxCurrent: 30, cutoffCurrent: 1 },
        datasets: [
            { label: '3.65V (Швидке насичення)', cc: 3.0, tau: 0.14, color: '#ef4444' },
            { label: '3.60V (Баланс)', cc: 2.5, tau: 0.43, color: '#f59e0b' },
            { label: '3.50V (М\'який заряд)', cc: 1.5, tau: 1.5, color: '#10b981' },
            { label: '3.40V (Повільне насичення)', cc: 1.0, tau: 2.5, color: '#3b82f6' }
        ]
    },
    nmc: {
        title: "⏳ Динаміка насичення NMC",
        desc: "Процес заряджання типової збірки <strong>NMC ємністю 100 А·год</strong>. Контролер подає постійний струм <strong>70 А (0.7C)</strong>, струм відсікання — <strong>1 А</strong>.",
        infoBoxClass: "bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-lg text-xs text-indigo-900 mt-4 space-y-2",
        infoHtml: "<strong>Фізика процесу:</strong> <p>Чим нижча цільова напруга (наприклад, 3.9 В), тим швидше напруга досягає порогу відсікання. Це дуже рано перериває фазу CC і переводить систему в <strong>тривалий режим експоненційного спаду струму (CV)</strong>.</p>",
        axis: { maxX: 2.5, stepX: 0.5, maxY: 80 },
        params: { maxCurrent: 70, cutoffCurrent: 1 },
        datasets: [
            { label: '4.20V (Повний заряд)', cc: 1.25, tau: 0.5 / Math.log(70/5), color: '#ef4444' },
            { label: '4.10V (М\'який режим)', cc: 1.0, tau: 0.8 / Math.log(70/5), color: '#f59e0b' },
            { label: '4.00V (Збереження ресурсу)', cc: 0.6, tau: 1.4 / Math.log(70/5), color: '#10b981' },
            { label: '3.90V (Швидка відсічка)', cc: 0.2, tau: 2.0 / Math.log(70/5), color: '#3b82f6' }
        ]
    }
};

// 3. ЄДИНИЙ РЕНДЕР (Більше ніяких if/else дублювань)
function renderChart() {
    const canvas = document.getElementById('absorptionChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    if (window.absorptionChartInstance) {
        window.absorptionChartInstance.destroy();
    }

    // Отримуємо налаштування для поточної хімії
    const config = chartConfigs[state.chemistry];

    // Оновлюємо текстовий контент
    document.getElementById('chart-title').innerHTML = config.title;
    document.getElementById('chart-desc').innerHTML = config.desc;
    document.getElementById('chart-info-box').className = config.infoBoxClass;
    document.getElementById('chart-info').innerHTML = config.infoHtml;

    // Створюємо датасети для графіка
    const chartDatasets = config.datasets.map(ds => {
        return {
            label: ds.label,
            data: generateChargeCurve(config.params.maxCurrent, config.params.cutoffCurrent, ds.cc, ds.tau, config.axis.maxX + 3),
            borderColor: ds.color,
            backgroundColor: ds.color + '1A', // Додаємо 10% прозорості (Hex Alpha)
            borderWidth: 3,
            tension: 0.4,           // Сгладжування Безьє
            borderJoinStyle: 'round' // Гладкі стики
        };
    });

    // Малюємо графік
    window.absorptionChartInstance = new Chart(ctx, {
        type: 'line',
        data: { datasets: chartDatasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            elements: { point: { radius: 0, hoverRadius: 5 } },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, titleFont: { size: 13, weight: 'bold' }, bodyFont: { size: 12 },
                    callbacks: {
                        title: function(context) {
                            let hours = context[0].parsed.x;
                            let h = Math.floor(hours);
                            let m = Math.round((hours - h) * 60);
                            return `⏳ Час заряду: ${h > 0 ? h + ' год ' : ''}${m} хв`;
                        },
                        label: function(context) { 
                            return ` ${context.dataset.label}: ${context.raw.y} А (🔋 ~${context.raw.soc}%)`; 
                        }
                    }
                }
            },
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Час заряду (години)' }, min: 0, max: config.axis.maxX, grid: { display: false }, ticks: { stepSize: config.axis.stepX, callback: v => v + ' год' } },
                y: { beginAtZero: true, title: { display: true, text: 'Струм заряду (Ампери)' }, max: config.axis.maxY, grid: { color: '#f1f5f9' }, ticks: { stepSize: 10 } }
            }
        },
        plugins: [crosshairPlugin]
    });
}