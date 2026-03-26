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

// 스크롤 시 Specs 섹션 슬라이드 애니메이션 실행
const specsSection = document.getElementById('specs');

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3 // 섹션이 화면에 30% 이상 보일 때 작동
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // 화면에 나타나면 클래스 추가하여 애니메이션 트리거
            entry.target.classList.add('is-visible');
            // 한 번 실행된 후에는 다시 실행되지 않도록 관찰 해제
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

if (specsSection) {
    observer.observe(specsSection);
}
