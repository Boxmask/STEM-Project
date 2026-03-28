// =========================================
// 1. [교정] 퍼센트 기반 좌표 데이터
// =========================================
// 화면 왼쪽에서 몇 %, 위에서 몇 % 지점인지로 계산됨
let targetX_pc = 84.08; // 목표 지점 X%
let targetY_pc = 112.74; // 목표 지점 Y%

const SPAWN_POINTS_FPV = [
    { x_pc: 16.67, y_pc: 22.22 }, { x_pc: 66.67, y_pc: 22.22 }, { x_pc: 66.50, y_pc: 32.44 },
    { x_pc: 98.17, y_pc: 33.04 }, { x_pc: 67.00, y_pc: 47.70 }, { x_pc: 82.92, y_pc: 45.93 },
    { x_pc: 97.25, y_pc: 51.41 }, { x_pc: 74.08, y_pc: 47.26 }, { x_pc: 57.92, y_pc: 38.22 },
    { x_pc: 90.58, y_pc: 61.19 }, { x_pc: 79.67, y_pc: 58.07 }, { x_pc: 90.92, y_pc: 44.59 }
];

const SPAWN_POINTS_RPG = [
    { x_pc: 12.50, y_pc: 88.89 }, { x_pc: 100.00, y_pc: 88.89 }, { x_pc: 75.33, y_pc: 82.07 },
    { x_pc: 87.25, y_pc: 82.81 }, { x_pc: 51.42, y_pc: 88.30 }, { x_pc: 42.08, y_pc: 101.33 },
    { x_pc: 103.08, y_pc: 89.78 }, { x_pc: 66.33, y_pc: 83.41 }, { x_pc: 95.58, y_pc: 81.63 },
    { x_pc: 81.75, y_pc: 80.30 }, { x_pc: 74.83, y_pc: 77.93 }
];

// =========================================
// 2. [교정] 정밀 스폰 및 이동 엔진
// =========================================

function launchProjectile(box, startX_pc, startY_pc, speed, baseSize, willIntercept, interceptAt, logRes) {
    let timeTick = 0;

    // 시작 시점에 위치를 즉시 할당 (이전 위치 잔상 제거)
    box.style.left = startX_pc + '%';
    box.style.top = startY_pc + '%';
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)'; 

    const moveLoop = setInterval(() => {
        timeTick += speed;
        if (timeTick > 1) timeTick = 1;

        // 모든 계산은 % 단위로 진행되어 화면 크기에 영향을 받지 않음
        const curX = startX_pc + (targetX_pc - startX_pc) * timeTick;
        const curY = startY_pc + (targetY_pc - startY_pc) * timeTick;
        const curSize = baseSize + (20 - baseSize) * Math.pow(timeTick, 1.5);

        box.style.left = curX + '%';
        box.style.top = curY + '%';
        box.style.width = curSize + '%';

        if (willIntercept && timeTick >= interceptAt) {
            clearInterval(moveLoop);
            box.style.display = 'none';
            
            // 폭발 이펙트 위치를 %에서 px로 변환하여 생성
            const viewRect = viewCamera.getBoundingClientRect();
            const expX = (curX / 100) * viewRect.width;
            const expY = (curY / 100) * viewRect.height;
            createExplosion(expX, expY);
            
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
            setTimeout(nextWave, 1500);
            return;
        }

        if (timeTick >= 1) {
            clearInterval(moveLoop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT!</span>`;
            setTimeout(nextWave, 1500);
        }
    }, 30);
}

function startAttack(type) {
    const isFPV = type === 'FPV';
    const points = isFPV ? SPAWN_POINTS_FPV : SPAWN_POINTS_RPG;
    const spawn = points[Math.floor(Math.random() * points.length)];
    const box = isFPV ? targetBox : rpgProjectileBox;
    
    const startX = spawn.x_pc;
    const startY = spawn.y_pc;
    const willIntercept = Math.random() <= INTERCEPT_CHANCE;
    const interceptAt = 0.5 + (Math.random() * 0.1);

    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG-7', startX, startY);

    if (!isFPV) {
        // 사수도 % 좌표로 배치
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = startX + '%';
        rpgGunnerBox.style.top = startY + '%';
        rpgGunnerBox.className = 'rpg-gunner-box fade-left';
        void rpgGunnerBox.offsetWidth;
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

let dragTarget = null; 
let nextFpvId = 3;
let nextRpgId = 3;

let targetPt = { id: 'TARGET', x: targetPixelX, y: targetPixelY, type: 'TARGET' };
createHandle(targetPt);

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

// =========================================================================
// [디버그 모드 종료]
// =========================================================================
