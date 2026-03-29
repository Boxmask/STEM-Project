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
    threshold: [0.3, 0.66] // 30% 보일 때, 66% 보일 때 감지
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.3 && entry.intersectionRatio < 0.66) {
                // 30% 이상 보이면 슬라이드 인
                entry.target.classList.remove('is-visible');
                entry.target.classList.add('is-hidden');
            } else if (entry.intersectionRatio >= 0.66) {
                // 66% 이상 지나가면 슬라이드 아웃
                 entry.target.classList.remove('is-hidden');
                entry.target.classList.add('is-visible');
            }
        } else {
            // 완전히 화면에서 벗어나면 초기 상태로 리셋
            entry.target.classList.remove('is-visible', 'is-hidden');
        }
    });
}, observerOptions);

if (specsSection) {
    observer.observe(specsSection);
}

// =========================================
// 메인 화면 슬라이더(Hero Carousel) 로직
// =========================================
let slideIndex = 1;
const slides = document.querySelectorAll(".hero-slide");
const dots = document.querySelectorAll(".dot");
let slideInterval;

function showSlides(n) {
    if (!slides.length) return;

    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }

    slides.forEach(slide => slide.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    slides[slideIndex - 1].classList.add("active");
    dots[slideIndex - 1].classList.add("active");
}

function changeSlide(n) {
    showSlides(slideIndex += n);
    resetInterval(); // 수동 조작 시 타이머 초기화
}

function currentSlide(n) {
    showSlides(slideIndex = n);
    resetInterval();
}

// 5초마다 자동 슬라이드 전환
function startInterval() {
    slideInterval = setInterval(() => {
        showSlides(slideIndex += 1);
    }, 5000);
}

function resetInterval() {
    clearInterval(slideInterval);
    startInterval();
}

// 페이지 로드 시 슬라이드 타이머 시작
if (slides.length > 0) {
    startInterval();
}
