// =========================================
// 1. 화면 전환 기능
// =========================================
const btnCamera = document.getElementById('btn-camera');
const btnLog = document.getElementById('btn-log');
const viewCamera = document.getElementById('camera-view');
const viewLog = document.getElementById('log-view');

btnCamera.addEventListener('click', () => {
    btnCamera.classList.add('active'); btnLog.classList.remove('active');
    viewCamera.classList.add('active'); viewLog.classList.remove('active');
});

btnLog.addEventListener('click', () => {
    btnLog.classList.add('active'); btnCamera.classList.remove('active');
    viewLog.classList.add('active'); viewCamera.classList.remove('active');
});

// =========================================
// 2. HUD 실시간 시계 기능
// =========================================
const timeDisplay = document.getElementById('hud-time-display');
setInterval(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeDisplay.innerText = `${hours}:${minutes}:${seconds}`;
}, 1000);

// =========================================
// 3. 카메라 모드 전환
// =========================================
const cameraModeVal = document.getElementById('camera-mode-val');
const hudStatusVal = document.getElementById('hud-status-val');

viewCamera.addEventListener('click', () => {
    if (cameraModeVal.innerText === 'OPTICAL') {
        cameraModeVal.innerText = 'IR';
        hudStatusVal.innerText = 'IR SENSOR: ONLINE';
        viewCamera.classList.add('ir-mode');
    } else {
        cameraModeVal.innerText = 'OPTICAL';
        hudStatusVal.innerText = 'OPTICAL SENSOR: ONLINE';
        viewCamera.classList.remove('ir-mode');
    }
});

// =========================================
// 4. 동적 로그 생성기 및 방위각 계산 함수
// =========================================
const logContent = document.getElementById('log-content');
const turretBar = document.getElementById('turret-bar');
const azimuthVal = document.getElementById('azimuth-val');

function updateSystemLog(threatName, startX, startY) {
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');

    let dx = startX - targetPixelX;
    let dy = startY - targetPixelY;
    
    // 방위각 계산: standard atan2, then adjust by 90 deg and normalize
    let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90; 
    if (angle < 0) angle += 360; 
    
    // 거리 계산: standard Euclidean distance
    let distance = Math.round(Math.sqrt(dx * dx + dy * dy));

    turretBar.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    azimuthVal.innerText = angle;

    let logHtml = `<div class="log-entry" id="current-log">
        <span class="log-time">[${timeStr}]</span>
        <span class="log-alert">WARNING: INCOMING ${threatName} DETECTED.</span><br>
        <span>AZIMUTH: ${angle}° | DISTANCE: ${distance}m</span><br>
        <span>INTERCEPTOR DEPLOYED... </span>
        <span class="log-result"></span>
    </div>`;

    // New logs prepended to top
    logContent.innerHTML = logHtml + logContent.innerHTML;
    return document.querySelector('#current-log .log-result'); 
}

// Explosion Effect
function createExplosion(x, y) {
    let explosion = document.createElement('div');
    explosion.className = 'explosion-effect';
    explosion.style.left = x + 'px';
    exp.style.top = y + 'px';
    document.body.appendChild(explosion);

    void explosion.offsetWidth; // Force Reflow
    explosion.classList.add('fade');

    // Remove after animation
    setTimeout(() => {
        explosion.remove();
    }, 400);
}

// =========================================
// 5. 스폰 포인트 데이터 및 HTML 요소 연결
// =========================================
// 사용자가 SOLVE로 추출한 고정 좌표 데이터
let targetPixelX = 1009;
let targetPixelY = 761;

const SPAWN_POINTS_FPV = [
    { id: 'F1', x: 200, y: 150 }, { id: 'F2', x: 800, y: 150 }, { id: 'F3', x: 798, y: 219 },
    { id: 'F4', x: 1178, y: 223 }, { id: 'F5', x: 804, y: 322 }, { id: 'F6', x: 995, y: 310 },
    { id: 'F7', x: 1167, y: 347 }, { id: 'F8', x: 889, y: 319 }, { id: 'F9', x: 695, y: 258 },
    { id: 'F10', x: 1087, y: 413 }, { id: 'F11', x: 956, y: 392 }, { id: 'F12', x: 1091, y: 301 },
];

