// =========================================
// 1. 기본 시스템 설정 및 데이터
// =========================================

// [핵심] 사용자가 SOLVE로 추출한 고정 좌표 데이터
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

// DOM 요소 연결
const viewCamera = document.getElementById('camera-view');
const viewLog = document.getElementById('log-view');
const logContent = document.getElementById('log-content');
const turretBar = document.getElementById('turret-bar');
const azimuthVal = document.getElementById('azimuth-val');
const targetBox = document.getElementById('target-box');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

// 설정값
const INTERCEPT_CHANCE = 0.82; // 82% 요격 확률
const MAX_SIZE = 20; // 최대 크기 (%)

// =========================================
// 2. 유틸리티 함수 (계산 및 이펙트)
// =========================================

// 폭발 이펙트 생성 (정확한 좌표 동기화)
function createExplosion(x, y) {
    const exp = document.createElement('div');
    exp.className = 'explosion-effect';
    // 부모인 camera-view 기준 절대 좌표로 배치
    exp.style.left = `${x}px`;
    exp.style.top = `${y}px`;
    viewCamera.appendChild(exp);

    void exp.offsetWidth; // 리플로우 강제
    exp.classList.add('fade');

    setTimeout(() => exp.remove(), 400);
}

// 실시간 시스템 로그 및 방위각 업데이트
function updateHUD(name, startX, startY) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    // 방위각 및 거리 계산: $distance = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$
    const dx = startX - targetPixelX;
    const dy = startY - targetPixelY;
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
        <span>STATUS: <span class="res">INTERCEPTING...</span></span>
    `;
    logContent.prepend(entry);
    return entry.querySelector('.res');
}

// =========================================
// 3. 메인 시뮬레이션 엔진
// =========================================

function startAttack(type) {
    const isFPV = type === 'FPV';
    const points = isFPV ? SPAWN_POINTS_FPV : SPAWN_POINTS_RPG;
    const spawn = points[Math.floor(Math.random() * points.length)];
    const box = isFPV ? targetBox : rpgProjectileBox;
    
    // 초기 설정
    let timeTick = 0;
    const startX = spawn.x;
    const startY = spawn.y;
    const willIntercept = Math.random() <= INTERCEPT_CHANCE;
    const interceptAt = 0.5 + (Math.random() * 0.1); // 50~60% 구간

    // HUD 업데이트
    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG WARHEAD', startX, startY);

    // 사수(Terror)일 경우 등장 애니메이션 선행
    if (!isFPV) {
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = `${startX}px`;
        rpgGunnerBox.style.top = `${startY}px`;
        rpgGunnerBox.className = 'rpg-gunner-box fade-left';
        void rpgGunnerBox.offsetWidth;
        rpgGunnerBox.classList.replace('fade-left', 'fade-center');
        
        // 0.5초 대기 후 발사
        setTimeout(() => launch(), 500);
        // 2초 후 사수 퇴장
        setTimeout(() => {
            rpgGunnerBox.classList.replace('fade-center', 'fade-right');
            setTimeout(() => rpgGunnerBox.style.display = 'none', 500);
        }, 2000);
    } else {
        launch();
    }

    function launch() {
        box.style.display = 'block';
        box.style.transform = 'translate(-50%, -50%)'; // 중심점 고정

        const moveLoop = setInterval(() => {
            timeTick += (isFPV ? 0.008 : 0.035);
            if (timeTick > 1) timeTick = 1;

            const currentSize = (isFPV ? 0 : 5) + (MAX_SIZE - (isFPV ? 0 : 5)) * Math.pow(timeTick, 1.5);
            const curX = startX + (targetPixelX - startX) * timeTick;
            const curY = startY + (targetPixelY - startY) * timeTick;

            box.style.width = `${currentSize}%`;
            box.style.left = `${curX}px`;
            box.style.top = `${curY}px`;

            // 요격 판정
            if (willIntercept && timeTick >= interceptAt) {
                clearInterval(moveLoop);
                box.style.display = 'none';
                createExplosion(curX, curY);
                logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
                setTimeout(nextWave, 1500);
                return;
            }

            // 피격 판정 (목표 도착)
            if (timeTick >= 1) {
                clearInterval(moveLoop);
                box.style.display = 'none';
                logRes.innerHTML = `<span class="log-alert">IMPACT! BRACE!</span>`;
                setTimeout(nextWave, 1500);
            }
        }, 30);
    }
}

function nextWave() {
    startAttack(Math.random() > 0.5 ? 'FPV' : 'RPG');
}

// 초기 실행 및 기존 UI 로직 (시계/전환)
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
    const now = new Date();
    document.getElementById('hud-time-display').innerText = now.toTimeString().split(' ')[0];
}, 1000);

// 카메라 모드 전환
viewCamera.onclick = () => {
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

// 시작
setTimeout(nextWave, 1000);
