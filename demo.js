// =========================================
// 1. 고정 데이터 및 시스템 설정 (퍼센트% 기반으로 교정)
// =========================================

// [교정] 목표 및 스폰 지점을 화면 대비 % 좌표로 관리합니다.
let targetX_pc = 84.08;
let targetY_pc = 85;

const SPAWN_POINTS_FPV = [
    { x_pc: 37.04, y_pc: 8.77 },
    { x_pc: 66.67, y_pc: 22.22 },
    { x_pc: 54.52, y_pc: 34.93 },
    { x_pc: 88.63, y_pc: 6.09 },
    { x_pc: 25.50, y_pc: 7.73 },
    { x_pc: 82.92, y_pc: 45.93 },
    { x_pc: 36.54, y_pc: 26.31 },
    { x_pc: 74.08, y_pc: 47.26 },
    { x_pc: 62.37, y_pc: 28.39 },
    { x_pc: 43.98, y_pc: 20.81 },
    { x_pc: 49.92, y_pc: 21.11 },
    { x_pc: 65.22, y_pc: 8.77 },
];

const SPAWN_POINTS_RPG = [
    { x_pc: 21.49, y_pc: 61.39 },
    { x_pc: 67.73, y_pc: 58.12 },
    { x_pc: 61.45, y_pc: 52.47 },
    { x_pc: 52.17, y_pc: 59.01 },
    { x_pc: 36.20, y_pc: 52.32 },
    { x_pc: 42.08, y_pc: 101.33 },
    { x_pc: 103.08, y_pc: 89.78 },
    { x_pc: 48.58, y_pc: 50.69 },
    { x_pc: 33.70, y_pc: 63.47 },
    { x_pc: 87.63, y_pc: 58.27 },
    { x_pc: 7.19, y_pc: 77.74 },
];

const INTERCEPT_CHANCE = 0.82; 
const MAX_SIZE = 20;

// =========================================
// 2. 핵심 시뮬레이션 엔진
// =========================================

function createExplosion(x_pc, y_pc) {
    const exp = document.createElement('div');
    exp.className = 'explosion-effect';
    // % 위치를 그대로 적용 (CSS에서 부모 relative 설정 필요)
    exp.style.left = `${x_pc}%`;
    exp.style.top = `${y_pc}%`;
    viewCamera.appendChild(exp);
    void exp.offsetWidth; 
    exp.classList.add('fade');
    setTimeout(() => exp.remove(), 400);
}

function updateHUD(name, startX_pc, startY_pc) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    
    // % 좌표를 이용한 방위각 계산
    const dx = startX_pc - targetX_pc;
    const dy = startY_pc - targetY_pc;
    let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
    if (angle < 0) angle += 360;
    
    // 화면 실제 픽셀 너비를 기준으로 거리 계산 (시각적 보정)
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 5.5);

    turretBar.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    azimuthVal.innerText = angle;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-alert">${name} DETECTED.</span><br>
                       <span>AZIMUTH: ${angle}° | DIST: ${dist}m</span> <span class="res">...</span>`;
    logContent.prepend(entry);
    return entry.querySelector('.res');
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

    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG WARHEAD', startX, startY);

    if (!isFPV) {
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = `${startX}%`;
        rpgGunnerBox.style.top = `${startY}%`;
        rpgGunnerBox.className = 'rpg-gunner-box fade-left';
        void rpgGunnerBox.offsetWidth;
        rpgGunnerBox.classList.replace('fade-left', 'fade-center');

        setTimeout(() => launch(box, startX, startY, 0.035, 5, willIntercept, interceptAt, logRes), 600);
        setTimeout(() => {
            rpgGunnerBox.classList.replace('fade-center', 'fade-right');
            setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 500);
        }, 2000);
    } else {
        launch(box, startX, startY, 0.008, 0, willIntercept, interceptAt, logRes);
    }
}

function launch(box, startX, startY, speed, baseSize, willIntercept, interceptAt, logRes) {
    let timeTick = 0;
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)';

    const loop = setInterval(() => {
        timeTick += speed;
        if (timeTick > 1) timeTick = 1;

        const curX = startX + (targetX_pc - startX) * timeTick;
        const curY = startY + (targetY_pc - startY) * timeTick;
        const curSize = baseSize + (MAX_SIZE - baseSize) * Math.pow(timeTick, 1.5);

        box.style.left = `${curX}%`;
        box.style.top = `${curY}%`;
        box.style.width = `${curSize}%`;

        if (willIntercept && timeTick >= interceptAt) {
            clearInterval(loop);
            box.style.display = 'none';
            createExplosion(curX, curY);
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
            setTimeout(nextWave, 1500);
            return;
        }

        if (timeTick >= 1) {
            clearInterval(loop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT!</span>`;
            setTimeout(nextWave, 1500);
        }
    }, 30);
}

function nextWave() {
    startAttack(Math.random() > 0.5 ? 'FPV' : 'RPG');
}