const SPAWN_POINTS_RPG = [
    { id: 'R1', x: 150, y: 600 }, { id: 'R2', x: 1200, y: 600 }, { id: 'R3', x: 904, y: 554 },
    { id: 'R4', x: 1047, y: 559 }, { id: 'R5', x: 617, y: 596 }, { id: 'R6', x: 505, y: 684 },
    { id: 'R7', x: 1237, y: 606 }, { id: 'R8', x: 796, y: 563 }, { id: 'R9', x: 1147, y: 551 },
    { id: 'R10', x: 981, y: 542 }, { id: 'R11', x: 898, y: 526 },
];

const targetBox = document.getElementById('target-box'); 
const targetLabel = document.getElementById('target-label');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgGunnerLabel = document.getElementById('rpg-gunner-label');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');
const MAX_SIZE = 20; // 최대 크기 (%)

// =========================================
// 6. 동적 시뮬레이션 및 스폰 로직 (정밀 보정 버전)
// =========================================

function spawnFPV() {
    if (SPAWN_POINTS_FPV.length === 0) return;

    // 선택된 스폰 포인트의 좌표를 변수에 확실히 고정
    const spawnNode = SPAWN_POINTS_FPV[Math.floor(Math.random() * SPAWN_POINTS_FPV.length)];
    const startX = spawnNode.x;
    const startY = spawnNode.y;
    
    let timeTick = 0; 
    const isIntercepted = Math.random() <= 0.82; 
    const interceptPoint = 0.5 + (Math.random() * 0.1); 

    const logResultElement = updateSystemLog('FPV LOITERING MUNITION', startX, startY);

    // FPV 드론: 초기 위치 강제 할당 및 중앙 정렬
    targetBox.style.left = `${startX}px`;
    targetBox.style.top = `${startY}px`;
    targetBox.style.width = '0%'; 
    targetBox.style.transform = 'translate(-50%, -50%)'; // FPV는 이미 적용됨
    targetBox.style.display = 'block';
    targetLabel.innerText = 'ID: FPV (HOSTILE)';

    const interval = setInterval(() => {
        timeTick += 0.008; 
        if (timeTick > 1) timeTick = 1;

        const size = MAX_SIZE * Math.pow(timeTick, 1.5); 
        // 시작점(startX, startY)을 기준으로 한 현재 위치의 절대 픽셀 계산
        const currentX = startX + (targetPixelX - startX) * timeTick;
        const currentY = startY + (targetPixelY - startY) * timeTick;

        targetBox.style.width = `${size}%`;
        targetBox.style.left = `${currentX}px`;
        targetBox.style.top = `${currentY}px`;

        // 요격 시점 판단
        if (isIntercepted && timeTick >= interceptPoint) {
            clearInterval(interval);
            targetBox.style.display = 'none';
            // 계산된 현재 절대 좌표에 폭발 생성
            createExplosion(currentX, currentY); 
            logResultElement.innerHTML = `<span class="log-success">THREAT NEUTRALIZED.</span>`;
            setTimeout(spawnRandomThreat, 1500);
            return;
        }

        const distance = Math.sqrt(Math.pow(targetPixelX - currentX, 2) + Math.pow(targetPixelY - currentY, 2));

        if (distance <= 15 || timeTick === 1) {
            clearInterval(interval);
            targetBox.style.display = 'none';
            logResultElement.innerHTML = `<span class="log-alert">INTERCEPT FAILED. BRACE.</span>`;
            setTimeout(spawnRandomThreat, 1500); 
        }
    }, 30);
}

