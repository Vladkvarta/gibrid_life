// ==========================================
// ЛОГІКА ГРАФІКІВ (CHART.JS)
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

function renderChart() {
    const canvas = document.getElementById('absorptionChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    if (window.absorptionChartInstance) {
        window.absorptionChartInstance.destroy();
    }

    const titleEl = document.getElementById('chart-title');
    const descEl = document.getElementById('chart-desc');
    const infoEl = document.getElementById('chart-info');
    const infoBox = document.getElementById('chart-info-box');

    if (state.chemistry === 'lifepo4') {
        titleEl.innerHTML = `⏳ Графік Заряду`;
        descEl.innerHTML = `Ілюстрація процесу заряду комірки (режими CC-CV). Крива залежить від обраного максимального порогу напруги.`;
        infoBox.className = `bg-slate-50 border-l-4 border-slate-400 p-3 rounded-r-lg text-xs text-slate-700 mt-4 space-y-2`;
        infoEl.innerHTML = `<strong>Інформація:</strong><p>Для LiFePO4 характерна швидка стадія CC (постійний струм) та короткий етап абсорбції (CV) при високих напругах. Однак, при зниженні цільової напруги (для ресурсу) час балансування суттєво розтягується.</p>`;

        function genLfpData(cc_duration, tau) {
            let data = [];
            for (let m = 0; m <= 7.5 * 60; m++) {
                let t = m / 60;
                let i = 30;
                if (t > cc_duration) {
                    i = 30 * Math.exp(-(t - cc_duration) / tau);
                }
                if (i < 0.3) break;
                let clean_x = Math.round(t * 100) / 100;
                data.push({ x: clean_x, y: parseFloat(i.toFixed(2)) });
            }
            return data;
        }

        window.absorptionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    { label: '3.65V (Швидке насичення)', data: genLfpData(3.0, 0.14), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 3 },
                    { label: '3.60V (Баланс)', data: genLfpData(2.5, 0.43), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 3 },
                    { label: '3.50V (М\'який заряд)', data: genLfpData(1.5, 1.5), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3 },
                    { label: '3.40V (Повільне насичення)', data: genLfpData(1.0, 2.5), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                elements: { 
                    line: { tension: 0, borderJoinStyle: 'round' }, // Добавлено сглаживание углов
                    point: { radius: 0, hoverRadius: 5 } 
                },
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
                            label: function(context) { return ` ${context.dataset.label}: ${context.raw.y} А`; }
                        }
                    }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'Час заряду (години)' }, min: 0, max: 7.5, grid: { display: false }, ticks: { stepSize: 1, callback: v => v + ' год' } },
                    y: { beginAtZero: true, title: { display: true, text: 'Струм заряду (Ампери)' }, max: 35, grid: { color: '#f1f5f9' }, ticks: { stepSize: 10 } }
                }
            },
            plugins: [crosshairPlugin]
        });

    } else if (state.chemistry === 'nmc') {
        titleEl.innerHTML = `⏳ Динаміка насичення (CC-CV)`;
        descEl.innerHTML = `Аналіз часу заряду при різних порогах напруги. Процес заряджання типової збірки <strong>NMC ємністю 100 А·год</strong>. Контролер подає постійний струм <strong>70 А (0.7C)</strong>, а струм відсікання — <strong>5 А (0.05C)</strong>.`;
        infoBox.className = `bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-lg text-xs text-indigo-900 mt-4 space-y-2`;
        infoEl.innerHTML = `<strong>Фізика процесу:</strong> 
                            <p>Згідно з еквівалентною електричною моделлю Тевенена, напруга на клемах зростає випереджаючими темпами через внутрішній опір (R₀) та поляризацію (Vp).</p>
                            <p>Найголовніше: <strong>чим нижча цільова напруга</strong> (наприклад, 3.9 В), тим швидше напруга досягає порогу відсікання. Це дуже рано перериває фазу CC і переводить систему в <strong>тривалий режим експоненційного спаду струму (CV)</strong>, розтягуючи час заряду.</p>`;

        function genNmcData(cc_duration, cv_duration) {
            let data = [];
            let t_end = cc_duration + cv_duration;
            let tau = cv_duration / Math.log(70/5);
            let ah = 0; let prev_t = 0; let prev_i = 70;
            let end_minute = Math.round(t_end * 60);
            
            for (let m = 0; m <= end_minute; m++) {
                let t = m / 60;
                let i = 70;
                if (t > cc_duration) i = 70 * Math.exp(-(t - cc_duration) / tau);
                if (i < 0.3) break;

                let dt = t - prev_t;
                if (dt > 0) ah += (prev_i + i) / 2 * dt;

                let clean_x = Math.round(t * 10000) / 10000;
                let soc = Math.min(100, Math.round(ah));
                data.push({x: clean_x, y: parseFloat(i.toFixed(2)), soc: soc});
                
                prev_t = t; prev_i = i;
            }
            return data;
        }

        window.absorptionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    { label: '4.20V (Повний заряд)', data: genNmcData(1.25, 0.5), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 3 },
                    { label: '4.10V (М\'який режим)', data: genNmcData(1.0, 0.8), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 3 },
                    { label: '4.00V (Збереження ресурсу)', data: genNmcData(0.6, 1.4), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3 },
                    { label: '3.90V (Швидка відсічка)', data: genNmcData(0.2, 2.0), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                elements: { 
                    line: { tension: 0, borderJoinStyle: 'round' }, // Добавлено сглаживание углов
                    point: { radius: 0, hoverRadius: 5 } 
                },
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
                            label: function(context) { return ` ${context.dataset.label}: ${context.raw.y} А (🔋 ~${context.raw.soc}%)`; }
                        }
                    }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'Час заряду (години)' }, min: 0, max: 2.5, grid: { display: false }, ticks: { stepSize: 0.5, callback: v => v + ' год' } },
                    y: { beginAtZero: true, title: { display: true, text: 'Струм заряду (Ампери)' }, max: 80, grid: { color: '#f1f5f9' }, ticks: { stepSize: 10 } }
                }
            },
            plugins: [crosshairPlugin]
        });
    }
}