// ===== HERO SLIDER ENGINE =====
function createSlider(config) {
    const track = document.getElementById(config.trackId);
    const container = document.getElementById(config.sliderId);
    const dotsContainer = document.getElementById(config.dotsId);
    if (!track || !container) return null;

    const items = track.children;
    const totalItems = items.length;
    let currentIndex = 0;

    function getVisibleCount() {
        const w = window.innerWidth;
        if (w >= 768) return config.desktopVisible || 3;
        if (w >= 640) return config.tabletVisible || 2;
        return config.mobileVisible || 1;
    }

    function getMaxIndex() {
        return Math.max(0, totalItems - getVisibleCount());
    }

    function updateDots() {
        if (!dotsContainer) return;
        const maxI = getMaxIndex();

        if (dotsContainer.children.length !== maxI + 1) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i <= maxI; i++) {
                const dot = document.createElement('div');
                dot.className = 'slide-dot' + (i === currentIndex ? ' active' : '');
                dot.onclick = () => goTo(i);
                dotsContainer.appendChild(dot);
            }
        } else {
            for (let i = 0; i < dotsContainer.children.length; i++) {
                dotsContainer.children[i].className = 'slide-dot' + (i === currentIndex ? ' active' : '');
            }
        }
    }

    function getItemWidth() {
        if (!items[0]) return 0;
        return items[0].offsetWidth + (config.gap || 12);
    }

    function goTo(index) {
        const maxI = getMaxIndex();
        currentIndex = Math.max(0, Math.min(index, maxI));
        track.style.transform = `translateX(-${currentIndex * getItemWidth()}px)`;
        updateDots();
    }

    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }

    // Touch support
    let startX = 0, isDragging = false;
    container.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        isDragging = true;
    }, { passive: true });

    container.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            diff > 0 ? next() : prev();
        }
    }, { passive: true });

    // FIX #1: Resize pe index reset ho sakta tha, ab safely clamp
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            currentIndex = Math.min(currentIndex, getMaxIndex());
            goTo(currentIndex);
        }, 150);
    });

    updateDots();
    return { next, prev, goTo };
}

const heroSlider = createSlider({
    sliderId: 'heroSlider',
    trackId: 'heroTrack',
    dotsId: 'heroDots',
    mobileVisible: 1.2,
    tabletVisible: 2,
    desktopVisible: 3,
    gap: 12
});

function slideHero(dir) {
    heroSlider && heroSlider[dir > 0 ? 'next' : 'prev']();
}

// FIX #2: Hero auto-slide — touch pe stop, touch end ke baad restart
let heroAutoSlide = setInterval(() => slideHero(1), 4000);

const heroSliderEl = document.getElementById('heroSlider');
if (heroSliderEl) {
    heroSliderEl.addEventListener('touchstart', () => {
        clearInterval(heroAutoSlide);
    }, { passive: true });

    heroSliderEl.addEventListener('touchend', () => {
        clearInterval(heroAutoSlide);
        heroAutoSlide = setInterval(() => slideHero(1), 4000);
    }, { passive: true });
}


// ===== MOBILE MENU =====
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('opacity-0');
        menu.classList.toggle('pointer-events-none');
    }
}


// ===== ICONS INITIALIZATION =====
lucide.createIcons();


// ===== SCROLL ANIMATIONS — MERGED INTO ONE OBSERVER =====
// FIX #3: Pehle 2 alag observers the, ab ek hi hai
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;

            // .fade-up elements (hero section wale)
            if (el.classList.contains('fade-up')) {
                el.classList.add('visible');
            }

            // .reveal-hidden elements (why dochaki, video, insta wale)
            if (el.classList.contains('reveal-hidden')) {
                const delay = el.dataset.delay || 0;
                el.style.animationDelay = delay + 'ms';
                el.classList.remove('reveal-hidden');
                el.classList.add('reveal-visible');
            }

            scrollObserver.unobserve(el);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.fade-up, .reveal-hidden').forEach(el => {
    scrollObserver.observe(el);
});


// ===== VIDEO CAROUSEL =====
// FIX #4: Null safety add kiya — agar koi element nahi mila to crash nahi hoga
let curSlide = 0;
const totalSlides = 4;
const videoSlidesEl = document.getElementById('videoSlides');
const videoDotsWrap = document.getElementById('carouselDots');
const videoDots = videoDotsWrap ? videoDotsWrap.querySelectorAll('.carousel-dot') : [];

function goVideoSlide(i) {
    if (i < 0) i = totalSlides - 1;
    if (i >= totalSlides) i = 0;
    curSlide = i;
    if (videoSlidesEl) {
        videoSlidesEl.style.transform = `translateX(-${curSlide * 100}%)`;
    }
    videoDots.forEach((d, idx) => d.classList.toggle('active', idx === curSlide));
}

const arrowLeft = document.getElementById('arrowLeft');
const arrowRight = document.getElementById('arrowRight');
if (arrowLeft) arrowLeft.onclick = () => goVideoSlide(curSlide - 1);
if (arrowRight) arrowRight.onclick = () => goVideoSlide(curSlide + 1);
videoDots.forEach(d => d.onclick = () => goVideoSlide(parseInt(d.dataset.index)));

// Auto-slide with mouse enter/leave
let videoAutoSlide = setInterval(() => goVideoSlide(curSlide + 1), 5000);
const videoWrap = document.querySelector('.video-carousel-wrap');

if (videoWrap) {
    videoWrap.addEventListener('mouseenter', () => clearInterval(videoAutoSlide));
    videoWrap.addEventListener('mouseleave', () => {
        clearInterval(videoAutoSlide);
        videoAutoSlide = setInterval(() => goVideoSlide(curSlide + 1), 5000);
    });
}

// Touch swipe for video
let videoTouchX = 0;
const videoTrack = document.querySelector('.video-track');

if (videoTrack) {
    videoTrack.addEventListener('touchstart', e => {
        videoTouchX = e.changedTouches[0].screenX;
        clearInterval(videoAutoSlide);
    }, { passive: true });

    videoTrack.addEventListener('touchend', e => {
        const diff = videoTouchX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            goVideoSlide(curSlide + (diff > 0 ? 1 : -1));
        }
        // FIX #5: Touch ke baad auto-slide restart
        videoAutoSlide = setInterval(() => goVideoSlide(curSlide + 1), 5000);
    }, { passive: true });
}

// FIX #6: document.onkeydown overwrite nahi karega kisi aur handler ko
document.addEventListener('keydown', e => {
    // Sirf tab react kare jab video section viewport mein ho
    if (!videoWrap) return;
    const rect = videoWrap.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft') goVideoSlide(curSlide - 1);
    if (e.key === 'ArrowRight') goVideoSlide(curSlide + 1);
});


// ===== CARD MOUSE GLOW =====
document.querySelectorAll('.why-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
});


// ===== TOAST =====
function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        // Agar HTML mein toast div nahi hai to dynamically bana do
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}