function spawnTerroristAndRPG() {
    if (SPAWN_POINTS_RPG.length === 0) return;

    const spawnNode = SPAWN_POINTS_RPG[Math.floor(Math.random() * SPAWN_POINTS_RPG.length)];
    const startX = spawnNode.x;
    const startY = spawnNode.y;

    const isIntercepted = Math.random() <= 0.82; 
    const interceptPoint = 0.5 + (Math.random() * 0.1); 
    let logResultElement = null; 

    rpgGunnerBox.style.transition = 'none'; 
    rpgGunnerBox.className = 'rpg-gunner-box fade-left'; 
    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.width = '5%';
    rpgGunnerBox.style.left = `${startX}px`;
    rpgGunnerBox.style.top = `${startY}px`;
    // 사수(Terrorist): 중앙 정렬 보정 추가
    rpgGunnerBox.style.transform = 'translate(-50%, -50%)'; 
    rpgGunnerLabel.innerText = 'ID: RPG GUNNER (HOSTILE)';

    void rpgGunnerBox.offsetWidth;
    rpgGunnerBox.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    rpgGunnerBox.classList.remove('fade-left');
    rpgGunnerBox.classList.add('fade-center');

    setTimeout(() => {
        let timeTick = 0;
        logResultElement = updateSystemLog('RPG-7 WARHEAD', startX, startY);

        rpgProjectileBox.style.left = `${startX}px`;
        rpgProjectileBox.style.top = `${startY}px`;
        rpgProjectileBox.style.width = '5%';
        rpgProjectileBox.style.transform = 'translate(-50%, -50%)'; // 투사체는 적용됨
        rpgProjectileBox.style.display = 'block';

        // 사수 퇴장 로직
        setTimeout(() => {
            rpgGunnerBox.classList.remove('fade-center');
            rpgGunnerBox.classList.add('fade-right');
            setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 500); 
        }, 2000);

        const interval = setInterval(() => {
            timeTick += 0.035; 
            if (timeTick > 1) timeTick = 1;

            const projSize = 5 + (MAX_SIZE - 5) * Math.pow(timeTick, 1.5);
            const currentX = startX + (targetPixelX - startX) * timeTick;
            const currentY = startY + (targetPixelY - startY) * timeTick;

            rpgProjectileBox.style.width = `${projSize}%`;
            rpgProjectileBox.style.left = `${currentX}px`;
            rpgProjectileBox.style.top = `${currentY}px`;
            // RPG 탄두: 커질 때 중앙 정렬 상태 유지 (CSS에서 Comment 제거)
            rpgProjectileBox.style.transform = 'translate(-50%, -50%)';

            if (isIntercepted && timeTick >= interceptAt) {
                clearInterval(interval);
                rpgProjectileBox.style.display = 'none';
                // 투사체의 현재 위치 좌표로 폭발 발생
                createExplosion(currentX, currentY);
                if(logResultElement) logResultElement.innerHTML = `<span class="log-success">THREAT NEUTRALIZED.</span>`;
                setTimeout(spawnRandomThreat, 1500);
                return;
            }

            const distance = Math.sqrt(Math.pow(targetPixelX - currentX, 2) + Math.pow(targetPixelY - currentY, 2));

            if (distance <= 15 || timeTick === 1) {
                clearInterval(interval);
                rpgProjectileBox.style.display = 'none';
                if(logResultElement) logResultElement.innerHTML = `<span class="log-alert">INTERCEPT FAILED. BRACE.</span>`;
                setTimeout(spawnRandomThreat, 1500);
            }
        }, 30);
    }, 500); 
}

function spawnRandomThreat() {
    if (Math.random() > 0.5) {
        spawnFPV();
    } else {
        spawnTerroristAndRPG();
    }
}

setTimeout(spawnRandomThreat, 1000);

// =========================================
// [디버그 모드 시작] - 스폰 포인트 관리 툴
// =========================================

const editorHTML = `
<div id="zone-editor-ui" style="position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.8); color:white; padding:15px; z-index:10000; font-family:monospace;">
    <strong>[디버그 툴: 스폰 포인트 설정]</strong><br>
    - 노란 원: FPV 드론 스폰 (드래그)<br>
    - 주황 사각형: RPG 사수 스폰 (드래그)<br>
    - 파란 원: 투사체 목표 지점 (드래그)<br><br>
    <button id="btn-add-fpv" style="padding:5px 10px; cursor:pointer; background:#880; color:white; border:1px solid yellow;">+ FPV 스폰</button>
    <button id="btn-add-rpg" style="padding:5px 10px; cursor:pointer; background:#840; color:white; border:1px solid orange;">+ RPG 스폰</button>
    <button id="btn-solve" style="padding:5px 10px; cursor:pointer; background:#050; color:white; border:1px solid lime;">SOLVE (코드 생성)</button><br><br>
    <textarea id="output-code" rows="12" cols="60" style="background:#222; color:lime; border:1px solid #555;"></textarea>
</div>
`;
document.body.insertAdjacentHTML('beforeend', editorHTML);

