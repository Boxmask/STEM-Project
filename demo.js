// =========================================
// 1. 시스템 설정 및 추출된 퍼센트(%) 데이터
// =========================================
let targetX_pc = 84.08;
let targetY_pc = 85;

const SPAWN_POINTS_FPV = [
    { x_pc: 37.04, y_pc: 8.77 }, { x_pc: 66.67, y_pc: 22.22 }, { x_pc: 54.52, y_pc: 34.93 },
    { x_pc: 88.63, y_pc: 6.09 }, { x_pc: 25.50, y_pc: 7.73 }, { x_pc: 82.92, y_pc: 45.93 },
    { x_pc: 36.54, y_pc: 26.31 }, { x_pc: 74.08, y_pc: 47.26 }, { x_pc: 62.37, y_pc: 28.39 },
    { x_pc: 43.98, y_pc: 20.81 }, { x_pc: 49.92, y_pc: 21.11 }, { x_pc: 65.22, y_pc: 8.77 }
];

const SPAWN_POINTS_RPG = [
    { x_pc: 21.49, y_pc: 61.39 }, { x_pc: 67.73, y_pc: 58.12 }, { x_pc: 61.45, y_pc: 52.47 },
    { x_pc: 52.17, y_pc: 59.01 }, { x_pc: 36.20, y_pc: 52.32 }, { x_pc: 42.08, y_pc: 101.33 },
    { x_pc: 103.08, y_pc: 89.78 }, { x_pc: 48.58, y_pc: 50.69 }, { x_pc: 33.70, y_pc: 63.47 },
    { x_pc: 87.63, y_pc: 58.27 }, { x_pc: 7.19, y_pc: 77.74 }
];

// DOM 참조
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

// =========================================
// 2. 핵심 유틸리티 (이펙트 및 HUD)
// =========================================

function createExplosion(x_pc, y_pc) {
    const exp = document.createElement('div');
    exp.className = 'explosion-effect';
    // 퍼센트 좌표를 그대로 사용하여 반응형 유지
    exp.style.left = `${x_pc}%`;
    exp.style.top = `${y_pc}%`;
    viewCamera.appendChild(exp);

    void exp.offsetWidth; 
    exp.classList.add('fade');
    setTimeout(() => exp.remove(), 400);
}

function updateHUD(name, startX_pc, startY_pc) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    
    // % 좌표 기반 방위각 계산
    const dx = startX_pc - targetX_pc;
    const dy = startY_pc - targetY_pc;
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
// 3. 전투 시뮬레이션 엔진
// =========================================

function startAttack(type) {
    const isFPV = type === 'FPV';
    const points = isFPV ? SPAWN_POINTS_FPV : SPAWN_POINTS_RPG;
    const spawn = points[Math.floor(Math.random() * points.length)];
    const box = isFPV ? targetBox : rpgProjectileBox;
    
    const startX = spawn.x_pc;
    const startY = spawn.y_pc;
    const willIntercept = Math.random() <= INTERCEPT_CHANCE;
    const interceptAt = 0.5 + (Math.random() * 0.1); 

    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG WARHEAD', startX, startY);

    if (!isFPV) {
        // RPG 사수(Terror) 배치
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = `${startX}%`;
        rpgGunnerBox.style.top = `${startY}%`;
        rpgGunnerBox.className = 'rpg-gunner-box fade-left';
        void rpgGunnerBox.offsetWidth;
        rpgGunnerBox.classList.replace('fade-left', 'fade-center');
        
        setTimeout(() => launch(box, startX, startY, 0.035, 5, willIntercept, interceptAt, logRes), 600);
        setTimeout(() => {
            rpgGunnerBox.classList.replace('fade-center', 'fade-right');
            setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 500);
        }, 2000);
    } else {
        launch(box, startX, startY, 0.008, 0, willIntercept, interceptAt, logRes);
    }
}

function launch(box, startX, startY, speed, baseSize, willIntercept, interceptAt, logRes) {
    let timeTick = 0;
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)';

    const loop = setInterval(() => {
        timeTick += speed;
        if (timeTick > 1) timeTick = 1;

        const curX = startX + (targetX_pc - startX) * timeTick;
        const curY = startY + (targetY_pc - startY) * timeTick;
        const curSize = baseSize + (MAX_SIZE - baseSize) * Math.pow(timeTick, 1.5);

        box.style.left = `${curX}%`;
        box.style.top = `${curY}%`;
        box.style.width = `${curSize}%`;

        if (willIntercept && timeTick >= interceptAt) {
            clearInterval(loop);
            box.style.display = 'none';
            createExplosion(curX, curY);
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
            setTimeout(nextWave, 1500);
            return;
        }

        if (timeTick >= 1) {
            clearInterval(loop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT!</span>`;
            setTimeout(nextWave, 1500);
        }
    }, 30);
}

function nextWave() {
    startAttack(Math.random() > 0.5 ? 'FPV' : 'RPG');
}

// UI 이벤트
document.getElementById('btn-camera').onclick = () => {
    viewCamera.classList.add('active'); 
    document.getElementById('log-view').classList.remove('active');
    document.getElementById('btn-camera').classList.add('active');
    document.getElementById('btn-log').classList.remove('active');
};
document.getElementById('btn-log').onclick = () => {
    document.getElementById('log-view').classList.add('active');
    viewCamera.classList.remove('active');
    document.getElementById('btn-log').classList.add('active');
    document.getElementById('btn-camera').classList.remove('active');
};

setInterval(() => {
    document.getElementById('hud-time-display').innerText = new Date().toTimeString().split(' ')[0];
}, 1000);

viewCamera.onclick = () => {
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

// 시작
setTimeout(nextWave, 1000);
