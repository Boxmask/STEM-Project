// =========================================
// 1. 고정 데이터 및 시스템 설정
// =========================================
let targetPixelX = 1009;
let targetPixelY = 761;

const SPAWN_POINTS_FPV = [
    { id: 'F1', x: 200, y: 150 }, { id: 'F2', x: 800, y: 150 }, { id: 'F3', x: 798, y: 219 },
    { id: 'F4', x: 1178, y: 223 }, { id: 'F5', x: 804, y: 322 }, { id: 'F6', x: 995, y: 310 },
    { id: 'F7', x: 1167, y: 347 }, { id: 'F8', x: 889, y: 319 }, { id: 'F9', x: 695, y: 258 },
    { id: 'F10', x: 1087, y: 413 }, { id: 'F11', x: 956, y: 392 }, { id: 'F12', x: 1091, y: 301 }
];

const SPAWN_POINTS_RPG = [
    { id: 'R1', x: 150, y: 600 }, { id: 'R2', x: 1200, y: 600 }, { id: 'R3', x: 904, y: 554 },
    { id: 'R4', x: 1047, y: 559 }, { id: 'R5', x: 617, y: 596 }, { id: 'R6', x: 505, y: 684 },
    { id: 'R7', x: 1237, y: 606 }, { id: 'R8', x: 796, y: 563 }, { id: 'R9', x: 1147, y: 551 },
    { id: 'R10', x: 981, y: 542 }, { id: 'R11', x: 898, y: 526 }
];

// DOM 참조 (HTML 구조에 맞춰 전역 선언)
const viewCamera = document.getElementById('camera-view');
const viewLog = document.getElementById('log-view');
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
// 2. 핵심 시뮬레이션 엔진
// =========================================

function createExplosion(x, y) {
    const exp = document.createElement('div');
    exp.className = 'explosion-effect';
    exp.style.left = `${x}px`;
    exp.style.top = `${y}px`;
    viewCamera.appendChild(exp);
    void exp.offsetWidth; 
    exp.classList.add('fade');
    setTimeout(() => exp.remove(), 400);
}

function updateHUD(name, startX, startY) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const dx = startX - targetPixelX;
    const dy = startY - targetPixelY;
    
    // 방위각 계산 보정
    let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
    if (angle < 0) angle += 360;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy));

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

function startAttack(type) {
    const isFPV = type === 'FPV';
    const points = isFPV ? SPAWN_POINTS_FPV : SPAWN_POINTS_RPG;
    const spawn = points[Math.floor(Math.random() * points.length)];
    const box = isFPV ? targetBox : rpgProjectileBox;
    
    let timeTick = 0;
    const startX = spawn.x;
    const startY = spawn.y;
    const willIntercept = Math.random() <= INTERCEPT_CHANCE;
    const interceptAt = 0.5 + (Math.random() * 0.1); 

    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG WARHEAD', startX, startY);

    if (!isFPV) {
        // 사수 초기 위치 설정 (보임 처리 전)
        rpgGunnerBox.style.transition = 'none';
        rpgGunnerBox.style.left = `${startX}px`;
        rpgGunnerBox.style.top = `${startY}px`;
        rpgGunnerBox.className = 'rpg-gunner-box fade-left';
        rpgGunnerBox.style.display = 'block';

        void rpgGunnerBox.offsetWidth; 
        rpgGunnerBox.style.transition = 'opacity 0.5s, transform 0.5s';
        rpgGunnerBox.classList.replace('fade-left', 'fade-center');
        
        setTimeout(() => launchProjectile(box, startX, startY, 0.035, 5, willIntercept, interceptAt, logRes), 600);
        
        setTimeout(() => {
            rpgGunnerBox.classList.replace('fade-center', 'fade-right');
            setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 500);
        }, 2000);
    } else {
        launchProjectile(box, startX, startY, 0.008, 0, willIntercept, interceptAt, logRes);
    }
}

function launchProjectile(box, startX, startY, speed, baseSize, willIntercept, interceptAt, logRes) {
    // 발사 전 초기 좌표 강제 고정 (이전 위치 잔상 방지)
    box.style.left = `${startX}px`;
    box.style.top = `${startY}px`;
    box.style.width = `${baseSize}%`;
    box.style.display = 'block';

    const moveLoop = setInterval(() => {
        let timeTick = (arguments.timeTick || 0) + speed;
        arguments.timeTick = timeTick; 

        if (timeTick > 1) timeTick = 1;

        const curSize = baseSize + (MAX_SIZE - baseSize) * Math.pow(timeTick, 1.5);
        const curX = startX + (targetPixelX - startX) * timeTick;
        const curY = startY + (targetPixelY - startY) * timeTick;

        box.style.width = `${curSize}%`;
        box.style.left = `${curX}px`;
        box.style.top = `${curY}px`;

        if (willIntercept && timeTick >= interceptAt) {
            clearInterval(moveLoop);
            box.style.display = 'none';
            createExplosion(curX, curY);
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
            setTimeout(nextWave, 1500);
            return;
        }

        if (timeTick >= 1) {
            clearInterval(moveLoop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT! BRACE!</span>`;
            setTimeout(nextWave, 1500);
        }
    }, 30);
}

function nextWave() {
    startAttack(Math.random() > 0.5 ? 'FPV' : 'RPG');
}

// =========================================
// 3. UI 제어 및 초기화
// =========================================

document.getElementById('btn-camera').onclick = () => {
    viewCamera.classList.add('active'); viewLog.classList.remove('active');
    document.getElementById('btn-camera').classList.add('active');
    document.getElementById('btn-log').classList.remove('active');
};
document.getElementById('btn-log').onclick = () => {
    viewLog.classList.add('active'); viewCamera.classList.remove('active');
    document.getElementById('btn-log').classList.add('active');
    document.getElementById('btn-camera').classList.add('active');
};

setInterval(() => {
    const now = new Date();
    document.getElementById('hud-time-display').innerText = now.toTimeString().split(' ')[0];
}, 1000);

viewCamera.onclick = () => {
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

// 최초 실행
setTimeout(nextWave, 1000);