let dragTarget = null; 
let nextFpvId = 3;
let nextRpgId = 3;

// FPV 드론용 ID:TARGET
let targetPt = { id: 'TARGET', x: targetPixelX, y: targetPixelY, type: 'TARGET' };
createHandle(targetPt);

SPAWN_POINTS_FPV.forEach(pt => createHandle({...pt, type: 'FPV'}));
SPAWN_POINTS_RPG.forEach(pt => createHandle({...pt, type: 'RPG'}));

function createHandle(pt) {
    let handle = document.createElement('div');
    // position:fixed is wrong for parent container, use absolute in relative view Camera
    // 좌표가 픽셀로 변환되어 그려집니다.
    handle.style.cssText = `position:absolute; cursor:move; z-index:9999; transform:translate(-50%, -50%); border:2px solid black;`;
    handle.style.left = pt.x + 'px';
    handle.style.top = pt.y + 'px';
    handle.title = pt.id;

    if (pt.type === 'FPV') {
        handle.style.width = '16px'; handle.style.height = '16px';
        handle.style.background = 'yellow'; handle.style.borderRadius = '50%';
    } else if (pt.type === 'RPG') {
        handle.style.width = '16px'; handle.style.height = '16px';
        handle.style.background = 'orange';
    } else if (pt.type === 'TARGET') {
        handle.style.width = '20px'; handle.style.height = '20px';
        handle.style.background = 'blue'; handle.style.borderRadius = '50%';
        handle.style.border = '2px solid white';
    }

    handle.addEventListener('mousedown', (e) => {
        dragTarget = { point: pt, element: handle };
    });
    
    // Fixed handle should be appended to body, relative to absolute camera view is complex. 
    // It works, but might be fragile to view size changes.
    // 좌표 데이터를 화면 중앙에 생성합니다.
    document.body.appendChild(handle);
}

document.getElementById('btn-add-fpv').addEventListener('click', () => {
    let newPt = { id: 'F' + (nextFpvId++), x: window.innerWidth / 2, y: window.innerHeight / 2, type: 'FPV' };
    SPAWN_POINTS_FPV.push(newPt);
    createHandle(newPt);
});

document.getElementById('btn-add-rpg').addEventListener('click', () => {
    let newPt = { id: 'R' + (nextRpgId++), x: window.innerWidth / 2, y: window.innerHeight / 2, type: 'RPG' };
    SPAWN_POINTS_RPG.push(newPt);
    createHandle(newPt);
});

// 좌표를 백분율(%)로 관리합니다.
document.addEventListener('mousemove', (e) => {
    if (dragTarget) {
        dragTarget.point.x = e.pageX;
        dragTarget.point.y = e.pageY;
        dragTarget.element.style.left = e.pageX + 'px';
        dragTarget.element.style.top = e.pageY + 'px';

        if (dragTarget.point.type === 'TARGET') {
            targetPixelX = e.pageX;
            targetPixelY = e.pageY;
        }
    }
});

document.addEventListener('mouseup', () => {
    dragTarget = null;
});

document.getElementById('btn-solve').addEventListener('click', () => {
    const output = document.getElementById('output-code');
    
    let code = `let targetPixelX = ${targetPixelX};\n`;
    code += `let targetPixelY = ${targetPixelY};\n\n`;
    
    code += `const SPAWN_POINTS_FPV = [\n`;
    SPAWN_POINTS_FPV.forEach(p => { code += `    { id: '${p.id}', x: ${p.x}, y: ${p.y} },\n`; });
    code += `];\n\n`;

    code += `const SPAWN_POINTS_RPG = [\n`;
    SPAWN_POINTS_RPG.forEach(p => { code += `    { id: '${p.id}', x: ${p.x}, y: ${p.y} },\n`; });
    code += `];\n`;

    output.value = code;
});

// =========================================
// [디버그 모드 종료]
// =========================================