// UI 이벤트 리스너
document.getElementById('btn-camera').onclick = () => {
    viewCamera.classList.add('active'); 
    document.getElementById('log-view').classList.remove('active');
    document.getElementById('btn-camera').classList.add('active');
    document.getElementById('btn-log').classList.remove('active');
};
document.getElementById('btn-log').onclick = () => {
    document.getElementById('log-view').classList.add('active');
    viewCamera.classList.remove('active');
    document.getElementById('btn-log').classList.add('active');
    document.getElementById('btn-camera').classList.remove('active');
};

setInterval(() => {
    document.getElementById('hud-time-display').innerText = new Date().toTimeString().split(' ')[0];
}, 1000);

viewCamera.onclick = () => {
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

setTimeout(nextWave, 1000);

// =========================================================================
// [디버그 모드] - 반응형(%) 스폰 포인트 관리 툴
// =========================================================================

const editorHTML = `
<div id="zone-editor-ui" style="position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.9); color:white; padding:15px; z-index:10000; font-family:monospace; border:1px solid #555;">
    <strong>[반응형 디버그 툴]</strong><br>
    - 점들은 카메라 화면 내부(%)로 고정됩니다.<br><br>
    <button id="btn-add-fpv" style="padding:5px; cursor:pointer; background:#880; color:white;">+ FPV</button>
    <button id="btn-add-rpg" style="padding:5px; cursor:pointer; background:#840; color:white;">+ RPG</button>
    <button id="btn-solve" style="padding:5px; cursor:pointer; background:#050; color:white; border:1px solid lime;">SOLVE</button><br><br>
    <textarea id="output-code" rows="10" cols="55" style="background:#111; color:lime; border:1px solid #444; font-size:11px;"></textarea>
</div>
`;
document.body.insertAdjacentHTML('beforeend', editorHTML);

let dragTarget = null;

function createHandle(pt, type) {
    const handle = document.createElement('div');
    // 초기 픽셀 좌표가 들어올 경우 %로 자동 변환하여 핸들 배치
    let left = pt.x_pc || (pt.x / viewCamera.offsetWidth * 100);
    let top = pt.y_pc || (pt.y / viewCamera.offsetHeight * 100);
    
    handle.style.cssText = `position:absolute; cursor:move; z-index:9999; transform:translate(-50%, -50%); border:1px solid #000;`;
    handle.style.left = left + '%';
    handle.style.top = top + '%';
    
    pt.x_pc = left.toFixed(2);
    pt.y_pc = top.toFixed(2);

    if (type === 'FPV') {
        handle.style.width = '14px'; handle.style.height = '14px';
        handle.style.background = 'yellow'; handle.style.borderRadius = '50%';
    } else if (type === 'RPG') {
        handle.style.width = '14px'; handle.style.height = '14px';
        handle.style.background = 'orange';
    } else {
        handle.style.width = '20px'; handle.style.height = '20px';
        handle.style.background = 'blue'; handle.style.borderRadius = '50%';
        handle.style.border = '2px solid white';
    }

    handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        dragTarget = { point: pt, element: handle };
    });
    viewCamera.appendChild(handle);
}

// 초기 핸들 생성
SPAWN_POINTS_FPV.forEach(pt => createHandle(pt, 'FPV'));
SPAWN_POINTS_RPG.forEach(pt => createHandle(pt, 'RPG'));
createHandle({id: 'TARGET', x_pc: targetX_pc, y_pc: targetY_pc}, 'TARGET');

document.addEventListener('mousemove', (e) => {
    if (dragTarget) {
        const rect = viewCamera.getBoundingClientRect();
        let x_pc = ((e.clientX - rect.left) / rect.width) * 100;
        let y_pc = ((e.clientY - rect.top) / rect.height) * 100;

        dragTarget.point.x_pc = x_pc.toFixed(2);
        dragTarget.point.y_pc = y_pc.toFixed(2);
        dragTarget.element.style.left = x_pc + '%';
        dragTarget.element.style.top = y_pc + '%';

        if (dragTarget.point.id === 'TARGET') {
            targetX_pc = x_pc.toFixed(2);
            targetY_pc = y_pc.toFixed(2);
        }
    }
});

document.addEventListener('mouseup', () => { dragTarget = null; });

document.getElementById('btn-add-fpv').onclick = () => createHandle({id:'F_NEW', x_pc:50, y_pc:50}, 'FPV');
document.getElementById('btn-add-rpg').onclick = () => createHandle({id:'R_NEW', x_pc:50, y_pc:50}, 'RPG');

document.getElementById('btn-solve').onclick = () => {
    const output = document.getElementById('output-code');
    let code = `let targetX_pc = ${targetX_pc};\nlet targetY_pc = ${targetY_pc};\n\n`;
    code += `const SPAWN_POINTS_FPV = [\n`;
    SPAWN_POINTS_FPV.forEach(p => { code += `    { x_pc: ${p.x_pc}, y_pc: ${p.y_pc} },\n`; });
    code += `];\n\nconst SPAWN_POINTS_RPG = [\n`;
    SPAWN_POINTS_RPG.forEach(p => { code += `    { x_pc: ${p.x_pc}, y_pc: ${p.y_pc} },\n`; });
    code += `];`;
    output.value = code;
};
