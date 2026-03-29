// =========================================
// 1. 시나리오 데이터 및 DOM 참조
// =========================================
let SCENARIOS = [
  { id: "FPV_1", type: "FPV", startX: "25.00", startY: "6.39", startSize: 5, endX: "43.48", endY: "68.52", endSize: "15" },
  { id: "RPG_1", type: "RPG", startX: "6.94", startY: "59.16", startSize: 5, endX: "13.55", endY: "85.32", endSize: "15" },
  { id: "RPG_3", type: "RPG", startX: "20.74", startY: "51.28", startSize: "4", endX: "28.18", endY: "71.35", endSize: "16" },
  { id: "FPV_4", type: "FPV", startX: "85.37", startY: "6.84", startSize: 5, endX: "78.85", endY: "65.25", endSize: "14" },
  { id: "FPV_5", type: "FPV", startX: "36.87", startY: "8.03", startSize: 5, endX: "47.74", endY: "70.31", endSize: 20 },
  { id: "FPV_6", type: "FPV", startX: "64.72", startY: "9.36", startSize: 5, endX: "63.55", endY: "67.19", endSize: 20 },
  { id: "RPG_7", type: "RPG", startX: "92.89", startY: "51.28", startSize: "4", endX: "85.54", endY: "75.96", endSize: "16" },
  { id: "RPG_8", type: "RPG", startX: "36.12", startY: "47.86", startSize: "3", endX: "40.05", endY: "68.82", endSize: "12" },
  { id: "RPG_9", type: "RPG", startX: "59.36", startY: "48.46", startSize: "2", endX: "55.69", endY: "65.55", endSize: "13" },
  { id: "FPV_10", type: "FPV", startX: "47.74", startY: "15.01", startSize: 5, endX: "54.68", endY: "61.84", endSize: 20 },
  { id: "RPG_11", type: "RPG", startX: "45.40", startY: "47.86", startSize: "2", endX: "57.86", endY: "64.51", endSize: "11" },
  { id: "FPV_12", type: "FPV", startX: "56.94", startY: "30.03", startSize: "3", endX: "68.98", endY: "64.36", endSize: "13" }
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
let currentAnimationLoop = null;

// =========================================
// 2. 엔진: 폭발 효과 및 컴뱃 로그(Combat Log)
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
    
    // 방위각 및 거리 계산
    const dx = startX_pc - endX_pc;
    const dy = startY_pc - endY_pc;
    let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
    if (angle < 0) angle += 360;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 5.5);

    turretBar.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    azimuthVal.innerText = angle;

    // 컴뱃 로그 생성 및 추가
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-alert">WARNING: ${name} DETECTED.</span><br>
        <span>AZIMUTH: ${angle}° | DISTANCE: ${dist}m</span><br>
        <span>STATUS: <span class="res" style="color: #ff0;">INTERCEPTING...</span></span>
    `;
    logContent.prepend(entry);
    return entry.querySelector('.res'); // 애니메이션 쪽에서 상태 업데이트를 위해 반환
}

// =========================================
// 3. 통합 시뮬레이션 실행 루프
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
        rpgGunnerBox.style.width = `${scenarioObj.startSize}%`;
        rpgGunnerBox.style.transform = 'translate(-50%, -50%)'; 
        rpgGunnerBox.style.opacity = '0';
        rpgGunnerBox.style.transition = 'opacity 0.3s';
        
        void rpgGunnerBox.offsetWidth;
        rpgGunnerBox.style.opacity = '1';
        
        setTimeout(() => {
            animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
            setTimeout(() => { 
                rpgGunnerBox.style.opacity = '0'; 
                setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 300);
            }, 1000);
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
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`; // 컴뱃 로그 업데이트
            setTimeout(triggerRandomAttack, 1500);
            return;
        }

        if (t >= 1) {
            clearInterval(currentAnimationLoop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT! BRACE!</span>`; // 컴뱃 로그 업데이트
            setTimeout(triggerRandomAttack, 1500);
        }
    }, 30);
}

function triggerRandomAttack() {
    if (SCENARIOS.length === 0) return;
    const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    runScenario(randomScenario);
}

// =========================================
// 4. UI 이벤트 리스너
// =========================================
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
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

// =========================================================================
// 5. 인터랙티브 튜토리얼 시스템 (가이드 투어)
// =========================================================================
const tutorialCSS = `
#tutorial-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.75);
    z-index: 10000; display: none; transition: opacity 0.3s;
}
#tutorial-box {
    position: fixed; z-index: 10002;
    background: #111; border: 1px solid #0f0; color: #0f0;
    padding: 15px; max-width: 300px; display: none;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2); font-family: monospace;
}
#tutorial-box button {
    margin-top: 15px; background: #0f0; color: #000;
    border: none; padding: 5px 10px; cursor: pointer; font-weight: bold; width: 100%;
}
.tutorial-highlight {
    position: relative !important; z-index: 10001 !important;
    pointer-events: none;
    box-shadow: 0 0 0 4px rgba(0, 255, 0, 0.5);
    background: #111;
}
.tutorial-explosion {
    position: absolute; width: 40px; height: 40px; 
    background: radial-gradient(circle, #fff 10%, #ff0 40%, #f00 70%, transparent 100%);
    border-radius: 50%; transform: translate(-50%, -50%);
}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${tutorialCSS}</style>`);

const tutOverlay = document.createElement('div');
tutOverlay.id = 'tutorial-overlay';
document.body.appendChild(tutOverlay);

const tutBox = document.createElement('div');
tutBox.id = 'tutorial-box';
tutBox.innerHTML = `<div id="tutorial-text" style="line-height:1.4;"></div><button onclick="nextTutorialStep()">다음 (NEXT)</button>`;
document.body.appendChild(tutBox);

let currentTutStep = 0;

const tutorialSteps = [
    { target: null, text: "Zontik-1 APS 소프트웨어 데모버전입니다.<br><br>본 튜토리얼에서는 시스템이 어떻게 작동하는지 안내합니다." },
    { target: ".hud-mode", text: "현재 센서 작동 모드(OPTICAL/IR)를 표시합니다." },
    { target: ".hud-top-center", text: "시스템의 실시간 시간과 센서 온라인 상태를 확인합니다." },
    { target: ".hud-azimuth", text: "식별된 위협의 방위각(Azimuth)과 거리를 실시간으로 표시합니다." },
    { target: "#rpg-gunner-box", text: "위협(사수)이 식별되었습니다. 시스템이 적의 위치를 파악합니다.", action: showTutGunner },
    { target: "#rpg-projectile-box", text: "투사체 발사가 감지되었습니다. 궤적을 분석하여 요격 지점을 계산합니다.", action: showTutProjectile },
    { target: ".tutorial-explosion", text: "우리회사는 500m 이내의 모든 표적을 무력화 할수 있습니다.", action: showTutExplosion },
    { target: "#btn-log", text: "전투 로그(Combat Log) 버튼을 클릭하여 기록을 확인해 보십시오.", action: prepareTutLog },
    { target: "#log-view", text: "이곳에서 교전 시간, 방위각, 요격 여부를 사후 분석할 수 있습니다.<br><br>튜토리얼을 종료하고 실전 시뮬레이션을 시작합니다.", action: showTutLog }
];

function startTutorial() {
    tutOverlay.style.display = 'block';
    tutBox.style.display = 'block';
    executeTutorialStep();
}

function executeTutorialStep() {
    if (currentTutStep >= tutorialSteps.length) {
        endTutorial();
        return;
    }

    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    const step = tutorialSteps[currentTutStep];
    if (step.action) step.action();

    document.getElementById('tutorial-text').innerHTML = step.text;

    if (step.target) {
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
            targetEl.classList.add('tutorial-highlight');
            const rect = targetEl.getBoundingClientRect();
            let topPos = rect.bottom + 15;
            let leftPos = rect.left;
            if (topPos > window.innerHeight - 100) topPos = rect.top - 100;
            
            tutBox.style.top = topPos + 'px';
            tutBox.style.left = leftPos + 'px';
            tutBox.style.transform = 'none';
        }
    } else {
        tutBox.style.top = '50%';
        tutBox.style.left = '50%';
        tutBox.style.transform = 'translate(-50%, -50%)';
    }
}

window.nextTutorialStep = () => {
    currentTutStep++;
    executeTutorialStep();
};

function endTutorial() {
    tutOverlay.remove();
    tutBox.remove();
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    document.querySelector('.tutorial-explosion')?.remove();
    
    rpgGunnerBox.style.display = 'none';
    rpgProjectileBox.style.display = 'none';
    document.getElementById('btn-camera').click(); 
    
    triggerRandomAttack(); // 튜토리얼 종료 후 실전 시뮬레이션 개시
}

function showTutGunner() {
    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.left = '25%';
    rpgGunnerBox.style.top = '70%';
    rpgGunnerBox.style.width = '6%';
    rpgGunnerBox.style.opacity = '1';
    rpgGunnerBox.style.transform = 'translate(-50%, -50%)';
    updateHUD('TUTORIAL TARGET', 25, 70, 84, 85);
}

function showTutProjectile() {
    rpgGunnerBox.style.opacity = '0.3'; 
    rpgProjectileBox.style.display = 'block';
    rpgProjectileBox.style.left = '45%';
    rpgProjectileBox.style.top = '75%';
    rpgProjectileBox.style.width = '12%';
    rpgProjectileBox.style.transform = 'translate(-50%, -50%)';
}

function showTutExplosion() {
    rpgProjectileBox.style.display = 'none';
    const exp = document.createElement('div');
    exp.className = 'tutorial-explosion tutorial-highlight';
    exp.style.left = '45%';
    exp.style.top = '75%';
    viewCamera.appendChild(exp);
}

function prepareTutLog() {
    document.querySelector('.tutorial-explosion')?.remove();
}

function showTutLog() {
    document.getElementById('btn-log').click(); 
}

// 스크립트 로드 후 튜토리얼 자동 시작
setTimeout(startTutorial, 500);
