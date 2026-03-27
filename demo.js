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
// 동적 타겟 추적 시뮬레이션 로직
// =========================================
const targetBox = document.getElementById('target-box');
const targetLabel = document.getElementById('target-label');

function spawnAndTrackTarget() {
    // 1. 초기 위치 및 이동 방향 설정 (화면 내 무작위 생성)
    let posX = 20 + Math.random() * 50; // Left: 20% ~ 70%
    let posY = 20 + Math.random() * 40; // Top: 20% ~ 60%
    
    // 무작위 이동 속도
    let speedX = (Math.random() - 0.5) * 0.3;
    let speedY = (Math.random() - 0.5) * 0.3;

    // 1단계: 초기 스폰 (작은 크기, UNKNOWN)
    targetBox.style.left = posX + '%';
    targetBox.style.top = posY + '%';
    targetBox.style.width = '20px';
    targetBox.style.height = '20px';
    targetLabel.innerText = 'ID: UNKNOWN';
    targetBox.style.display = 'block';

    // 2단계: 0.2초(200ms) 뒤 크기와 비율 변경
    setTimeout(() => {
        targetBox.style.width = '35px';
        targetBox.style.height = '45px';
    }, 200);

    // 3단계: 0.5초(500ms) 뒤 객체 식별 및 최종 크기 적용
    setTimeout(() => {
        const identifiedThreat = threats[Math.floor(Math.random() * threats.length)];
        targetLabel.innerText = `ID: ${identifiedThreat} (HOSTILE)`;
        targetBox.style.width = '60px';
        targetBox.style.height = '60px';
    }, 500);

    // 4단계: 객체 이동 로직 (30ms 간격으로 위치 업데이트)
    const moveInterval = setInterval(() => {
        posX += speedX;
        posY += speedY;
        targetBox.style.left = posX + '%';
        targetBox.style.top = posY + '%';

        // 객체가 화면을 일정 수준 벗어나면 추적 종료 및 재스폰
        if (posX < -10 || posX > 110 || posY < -10 || posY > 110) {
            clearInterval(moveInterval);
            targetBox.style.display = 'none';
            
            // 2초 뒤 새로운 타겟 생성
            setTimeout(spawnAndTrackTarget, 2000); 
        }
    }, 30);
}

// 스크립트 로드 후 1초 뒤 첫 타겟 생성
setTimeout(spawnAndTrackTarget, 1000);
