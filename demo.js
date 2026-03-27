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
// 원근 및 곡선(Bezier) 기반 동적 시뮬레이션 로직
// =========================================
const targetBox = document.getElementById('target-box'); // FPV용
const targetLabel = document.getElementById('target-label');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgGunnerLabel = document.getElementById('rpg-gunner-label');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

// 플레이어 방향(화면 중앙 하단 - 빨간색 회피 구역) 좌표 설정
const centerBottomX = 50; 
const centerBottomY = 100;

function spawnFPV() {
    let size = 0; // 크기 0에서 시작
    
    // 자주색 구역: 하늘 (상단 5% ~ 30%, 가로 20% ~ 80%)
    let posX = 20 + Math.random() * 60;
    let posY = 5 + Math.random() * 25;

    // 곡선 궤적을 위한 2차 베지어 곡선 제어점 (P1) 설정
    let p0 = { x: posX, y: posY };
    let p2 = { x: centerBottomX, y: centerBottomY };
    let p1 = {
        x: (p0.x + p2.x) / 2 + (Math.random() * 60 - 30), // 좌우 무작위로 휘어짐
        y: (p0.y + p2.y) / 2 - 20 // 포물선 형태를 위해 위로 휘어짐
    };

    targetBox.style.display = 'block';
    targetLabel.innerText = 'ID: FPV (HOSTILE)';

    let interval = setInterval(() => {
        size += 0.15; // 기존 대비 1.5배 이상 속도 감소
        
        // 크기 30을 기준으로 진행률 t(0~1) 계산
        let t = size / 30; 
        if (t > 1) t = 1;

        // 베지어 곡선 공식에 따른 현재 X, Y 좌표 계산
        let currentX = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
        let currentY = Math.pow(1-t, 2) * p0.y + 2 * (1-t) * t * p1.y + Math.pow(t, 2) * p2.y;

        targetBox.style.width = size + '%';
        targetBox.style.height = 'auto'; 
        targetBox.style.left = currentX + '%';
        targetBox.style.top = currentY + '%';

        // 투사체 크기가 30 이상이 되면 제거
        if (size >= 30) {
            clearInterval(interval);
            targetBox.style.display = 'none';
            setTimeout(spawnRandomThreat, 1500); 
        }
    }, 30);
}

function spawnTerroristAndRPG() {
    let gunnerSize = 5; 
    
    // 파란색 구역: 좌/우 건물 주변 (가로 15~35% 또는 65~85%, 세로 45~60%)
    let isLeft = Math.random() > 0.5;
    let posX = isLeft ? 15 + Math.random() * 20 : 65 + Math.random() * 20;
    let posY = 45 + Math.random() * 15;

    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.width = gunnerSize + '%';
    rpgGunnerBox.style.height = 'auto';
    rpgGunnerBox.style.left = posX + '%';
    rpgGunnerBox.style.top = posY + '%';
    rpgGunnerLabel.innerText = 'ID: RPG GUNNER (HOSTILE)';

    setTimeout(() => {
        rpgGunnerBox.style.display = 'none';
    }, 3000);

    setTimeout(() => {
        let projSize = gunnerSize; 
        
        // RPG 궤적용 제어점 설정
        let p0 = { x: posX, y: posY };
        let p2 = { x: centerBottomX, y: centerBottomY };
        let p1 = {
            x: (p0.x + p2.x) / 2 + (isLeft ? 30 : -30), // 건물 바깥쪽으로 크게 곡선을 그림
            y: p0.y - 15 // 초기 발사 시 약간 위로 솟구침
        };

        rpgProjectileBox.style.display = 'block';

        let interval = setInterval(() => {
            projSize += 0.25; // 기존 대비 속도 감소

            let t = (projSize - gunnerSize) / (30 - gunnerSize);
            if (t > 1) t = 1;

            let currentX = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
            let currentY = Math.pow(1-t, 2) * p0.y + 2 * (1-t) * t * p1.y + Math.pow(t, 2) * p2.y;

            rpgProjectileBox.style.width = projSize + '%';
            rpgProjectileBox.style.height = 'auto';
            rpgProjectileBox.style.left = currentX + '%';
            rpgProjectileBox.style.top = currentY + '%';

            // 투사체 크기가 30 이상이 되면 제거
            if (projSize >= 30) {
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
