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
let currentAnimationLoop = null;

// [튜토리얼용 전역 상태 변수]
let isTutorialActive = true;
let isPaused = false;
let tutPhase = 'INIT'; // INIT, WAIT_SPAWN, WAIT_PROJECTILE, WAIT_EXPLOSION, WAIT_LOG, LOG_TAB, DONE

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
// 3. 통합 시뮬레이션 실행 루프 (정지 기능 포함)
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
    
    const willIntercept = isTutorialActive ? true : (Math.random() <= INTERCEPT_CHANCE);
    const interceptAt = 0.5 + (Math.random() * 0.1); 

    const logRes = updateHUD(isFPV ? 'FPV DRONE' : 'RPG WARHEAD', scenarioObj.startX, scenarioObj.startY, scenarioObj.endX, scenarioObj.endY);

    if (!isFPV) {
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = `${scenarioObj.startX}%`;
        rpgGunnerBox.style.top = `${scenarioObj.startY}%`;
        rpgGunnerBox.style.width = `${scenarioObj.startSize}%`;
        rpgGunnerBox.style.transform = 'translate(-50%, -50%)'; 
        rpgGunnerBox.style.opacity = '1';
        
        if (isTutorialActive && tutPhase === 'WAIT_SPAWN') {
            isPaused = true;
            showTut(rpgGunnerBox, "위협(사수)이 식별되었습니다. 시스템이 표적의 좌표를 획득합니다.");
            
            window.tutResumeCallback = () => {
                tutPhase = 'WAIT_PROJECTILE';
                setTimeout(() => { 
                    rpgGunnerBox.style.opacity = '0'; 
                    setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 300);
                }, 1000);
                animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
            };
        } else {
            setTimeout(() => {
                animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
                setTimeout(() => { 
                    rpgGunnerBox.style.opacity = '0'; 
                    setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 300);
                }, 1000);
            }, 600);
        }
    } else {
        if (isTutorialActive && tutPhase === 'WAIT_SPAWN') {
            isPaused = true;
            box.style.display = 'block';
            box.style.left = `${scenarioObj.startX}%`;
            box.style.top = `${scenarioObj.startY}%`;
            box.style.width = `${scenarioObj.startSize}%`;
            box.style.transform = 'translate(-50%, -50%)';
            
            showTut(box, "위협(드론)이 식별되었습니다. 시스템이 표적의 좌표를 획득합니다.");
            window.tutResumeCallback = () => {
                tutPhase = 'WAIT_PROJECTILE';
                animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
            };
        } else {
            animateProjectile(box, scenarioObj, speed, willIntercept, interceptAt, logRes);
        }
    }
}

