const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
const navLinks = document.querySelectorAll<HTMLAnchorElement>(".nav-links a");
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

const setActiveNav = () => {
  const activeSection = sections
    .filter((section) => section.getBoundingClientRect().top <= 150)
    .pop();

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", activeSection?.id === link.hash.slice(1));
  });
};

setActiveNav();
window.addEventListener("scroll", setActiveNav, { passive: true });
