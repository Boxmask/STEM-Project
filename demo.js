// 1. 화면 전환 기능
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

// 2. HUD 실시간 시계 기능
const timeDisplay = document.getElementById('hud-time-display');
setInterval(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeDisplay.innerText = `${hours}:${minutes}:${seconds}`;
}, 1000);

// 3. 카메라 모드 전환
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

// 4. 가상 로그 생성 및 포탑 각도 연동 기능
const logContent = document.getElementById('log-content');
const turretBar = document.getElementById('turret-bar');
const azimuthVal = document.getElementById('azimuth-val');
const threats = ['ATGM', 'RPG-7', 'Loitering Munition'];

setInterval(() => {
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');

    const randomThreat = threats[Math.floor(Math.random() * threats.length)];
    const isSuccess = Math.random() > 0.1; 
    const randomAzimuth = Math.floor(Math.random() * 360);
    const randomDistance = Math.floor(Math.random() * 800) + 100;

    turretBar.style.transform = `translate(-50%, -100%) rotate(${randomAzimuth}deg)`;
    azimuthVal.innerText = randomAzimuth;

    let logHtml = `<div class="log-entry">
        <span class="log-time">[${timeStr}]</span>
        <span class="log-alert">WARNING: INCOMING ${randomThreat} DETECTED.</span><br>
        <span>AZIMUTH: ${randomAzimuth}° | DISTANCE: ${randomDistance}m</span><br>
        <span>INTERCEPTOR DEPLOYED... </span>`;

    if (isSuccess) {
        logHtml += `<span class="log-success">THREAT NEUTRALIZED.</span>`;
    } else {
        logHtml += `<span class="log-alert">INTERCEPT FAILED. BRACE.</span>`;
    }
    logHtml += `</div>`;

    logContent.innerHTML = logHtml + logContent.innerHTML; 
}, 3500);

// =========================================
// 동적 시뮬레이션 및 스폰 포인트 로직
// =========================================

// 추출한 목표 좌표 및 스폰 포인트 데이터 (초기값)
let targetPixelX = 1009;
let targetPixelY = 761;

const SPAWN_POINTS_FPV = [
    { id: 'F1', x: 200, y: 150 },
    { id: 'F2', x: 800, y: 150 }
];

const SPAWN_POINTS_RPG = [
    { id: 'R1', x: 150, y: 600 },
    { id: 'R2', x: 1200, y: 600 }
];

const targetBox = document.getElementById('target-box'); 
const targetLabel = document.getElementById('target-label');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgGunnerLabel = document.getElementById('rpg-gunner-label');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

const MAX_SIZE = 20; 

function spawnFPV() {
    if (SPAWN_POINTS_FPV.length === 0) return;

    // 등록된 FPV 스폰 포인트 중 무작위 하나 선택
    let spawnNode = SPAWN_POINTS_FPV[Math.floor(Math.random() * SPAWN_POINTS_FPV.length)];
    let startX = spawnNode.x;
    let startY = spawnNode.y;
    
    let timeTick = 0; 

    targetBox.style.left = startX + 'px';
    targetBox.style.top = startY + 'px';
    targetBox.style.width = '0%'; 
    targetBox.style.transform = 'translate(-50%, -50%)'; // 중심점 정렬 보정
    targetBox.style.display = 'block';
    targetLabel.innerText = 'ID: FPV (HOSTILE)';

    let interval = setInterval(() => {
        timeTick += 0.008; 
        if (timeTick > 1) timeTick = 1;

        let size = MAX_SIZE * Math.pow(timeTick, 1.5); 

        let currentX = startX + (targetPixelX - startX) * timeTick;
        let currentY = startY + (targetPixelY - startY) * timeTick;

        targetBox.style.width = size + '%';
        targetBox.style.height = 'auto'; 
        targetBox.style.left = currentX + 'px';
        targetBox.style.top = currentY + 'px';

        let distance = Math.sqrt(Math.pow(targetPixelX - currentX, 2) + Math.pow(targetPixelY - currentY, 2));

        if (distance <= 10 || timeTick === 1) {
            clearInterval(interval);
            targetBox.style.display = 'none';
            setTimeout(spawnRandomThreat, 1500); 
        }
    }, 30);
}