function animateProjectile(box, s, speed, willIntercept, interceptAt, logRes) {
    let t = 0;
    box.style.display = 'block';
    box.style.transform = 'translate(-50%, -50%)';

    currentAnimationLoop = setInterval(() => {
        if (isPaused) return; 

        if (isTutorialActive && tutPhase === 'WAIT_PROJECTILE' && t > 0.05) {
            isPaused = true;
            showTut(box, "투사체 접근이 감지되었습니다. 궤적을 분석하여 예상 요격 지점을 산출합니다.");
            window.tutResumeCallback = () => { tutPhase = 'WAIT_EXPLOSION'; };
            return;
        }

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
            logRes.innerHTML = `<span class="log-success">NEUTRALIZED.</span>`;
            
            if (isTutorialActive && tutPhase === 'WAIT_EXPLOSION') {
                isPaused = true;
                const exp = document.createElement('div');
                exp.className = 'explosion-effect';
                exp.id = 'tut-explosion';
                exp.style.left = `${curX}%`;
                exp.style.top = `${curY}%`;
                exp.style.background = 'radial-gradient(circle, #fff 10%, #ff0 40%, #f00 70%, transparent 100%)';
                exp.style.opacity = '1';
                viewCamera.appendChild(exp);

                showTut(exp, "요격 성공. 당사 시스템은 500m 이내의 모든 표적을 무력화할 수 있습니다.");
                window.tutResumeCallback = () => {
                    exp.remove();
                    tutPhase = 'WAIT_LOG';
                    nextTutorialStep(); 
                };
                return;
            }

            createExplosion(curX, curY);
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
    if (isTutorialActive) return; 
    const isOptical = cameraModeVal.innerText === 'OPTICAL';
    cameraModeVal.innerText = isOptical ? 'IR' : 'OPTICAL';
    hudStatusVal.innerText = `${isOptical ? 'IR' : 'OPTICAL'} SENSOR: ONLINE`;
    viewCamera.classList.toggle('ir-mode');
};

// =========================================================================
// 5. 동적 인터랙티브 튜토리얼 시스템 (CSS 교정 완료)
// =========================================================================
const tutorialCSS = `
#tutorial-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10000; display: none;
}
#tutorial-box {
    position: fixed; z-index: 10002;
    background: #0a0a0a; border: 2px solid #0f0; color: #0f0;
    padding: 20px; max-width: 320px; display: none;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3); font-family: monospace;
}
#tutorial-box button {
    margin-top: 20px; background: rgba(0,255,0,0.2); color: #0f0;
    border: 1px solid #0f0; padding: 8px 12px; cursor: pointer; font-weight: bold; width: 100%; transition: all 0.2s;
}
#tutorial-box button:hover {
    background: #0f0; color: #000;
}

/* [교정 완료] static 요소도 강조 배경 위로 띄우기 위해 position 속성 추가 */
.tutorial-highlight {
    position: relative !important; /* static 요소의 z-index 활성화를 위해 필수 */
    z-index: 10001 !important;
    outline: 4px solid #0f0 !important;
    box-shadow: 0 0 20px rgba(0,255,0,0.8) !important;
}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${tutorialCSS}</style>`);

const tutOverlay = document.createElement('div');
tutOverlay.id = 'tutorial-overlay';
document.body.appendChild(tutOverlay);

const tutBox = document.createElement('div');
tutBox.id = 'tutorial-box';
tutBox.innerHTML = `<div id="tutorial-text" style="line-height:1.4;"></div><button onclick="nextTutorialStep()">NEXT ></button>`;
document.body.appendChild(tutBox);

let tutIndex = 0;
const initialSteps = [
    { target: null, text: "Zontik-1 APS 소프트웨어 데모입니다.<br><br>본 과정에서는 시스템의 탐지 및 요격 알고리즘을 안내합니다." },
    { target: ".hud-mode", text: "현재 광학 장비의 작동 모드(OPTICAL / IR)를 표시합니다." },
    { target: ".hud-top-center", text: "상단 패널에서 시스템 동기화 시간과 센서 연결 상태를 확인합니다." },
    { target: ".hud-azimuth", text: "하단 패널은 식별된 위협의 방위각(Azimuth)과 예상 거리를 실시간으로 산출합니다." }
];

function showTut(targetEl, text) {
    tutOverlay.style.display = 'block';
    tutBox.style.display = 'block';
    document.getElementById('tutorial-text').innerHTML = text;
    
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    
    if (targetEl) {
        targetEl.classList.add('tutorial-highlight');
        const rect = targetEl.getBoundingClientRect();
        
        let topPos = rect.bottom + 15;
        let leftPos = rect.left;
        
        if (topPos + 150 > window.innerHeight) topPos = rect.top - 150;
        if (leftPos + 320 > window.innerWidth) leftPos = window.innerWidth - 340;
        
        tutBox.style.top = topPos + 'px';
        tutBox.style.left = leftPos + 'px';
        tutBox.style.transform = 'none';
    } else {
        tutBox.style.top = '50%';
        tutBox.style.left = '50%';
        tutBox.style.transform = 'translate(-50%, -50%)';
    }
}

function hideTut() {
    tutOverlay.style.display = 'none';
    tutBox.style.display = 'none';
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
}

window.nextTutorialStep = () => {
    if (tutPhase === 'INIT') {
        tutIndex++;
        if (tutIndex < initialSteps.length) {
            showTut(document.querySelector(initialSteps[tutIndex].target), initialSteps[tutIndex].text);
        } else {
            tutPhase = 'WAIT_SPAWN';
            hideTut();
            triggerRandomAttack(); 
        }
    } else if (tutPhase === 'WAIT_SPAWN' || tutPhase === 'WAIT_PROJECTILE' || tutPhase === 'WAIT_EXPLOSION') {
        hideTut();
        isPaused = false; 
        if (window.tutResumeCallback) {
            window.tutResumeCallback();
            window.tutResumeCallback = null;
        }
    } else if (tutPhase === 'WAIT_LOG') {
        tutPhase = 'LOG_TAB';
        showTut(document.getElementById('btn-log'), "교전이 종료되었습니다. 상단의 Combat Log 버튼을 클릭하십시오.");
    } else if (tutPhase === 'LOG_TAB') {
        document.getElementById('btn-log').click();
        tutPhase = 'DONE';
        showTut(document.getElementById('log-view'), "Combat Log 화면입니다. 교전 발생 시간, 표적 방위각, 그리고 요격 결과 데이터가 기록됩니다.<br><br>이제 튜토리얼을 종료하고 실전 시뮬레이션으로 전환합니다.");
    } else if (tutPhase === 'DONE') {
        hideTut();
        isTutorialActive = false;
        isPaused = false;
        document.getElementById('btn-camera').click();
        setTimeout(triggerRandomAttack, 1000); 
    }
};

setTimeout(() => { showTut(null, initialSteps[0].text); }, 500);
