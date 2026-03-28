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
// 3. 진화된 디버그 툴 (Path & Size Editor)
// =========================================

const editorHTML = `
<div id="path-editor-ui" style="position:fixed; top:10px; right:10px; background:rgba(0,0,0,0.9); color:white; padding:15px; z-index:10000; font-family:monospace; border:1px solid #ff0000;">
    <strong style="color:red;">[APS 경로 시나리오 에디터]</strong><br><br>
    유형: <select id="edit-type"><option value="FPV">FPV</option><option value="RPG">RPG</option></select><br>
    초기 크기: <input type="range" id="edit-size" min="0.1" max="10" step="0.1" value="1"><br>
    <button id="btn-preview" style="background:#444; color:white;">미리보기</button>
    <button id="btn-save-path" style="background:red; color:white;">시나리오 저장</button><br><br>
    <textarea id="path-output" rows="8" cols="40" style="font-size:10px; background:#111; color:lime;"></textarea>
</div>
<svg id="path-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9000;">
    <line id="preview-line" x1="0" y1="0" x2="0" y2="0" stroke="red" stroke-width="2" stroke-dasharray="5,5" />
</svg>
`;

document.body.insertAdjacentHTML('beforeend', editorHTML);

// 디버그용 핸들 (시작점/끝점) 제어 로직 추가 필요...