function spawnTerroristAndRPG() {
    if (SPAWN_POINTS_RPG.length === 0) return;

    // 등록된 RPG 사수 스폰 포인트 중 무작위 하나 선택
    let spawnNode = SPAWN_POINTS_RPG[Math.floor(Math.random() * SPAWN_POINTS_RPG.length)];
    let startX = spawnNode.x;
    let startY = spawnNode.y;

    rpgGunnerBox.style.transition = 'none'; 
    rpgGunnerBox.className = 'rpg-gunner-box fade-left'; 
    
    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.width = '5%';
    rpgGunnerBox.style.height = 'auto';
    rpgGunnerBox.style.left = startX + 'px';
    rpgGunnerBox.style.top = startY + 'px';
    rpgGunnerLabel.innerText = 'ID: RPG GUNNER (HOSTILE)';

    void rpgGunnerBox.offsetWidth;

    rpgGunnerBox.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    rpgGunnerBox.classList.remove('fade-left');
    rpgGunnerBox.classList.add('fade-center');

    setTimeout(() => {
        let timeTick = 0;

        rpgProjectileBox.style.left = startX + 'px';
        rpgProjectileBox.style.top = startY + 'px';
        rpgProjectileBox.style.width = '5%';
        rpgProjectileBox.style.transform = 'translate(-50%, -50%)'; // 중심점 정렬 보정
        rpgProjectileBox.style.display = 'block';

        setTimeout(() => {
            rpgGunnerBox.classList.remove('fade-center');
            rpgGunnerBox.classList.add('fade-right');
            
            setTimeout(() => {
                rpgGunnerBox.style.display = 'none';
            }, 500); 
        }, 2000);

        let interval = setInterval(() => {
            timeTick += 0.035; 
            if (timeTick > 1) timeTick = 1;

            let projSize = 5 + (MAX_SIZE - 5) * Math.pow(timeTick, 1.5);

            let currentX = startX + (targetPixelX - startX) * timeTick;
            let currentY = startY + (targetPixelY - startY) * timeTick;

            rpgProjectileBox.style.width = projSize + '%';
            rpgProjectileBox.style.height = 'auto';
            rpgProjectileBox.style.left = currentX + 'px';
            rpgProjectileBox.style.top = currentY + 'px';

            let distance = Math.sqrt(Math.pow(targetPixelX - currentX, 2) + Math.pow(targetPixelY - currentY, 2));

            if (distance <= 10 || timeTick === 1) {
                clearInterval(interval);
                rpgProjectileBox.style.display = 'none';
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

// =========================================================================
// [디버그 모드 시작] - 스폰 포인트 관리 툴
// =========================================================================

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

let dragTarget = null; // 현재 드래그 중인 포인트 객체 정보
let nextFpvId = 3;
let nextRpgId = 3;

// 목표 지점 핸들 생성
let targetPt = { id: 'TARGET', x: targetPixelX, y: targetPixelY, type: 'TARGET' };
createHandle(targetPt);

// 초기 스폰 포인트 핸들 생성
SPAWN_POINTS_FPV.forEach(pt => createHandle({...pt, type: 'FPV'}));
SPAWN_POINTS_RPG.forEach(pt => createHandle({...pt, type: 'RPG'}));

function createHandle(pt) {
    let handle = document.createElement('div');
    handle.style.cssText = `position:fixed; cursor:move; z-index:9999; transform:translate(-50%, -50%); border:2px solid black;`;
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
    
    document.body.appendChild(handle);
}

// 점 추가 버튼 이벤트
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

// 드래그 조작 연동
document.addEventListener('mousemove', (e) => {
    if (dragTarget) {
        dragTarget.point.x = e.pageX;
        dragTarget.point.y = e.pageY;
        dragTarget.element.style.left = e.pageX + 'px';
        dragTarget.element.style.top = e.pageY + 'px';

        // 목표 지점이 변경되었을 경우 전역 변수 동기화
        if (dragTarget.point.type === 'TARGET') {
            targetPixelX = e.pageX;
            targetPixelY = e.pageY;
        }
    }
});

document.addEventListener('mouseup', () => {
    dragTarget = null;
});

// 출력 연동
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

// =========================================================================
// [디버그 모드 종료]
// =========================================================================
