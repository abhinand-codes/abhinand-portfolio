const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;

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

// Scroll progress bar
const progressBar = document.querySelector<HTMLElement>(".scroll-progress span");
const updateProgress = () => {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
};
updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

// Cursor glow + custom cursor dot (desktop, fine-pointer only)
if (!isCoarsePointer) {
  const cursorGlow = document.querySelector<HTMLElement>(".cursor-glow");
  const cursorDot = document.querySelector<HTMLElement>(".cursor-dot");
  let rafId = 0;
  let targetX = 0;
  let targetY = 0;

  const applyCursorPosition = () => {
    if (cursorGlow) cursorGlow.style.transform = `translate(${targetX}px, ${targetY}px)`;
    if (cursorDot) cursorDot.style.transform = `translate(${targetX}px, ${targetY}px)`;
    rafId = 0;
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (cursorGlow) cursorGlow.style.opacity = "1";
      if (cursorDot) cursorDot.style.opacity = "1";
      if (!rafId) rafId = requestAnimationFrame(applyCursorPosition);
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    if (cursorGlow) cursorGlow.style.opacity = "0";
    if (cursorDot) cursorDot.style.opacity = "0";
  });

  const hoverTargets = document.querySelectorAll<HTMLElement>("a, button, [data-tilt]");
  hoverTargets.forEach((el) => {
    el.addEventListener("pointerenter", () => cursorDot?.classList.add("is-hovering"));
    el.addEventListener("pointerleave", () => cursorDot?.classList.remove("is-hovering"));
  });
}

// Contact terminal: copy email + mailto composer
const copyEmailBtn = document.querySelector<HTMLButtonElement>("#copy-email-btn");
if (copyEmailBtn) {
  const label = copyEmailBtn.querySelector<HTMLElement>(".copy-label");
  copyEmailBtn.addEventListener("click", async () => {
    const email = copyEmailBtn.dataset.email ?? "";
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Clipboard API unavailable (older browser / permissions) — fall back silently.
    }
    copyEmailBtn.classList.add("is-copied");
    if (label) label.textContent = "Copied ✓";
    window.setTimeout(() => {
      copyEmailBtn.classList.remove("is-copied");
      if (label) label.textContent = "Copy";
    }, 1800);
  });
}

const sendMailBtn = document.querySelector<HTMLButtonElement>("#send-mail-btn");
if (sendMailBtn) {
  sendMailBtn.addEventListener("click", () => {
    const to = copyEmailBtn?.dataset.email ?? "abhinand.codes@gmail.com";
    const subjectEl = document.querySelector<HTMLInputElement>("#contact-subject");
    const messageEl = document.querySelector<HTMLTextAreaElement>("#contact-message");
    const subject = subjectEl?.value.trim() || "Role opportunity";
    const body = messageEl?.value.trim() || "";
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}

// 3D tilt on project cards (desktop, fine-pointer only)
if (!isCoarsePointer && !prefersReducedMotion) {
  const tiltCards = document.querySelectorAll<HTMLElement>("[data-tilt]");

  tiltCards.forEach((card) => {
    const maxTilt = 6;

    const handleMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (-py * maxTilt).toFixed(2);
      const rotateY = (px * maxTilt).toFixed(2);
      card.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const resetTilt = () => {
      card.style.transform = "";
    };

    card.addEventListener("pointermove", handleMove);
    card.addEventListener("pointerleave", resetTilt);
  });
}
