const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
const navLinks = document.querySelectorAll<HTMLAnchorElement>(".nav-links a");
const navList = document.querySelector<HTMLElement>(".nav-links");
const navIndicator = document.querySelector<HTMLElement>(".nav-indicator");
const sections = [...navLinks]
  .map((link) => document.querySelector<HTMLElement>(link.hash))
  .filter(Boolean) as HTMLElement[];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => observer.observe(item));

const moveNavIndicator = () => {
  if (!navIndicator || !navList) return;
  const active = navList.querySelector<HTMLAnchorElement>("a.is-active");
  if (!active) {
    navIndicator.style.opacity = "0";
    return;
  }
  const navRect = navList.getBoundingClientRect();
  const linkRect = active.getBoundingClientRect();
  navIndicator.style.left = `${linkRect.left - navRect.left}px`;
  navIndicator.style.width = `${linkRect.width}px`;
  navIndicator.style.opacity = "1";
};

const setActiveNav = () => {
  const activeSection = sections
    .filter((section) => section.getBoundingClientRect().top <= 150)
    .pop();

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", activeSection?.id === link.hash.slice(1));
  });

  moveNavIndicator();
};

setActiveNav();
window.addEventListener("scroll", setActiveNav, { passive: true });
window.addEventListener("resize", moveNavIndicator);

// Count-up animation for hero stats (4+, 5+, 40%, 20+ ...)
const statEls = document.querySelectorAll<HTMLElement>(".hero-stats dt");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const animateStat = (el: HTMLElement) => {
  const raw = el.dataset.statValue ?? el.textContent?.trim() ?? "";
  const match = raw.match(/^([\d.]+)(.*)$/);
  if (!match) return;

  if (prefersReducedMotion) {
    el.textContent = raw;
    return;
  }

  const end = parseFloat(match[1]);
  const suffix = match[2];
  const isInteger = Number.isInteger(end);
  const duration = 1100;
  const start = performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = end * eased;
    el.textContent = `${isInteger ? Math.round(current) : current.toFixed(1)}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = raw;
    }
  };

  requestAnimationFrame(step);
};

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateStat(entry.target as HTMLElement);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

statEls.forEach((el) => {
  const raw = el.textContent?.trim() ?? "";
  el.dataset.statValue = raw;
  if (!prefersReducedMotion) {
    el.textContent = "0";
  }
  statObserver.observe(el);
});
