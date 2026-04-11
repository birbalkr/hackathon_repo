// ── District pills (pure JS — no template literals in HTML) ──
(function () {
  var districts = [
    "Patna",
    "Vaishali",
    "Muzaffarpur",
    "Samastipur",
    "Darbhanga",
    "Begusarai",
    "Gaya",
    "Nalanda",
    "Bhagalpur",
    "Purnia",
  ];
  var container = document.getElementById("district-pills");
  districts.forEach(function (d) {
    var s = document.createElement("span");
    s.className = "district-pill";
    s.textContent = d;
    container.appendChild(s);
  });
})();

// ── Page navigation ──────────────────────────
function showPage(id) {
  if (typeof id === "string" && (id.startsWith("/") || id.endsWith(".html"))) {
    window.location.href = id;
    return;
  }

  document.querySelectorAll(".page").forEach(function (p) {
    p.classList.remove("active");
  });
  var page = document.getElementById("page-" + id);
  if (page) page.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  // nav highlights
  ["home", "contact"].forEach(function (k) {
    var el = document.getElementById("nl-" + k);
    if (el) el.classList.toggle("active", k === id);
  });
}
function goHome() {
  showPage("home");
}
function goLogin() {
  showPage("/protected/protected.html");
}
function goContact() {
  showPage("home");
  setTimeout(function () {
    jumpTo("contact");
  }, 150);
}
function jumpTo(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// ── Navbar scroll ─────────────────────────────
window.addEventListener("scroll", function () {
  document
    .getElementById("navbar")
    .classList.toggle("scrolled", window.scrollY > 10);
});
document.getElementById("navbar").classList.add("scrolled");

// ── Mobile menu ───────────────────────────────
function toggleMenu() {
  document.getElementById("mobile-menu").classList.toggle("open");
}
document.addEventListener("click", function (e) {
  var menu = document.getElementById("mobile-menu");
  var ham = document.getElementById("hamburger");
  if (
    menu.classList.contains("open") &&
    !menu.contains(e.target) &&
    !ham.contains(e.target)
  ) {
    menu.classList.remove("open");
  }
});

// ── Hero counter animation ────────────────────
var counters = [
  { id: "cnt1", target: 18400, suffix: "+" },
  { id: "cnt2", target: 12485, suffix: "" },
  { id: "cnt3", target: 48200, suffix: "T" },
  { id: "cnt4", target: 38, suffix: "+" },
];
function animCount(el, target, suffix, dur) {
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var p = Math.min((ts - start) / dur, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(ease * target).toLocaleString("en-IN") + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString("en-IN") + suffix;
  }
  requestAnimationFrame(step);
}
setTimeout(function () {
  counters.forEach(function (c) {
    var el = document.getElementById(c.id);
    if (el) animCount(el, c.target, c.suffix, 2000);
  });
}, 500);

// ── Scroll reveal ─────────────────────────────
var revObs = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.1 },
);
document.querySelectorAll(".reveal").forEach(function (el) {
  revObs.observe(el);
});

// ── 6-second popup ────────────────────────────
var popupShown = false;
var popupInt = null;
var remaining = 30;

function showPopup() {
  if (popupShown) return;
  popupShown = true;
  document.getElementById("popup-overlay").classList.add("show");
  var timerEl = document.getElementById("popup-timer");
  popupInt = setInterval(function () {
    remaining--;
    timerEl.textContent = "Closes automatically in " + remaining + "s";
    if (remaining <= 0) closePopup();
  }, 1000);
}
function closePopup() {
  document.getElementById("popup-overlay").classList.remove("show");
  clearInterval(popupInt);
}
// Trigger at 6 seconds
setTimeout(showPopup, 6000);
// Exit-intent
document.addEventListener("mouseleave", function (e) {
  if (e.clientY < 5 && !popupShown) showPopup();
});
// Click overlay to close
document
  .getElementById("popup-overlay")
  .addEventListener("click", function (e) {
    if (e.target === this) closePopup();
  });

// ── Auth tab switch ───────────────────────────
function switchTab(tab) {
  var si = tab === "signin";
  document.getElementById("tab-si").classList.toggle("active", si);
  document.getElementById("tab-su").classList.toggle("active", !si);
  document.getElementById("form-signin").style.display = si ? "block" : "none";
  document.getElementById("form-signup").style.display = si ? "none" : "block";
  document.getElementById("auth-title").textContent = si
    ? "Welcome back"
    : "Join KisanTrack";
  document.getElementById("auth-sub").textContent = si
    ? "Sign in to your KisanTrack account"
    : "Create your free account in 30 seconds";
}

// ── Sign In ───────────────────────────────────
function handleSignIn() {
  var email = document.getElementById("si-email").value.trim();
  var pass = document.getElementById("si-pass").value;
  if (!email) return showToast("Please enter your email or phone.", "red");
  if (!pass) return showToast("Please enter your password.", "red");
  if (pass.length < 6)
    return showToast("Password must be at least 6 characters.", "red");
  showToast("Signing you in... Welcome back!", "green");
  setTimeout(goHome, 1600);
}

// ── Sign Up ───────────────────────────────────
function handleSignUp() {
  var first = document.getElementById("su-first").value.trim();
  var email = document.getElementById("su-email").value.trim();
  var pass = document.getElementById("su-pass").value;
  if (!first) return showToast("Please enter your first name.", "red");
  if (!email) return showToast("Please enter your email.", "red");
  if (pass.length < 8)
    return showToast("Password must be at least 8 characters.", "red");
  showToast("Account created! Welcome, " + first + "!", "green");
  setTimeout(goHome, 1800);
}

// ── Password visibility ───────────────────────
function togglePass(id, btn) {
  var inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === "password" ? "text" : "password";
  btn.textContent = inp.type === "password" ? "\uD83D\uDC41" : "\uD83D\uDE48";
}

// ── Contact form ──────────────────────────────
function submitContact() {
  var name = document.getElementById("c-name").value.trim();
  var email = document.getElementById("c-email").value.trim();
  var msg = document.getElementById("c-msg").value.trim();
  if (!name) return showToast("Please enter your name.", "red");
  if (!email) return showToast("Please enter your email or phone.", "red");
  if (!msg) return showToast("Please write a message.", "red");
  showToast("Message sent! We'll reply within 24 hours.", "green");
  document.getElementById("c-name").value = "";
  document.getElementById("c-email").value = "";
  document.getElementById("c-msg").value = "";
}

// ── Toast ─────────────────────────────────────
function showToast(msg, type) {
  var t = document.getElementById("toast");
  t.style.background = type === "red" ? "#C0392B" : "#0D4A1E";
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function () {
    t.classList.remove("show");
  }, 3400);
}

// chatbot 

  window.watsonAssistantChatOptions = {
    integrationID: "a0f050db-d63d-45be-80ec-79338ae73be8", // The ID of this integration.
    region: "au-syd", // The region your integration is hosted in.
    serviceInstanceID: "baecb4fa-85db-4ead-8fda-b4074a592e26", // The ID of your service instance.
    onLoad: async (instance) => { await instance.render(); }
  };
  setTimeout(function(){
    const t=document.createElement('script');
    t.src="https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + (window.watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
    document.head.appendChild(t);
  });

