// ==========================================
// ЛОГІКА ІНТЕРФЕЙСУ ТА ІНІЦІАЛІЗАЦІЯ
// ==========================================
function updateChemistry(chem) {
    state.chemistry = chem;
    
    if (chem === 'lifepo4') {
        document.getElementById('btn-chem-lifepo4').className = "px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 bg-white text-indigo-700 shadow shadow-slate-200/50";
        document.getElementById('btn-chem-nmc').className = "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-700";
    } else {
        document.getElementById('btn-chem-nmc').className = "px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 bg-white text-indigo-700 shadow shadow-slate-200/50";
        document.getElementById('btn-chem-lifepo4').className = "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-700";
    }

    const voltLabels = db[chem].voltages;
    document.getElementById('label-12v').innerText = voltLabels['12'];
    document.getElementById('label-24v').innerText = voltLabels['24'];
    document.getElementById('label-48v').innerText = voltLabels['48'];
    document.getElementById('voltage-note').innerText = `*Базові розрахунки спираються на ${db[chem].baseVoltage}В/комірку.`;
    
    document.getElementById('encyclopedia-title-chem').innerText = chem === 'lifepo4' ? 'LiFePO4' : 'NMC';
    document.getElementById('footer-chem').innerText = chem === 'lifepo4' ? 'LiFePO4' : 'Li-ion NMC';

    document.getElementById('label-opt-c').innerText = chem === 'nmc' ? 'Оптимально (0.5C - 0.7C):' : 'Оптимально (0.2C - 0.3C):';
    document.getElementById('label-lim-c').innerText = chem === 'nmc' ? 'Ліміт надійності (1.0C):' : 'Ліміт надійності (0.5C):';

    document.getElementById('temp-otp-val').innerText = db[chem].tempOTP;
    document.getElementById('temp-otpr-val').innerText = db[chem].tempOTPR;

    
    const storageSoc = document.getElementById('card-storage-soc');
    const storageCond = document.getElementById('card-storage-cond');
    const mechTitle = document.getElementById('card-mech-title');
    const mechDesc = document.getElementById('card-mech-desc');

    if (chem === 'lifepo4') {
        storageSoc.innerText = "50 - 60% (~3.30В/комір.)";
        storageCond.innerText = "Сухе приміщення, +10°C ... +25°C. Раз на 6 місяців проводити контрольний цикл заряд/розряд. Балансири BMS мають бути вимкнені.";
        mechTitle.innerText = "Фізична стяжка (Compression)";
        mechDesc.innerText = "Призматичні корпуси вимагають жорсткої фіксації (текстоліт + шпильки) із зусиллям ~300 кгс. Це запобігає розпуханню та мікророзривам сепаратора.";
    } else {
        storageSoc.innerText = "40 - 50% (~3.65В/комір.)";
        storageCond.innerText = "Прохолодне місце, +5°C ... +15°C. Зберігати ізольовано у вогнетривкому боксі або металевій шафі подалі від легкозаймистих речей.";
        mechTitle.innerText = "Теплові зазори (Конвекція)";
        mechDesc.innerText = "Комірки схильні до сильного нагріву. Обов'язкова дистанція 2-3 мм між елементами або використання холдерів для вільної циркуляції повітря.";
    }


    filterEncyclopedia();
    check12vWarning();
    if (typeof gtag !== 'undefined') gtag('event', 'select_chemistry', { 'chemistry': chem });

    renderDashboard();
    renderChart();
}

function updateVoltage(v) {
    state.voltage = v;
    ['12', '24', '48'].forEach(val => {
        const btn = document.getElementById(`btn-v-${val}`);
        if (val === v) {
            btn.className = "py-2 px-3 text-sm font-bold border border-indigo-500 rounded-lg bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500 transition-all";
        } else {
            btn.className = "py-2 px-3 text-sm font-medium border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-all";
        }
    });
    check12vWarning();
    if (typeof gtag !== 'undefined') gtag('event', 'select_voltage', { 'voltage_type': v });
    renderDashboard();
}

function updateScenario(s) {
    state.scenario = s;
    const scenarioIds = ['capacity', 'balanced', 'life'];
    const colors = { 'capacity': 'rose', 'balanced': 'indigo', 'life': 'emerald' };

    scenarioIds.forEach(id => {
        const btn = document.getElementById(`btn-s-${id}`);
        const color = colors[id];
        if (id === s) {
            btn.className = `py-2 px-3 text-sm font-bold border border-${color}-500 rounded-lg bg-${color}-50 text-${color}-700 shadow-sm ring-1 ring-${color}-500`;
        } else {
            btn.className = "py-2 px-3 text-sm font-medium border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50";
        }
    });
    if (typeof gtag !== 'undefined') gtag('event', 'select_mode', { 'mode_type': s });
    renderDashboard();
}

