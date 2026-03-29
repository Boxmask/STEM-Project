// =========================================
// 1. 시나리오 데이터 및 DOM 참조
// =========================================
let SCENARIOS = [
  { id: "FPV_1", type: "FPV", startX: "25.00", startY: "6.39", startSize: 5, endX: "43.48", endY: "68.52", endSize: "15" },
  { id: "RPG_1", type: "RPG", startX: "6.94", startY: "59.16", startSize: 5, endX: "13.55", endY: "85.32", endSize: "15" },
  { id: "RPG_3", type: "RPG", startX: "20.74", startY: "51.28", startSize: "4", endX: "28.18", endY: "71.35", endSize: "16" },
  { id: "FPV_4", type: "FPV", startX: "85.37", startY: "6.84", startSize: 5, endX: "78.85", endY: "65.25", endSize: "14" },
  { id: "FPV_5", type: "FPV", startX: "36.87", startY: "8.03", startSize: 5, endX: "47.74", endY: "70.31", endSize: 20 },
  { id: "FPV_6", type: "FPV", startX: "64.72", startY: "9.36", startSize: 5, endX: "63.55", endY: "67.19", endSize: 20 },
  { id: "RPG_7", type: "RPG", startX: "92.89", startY: "51.28", startSize: "4", endX: "85.54", endY: "75.96", endSize: "16" },
  { id: "RPG_8", type: "RPG", startX: "36.12", startY: "47.86", startSize: "3", endX: "40.05", endY: "68.82", endSize: "12" },
  { id: "RPG_9", type: "RPG", startX: "59.36", startY: "48.46", startSize: "2", endX: "55.69", endY: "65.55", endSize: "13" },
  { id: "FPV_10", type: "FPV", startX: "47.74", startY: "15.01", startSize: 5, endX: "54.68", endY: "61.84", endSize: 20 },
  { id: "RPG_11", type: "RPG", startX: "45.40", startY: "47.86", startSize: "2", endX: "57.86", endY: "64.51", endSize: "11" },
  { id: "FPV_12", type: "FPV", startX: "56.94", startY: "30.03", startSize: "3", endX: "68.98", endY: "64.36", endSize: "13" }
];

const viewCamera = document.getElementById('camera-view');
const logContent = document.getElementById('log-content');
const turretBar = document.getElementById('turret-bar');
const azimuthVal = document.getElementById('azimuth-val');
const targetBox = document.getElementById('target-box');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');
const cameraModeVal = document.getElementById('camera-mode-val');
const hudStatusVal = document.getElementById('hud-status-val');

const INTERCEPT_CHANCE = 0.82; 
const MAX_SIZE = 20;
let currentAnimationLoop = null;

// =========================================
// 2. 핵심 유틸리티 (이펙트 및 HUD)
// =========================================
function createExplosion(x_pc, y_pc) {
    const exp = document.createElement('div');
    exp.className = 'explosion-effect';
    exp.style.left = `${x_pc}%`;
    exp.style.top = `${y_pc}%`;
    viewCamera.appendChild(exp);

    void exp.offsetWidth; 
    exp.classList.add('fade');
    setTimeout(() => exp.remove(), 400);
}

function updateHUD(name, startX_pc, startY_pc, endX_pc, endY_pc) {
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');
    
    const dx = startX_pc - endX_pc;
    const dy = startY_pc - endY_pc;
    let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
    if (angle < 0) angle += 360;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 5.5);

    turretBar.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    azimuthVal.innerText = angle;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-alert">WARNING: ${name} DETECTED.</span><br>
        <span>AZIMUTH: ${angle}° | DISTANCE: ${dist}m</span><br>
        <span>STATUS: <span class="res" style="color: #ff0;">INTERCEPTING...</span></span>
    `;
    logContent.prepend(entry);
    return entry.querySelector('.res');
}

// =========================================
// 3. 통합 시뮬레이션 엔진
// =========================================
function runScenario(scenarioObj) {
    if (currentAnimationLoop) {
        clearInterval(currentAnimationLoop);
        targetBox.style.display = 'none';
        rpgProjectileBox.style.display = 'none';
        rpgGunnerBox.style.display = 'none';
    }

    const isFPV = scenarioObj.type === 'FPV';
    const box = isFPV ? targetBox : rpgProjectileBox;
    const speed = isFPV ? 0.008 : 0.035;
    
    const willIntercept = Math.random() <= INTERCEPT_CHANCE;
    const interceptAt = 0.5 + (Math.random() * 0.1); 

    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG WARHEAD', scenarioObj.startX, scenarioObj.startY, scenarioObj.endX, scenarioObj.endY);

    if (!isFPV) {
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = `${scenarioObj.startX}%`;
        rpgGunnerBox.style.top = `${scenarioObj.startY}%`;
        rpgGunnerBox.style.width = `${scenarioObj.startSize}%`;
        rpgGunnerBox.style.transform = 'translate(-50%, -50%)'; 
        rpgGunnerBox.style.opacity = '0';
        rpgGunnerBox.style.transition = 'opacity 0.3s';
        
        void rpgGunnerBox.offsetWidth;
        rpgGunnerBox.style.opacity = '1';
        
        setTimeout(() => {
            animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
            setTimeout(() => { 
                rpgGunnerBox.style.opacity = '0'; 
                setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 300);
            }, 1000);
        }, 600);
    } else {
        animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
    }
}

function animateProjectile(box, s, speed, willIntercept, interceptAt, logRes) {
    let t = 0;
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)';
    box.style.left = s.startX + '%';
    box.style.top = s.startY + '%';
    box.style.width = s.startSize + '%';

    currentAnimationLoop = setInterval(() => {
        t += speed;
        if (t > 1) t = 1;

        const curX = parseFloat(s.startX) + (s.endX - s.startX) * t;
        const curY = parseFloat(s.startY) + (s.endY - s.startY) * t;
        const curSize = parseFloat(s.startSize) + (s.endSize - s.startSize) * Math.pow(t, 1.5);

        box.style.left = curX + '%';
        box.style.top = curY + '%';
        box.style.width = curSize + '%';

        if (willIntercept && t >= interceptAt) {
            clearInterval(currentAnimationLoop);
            box.style.display = 'none';
            createExplosion(curX, curY);
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
            setTimeout(triggerRandomAttack, 1500);
            return;
        }

        if (t >= 1) {
            clearInterval(currentAnimationLoop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT! BRACE!</span>`;
            setTimeout(triggerRandomAttack, 1500);
        }
    }, 30);
}

function triggerRandomAttack() {
    if (SCENARIOS.length === 0) return;
    const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    runScenario(randomScenario);
}

// UI 이벤트 리스너 및 초기화
document.getElementById('btn-camera').onclick = () => {
    viewCamera.classList.add('active'); viewLog.classList.remove('active');
    document.getElementById('btn-camera').classList.add('active');
    document.getElementById('btn-log').classList.remove('active');
};
document.getElementById('btn-log').onclick = () => {
    viewLog.classList.add('active'); viewCamera.classList.remove('active');
    document.getElementById('btn-log').classList.add('active');
    document.getElementById('btn-camera').classList.remove('active');
};

setInterval(() => {
    document.getElementById('hud-time-display').innerText = new Date().toTimeString().split(' ')[0];
}, 1000);

viewCamera.onclick = (e) => {
    if (e.target.closest('.path-handle')) return;
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

setTimeout(triggerRandomAttack, 1000);
