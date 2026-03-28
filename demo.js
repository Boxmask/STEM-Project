// =========================================
// 1. 시나리오 데이터 (디버그 툴에서 추출할 데이터)
// =========================================

// 시나리오 예시: { type, start: {x, y}, end: {x, y}, initSize }
const ATTACK_SCENARIOS = [
    { type: 'FPV', start: {x: 15, y: 10}, end: {x: 84, y: 85}, initSize: 0.5 },
    { type: 'RPG', start: {x: 85, y: 45}, end: {x: 84, y: 85}, initSize: 4.0 }
];

const viewCamera = document.getElementById('camera-view');
const targetBox = document.getElementById('target-box');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

// =========================================
// 2. 핵심 유틸리티 및 시뮬레이션 엔진
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

function executeAttack(scenario) {
    const isFPV = scenario.type === 'FPV';
    const box = isFPV ? targetBox : rpgProjectileBox;
    const { start, end, initSize } = scenario;
    
    let t = 0; // 진행도 (0 ~ 1)
    const interceptAt = 0.5 + (Math.random() * 0.15); // 50~65% 지점 요격
    const willIntercept = Math.random() <= 0.82;

    const logRes = updateHUD(scenario.type, start.x, start.y, end.x, end.y);

    if (scenario.type === 'RPG') {
        // 사수 배치 및 등장
        rpgGunnerBox.style.display = 'block';
        rpgGunnerBox.style.left = `${start.x}%`;
        rpgGunnerBox.style.top = `${start.y}%`;
        rpgGunnerBox.className = 'rpg-gunner-box fade-center';
        
        setTimeout(() => launch(), 800);
        setTimeout(() => { rpgGunnerBox.style.display = 'none'; }, 2500);
    } else {
        launch();
    }

    function launch() {
        box.style.display = 'block';
        const loop = setInterval(() => {
            t += isFPV ? 0.007 : 0.03;
            if (t > 1) t = 1;

            // 선형 보간(Lerp) 경로 계산
            // $P(t) = P_{start} + t \times (P_{end} - P_{start})$
            const curX = start.x + (end.x - start.x) * t;
            const curY = start.y + (end.y - start.y) * t;
            const curSize = initSize + (20 - initSize) * Math.pow(t, 1.5);

            box.style.left = `${curX}%`;
            box.style.top = `${curY}%`;
            box.style.width = `${curSize}%`;

            // 진행도(t) 기반 APS 요격 판정
            if (willIntercept && t >= interceptAt) {
                clearInterval(loop);
                box.style.display = 'none';
                createExplosion(curX, curY);
                logRes.innerHTML = `<span class="log-success">INTERCEPTED AT ${(t*100).toFixed(0)}%</span>`;
                setTimeout(nextScenario, 1500);
                return;
            }

            if (t >= 1) {
                clearInterval(loop);
                box.style.display = 'none';
                logRes.innerHTML = `<span class="log-alert">IMPACT</span>`;
                setTimeout(nextScenario, 1500);
            }
        }, 30);
    }
}

// =========================================
// [통합 단계] 시나리오 디렉터: 경로, 크기, 궤적 통합 에디터
// =========================================

// 1. SVG 레이어 및 에디터 UI 삽입
if (!document.getElementById('path-svg')) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "path-svg";
    svg.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9000;";
    document.getElementById('camera-view').appendChild(svg);
}

const editorHTML = `
<div id="scenario-director" style="position:fixed; bottom:10px; right:10px; background:rgba(0,0,0,0.95); color:white; padding:15px; z-index:10000; font-family:monospace; width:350px; border:2px solid cyan; border-radius:8px; box-shadow: 0 0 20px rgba(0,255,255,0.2);">
    <strong style="color:cyan; font-size:14px;">[COMBAT SCENARIO DIRECTOR]</strong><br>
    <small style="color:#888;">경로를 설계하고 ▶ 버튼으로 테스트하세요.</small><br><br>
    
    <div id="path-list" style="max-height:300px; overflow-y:auto; margin-bottom:15px; padding-right:5px;"></div>
    
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <button id="add-fpv-path" style="background:#880; color:white; border:none; padding:10px; cursor:pointer; font-weight:bold;">+ FPV 경로</button>
        <button id="add-rpg-path" style="background:#840; color:white; border:none; padding:10px; cursor:pointer; font-weight:bold;">+ RPG 경로</button>
    </div>
    <button id="export-data" style="background:cyan; color:black; font-weight:bold; margin-top:10px; width:100%; border:none; padding:10px; cursor:pointer;">최종 시나리오 추출 (SOLVE)</button>
</div>
`;

if (document.getElementById('scenario-director')) document.getElementById('scenario-director').remove();
document.body.insertAdjacentHTML('beforeend', editorHTML);

let scenarios = []; 
const cameraView = document.getElementById('camera-view');
const pathSvg = document.getElementById('path-svg');

