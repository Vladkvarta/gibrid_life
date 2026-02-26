// ==========================================
// БАЗА ДАНИХ ТА НАЛАШТУВАННЯ
// ==========================================
const bmsStandardDesc = {
    ovp: "Аварійне відключення заряду (захист від перезаряду комірки)",
    ovpr: "Відновлення заряду після спрацювання захисту OVP",
    soc100: "Калібрування BMS для відображення 100% заряду",
    balance: "Активація балансирів (на початку крутого підйому напруги)",
    uvp: "Аварійне відключення розряду (захист від глибокого розряду)",
    uvpr: "Відновлення розряду після спрацювання захисту UVP",
    soc0: "Калібрування BMS для відображення 0% заряду",
    poweroff: "Повне знеструмлення електроніки BMS (сплячий режим)"
};

const db = {
    'lifepo4': {
        baseVoltage: 3.2,
        voltages: { '12': '12.8В (4S)', '24': '25.6В (8S)', '48': '51.2В (16S)' },
        tempOTP: '+60 °C', tempOTPR: '+55 °C',
        scenarios: {
            'capacity': {
                title: "Максимальна ємність (Агресивний)",
                desc: "Утилізує максимальний обсяг енергії (0-100% SoC). Знижено ризик деградації завдяки Bulk 3.60V та правильному Inverter Cutoff.",
                inverter: {
                    '12': { bulk: 14.40, float: 13.48, cutoff: 11.20, restart: 12.40 },
                    '24': { bulk: 28.80, float: 26.96, cutoff: 22.40, restart: 24.80 },
                    '48': { bulk: 57.60, float: 53.92, cutoff: 44.80, restart: 49.60 },
                    'cell': { bulk: 3.60, float: 3.37, cutoff: 2.80, restart: 3.10 }
                },
                bms: [
                    { name: 'Cell OVP', val: 3.650, desc: bmsStandardDesc.ovp },
                    { name: 'Cell OVPR', val: 3.450, desc: bmsStandardDesc.ovpr },
                    { name: 'SOC 100% Volt', val: 3.550, desc: bmsStandardDesc.soc100 },
                    { name: 'Start Balance Volt', val: 3.400, desc: bmsStandardDesc.balance },
                    { name: 'Cell UVP', val: 2.600, desc: bmsStandardDesc.uvp },
                    { name: 'Cell UVPR', val: 2.800, desc: bmsStandardDesc.uvpr },
                    { name: 'SOC 0% Volt', val: 2.850, desc: bmsStandardDesc.soc0 },
                    { name: 'Power Off Vol', val: 2.600, desc: bmsStandardDesc.poweroff }
                ]
            },
            'balanced': {
                title: "Збалансований режим (Інженерний standard)",
                desc: "Найкращий вибір для циклічного використання (10-90% SoC). Точна синхронізація інвертора та BMS блокує аварійні ситуації.",
                inverter: {
                    '12': { bulk: 14.20, float: 13.40, cutoff: 12.00, restart: 12.80 },
                    '24': { bulk: 28.40, float: 26.80, cutoff: 24.00, restart: 25.60 },
                    '48': { bulk: 56.80, float: 53.60, cutoff: 48.00, restart: 51.20 },
                    'cell': { bulk: 3.55, float: 3.35, cutoff: 3.00, restart: 3.20 }
                },
                bms: [
                    { name: 'Cell OVP', val: 3.600, desc: bmsStandardDesc.ovp },
                    { name: 'Cell OVPR', val: 3.400, desc: bmsStandardDesc.ovpr },
                    { name: 'SOC 100% Volt', val: 3.480, desc: bmsStandardDesc.soc100 },
                    { name: 'Start Balance Volt', val: 3.400, desc: bmsStandardDesc.balance },
                    { name: 'Cell UVP', val: 2.800, desc: bmsStandardDesc.uvp },
                    { name: 'Cell UVPR', val: 3.000, desc: bmsStandardDesc.uvpr },
                    { name: 'SOC 0% Volt', val: 2.850, desc: bmsStandardDesc.soc0 },
                    { name: 'Power Off Vol', val: 2.600, desc: bmsStandardDesc.poweroff }
                ]
            },
            'life': {
                title: "Максимальний ресурс (Буферний режим)",
                desc: "Для систем UPS та серверів (20-80% SoC). Функцію Float відключено для запобігання постійному електрохімічному стресу.",
                inverter: {
                    '12': { bulk: 13.80, float: "Вимк", cutoff: 12.60, restart: 13.00 },
                    '24': { bulk: 27.60, float: "Вимк", cutoff: 25.20, restart: 26.00 },
                    '48': { bulk: 55.20, float: "Вимк", cutoff: 50.40, restart: 52.00 },
                    'cell': { bulk: 3.45, float: "Re-bulk 3.30", cutoff: 3.15, restart: 3.25 }
                },
                bms: [
                    { name: 'Cell OVP', val: 3.550, desc: bmsStandardDesc.ovp },
                    { name: 'Cell OVPR', val: 3.350, desc: bmsStandardDesc.ovpr },
                    { name: 'SOC 100% Volt', val: 3.430, desc: bmsStandardDesc.soc100 },
                    { name: 'Start Balance Volt', val: 3.400, desc: bmsStandardDesc.balance },
                    { name: 'Cell UVP', val: 2.900, desc: bmsStandardDesc.uvp },
                    { name: 'Cell UVPR', val: 3.100, desc: bmsStandardDesc.uvpr },
                    { name: 'SOC 0% Volt', val: 2.900, desc: bmsStandardDesc.soc0 },
                    { name: 'Power Off Vol', val: 2.600, desc: bmsStandardDesc.poweroff }
                ]
            }
        }
    },
    'nmc': {
        baseVoltage: 3.65,
        voltages: { '12': '14.8В (4S)', '24': '25.9В (7S)', '48': '51.8В (14S)' },
        tempOTP: '+65 °C', tempOTPR: '+60 °C',
        scenarios: {
            'capacity': {
                title: "Максимальна ємність (Агресивний)",
                desc: "Використовує максимальний обсяг енергії. Високий ризик прискореної деградації. Заряд до 4.20V на комірку.",
                inverter: {
                    '12': { bulk: 16.80, float: 16.40, cutoff: 12.00, restart: 12.80 },
                    '24': { bulk: 29.40, float: 28.70, cutoff: 21.00, restart: 22.40 },
                    '48': { bulk: 58.80, float: 57.40, cutoff: 42.00, restart: 44.80 },
                    'cell': { bulk: 4.20, float: 4.10, cutoff: 3.00, restart: 3.20 }
                },
                bms: [
                    { name: 'Cell OVP', val: 4.250, desc: bmsStandardDesc.ovp },
                    { name: 'Cell OVPR', val: 4.150, desc: bmsStandardDesc.ovpr },
                    { name: 'SOC 100% Volt', val: 4.150, desc: bmsStandardDesc.soc100 },
                    { name: 'Start Balance Volt', val: 3.650, desc: bmsStandardDesc.balance },
                    { name: 'Cell UVP', val: 2.600, desc: bmsStandardDesc.uvp },
                    { name: 'Cell UVPR', val: 2.800, desc: bmsStandardDesc.uvpr },
                    { name: 'SOC 0% Volt', val: 2.800, desc: bmsStandardDesc.soc0 },
                    { name: 'Power Off Vol', val: 2.600, desc: bmsStandardDesc.poweroff }
                ]
            },
            'balanced': {
                title: "Збалансований режим (Стратегія 20-80%)",
                desc: "Оптимальний standard для щоденного циклювання. Зниження напруги заряду до 4.10V радикально збільшує ресурс.",
                inverter: {
                    '12': { bulk: 16.40, float: 16.00, cutoff: 13.20, restart: 14.00 },
                    '24': { bulk: 28.70, float: 28.00, cutoff: 23.10, restart: 24.50 },
                    '48': { bulk: 57.40, float: 56.00, cutoff: 46.20, restart: 49.00 },
                    'cell': { bulk: 4.10, float: 4.00, cutoff: 3.30, restart: 3.50 }
                },
                bms: [
                    { name: 'Cell OVP', val: 4.200, desc: bmsStandardDesc.ovp },
                    { name: 'Cell OVPR', val: 4.100, desc: bmsStandardDesc.ovpr },
                    { name: 'SOC 100% Volt', val: 4.050, desc: bmsStandardDesc.soc100 },
                    { name: 'Start Balance Volt', val: 3.650, desc: bmsStandardDesc.balance },
                    { name: 'Cell UVP', val: 2.700, desc: bmsStandardDesc.uvp },
                    { name: 'Cell UVPR', val: 2.900, desc: bmsStandardDesc.uvpr },
                    { name: 'SOC 0% Volt', val: 3.100, desc: bmsStandardDesc.soc0 },
                    { name: 'Power Off Vol', val: 2.600, desc: bmsStandardDesc.poweroff }
                ]
            },
            'life': {
                title: "Максимальний ресурс (Вузьке вікно DoD)",
                desc: "Фокус на LCOS. Вузьке вікно напруг (3.40V - 3.92V) усуває електрохімічний стрес, забезпечуючи понад 4000 циклів.",
                inverter: {
                    '12': { bulk: 15.68, float: 15.28, cutoff: 13.60, restart: 14.40 },
                    '24': { bulk: 27.40, float: 26.70, cutoff: 23.80, restart: 25.20 },
                    '48': { bulk: 54.90, float: 53.50, cutoff: 47.60, restart: 50.40 },
                    'cell': { bulk: 3.92, float: 3.82, cutoff: 3.40, restart: 3.60 }
                },
                bms: [
                    { name: 'Cell OVP', val: 4.100, desc: bmsStandardDesc.ovp },
                    { name: 'Cell OVPR', val: 4.000, desc: bmsStandardDesc.ovpr },
                    { name: 'SOC 100% Volt', val: 3.900, desc: bmsStandardDesc.soc100 },
                    { name: 'Start Balance Volt', val: 3.650, desc: bmsStandardDesc.balance },
                    { name: 'Cell UVP', val: 3.000, desc: bmsStandardDesc.uvp },
                    { name: 'Cell UVPR', val: 3.200, desc: bmsStandardDesc.uvpr },
                    { name: 'SOC 0% Volt', val: 3.200, desc: bmsStandardDesc.soc0 },
                    { name: 'Power Off Vol', val: 2.600, desc: bmsStandardDesc.poweroff }
                ]
            }
        }
    }
};

// Глобальний стан додатку
let state = {
    chemistry: 'lifepo4',
    voltage: '48',
    scenario: 'balanced'
};