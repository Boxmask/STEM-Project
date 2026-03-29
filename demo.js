// =========================================
// 1. 시나리오 데이터 및 DOM 참조
// =========================================
let SCENARIOS = [
    { id: 'FPV_1', type: 'FPV', startX: 16.67, startY: 22.22, startSize: 5, endX: 84.08, endY: 85.00, endSize: 20 },
    { id: 'RPG_1', type: 'RPG', startX: 12.50, startY: 88.89, startSize: 5, endX: 84.08, endY: 85.00, endSize: 20 }
];

const viewCamera = document.getElementById('camera-view');
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
let currentAnimationLoop = null;

// =========================================
// 2. 핵심 유틸리티 (이펙트 및 HUD)
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

function updateHUD(name, startX_pc, startY_pc, endX_pc, endY_pc) {
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');
    
    const dx = startX_pc - endX_pc;
    const dy = startY_pc - endY_pc;
    let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
    if (angle < 0) angle += 360;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 5.5);

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

// =========================================
// 3. 통합 시뮬레이션 엔진
// =========================================
function runScenario(scenarioObj) {
    if (currentAnimationLoop) {
        clearInterval(currentAnimationLoop);
        targetBox.style.display = 'none';
        rpgProjectileBox.style.display = 'none';
        rpgGunnerBox.style.display = 'none';
    }

    const isFPV = scenarioObj.type === 'FPV';
    const box = isFPV ? targetBox : rpgProjectileBox;
    const speed = isFPV ? 0.008 : 0.035;
    
    const willIntercept = Math.random() <= INTERCEPT_CHANCE;
    const interceptAt = 0.5 + (Math.random() * 0.1); 

    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG WARHEAD', scenarioObj.startX, scenarioObj.startY, scenarioObj.endX, scenarioObj.endY);

    if (!isFPV) {
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = `${scenarioObj.startX}%`;
        rpgGunnerBox.style.top = `${scenarioObj.startY}%`;
        rpgGunnerBox.className = 'rpg-gunner-box fade-center';
        
        setTimeout(() => {
            animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
            setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 1000);
        }, 600);
    } else {
        animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
    }
}

