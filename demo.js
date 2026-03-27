// =========================================
// 비선형 크기 증가(커브) 동적 시뮬레이션 로직
// =========================================
const targetBox = document.getElementById('target-box'); // FPV용
const targetLabel = document.getElementById('target-label');
const rpgGunnerBox = document.getElementById('rpg-gunner-box');
const rpgGunnerLabel = document.getElementById('rpg-gunner-label');
const rpgProjectileBox = document.getElementById('rpg-projectile-box');

// 고정된 목표 좌표 (픽셀 단위)
const targetPixelX = 1009; 
const targetPixelY = 741;
const MAX_SIZE = 20; // 모든 투사체의 최대 크기 (%)

function spawnFPV() {
    // 화면 크기(window.innerWidth/Height)를 기준으로 퍼센트 좌표를 픽셀로 변환하여 시작점 설정
    let startX = window.innerWidth * ((20 + Math.random() * 60) / 100);
    let startY = window.innerHeight * ((2 + Math.random() * 10) / 100); 
    
    let timeTick = 0; 

    targetBox.style.display = 'block';
    targetLabel.innerText = 'ID: FPV (HOSTILE)';

    let interval = setInterval(() => {
        timeTick += 0.008; 
        if (timeTick > 1) timeTick = 1;

        let size = MAX_SIZE * Math.pow(timeTick, 1.5); 

        // 지정된 1009, 741 픽셀 좌표를 향해 이동
        let currentX = startX + (targetPixelX - startX) * timeTick;
        let currentY = startY + (targetPixelY - startY) * timeTick;

        targetBox.style.width = size + '%';
        targetBox.style.height = 'auto'; 
        targetBox.style.left = currentX + 'px';
        targetBox.style.top = currentY + 'px';

        // 두 점 사이의 거리 계산
        let distance = Math.sqrt(Math.pow(targetPixelX - currentX, 2) + Math.pow(targetPixelY - currentY, 2));

        // 목표 좌표 반경 10px 이내에 들어오거나, 이동이 완료되었을 때 소멸
        if (distance <= 10 || timeTick === 1) {
            clearInterval(interval);
            targetBox.style.display = 'none';
            setTimeout(spawnRandomThreat, 1500); 
        }
    }, 30);
}

function spawnTerroristAndRPG() {
    let gunnerSize = 5; 
    
    let isLeft = Math.random() > 0.5;
    let startPercentX = isLeft ? 5 + Math.random() * 15 : 80 + Math.random() * 15;
    let startPercentY = 40 + Math.random() * 15;

    let startX = window.innerWidth * (startPercentX / 100);
    let startY = window.innerHeight * (startPercentY / 100);

    rpgGunnerBox.style.display = 'block';
    rpgGunnerBox.style.width = gunnerSize + '%';
    rpgGunnerBox.style.height = 'auto';
    rpgGunnerBox.style.left = startX + 'px';
    rpgGunnerBox.style.top = startY + 'px';
    rpgGunnerLabel.innerText = 'ID: RPG GUNNER (HOSTILE)';

    setTimeout(() => {
        // 투사체 발사 시점 (스폰 후 500ms)
        let timeTick = 0;
        rpgProjectileBox.style.display = 'block';

        // 사수는 발사체 발사 시점으로부터 2초(2000ms) 뒤에 사라짐
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

            // 두 점 사이의 거리 계산
            let distance = Math.sqrt(Math.pow(targetPixelX - currentX, 2) + Math.pow(targetPixelY - currentY, 2));

            // 목표 좌표 반경 10px 이내에 들어오거나, 이동이 완료되었을 때 소멸
            if (distance <= 10 || timeTick === 1) {
                clearInterval(interval);
                rpgProjectileBox.style.display = 'none';
                setTimeout(spawnRandomThreat, 1500);
            }
        }, 30);
    }, 500); // 사수 등장 500ms 후 발사
}

// 두 가지 위협 중 무작위 선택하여 스폰
function spawnRandomThreat() {
    if (Math.random() > 0.5) {
        spawnFPV();
    } else {
        spawnTerroristAndRPG();
    }
}

// 최초 스폰 시작
setTimeout(spawnRandomThreat, 1000);
