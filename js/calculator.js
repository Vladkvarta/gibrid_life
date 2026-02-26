// ==========================================
// МАТЕМАТИКА КАЛЬКУЛЯТОРА C-RATE
// ==========================================
function calculateCurrent() {
    let capInput = document.getElementById('input-capacity').value;
    let loadInput = document.getElementById('input-load').value;
    
    let cap = parseFloat(capInput);
    let loadKw = parseFloat(loadInput);

    if (isNaN(cap) || cap < 0) cap = 0;
    if (isNaN(loadKw) || loadKw < 0) loadKw = 0;

    const resMin = document.getElementById('res-min');
    const resMax = document.getElementById('res-max');
    const resLimit = document.getElementById('res-limit');
    const resLoadAmps = document.getElementById('res-load-amps');
    const resCRate = document.getElementById('res-c-rate');
    const sagWarningBox = document.getElementById('sag-warning-box');
    const sagWarningText = document.getElementById('sag-warning-text');
    const cRateIndicator = document.getElementById('c-rate-indicator');

    if (cap > 0) {
        if (state.chemistry === 'nmc') {
            resMin.innerText = (cap * 0.5).toFixed(0);
            resMax.innerText = (cap * 0.7).toFixed(0);
            resLimit.innerText = (cap * 1.0).toFixed(0);
        } else {
            resMin.innerText = (cap * 0.2).toFixed(0);
            resMax.innerText = (cap * 0.3).toFixed(0);
            resLimit.innerText = (cap * 0.5).toFixed(0);
        }
    } else {
        resMin.innerText = "0"; resMax.innerText = "0"; resLimit.innerText = "0";
    }

    if (cap > 0 && loadKw > 0) {
        const INVERTER_EFFICIENCY = 0.92;
        let numCells = state.voltage === '12' ? 4 : (state.voltage === '24' ? (state.chemistry === 'lifepo4' ? 8 : 7) : (state.chemistry === 'lifepo4' ? 16 : 14));
        let nomV = numCells * db[state.chemistry].baseVoltage;

        let maxAmps = (loadKw * 1000) / (nomV * INVERTER_EFFICIENCY);
        resLoadAmps.innerText = maxAmps.toFixed(0);

        let cRate = maxAmps / cap;
        resCRate.innerText = cRate.toFixed(2) + " C";

        let dangerThreshold = state.chemistry === 'lifepo4' ? 0.8 : 1.5;
        let warnThreshold   = state.chemistry === 'lifepo4' ? 0.5 : 1.0;

        if (cRate <= warnThreshold) {
            resCRate.className = "font-bold text-emerald-600";
            cRateIndicator.className = "absolute right-0 top-0 bottom-0 w-1.5 bg-emerald-500 transition-all";
        }
        else if (cRate <= dangerThreshold) {
            resCRate.className = "font-bold text-amber-500";
            cRateIndicator.className = "absolute right-0 top-0 bottom-0 w-1.5 bg-amber-500 transition-all";
        }
        else {
            resCRate.className = "font-bold text-rose-600";
            cRateIndicator.className = "absolute right-0 top-0 bottom-0 w-1.5 bg-rose-500 transition-all";
        }

        const healthWarningBox = document.getElementById('health-warning-box');
        const healthWarningText = document.getElementById('health-warning-text');
        const warningIcon = document.getElementById('health-warning-icon');
        const warningTitle = document.getElementById('health-warning-title');

        if (cRate > dangerThreshold) {
            let recCap = (maxAmps / (state.chemistry === 'nmc' ? 1.0 : 0.5)).toFixed(0);
            healthWarningText.innerHTML = `Критичне навантаження (<strong>${cRate.toFixed(2)}C</strong>)! Акумулятор працює поза зоною оптимальності та сильно перегрівається.<span class="block mt-3 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 text-emerald-900 shadow-sm text-sm"><strong>🛠 Рішення:</strong> Збільште ємність збірки мінімум до ${recCap}Аг.</span>`;
            healthWarningBox.className = "mt-4 rounded-xl p-4 border transition-all duration-300 bg-rose-50 border-rose-200 text-rose-900";
            warningTitle.className = "text-sm font-bold text-rose-800 uppercase tracking-wider mb-0.5";
            warningTitle.innerText = "🚨 Небезпечний режим";
            warningIcon.innerText = "🚨";
            healthWarningBox.classList.remove('hidden');
        } else if (cRate > warnThreshold) {
            let extraText = state.chemistry === 'nmc' ? " Обов'язковий температурний менеджмент." : " Зверніть увагу на переріз кабелів.";
            healthWarningText.innerHTML = `Підвищене навантаження (<strong>${cRate.toFixed(2)}C</strong>). Значні теплові втрати (I²R).${extraText}`;
            healthWarningBox.className = "mt-4 rounded-xl p-4 border transition-all duration-300 bg-amber-50 border-amber-200 text-amber-900";
            warningTitle.className = "text-sm font-bold text-amber-800 uppercase tracking-wider mb-0.5";
            warningTitle.innerText = "⚠️ Підвищений знос";
            warningIcon.innerText = "⚠️";
            healthWarningBox.classList.remove('hidden');
        } else {
            healthWarningBox.classList.add('hidden');
        }

        if (cRate > warnThreshold) {
            let cellBump = cRate > dangerThreshold ? 0.15 : 0.1;
            let baseRestart = db[state.chemistry].scenarios[state.scenario].inverter[state.voltage].restart;
            let suggestedRestart = (baseRestart + (cellBump * numCells)).toFixed(1);
            sagWarningText.innerHTML = `Коефіцієнт розряду <strong>${cRate.toFixed(2)}C</strong> викличе різку просадку напруги.<br>Збільште параметр <strong>Restart до ~${suggestedRestart} В</strong>.`;
            sagWarningBox.classList.remove('hidden');
        } else {
            sagWarningBox.classList.add('hidden');
        }
    } else {
        resLoadAmps.innerText = "0";
        resCRate.innerText = "0.00 C";
        resCRate.className = "font-bold text-slate-800";
        cRateIndicator.className = "absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 transition-all";
        sagWarningBox.classList.add('hidden');
        document.getElementById('health-warning-box').classList.add('hidden');
    }
}