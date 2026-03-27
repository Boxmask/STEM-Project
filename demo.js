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
// 원근 기반 동적 시뮬레이션 로직
// =========================================
const targetBox = document.getElementById('target-box'); // FPV용
const targetLabel = document.getElementById('target-label');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgGunnerLabel = document.getElementById('rpg-gunner-label');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

// 플레이어 방향(화면 중앙 하단) 좌표 설정
const centerBottomX = 50; 
const centerBottomY = 100;

function spawnFPV() {
    let size = 0; // 크기 0에서 시작
    // 하늘(상단 0% ~ 20%) 범위에서 무작위 스폰
    let posX = 10 + Math.random() * 80;
    let posY = 0 + Math.random() * 20;

    targetBox.style.display = 'block';
    targetLabel.innerText = 'ID: FPV (HOSTILE)';

    let interval = setInterval(() => {
        size += 0.5; // 크기 증가
        posX += (centerBottomX - posX) * 0.02; // 중앙 하단으로 점진적 이동
        posY += (centerBottomY - posY) * 0.02;

        targetBox.style.width = size + '%';
        targetBox.style.height = 'auto'; 
        targetBox.style.left = posX + '%';
        targetBox.style.top = posY + '%';

        // 크기가 100 이상이 되면 제거
        if (size >= 100) {
            clearInterval(interval);
            targetBox.style.display = 'none';
            setTimeout(spawnRandomThreat, 1500); // 1.5초 뒤 다음 위협
        }
    }, 30);
}

function spawnTerroristAndRPG() {
    let gunnerSize = 5; // 테러리스트 크기
    // 건물 주변(중간 40% ~ 60%) 범위에서 무작위 스폰
    let posX = 10 + Math.random() * 80;
    let posY = 40 + Math.random() * 20;

    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.width = gunnerSize + '%';
    rpgGunnerBox.style.height = 'auto';
    rpgGunnerBox.style.left = posX + '%';
    rpgGunnerBox.style.top = posY + '%';
    rpgGunnerLabel.innerText = 'ID: RPG GUNNER (HOSTILE)';

    // 규칙 1: 3초 뒤 테러리스트 사라짐
    setTimeout(() => {
        rpgGunnerBox.style.display = 'none';
    }, 3000);

    // 테러리스트 생성 0.5초 뒤 탄두 발사
    setTimeout(() => {
        let projSize = gunnerSize; // 규칙 1-i: 탄두 크기는 테러리스트 크기와 동일하게 시작
        let projX = posX; // 테러리스트 위치에서 생성
        let projY = posY;

        rpgProjectileBox.style.display = 'block';

        let interval = setInterval(() => {
            projSize += 0.8; // 탄두 이동 속도
            projX += (centerBottomX - projX) * 0.05;
            projY += (centerBottomY - projY) * 0.05;

            rpgProjectileBox.style.width = projSize + '%';
            rpgProjectileBox.style.height = 'auto';
            rpgProjectileBox.style.left = projX + '%';
            rpgProjectileBox.style.top = projY + '%';

            // 크기가 40 이상이 되면 제거
            if (projSize >= 40) {
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