function check12vWarning() {
    const warnBox = document.getElementById('nmc-12v-warning');
    if (state.chemistry === 'nmc' && state.voltage === '12') warnBox.classList.remove('hidden');
    else warnBox.classList.add('hidden');
}

function filterEncyclopedia() {
    const items = document.querySelectorAll('#encyclopedia-container details');
    items.forEach(item => {
        const chemAttr = item.getAttribute('data-chem');
        if (chemAttr === 'universal' || chemAttr === state.chemistry) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
            item.removeAttribute('open');
        }
    });
    const dangerCard = document.getElementById('nmc-danger-card');
    if (state.chemistry === 'nmc' && dangerCard) dangerCard.setAttribute('open', '');
}

function renderDashboard() {
    const data = db[state.chemistry].scenarios[state.scenario];
    const invData = data.inverter[state.voltage];
    const cellInvData = data.inverter['cell'];

    document.getElementById('scenario-title').innerText = data.title;
    document.getElementById('scenario-desc').innerText = data.desc;

    document.getElementById('val-bulk').innerText = invData.bulk.toFixed(2);
    
    const floatEl = document.getElementById('val-float');
    const floatUnit = document.getElementById('val-float-unit');
    if (typeof invData.float === 'number') {
        floatEl.innerText = invData.float.toFixed(2);
        floatUnit.style.display = "inline";
        floatEl.className = 'text-4xl font-bold text-slate-900';
    } else {
        floatEl.innerText = invData.float; 
        floatUnit.style.display = "none";
        floatEl.className = 'text-2xl font-bold text-slate-900 mt-2';
    }

    document.getElementById('val-cutoff').innerText = invData.cutoff.toFixed(2);
    document.getElementById('val-restart').innerText = invData.restart.toFixed(2);
    
    document.getElementById('cell-bulk-note').innerText = `(${cellInvData.bulk.toFixed(2)}В/комірку)`;
    document.getElementById('cell-float-note').innerText = typeof cellInvData.float === 'number' ? `(${cellInvData.float.toFixed(2)}В/комірку)` : `(${cellInvData.float})`;
    document.getElementById('cell-cutoff-note').innerText = `(${cellInvData.cutoff.toFixed(2)}В/комірку)`;
    document.getElementById('cell-restart-note').innerText = `(${cellInvData.restart.toFixed(2)}В/комірку)`;

    const timingAbs = document.getElementById('timing-abs');
    const timingDesc = document.getElementById('timing-abs-desc');
    if(state.chemistry === 'nmc') {
        timingAbs.innerText = "10 - 30 хв";
        timingDesc.innerText = "Після завершення балансування інвертор повинен зняти напругу.";
    } else {
        timingAbs.innerText = "30 - 60 хв";
        timingDesc.innerText = "Необхідно для успішного завершення процесу балансування комірок.";
    }

    const tbody = document.getElementById('bms-table-body');
    tbody.innerHTML = '';
    data.bms.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "bg-white border-b hover:bg-indigo-50/30 transition-colors h-12";
        tr.innerHTML = `
            <td class="px-4 sm:px-6 py-3 font-semibold text-slate-700 truncate" title="${row.name}">${row.name}</td>
            <td class="px-4 sm:px-6 py-3 text-right font-mono font-bold text-indigo-600 text-base">${row.val.toFixed(3)}</td>
            <td class="hidden sm:table-cell px-4 sm:px-6 py-3 text-slate-500 text-xs italic leading-tight" title="${row.desc}">${row.desc}</td>
        `;
        tbody.appendChild(tr);
    });

    calculateCurrent();
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    updateChemistry('lifepo4');
    updateVoltage('48');
    updateScenario('balanced');

    document.querySelectorAll('details').forEach(item => {
        item.addEventListener('toggle', (event) => {
            if (event.target.open && typeof gtag !== 'undefined') gtag('event', 'open_encyclopedia_card');
        });
    });

    const donateBtn = document.getElementById('donate-button');
    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') gtag('event', 'click_donate_author');
        });
    }
});