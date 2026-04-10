gsap.registerPlugin(ScrollTrigger);

/* ── FLOATING BG ICONS ── */
const floatIcons = ["🌾", "🌿", "🍃", "🌱", "🌽", "🥦", "🫛", "🍅", "🌻", "🫚"];
const fa = document.getElementById("hfloat");
for (let i = 0; i < 16; i++) {
  const d = document.createElement("div");
  d.className = "hf";
  d.textContent = floatIcons[i % floatIcons.length];
  d.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%`;
  fa.appendChild(d);
  gsap.to(d, {
    y: (Math.random() - 0.5) * 70,
    x: (Math.random() - 0.5) * 35,
    rotation: (Math.random() - 0.5) * 50,
    duration: 3 + Math.random() * 4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: Math.random() * 1,
  });
}

/* ── LOGO PULSE ── */
gsap.to("#logo-svg", {
  rotation: 8,
  duration: 1.8,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
  transformOrigin: "center",
});
gsap.to("#stem", {
  scaleY: 1.15,
  duration: 1.2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
  transformOrigin: "bottom center",
});

/* ── NAVBAR ENTRANCE ── */
gsap.fromTo(
  "#nav",
  { y: -70, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
);

/* ── NAV LINKS: Home & Contact stagger in ── */
gsap.fromTo(
  ["#nl-home", "#nl-contact"],
  { opacity: 0, y: -20 },
  {
    opacity: 1,
    y: 0,
    stagger: 0.15,
    duration: 0.5,
    delay: 0.4,
    ease: "back.out(1.7)",
  },
);

/* ── LOGIN BUTTON bounce in ── */
gsap.fromTo(
  "#nav-login",
  { opacity: 0, scale: 0.6, rotation: -10 },
  {
    opacity: 1,
    scale: 1,
    rotation: 0,
    duration: 0.6,
    delay: 0.7,
    ease: "back.out(2)",
  },
);

/* ── LOGIN BUTTON icon wiggle on hover ── */
const loginBtn = document.getElementById("nav-login");
loginBtn.addEventListener("mouseenter", () =>
  gsap.to(loginBtn.querySelector("svg"), {
    rotation: 15,
    scale: 1.3,
    duration: 0.25,
    ease: "power2.out",
  }),
);
loginBtn.addEventListener("mouseleave", () =>
  gsap.to(loginBtn.querySelector("svg"), {
    rotation: 0,
    scale: 1,
    duration: 0.25,
    ease: "power2.out",
  }),
);

/* ── HERO ENTRANCE ── */
const heroTl = gsap.timeline({ delay: 0.5 });
heroTl
  .fromTo(
    "#hbadge",
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
  )
  .fromTo(
    "#htitle",
    { opacity: 0, y: 36 },
    { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" },
    "<.15",
  )
  .fromTo(
    "#hsub",
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
    "<.2",
  )
  .fromTo(
    "#hbtn",
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" },
    "<.15",
  )
  .fromTo(
    ["#st1", "#st2", "#st3"],
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, stagger: 0.15, duration: 0.4, ease: "power2.out" },
    "<.2",
  );

/* ── COUNTERS ── */
function countUp(id, to, suffix = "") {
  const el = document.getElementById(id),
    obj = { v: 0 };
  gsap.to(obj, {
    v: to,
    duration: 2,
    ease: "power2.out",
    delay: 1.2,
    onUpdate: () =>
      (el.textContent = Math.round(obj.v).toLocaleString() + suffix),
  });
}
countUp("c1", 12400, "+");
countUp("c2", 84000, "+");
countUp("c3", 320, "+");

/* ── HOW IT WORKS: scroll reveal + icon bounce ── */
gsap.fromTo(
  "#hw-t",
  { opacity: 0, y: 28 },
  {
    opacity: 1,
    y: 0,
    duration: 0.6,
    scrollTrigger: { trigger: "#hw-t", start: "top 85%" },
  },
);

const hwCards = document.querySelectorAll("#hw-cards .card");
hwCards.forEach((card, i) => {
  gsap.fromTo(
    card,
    { opacity: 0, y: 50, scale: 0.9 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.65,
      ease: "back.out(1.4)",
      delay: i * 0.12,
      scrollTrigger: { trigger: "#hw-cards", start: "top 80%" },
    },
  );
  const iw = card.querySelector(".icon-wrap");
  gsap.to(iw, {
    y: -6,
    duration: 1.6 + i * 0.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: i * 0.3,
  });
  card.addEventListener("mouseenter", () => {
    gsap.to(iw, {
      rotation: 15,
      scale: 1.15,
      duration: 0.3,
      ease: "back.out(2)",
    });
    gsap.to(iw.querySelector("svg"), {
      filter: "drop-shadow(0 4px 10px rgba(76,175,80,.5))",
      duration: 0.3,
    });
  });
  card.addEventListener("mouseleave", () => {
    gsap.to(iw, { rotation: 0, scale: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(iw.querySelector("svg"), { filter: "none", duration: 0.3 });
  });
});

/* ── FEATURES: scroll reveal + icon spin on hover ── */
gsap.fromTo(
  "#feat-t",
  { opacity: 0, y: 28 },
  {
    opacity: 1,
    y: 0,
    duration: 0.6,
    scrollTrigger: { trigger: "#feat-t", start: "top 85%" },
  },
);

const fCards = document.querySelectorAll("#feat-cards .feat-card");
fCards.forEach((card, i) => {
  gsap.fromTo(
    card,
    { opacity: 0, x: -36 },
    {
      opacity: 1,
      x: 0,
      duration: 0.55,
      ease: "power3.out",
      delay: i * 0.13,
      scrollTrigger: { trigger: "#feat-cards", start: "top 82%" },
    },
  );
  const fi = card.querySelector(".feat-icon");
  card.addEventListener("mouseenter", () =>
    gsap.to(fi, {
      rotation: 360,
      scale: 1.18,
      duration: 0.5,
      ease: "power2.inOut",
    }),
  );
  card.addEventListener("mouseleave", () =>
    gsap.to(fi, { rotation: 0, scale: 1, duration: 0.4, ease: "power2.out" }),
  );
});
