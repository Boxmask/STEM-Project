// =========================================
// 1. 고정 데이터 및 시스템 설정 (퍼센트% 기반으로 교정)
// =========================================

// 목표 지점은 화면 대비 % 좌표로 관리합니다.
let targetX_pc = 84.08; 
let targetY_pc = 85.00; 

// FPV와 RPG의 스폰 포인트 데이터를 %로 관리합니다.
const SPAWN_POINTS_FPV = [
    { id: 'F1', x_pc: 16.67, y_pc: 22.22 }, { id: 'F2', x: 800, y: 150 }, { id: 'F3', x: 798, y: 219 },
    { id: 'F4', x: 1178, y: 223 }, { id: 'F5', x: 804, y: 322 }, { id: 'F6', x: 995, y: 310 },
    { id: 'F7', x: 1167, y: 347 }, { id: 'F8', x: 889, y: 319 }, { id: 'F9', x: 695, y: 258 },
    { id: 'F10', x: 1087, y: 413 }, { id: 'F11', x: 956, y: 392 }, { id: 'F12', x: 1091, y: 301 }
];

const SPAWN_POINTS_RPG = [
    { id: 'R1', x_pc: 12.50, y_pc: 88.89 }, { id: 'R2', x: 1200, y: 600 }, { id: 'R3', x: 904, y: 554 },
    { id: 'R4', x: 1047, y: 559 }, { id: 'R5', x: 617, y: 596 }, { id: 'R6', x: 505, y: 684 },
    { id: 'R7', x: 1237, y: 606 }, { id: 'R8', x: 796, y: 563 }, { id: 'R9', x: 1147, y: 551 },
    { id: 'R10', x: 981, y: 542 }, { id: 'R11', x: 898, y: 526 }
];

// DOM 참조 (HTML 구조에 맞춰 전역 선언)
const viewCamera = document.getElementById('camera-view');
const viewLog = document.getElementById('log-view');
const logContent = document.getElementById('log-content');
const turretBar = document.getElementById('turret-bar');
const azimuthVal = document.getElementById('azimuth-val');
const targetBox = document.getElementById('target-box');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');
const cameraModeVal = document.getElementById('camera-mode-val');
const hudStatusVal = document.getElementById('hud-status-val');

const INTERCEPT_CHANCE = 0.82; 
const MAX_SIZE = 20;

// =========================================
// 2. 핵심 시뮬레이션 엔진
// =========================================

function createExplosion(x_pc, y_pc) {
    const exp = document.createElement('div');
    exp.className = 'explosion-effect';
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
    const dx = startX_pc - targetX_pc;
    const dy = startY_pc - targetY_pc;
    
    // 방위각 계산 보정
    let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
    if (angle < 0) angle += 360;
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
        
        setTimeout(() => launchProjectile(box, startX, startY, 0.035, 5, willIntercept, interceptAt, logRes), 600);
        setTimeout(() => {
            rpgGunnerBox.classList.replace('fade-center', 'fade-right');
            setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 500);
        }, 2000);
    } else {
        launchProjectile(box, startX, startY, 0.008, 0, willIntercept, interceptAt, logRes);
    }
}