function animateProjectile(box, s, speed, willIntercept, interceptAt, logRes) {
    let t = 0;
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)';
    box.style.left = s.startX + '%';
    box.style.top = s.startY + '%';
    box.style.width = s.startSize + '%';

    currentAnimationLoop = setInterval(() => {
        t += speed;
        if (t > 1) t = 1;

        const curX = parseFloat(s.startX) + (s.endX - s.startX) * t;
        const curY = parseFloat(s.startY) + (s.endY - s.startY) * t;
        const curSize = parseFloat(s.startSize) + (s.endSize - s.startSize) * Math.pow(t, 1.5);

        box.style.left = curX + '%';
        box.style.top = curY + '%';
        box.style.width = curSize + '%';

        if (willIntercept && t >= interceptAt) {
            clearInterval(currentAnimationLoop);
            box.style.display = 'none';
            createExplosion(curX, curY);
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
            setTimeout(triggerRandomAttack, 1500);
            return;
        }

        if (t >= 1) {
            clearInterval(currentAnimationLoop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT! BRACE!</span>`;
            setTimeout(triggerRandomAttack, 1500);
        }
    }, 30);
}

function triggerRandomAttack() {
    if (SCENARIOS.length === 0) return;
    const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    runScenario(randomScenario);
}

// UI 이벤트 리스너 및 초기화
document.getElementById('btn-camera').onclick = () => {
    viewCamera.classList.add('active'); viewLog.classList.remove('active');
    document.getElementById('btn-camera').classList.add('active');
    document.getElementById('btn-log').classList.remove('active');
};
document.getElementById('btn-log').onclick = () => {
    viewLog.classList.add('active'); viewCamera.classList.remove('active');
    document.getElementById('btn-log').classList.add('active');
    document.getElementById('btn-camera').classList.remove('active');
};

setInterval(() => {
    document.getElementById('hud-time-display').innerText = new Date().toTimeString().split(' ')[0];
}, 1000);

viewCamera.onclick = (e) => {
    if (e.target.closest('.path-handle')) return;
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

setTimeout(triggerRandomAttack, 1000);

// =========================================================================
// 4. 시나리오 디렉터 (에디터 UI)
// =========================================================================

if (!document.getElementById('path-svg')) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "path-svg";
    svg.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9000;";
    viewCamera.appendChild(svg);
}

const editorHTML = `
<div id="scenario-director" style="position:fixed; bottom:10px; right:10px; background:rgba(0,0,0,0.9); color:white; padding:15px; z-index:10000; font-family:monospace; width:340px; border:1px solid cyan;">
    <strong>[COMBAT SCENARIO DIRECTOR]</strong><br>
    <div id="path-list" style="max-height:250px; overflow-y:auto; margin:10px 0; padding-right:5px;"></div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
        <button id="add-fpv-path" style="background:#880; color:white; border:none; padding:8px; cursor:pointer;">+ FPV 추가</button>
        <button id="add-rpg-path" style="background:#840; color:white; border:none; padding:8px; cursor:pointer;">+ RPG 추가</button>
    </div>
    <button id="solve-new" style="background:cyan; color:black; font-weight:bold; margin-top:10px; width:100%; border:none; padding:8px; cursor:pointer;">좌표 데이터 추출 (SOLVE)</button>
</div>
`;
if (document.getElementById('scenario-director')) document.getElementById('scenario-director').remove();
document.body.insertAdjacentHTML('beforeend', editorHTML);

const pathSvg = document.getElementById('path-svg');

function refreshEditor() {
    const list = document.getElementById('path-list');
    list.innerHTML = '';
    pathSvg.innerHTML = '';
    
    document.querySelectorAll('.path-handle').forEach(el => el.remove());

    SCENARIOS.forEach((s, idx) => {
        const item = document.createElement('div');
        item.style.cssText = "background:#222; padding:10px; margin-bottom:8px; border-radius:4px; border-left:4px solid cyan;";
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span style="color:cyan; font-weight:bold;">${s.id}</span>
                <button onclick="runScenario(SCENARIOS[${idx}])" style="background:#050; color:lime; border:1px solid lime; cursor:pointer; padding:2px 8px;">▶ TEST</button>
            </div>
            <div style="font-size:11px;">
                <label>Start Size: <input type="range" min="1" max="30" value="${s.startSize}" oninput="updateEditorData(${idx}, 'startSize', this.value)"></label><br>
                <label>End Size: <input type="range" min="5" max="50" value="${s.endSize}" oninput="updateEditorData(${idx}, 'endSize', this.value)"></label>
            </div>
        `;
        list.appendChild(item);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", s.startX + "%"); line.setAttribute("y1", s.startY + "%");
        line.setAttribute("x2", s.endX + "%");   line.setAttribute("y2", s.endY + "%");
        line.setAttribute("stroke", s.type === 'FPV' ? "rgba(255,255,0,0.6)" : "rgba(255,100,0,0.6)");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-dasharray", "4,4");
        pathSvg.appendChild(line);

        createImageHandle(s, idx, 'start');
        createImageHandle(s, idx, 'end');
    });
}

function createImageHandle(s, idx, mode) {
    const isStart = mode === 'start';
    const handle = document.createElement('div');
    handle.className = 'scenario-preview path-handle';
    handle.id = `preview_${s.id}_${mode}`;
    
    let imgPath = '';
    if (s.type === 'FPV') {
        imgPath = 'FPV.png';
    } else {
        imgPath = isStart ? 'terror.png' : 'RPG.png';
    }
    
    const currentSize = isStart ? s.startSize : s.endSize;

    handle.style.cssText = `
        position:absolute; left:${isStart ? s.startX : s.endX}%; 
        top:${isStart ? s.startY : s.endY}%; 
        width:${currentSize}%; transform:translate(-50%, -50%); 
        border:${isStart ? '3px solid #0f0' : '3px solid #00f'}; 
        border-radius:2px; z-index:9999; cursor:move; 
        box-sizing:border-box;
    `;
    
    handle.innerHTML = `<img src="${imgPath}" style="width:100%; opacity:${isStart ? 0.8 : 0.4}; pointer-events:none;">`;

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

window.updateEditorData = (idx, key, val) => {
    SCENARIOS[idx][key] = val;
    refreshEditor();
};

document.getElementById('add-fpv-path').onclick = () => {
    SCENARIOS.push({ id: 'FPV_' + (SCENARIOS.length + 1), type: 'FPV', startX: 20, startY: 20, startSize: 5, endX: 84, endY: 85, endSize: 20 });
    refreshEditor();
};
document.getElementById('add-rpg-path').onclick = () => {
    SCENARIOS.push({ id: 'RPG_' + (SCENARIOS.length + 1), type: 'RPG', startX: 20, startY: 80, startSize: 5, endX: 84, endY: 85, endSize: 20 });
    refreshEditor();
};
document.getElementById('solve-new').onclick = () => {
    console.log("--- 추출된 SCENARIOS 데이터 ---");
    console.log(JSON.stringify(SCENARIOS, null, 2));
    alert("콘솔(F12)에서 데이터를 확인하세요.");
};

refreshEditor();
