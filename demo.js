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
// 비선형 크기 증가(커브) 동적 시뮬레이션 로직
// =========================================
const targetBox = document.getElementById('target-box'); // FPV용
const targetLabel = document.getElementById('target-label');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgGunnerLabel = document.getElementById('rpg-gunner-label');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

// 플레이어 방향(화면 중앙 하단)
const centerBottomX = 50; 
const centerBottomY = 100;
const MAX_SIZE = 20; // 모든 투사체의 최대 크기

function spawnFPV() {
    // 중앙을 피하기 위해 최상단 구역 중 무작위 스폰
    let startX = 20 + Math.random() * 60;
    let startY = 2 + Math.random() * 10; 
    
    let timeTick = 0; // 진행 시간(0 ~ 1)

    targetBox.style.display = 'block';
    targetLabel.innerText = 'ID: FPV (HOSTILE)';

    let interval = setInterval(() => {
        // 수정됨: 드론이 날아오는 속도 감소 (기존 0.015 -> 0.008)
        timeTick += 0.008; 
        
        if (timeTick > 1) timeTick = 1;

        // 크기 증가율 커브 적용 (t^1.5 곡선 함수로 서서히 커지다 급격히 커짐)
        let size = MAX_SIZE * Math.pow(timeTick, 1.5); 

        // 직선 이동 보간
        let currentX = startX + (centerBottomX - startX) * timeTick;
        let currentY = startY + (centerBottomY - startY) * timeTick;

        targetBox.style.width = size + '%';
        targetBox.style.height = 'auto'; 
        targetBox.style.left = currentX + '%';
        targetBox.style.top = currentY + '%';

        // 크기 20 이상 도달 시 소멸
        if (size >= MAX_SIZE) {
            clearInterval(interval);
            targetBox.style.display = 'none';
            setTimeout(spawnRandomThreat, 1500); 
        }
    }, 30);
}

function spawnTerroristAndRPG() {
    let gunnerSize = 5; 
    
    // 안전 구역을 크게 확보하기 위해 화면 양 끝단 극단에 배치
    let isLeft = Math.random() > 0.5;
    let startX = isLeft ? 5 + Math.random() * 15 : 80 + Math.random() * 15;
    let startY = 40 + Math.random() * 15;

    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.width = gunnerSize + '%';
    rpgGunnerBox.style.height = 'auto';
    rpgGunnerBox.style.left = startX + '%';
    rpgGunnerBox.style.top = startY + '%';
    rpgGunnerLabel.innerText = 'ID: RPG GUNNER (HOSTILE)';

    setTimeout(() => {
        rpgGunnerBox.style.display = 'none';
    }, 3000);

    setTimeout(() => {
        let timeTick = 0;
        rpgProjectileBox.style.display = 'block';

        let interval = setInterval(() => {
            // 수정됨: RPG 탄두가 날아오는 속도 증가 (기존 0.02 -> 0.035)
            timeTick += 0.035; 

            if (timeTick > 1) timeTick = 1;

            // 크기 증가 커브 적용: 시작 크기(gunnerSize)에서 목표 크기(20)까지 곡선 함수로 도달
            let projSize = gunnerSize + (MAX_SIZE - gunnerSize) * Math.pow(timeTick, 1.5);

            // 직선 이동 보간
            let currentX = startX + (centerBottomX - startX) * timeTick;
            let currentY = startY + (centerBottomY - startY) * timeTick;

            rpgProjectileBox.style.width = projSize + '%';
            rpgProjectileBox.style.height = 'auto';
            rpgProjectileBox.style.left = currentX + '%';
            rpgProjectileBox.style.top = currentY + '%';

            // 크기 20 이상 도달 시 소멸
            if (projSize >= MAX_SIZE) {
                clearInterval(interval);
                rpgProjectileBox.style.display = 'none';
                setTimeout(spawnRandomThreat, 1500);
            }
        }, 30);
    }, 500);
}

// 두 가지 위협 중 무작위 선택하여 스폰
function spawnRandomThreat() {
    if (Math.random() > 0.5) {
        spawnFPV();
    } else {
        spawnTerroristAndRPG();
    }
}

// 최초 스폰 시작
setTimeout(spawnRandomThreat, 1000);


// =========================================================================
// [디버그 모드 시작] - 나중에 배포 시 아래 블록만 전체 삭제 또는 주석 처리하면 됩니다.
// =========================================================================
const debugUI = document.createElement('div');
debugUI.style.cssText = 'position:fixed; top:10px; right:10px; background:rgba(0,0,0,0.8); color:lime; padding:10px; font-family:monospace; font-size:12px; z-index:9999; pointer-events:none; border:1px solid lime;';
document.body.appendChild(debugUI);

let currentMouseX = 0;
let currentMouseY = 0;

document.addEventListener('mousemove', (e) => {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
});

setInterval(() => {
    let htmlStr = `<strong>[SYSTEM DEBUG INFO]</strong><br><br>`;
    htmlStr += `Cursor Pos (px): X: ${currentMouseX}, Y: ${currentMouseY}<br><br>`;

    if (targetBox.style.display === 'block') {
        htmlStr += `[FPV DRONE]<br>`;
        htmlStr += `Width: ${targetBox.style.width}<br>`;
        htmlStr += `Pos: X: ${targetBox.style.left}, Y: ${targetBox.style.top}<br><br>`;
    }

    if (rpgProjectileBox.style.display === 'block') {
        htmlStr += `[RPG PROJECTILE]<br>`;
        htmlStr += `Width: ${rpgProjectileBox.style.width}<br>`;
        htmlStr += `Pos: X: ${rpgProjectileBox.style.left}, Y: ${rpgProjectileBox.style.top}<br>`;
    }

    if (targetBox.style.display !== 'block' && rpgProjectileBox.style.display !== 'block') {
        htmlStr += `Active Projectiles: None`;
    }

    debugUI.innerHTML = htmlStr;
}, 50);
// =========================================================================
// [디버그 모드 종료]
// =========================================================================