function launchProjectile(box, startX_pc, startY_pc, speed, baseSize, willIntercept, interceptAt, logRes) {
    let timeTick = 0;
    box.style.left = startX_pc + '%';
    box.style.top = startY_pc + '%';
    box.style.width = baseSize + '%';
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)'; 

    const moveLoop = setInterval(() => {
        timeTick += speed;
        if (timeTick > 1) timeTick = 1;

        const curX = startX_pc + (targetX_pc - startX_pc) * timeTick;
        const curY = startY_pc + (targetY_pc - startY_pc) * timeTick;
        const curSize = baseSize + (MAX_SIZE - baseSize) * Math.pow(timeTick, 1.5);

        box.style.width = curSize + '%';
        box.style.left = curX + '%';
        box.style.top = curY + '%';

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

// UI 이벤트 리스너
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
    document.getElementById('hud-time-display').innerText = new Date().toTimeString().split(' ')[0];
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
// [디버그 모드 시작] - 반응형(%) 스폰 포인트 관리 툴
// =========================================================================

const editorHTML = `
<div id="path-editor" style="position:fixed; bottom:10px; right:10px; background:rgba(0,0,0,0.9); color:white; padding:15px; z-index:10000; font-family:monospace; width:340px; border:1px solid cyan;">
    <strong>[COMBAT SCENARIO DIRECTOR]</strong><br>
    - 실제 이미지를 움직여 경로를 설계하세요.<br><br>
    
    <div id="path-list" style="max-height:300px; overflow-y:auto; margin-bottom:10px; padding-right:5px;"></div>
    
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
        <button id="add-fpv-path" style="background:#880; color:white; border:none; padding:8px; cursor:pointer;">+ FPV 경로</button>
        <button id="add-rpg-path" style="background:#840; color:white; border:none; padding:8px; cursor:pointer;">+ RPG 경로</button>
    </div>
    <button id="solve-new" style="background:cyan; color:black; font-weight:bold; margin-top:10px; width:100%; border:none; padding:8px; cursor:pointer;">좌표 데이터 추출 (SOLVE)</button>
</div>
<svg id="path-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9000;"></svg>
`;
document.body.insertAdjacentHTML('beforeend', editorHTML);

let scenarios = []; 
const pathSvg = document.getElementById('path-svg');

function addScenario(type) {
    const id = type + "_" + (scenarios.length + 1);
    const newScenario = {
        id: id,
        type: type,
        startX: 20, startY: 20, startSize: 5,
        endX: 84, endY: 85, endSize: 20
    };
    scenarios.push(newScenario);
    refreshEditor();
}

function refreshEditor() {
    const list = document.getElementById('object-list') || document.getElementById('path-list');
    list.innerHTML = '';
    pathSvg.innerHTML = '';
    
    // 기존 미리보기 이미지 및 핸들 제거
    document.querySelectorAll('.scenario-preview, .path-handle').forEach(el => el.remove());

    scenarios.forEach((s, idx) => {
        // UI 리스트 아이템
        const item = document.createElement('div');
        item.style.cssText = "background:#222; padding:10px; margin-bottom:8px; border-radius:4px; border-left:4px solid cyan;";
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span style="color:cyan; font-weight:bold;">${s.id}</span>
                <button onclick="testScenario(${idx})" style="background:#050; color:lime; border:1px solid lime; cursor:pointer; padding:2px 8px;">▶ TEST</button>
            </div>
            <div style="font-size:11px;">
                <label>Start Size: </label>
                <input type="range" min="1" max="30" value="${s.startSize}" oninput="updateScenarioData(${idx}, 'startSize', this.value)"> ${s.startSize}%<br>
                <label>End Size: </label>
                <input type="range" min="5" max="50" value="${s.endSize}" oninput="updateScenarioData(${idx}, 'endSize', this.value)"> ${s.endSize}%
            </div>
        `;
        list.appendChild(item);

        // 시각적 가이드라인 (SVG)
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", s.startX + "%"); line.setAttribute("y1", s.startY + "%");
        line.setAttribute("x2", s.endX + "%");   line.setAttribute("y2", s.endY + "%");
        line.setAttribute("stroke", s.type === 'FPV' ? "rgba(255,255,0,0.5)" : "rgba(255,100,0,0.5)");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-dasharray", "4,4");
        pathSvg.appendChild(line);

        // 실제 이미지로 핸들 생성
        createImageHandle(s, idx, 'start');
        createImageHandle(s, idx, 'end');
    });
}

// [교정] 점이 아니라 실제 이미지를 사용하여 드래그 핸들을 만듭니다.
function createImageHandle(s, idx, mode) {
    const isStart = mode === 'start';
    const handle = document.createElement('div');
    handle.className = 'scenario-preview path-handle';
    handle.id = `preview_${s.id}_${mode}`;
    
    // 객체 타입에 따른 이미지 경로 설정
    const imgPath = s.type === 'FPV' ? 'FPV.png' : 'terror.png';
    // 시작점 이미지에만 크기 조절 슬라이더 값을 반영
    const size = isStart ? s.startSize : 3; 

    handle.style.cssText = `
        position:absolute; left:${isStart ? s.startX : s.endX}%; 
        top:${isStart ? s.startY : s.endY}%; 
        width:${size}%; transform:translate(-50%, -50%); 
        border:${isStart ? '3px solid #0f0' : '3px solid #00f'}; 
        border-radius:2px; z-index:9999; cursor:move; 
        box-sizing:border-box;
    `;
    
    handle.innerHTML = `<img src="${imgPath}" style="width:100%; opacity:${isStart ? 0.7 : 0.4}; pointer-events:none;">`;

    handle.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.onmousemove = (me) => {
            const rect = viewCamera.getBoundingClientRect();
            let px = ((me.clientX - rect.left) / rect.width * 100).toFixed(2);
            let py = ((me.clientY - rect.top) / rect.height * 100).toFixed(2);
            
            if (isStart) { s.startX = px; s.startY = py; }
            else { s.endX = px; s.endY = py; }
            refreshEditor();
        };
        document.onmouseup = () => { document.onmousemove = null; };
    };
    viewCamera.appendChild(handle);
}

// 실시간 데이터 업데이트 및 시나리오 테스트 실행 (전역 등록)
window.updateScenarioData = (idx, key, val) => {
    scenarios[idx][key] = val;
    refreshEditor();
};

// [교정] 버튼을 눌렀을 때 즉시 시뮬레이션 엔진이 실행되도록 수정
window.testScenario = (idx) => {
    const s = scenarios[idx];
    
    // (arguments.timeTick || 0) 충돌을 방지하기 위해 arguments 초기화
    // 이는 launchProjectile 함수 내의 `let timeTick = 0;`으로 이미 처리됨.

    // speed 값은 FPV와 RPG의 특성에 맞게 조정
    const speed = s.type === 'FPV' ? 0.008 : 0.035;
    const box = s.type === 'FPV' ? targetBox : rpgProjectileBox;
    
    // HUD 로그 생성 및 실행 (기존 함수 활용)
    const logRes = updateHUD(s.type, s.startX, s.startY);
    
    // 요격 확률은 테스트를 위해 82% 그대로 적용
    const willIntercept = Math.random() <= 0.82;
    // 요격 지점 랜덤 (50~60% 진행 구간)
    const interceptAt = 0.5 + (Math.random() * 0.1);
    
    // 사수 배경이 필요할 경우 (RPG)
    if (s.type === 'RPG') {
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = s.startX + '%';
        rpgGunnerBox.style.top = s.startY + '%';
        rpgGunnerBox.className = 'rpg-gunner-box fade-center';
        setTimeout(() => {
            executePath(box, s, speed, willIntercept, interceptAt, logRes);
            setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 1000);
        }, 500);
    } else {
        executePath(box, s, speed, willIntercept, interceptAt, logRes);
    }
};

// 실제 경로 이동 및 요격 엔진
function executePath(box, s, speed, willIntercept, interceptAt, logRes) {
    let t = 0;
    box.style.display = 'block';
    const moveLoop = setInterval(() => {
        t += speed;
        if (t > 1) t = 1;

        const curX = parseFloat(s.startX) + (s.endX - s.startX) * t;
        const curY = parseFloat(s.startY) + (s.endY - s.startY) * t;
        const curSize = parseFloat(s.startSize) + (s.endSize - s.startSize) * Math.pow(t, 1.5);

        box.style.left = curX + '%';
        box.style.top = curY + '%';
        box.style.width = curSize + '%';

        if (willIntercept && t >= interceptAt) {
            clearInterval(moveLoop);
            box.style.display = 'none';
            // % 좌표를 픽셀로 변환하여 폭발 생성
            const rect = viewCamera.getBoundingClientRect();
            createExplosion((curX/100)*rect.width, (curY/100)*rect.height);
            logRes.innerHTML = `<span class="log-success">INTERCEPTED (${Math.round(t*100)}%)</span>`;
            return;
        }

        if (timeTick >= 1) {
            clearInterval(moveLoop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT!</span>`;
        }
    }, 30);
}

document.getElementById('add-fpv-path').onclick = () => addScenario('FPV');
document.getElementById('add-rpg-path').onclick = () => addScenario('RPG');
document.getElementById('solve-new').onclick = () => {
    console.log("--- FINAL SCENARIO DATA ---");
    console.log(JSON.stringify(scenarios, null, 2));
    alert("콘솔(F12)에서 데이터를 확인하세요.");
};