// 시나리오 추가 함수
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

// 에디터 화면 갱신 (리스트, 선, 핸들)
function refreshEditor() {
    const list = document.getElementById('path-list');
    list.innerHTML = '';
    pathSvg.innerHTML = '';
    
    // 기존 핸들 제거
    document.querySelectorAll('.dir-handle').forEach(h => h.remove());

    scenarios.forEach((s, idx) => {
        // 1. UI 리스트 아이템
        const item = document.createElement('div');
        item.style.cssText = "background:#222; padding:12px; margin-bottom:8px; border-radius:4px; border-left:4px solid " + (s.type === 'FPV' ? 'yellow' : 'orange');
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <b style="color:cyan;">${s.id}</b>
                <button onclick="testScenario(${idx})" style="background:#050; color:lime; border:1px solid lime; cursor:pointer; padding:2px 8px;">▶ TEST</button>
            </div>
            <div style="font-size:11px; display:grid; gap:5px;">
                <label>Start Size: <input type="range" min="1" max="30" value="${s.startSize}" oninput="updateScenarioData(${idx}, 'startSize', this.value)"> ${s.startSize}%</label>
                <label>End Size: <input type="range" min="5" max="60" value="${s.endSize}" oninput="updateScenarioData(${idx}, 'endSize', this.value)"> ${s.endSize}%</label>
            </div>
        `;
        list.appendChild(item);

        // 2. SVG 궤적 선
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", s.startX + "%"); line.setAttribute("y1", s.startY + "%");
        line.setAttribute("x2", s.endX + "%");   line.setAttribute("y2", s.endY + "%");
        line.setAttribute("stroke", s.type === 'FPV' ? "rgba(255,255,0,0.5)" : "rgba(255,100,0,0.5)");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-dasharray", "4,4");
        pathSvg.appendChild(line);

        // 3. 드래그 핸들 (시작:초록, 끝:파랑)
        createHandle(s, idx, 'start');
        createHandle(s, idx, 'end');
    });
}

function createHandle(s, idx, mode) {
    const handle = document.createElement('div');
    handle.className = 'dir-handle';
    const isStart = mode === 'start';
    handle.style.cssText = `
        position:absolute; width:14px; height:14px; 
        background:${isStart ? '#0f0' : '#00f'}; 
        left:${isStart ? s.startX : s.endX}%; 
        top:${isStart ? s.startY : s.endY}%; 
        transform:translate(-50%, -50%); border:2px solid white; border-radius:50%; z-index:9999; cursor:move;
    `;

    handle.onmousedown = (e) => {
        e.preventDefault();
        document.onmousemove = (me) => {
            const rect = cameraView.getBoundingClientRect();
            let px = ((me.clientX - rect.left) / rect.width * 100).toFixed(2);
            let py = ((me.clientY - rect.top) / rect.height * 100).toFixed(2);
            
            if (isStart) { s.startX = px; s.startY = py; }
            else { s.endX = px; s.endY = py; }
            refreshEditor();
        };
        document.onmouseup = () => { document.onmousemove = null; };
    };
    cameraView.appendChild(handle);
}

// 실시간 데이터 업데이트 및 시나리오 테스트 실행
window.updateScenarioData = (idx, key, val) => {
    scenarios[idx][key] = val;
    refreshEditor();
};

window.testScenario = (idx) => {
    const s = scenarios[idx];
    // 기존 시뮬레이션 엔진(launch) 함수 호출
    // speed 값은 FPV와 RPG의 특성에 맞게 조정
    const speed = s.type === 'FPV' ? 0.008 : 0.035;
    const box = s.type === 'FPV' ? targetBox : rpgProjectileBox;
    
    // HUD 로그 생성 및 실행 (기존 함수 활용)
    const logRes = updateHUD(s.type, s.startX, s.startY);
    
    // 경로 기반 이동 실행 (기존 launch 함수 구조 활용)
    // 여기서 willIntercept는 테스트를 위해 82% 확률 적용
    const willIntercept = Math.random() <= 0.82;
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
            const rect = cameraView.getBoundingClientRect();
            createExplosion((curX/100)*rect.width, (curY/100)*rect.height);
            logRes.innerHTML = `<span class="log-success">INTERCEPTED (${Math.round(t*100)}%)</span>`;
            return;
        }

        if (t >= 1) {
            clearInterval(moveLoop);
            box.style.display = 'none';
            logRes.innerHTML = `<span class="log-alert">IMPACT!</span>`;
        }
    }, 30);
}

document.getElementById('add-fpv-path').onclick = () => addScenario('FPV');
document.getElementById('add-rpg-path').onclick = () => addScenario('RPG');
document.getElementById('export-data').onclick = () => {
    console.log("--- FINAL SCENARIO DATA ---");
    console.log(JSON.stringify(scenarios, null, 2));
    alert("콘솔(F12)에서 데이터를 확인하세요.");
};
