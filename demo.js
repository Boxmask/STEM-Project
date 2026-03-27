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

// [추가됨] 다각형 형태의 금지 구역 좌표 (초기 A,B,C,D 값 적용)
const RESTRICTED_POLY = [
    { id: 'A', x: 675, y: 644 },
    { id: 'B', x: 382, y: 860 },
    { id: 'C', x: 1552, y: 861 },
    { id: 'D', x: 1433, y: 643 }
];

// [추가됨] 다각형 내부 검사 알고리즘 (Ray-Casting)
function isRestricted(x, y) {
    let inside = false;
    for (let i = 0, j = RESTRICTED_POLY.length - 1; i < RESTRICTED_POLY.length; j = i++) {
        let xi = RESTRICTED_POLY[i].x, yi = RESTRICTED_POLY[i].y;
        let xj = RESTRICTED_POLY[j].x, yj = RESTRICTED_POLY[j].y;
        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

const targetBox = document.getElementById('target-box'); 
const targetLabel = document.getElementById('target-label');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgGunnerLabel = document.getElementById('rpg-gunner-label');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

// 고정된 목표 좌표 (픽셀 단위)
const targetPixelX = 1009; 
const targetPixelY = 741;
const MAX_SIZE = 20; 

function spawnFPV() {
    let startX, startY;

    // [수정됨] 금지 구역 판별 로직 적용
    do {
        startX = window.innerWidth * ((20 + Math.random() * 60) / 100);
        startY = window.innerHeight * ((2 + Math.random() * 10) / 100); 
    } while (isRestricted(startX, startY));
    
    let timeTick = 0; 

    targetBox.style.left = startX + 'px';
    targetBox.style.top = startY + 'px';
    targetBox.style.width = '0%'; 
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
    let gunnerSize = 5; 
    let startX, startY;
    
    // [수정됨] 금지 구역 판별 로직 적용
    do {
        let isLeft = Math.random() > 0.5;
        let startPercentX = isLeft ? 5 + Math.random() * 15 : 80 + Math.random() * 15;
        let startPercentY = 40 + Math.random() * 15;

        startX = window.innerWidth * (startPercentX / 100);
        startY = window.innerHeight * (startPercentY / 100);
    } while (isRestricted(startX, startY));

    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.width = gunnerSize + '%';
    rpgGunnerBox.style.height = 'auto';
    rpgGunnerBox.style.left = startX + 'px';
    rpgGunnerBox.style.top = startY + 'px';
    rpgGunnerLabel.innerText = 'ID: RPG GUNNER (HOSTILE)';

    setTimeout(() => {
        let timeTick = 0;

        rpgProjectileBox.style.left = startX + 'px';
        rpgProjectileBox.style.top = startY + 'px';
        rpgProjectileBox.style.width = gunnerSize + '%';
        rpgProjectileBox.style.display = 'block';

        setTimeout(() => {
            rpgGunnerBox.style.display = 'none';
        }, 2000);

        let interval = setInterval(() => {
            timeTick += 0.035; 
            if (timeTick > 1) timeTick = 1;

            let projSize = gunnerSize + (MAX_SIZE - gunnerSize) * Math.pow(timeTick, 1.5);

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
// [디버그 모드 시작] - 다각형 에디터 포함
// =========================================================================

// HTML UI를 자바스크립트를 통해 문서에 삽입
const editorHTML = `
<div id="zone-editor-ui" style="position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.8); color:white; padding:15px; z-index:10000; font-family:monospace;">
    <strong>[금지 구역 에디터]</strong><br>
    점(빨간색 사각형)을 드래그하여 구역을 설정하세요.<br><br>
    <button id="btn-solve" style="padding:5px 10px; cursor:pointer;">SOLVE (코드 생성)</button><br><br>
    <textarea id="output-code" rows="10" cols="60" style="background:#222; color:lime; border:1px solid #555;"></textarea>
</div>
<svg id="zone-svg" style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9998;">
    <polygon id="zone-polygon" points="" style="fill:rgba(255,0,0,0.3); stroke:red; stroke-width:2;"></polygon>
</svg>
`;
document.body.insertAdjacentHTML('beforeend', editorHTML);

const corners = RESTRICTED_POLY; // 위에서 선언한 배열을 참조
const handles = [];
let dragIndex = -1;

corners.forEach((corner, index) => {
    let handle = document.createElement('div');
    handle.style.cssText = `position:fixed; width:16px; height:16px; background:red; border:2px solid white; cursor:move; z-index:9999; transform:translate(-50%, -50%);`;
    handle.style.left = corner.x + 'px';
    handle.style.top = corner.y + 'px';
    handle.title = corner.id;
    
    handle.addEventListener('mousedown', (e) => {
        dragIndex = index;
    });
    
    document.body.appendChild(handle);
    handles.push(handle);
});

document.addEventListener('mousemove', (e) => {
    if (dragIndex !== -1) {
        corners[dragIndex].x = e.pageX;
        corners[dragIndex].y = e.pageY;
        handles[dragIndex].style.left = e.pageX + 'px';
        handles[dragIndex].style.top = e.pageY + 'px';
        drawPolygon();
    }
});

document.addEventListener('mouseup', () => {
    dragIndex = -1;
});

function drawPolygon() {
    const polygon = document.getElementById('zone-polygon');
    const pointsStr = corners.map(c => `${c.x},${c.y}`).join(' ');
    polygon.setAttribute('points', pointsStr);
}

drawPolygon();

document.getElementById('btn-solve').addEventListener('click', () => {
    const output = document.getElementById('output-code');
    
    let code = `// 아래 코드를 복사하여 기존 RESTRICTED_POLY 부분을 대체하세요.\n`;
    code += `const RESTRICTED_POLY = [\n`;
    corners.forEach(c => {
        code += `    { id: '${c.id}', x: ${c.x}, y: ${c.y} },\n`;
    });
    code += `];\n`;

    output.value = code;
});

// =========================================================================
// [디버그 모드 종료]
// =========================================================================
