const canvas = document.querySelector("#constellation");
const ctx = canvas.getContext("2d");
const glow = document.querySelector(".cursor-glow");
const motionField = document.querySelector(".motion-field");
const themeButton = document.querySelector(".theme-toggle");
const contactModal = document.querySelector("#contact-modal");
const contactModalCard = document.querySelector(".contact-modal-card");
const contactToggles = document.querySelectorAll(".contact-toggle, .contact-float-toggle");
const contactCloseButtons = document.querySelectorAll("[data-close-contact]");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const resumeUrl = "https://drive.google.com/file/d/1OzRaWqZ3MP2DUwbI5QTuACnMHWRM57Fk/view?usp=sharing";

const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.42,
  active: false,
};

let particles = [];
let calmMotion = false;
let lastFrame = 0;

function setTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark-theme", dark);
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  themeButton.querySelector("span").textContent = dark ? "Light" : "Dark";
  localStorage.setItem("portfolio-theme", theme);
}

const savedTheme = localStorage.getItem("portfolio-theme");
const preferredTheme =
  savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
setTheme(preferredTheme);

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  seedParticles();
}

function seedParticles() {
  const count = Math.min(68, Math.max(34, Math.floor(window.innerWidth / 22)));
  particles = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    size: 1.2 + Math.random() * 2.2,
    hue: index % 4,
  }));
}

function drawCanvas(timestamp = 0) {
  requestAnimationFrame(drawCanvas);
  if (timestamp - lastFrame < 32) return;
  lastFrame = timestamp;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (calmMotion || reduced) {
    return;
  }

  particles.forEach((particle) => {
    const dx = pointer.x - particle.x;
    const dy = pointer.y - particle.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 150) {
      const force = (150 - distance) / 150;
      particle.vx -= (dx / distance) * force * 0.025 || 0;
      particle.vy -= (dy / distance) * force * 0.025 || 0;
    }

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.992;
    particle.vy *= 0.992;

    if (particle.x < -10) particle.x = window.innerWidth + 10;
    if (particle.x > window.innerWidth + 10) particle.x = -10;
    if (particle.y < -10) particle.y = window.innerHeight + 10;
    if (particle.y > window.innerHeight + 10) particle.y = -10;
  });

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < 118) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(16, 24, 40, ${0.12 * (1 - distance / 118)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  particles.forEach((particle) => {
    const colors = ["#0f9f9a", "#f06c5b", "#e0a82e", "#7357d8"];
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = colors[particle.hue];
    ctx.fill();
  });
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
  glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;

  if (!calmMotion && !reduced) {
    const xShift = ((event.clientX / window.innerWidth) - 0.5) * 34;
    const yShift = ((event.clientY / window.innerHeight) - 0.5) * 34;
    motionField.style.setProperty("--motion-x", `${xShift}px`);
    motionField.style.setProperty("--motion-y", `${yShift}px`);
  }
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener(
  "scroll",
  () => {
    if (calmMotion || reduced) return;
    motionField.style.setProperty("--scroll-shift", `${window.scrollY * 0.045}px`);
  },
  { passive: true }
);

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

document.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));

const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector("#mobile-nav");

navToggle.addEventListener("click", () => {
  const open = !mobileNav.classList.contains("open");
  mobileNav.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});

mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = Number(entry.target.dataset.count);
      let current = 0;
      const increment = Math.max(1, Math.ceil(target / 38));
      const tick = () => {
        current = Math.min(target, current + increment);
        entry.target.textContent = current;
        if (current < target) requestAnimationFrame(tick);
      };
      tick();
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.8 }
);

counters.forEach((counter) => counterObserver.observe(counter));

document.querySelectorAll(".magnet").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    if (calmMotion || reduced) return;
    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const rotateX = Math.max(-6, Math.min(6, -y / 18));
    const rotateY = Math.max(-6, Math.min(6, x / 18));
    item.style.transform = `translateY(-3px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project-card");

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    filters.forEach((button) => button.classList.remove("active"));
    filter.classList.add("active");
    const tag = filter.dataset.filter;

    projects.forEach((project) => {
      const tags = project.dataset.tags.split(" ");
      project.classList.toggle("hidden", tag !== "all" && !tags.includes(tag));
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !contactModal.hasAttribute("hidden")) {
    closeContactModal();
  }
  if (event.key.toLowerCase() === "p" && !event.metaKey && !event.ctrlKey) {
    document.querySelector("#projects").scrollIntoView({ behavior: "smooth" });
  }
  if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey) {
    window.location.href = resumeUrl;
  }
});

themeButton.addEventListener("click", () => {
  setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark");
});

function openContactModal() {
  contactModal.removeAttribute("hidden");
  contactToggles.forEach((button) => button.setAttribute("aria-expanded", "true"));
  contactModalCard.focus();
}

function closeContactModal() {
  contactModal.setAttribute("hidden", "");
  contactToggles.forEach((button) => button.setAttribute("aria-expanded", "false"));
}

contactToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    openContactModal();
  });
});

contactCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeContactModal();
  });
});

resizeCanvas();
drawCanvas();
