// 모든 섹션과 헤더, 내비게이션 링크 요소를 불러옵니다.
const sections = document.querySelectorAll("section, header");
const navLi = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {
    let current = "";

    // 현재 화면에 어떤 섹션이 있는지 계산
    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        // 화면의 1/3 지점을 기준으로 현재 섹션을 판별
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute("id");
        }
    });

    // 모든 링크에서 'active' 클래스를 지우고, 현재 섹션과 일치하는 링크에만 추가
    navLi.forEach((a) => {
        a.classList.remove("active");
        if (a.getAttribute("href").includes(current)) {
            a.classList.add("active");
        }
    });

    // 스크롤 시 상단 내비게이션 바 배경색 변경
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = '#2C2E25';
        navbar.style.borderBottom = '2px solid #50543D';
    } else {
        navbar.style.backgroundColor = 'transparent';
        navbar.style.borderBottom = 'none';
    }
});
