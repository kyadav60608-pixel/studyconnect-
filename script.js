/* =========================================================
   STUDYCONNECT — FINAL SCRIPT.JS
   PART 1 / 2
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCquRX2YB59FObuIyiSw3Wc3aUCdPWypag",
  authDomain: "studyconnect-99006.firebaseapp.com",
  projectId: "studyconnect-99006",
  storageBucket: "studyconnect-99006.firebasestorage.app",
  messagingSenderId: "15964627995",
  appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
  measurementId: "G-SYJYMREJJL"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);


/* =========================================================
   APP CONSTANTS
   ========================================================= */

const OWNER_NAME = "Krishna Yadav";
const OWNER_SHORT_NAME = "Krishna Ji";

/* Development/bootstrap owner password.
   Change it later from Owner > Security. */
const OWNER_BOOT_PASSWORD = "12341";

const STUDENT_BOOT_PASSWORD = "123";

let currentUser = null;
let currentStudent = null;
let currentPermission = "normal";
let currentPage = "home";
let currentChatUser = null;
let currentChatUnsubscribe = null;
let globalSettings = {};
let appFeatures = {};

let navigationHistory = [];
let isLoggingIn = false;


/* =========================================================
   SMALL HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

function exists(id) {
  return !!$(id);
}

function text(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

function html(id, value) {
  const el = $(id);
  if (el) el.innerHTML = value ?? "";
}

function value(id, fallback = "") {
  const el = $(id);
  return el ? el.value : fallback;
}

function setValue(id, v) {
  const el = $(id);
  if (el) el.value = v ?? "";
}

function show(id) {
  const el = $(id);
  if (el) el.hidden = false;
}

function hide(id) {
  const el = $(id);
  if (el) el.hidden = true;
}

function toggle(id, state) {
  const el = $(id);
  if (el) el.hidden = !state;
}

function escapeHTML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanPhone(phone = "") {
  return String(phone).replace(/\D/g, "").slice(-10);
}

function profileId(phone) {
  return btoa(cleanPhone(phone))
    .replaceAll("=", "")
    .replaceAll("/", "_")
    .replaceAll("+", "-");
}

function makeChatId(a, b) {
  return [profileId(a), profileId(b)].sort().join("_");
}

function nowText(timestamp) {
  if (!timestamp) return "";

  let date;

  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function dateText(timestamp) {
  if (!timestamp) return "";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function sameDay(a, b) {
  if (!a || !b) return false;

  const d1 = a.toDate ? a.toDate() : new Date(a);
  const d2 = b.toDate ? b.toDate() : new Date(b);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message, icon = "✓") {
  const box = $("toast");
  if (!box) return;

  text("toastIcon", icon);
  text("toastMessage", message);

  box.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    box.classList.remove("show");
  }, 2600);
}


/* =========================================================
   APP MODAL
   ========================================================= */

function openAppModal(titleValue, bodyValue) {
  text("appModalTitle", titleValue);
  html("appModalBody", bodyValue);

  const modal = $("appModal");

  if (modal) {
    modal.classList.add("active");
    modal.hidden = false;
  }
}

function closeAppModal() {
  const modal = $("appModal");

  if (modal) {
    modal.classList.remove("active");
    modal.hidden = true;
  }
}


/* =========================================================
   HASH PASSWORD
   ========================================================= */

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}


/* =========================================================
   FIREBASE AUTH
   ========================================================= */

async function startFirebaseAuth() {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Firebase Auth:", error);
    toast("Firebase connection failed", "!");
  }
}

onAuthStateChanged(auth, user => {
  currentUser = user || null;
});


/* =========================================================
   GLOBAL SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
  appName: "StudyConnect",
  language: "en",
  theme: "system",
  welcomeAnimation: true,

  features: {
    chat: true,
    groups: true,
    homework: true,
    notes: true,
    announcements: true,
    registration: true,
    studentSearch: true,
    maintenance: false
  }
};


async function loadGlobalSettings() {
  try {
    const ref = doc(db, "appSettings", "main");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      globalSettings = {
        ...DEFAULT_SETTINGS,
        ...snap.data()
      };

      appFeatures = {
        ...DEFAULT_SETTINGS.features,
        ...(snap.data().features || {})
      };
    } else {
      globalSettings = { ...DEFAULT_SETTINGS };
      appFeatures = { ...DEFAULT_SETTINGS.features };

      if (currentUser) {
        try {
          await setDoc(ref, {
            ...DEFAULT_SETTINGS,
            features: DEFAULT_SETTINGS.features,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn("Initial settings save skipped:", e);
        }
      }
    }

    applyGlobalSettings();

  } catch (error) {
    console.error("Settings load:", error);

    globalSettings = { ...DEFAULT_SETTINGS };
    appFeatures = { ...DEFAULT_SETTINGS.features };

    applyGlobalSettings();
  }
}


/* =========================================================
   LANGUAGE
   ========================================================= */

const translations = {
  en: {
    home: "Home",
    chat: "Chat",
    groups: "Groups",
    homework: "Homework",
    school: "School Updates",
    notes: "Notes",
    settings: "Settings",
    ownerPanel: "Owner Panel",
    logout: "Logout",
    search: "Search",
    send: "Send",
    createGroup: "Create Group",
    noData: "Nothing here yet",
    loading: "Loading...",
    online: "Online",
    offline: "Offline",
    normal: "Normal",
    allow: "Allow",
    restricted: "Restricted",
    blocked: "Blocked"
  },

  hi: {
    home: "होम",
    chat: "चैट",
    groups: "ग्रुप",
    homework: "होमवर्क",
    school: "स्कूल अपडेट",
    notes: "नोट्स",
    settings: "सेटिंग्स",
    ownerPanel: "ओनर पैनल",
    logout: "लॉगआउट",
    search: "खोजें",
    send: "भेजें",
    createGroup: "ग्रुप बनाएँ",
    noData: "अभी कुछ नहीं है",
    loading: "लोड हो रहा है...",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    normal: "नॉर्मल",
    allow: "अनुमति",
    restricted: "सीमित",
    blocked: "ब्लॉक"
  }
};

function t(key) {
  const lang = globalSettings.language === "hi"
    ? "hi"
    : "en";

  return translations[lang]?.[key] || translations.en[key] || key;
}


/* =========================================================
   APPLY GLOBAL SETTINGS
   ========================================================= */

function applyGlobalSettings() {
  const lang =
    globalSettings.language === "hi"
      ? "hi"
      : "en";

  document.documentElement.lang =
    lang === "hi" ? "hi" : "en";

  if (globalSettings.appName) {
    text("appTitle", globalSettings.appName);
    text("loginTitle", globalSettings.appName);
  }

  applyTheme(globalSettings.theme);

  applyFeatureVisibility();

  /* Owner welcome select */
  const welcomeSelect = $("ownerWelcomeAnimation");

  if (welcomeSelect) {
    welcomeSelect.value =
      globalSettings.welcomeAnimation === false
        ? "off"
        : "on";
  }
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme(theme) {
  const body = document.body;

  if (!body) return;

  body.classList.remove("dark");

  if (theme === "dark") {
    body.classList.add("dark");
  }

  if (theme === "system") {
    const dark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (dark) {
      body.classList.add("dark");
    }
  }
}


/* =========================================================
   FEATURE VISIBILITY
   ========================================================= */

function applyFeatureVisibility() {
  const map = {
    chat: "[data-page='chat']",
    groups: "[data-page='groups']",
    homework: "[data-page='homework']",
    announcements: "[data-page='school']",
    notes: "[data-page='notes']"
  };

  Object.entries(map).forEach(([feature, selector]) => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display =
        appFeatures[feature] === false
          ? "none"
          : "";
    });
  });

  const featureCards = document.querySelectorAll(
    ".feature-card[data-feature]"
  );

  featureCards.forEach(card => {
    const feature = card.dataset.feature;

    if (
      feature &&
      appFeatures[feature] === false
    ) {
      card.style.display = "none";
    } else {
      card.style.display = "";
    }
  });

  const maintenance = $("maintenanceNotice");

  if (maintenance) {
    maintenance.hidden =
      appFeatures.maintenance !== true;
  }
}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(message, type = "") {
  const el = $("loginMessage");

  if (!el) return;

  el.textContent = message;
  el.className = "login-message";

  if (type) {
    el.classList.add(type);
  }
}


/* =========================================================
   OWNER WELCOME
   ========================================================= */

function showOwnerWelcome() {
  const welcome = $("ownerWelcome");

  if (!welcome) {
    openApp();
    return;
  }

  text(
    "ownerWelcomeTitle",
    "Welcome Owner"
  );

  text(
    "ownerWelcomeText",
    `${OWNER_SHORT_NAME}`
  );

  const stars = $("fallingStars");

  if (stars) {
    stars.innerHTML = "";

    for (let i = 0; i < 32; i++) {
      const star = document.createElement("span");

      star.textContent = "✦";

      star.style.left =
        `${Math.random() * 100}%`;

      star.style.animationDelay =
        `${Math.random() * 1.4}s`;

      star.style.animationDuration =
        `${1.5 + Math.random() * 1.5}s`;

      stars.appendChild(star);
    }
  }

  welcome.classList.add("active");
  welcome.hidden = false;

  /* Small celebration tone */
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = 660;
      gain.gain.value = 0.035;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      setTimeout(() => {
        osc.frequency.value = 880;
      }, 120);

      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 260);
    }
  } catch (e) {
    console.warn("Welcome tone unavailable");
  }

  setTimeout(() => {
    welcome.classList.remove("active");
    welcome.hidden = true;
    openApp();
  }, 2100);
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin() {
  if (isLoggingIn) return;

  isLoggingIn = true;

  const name = value("loginName").trim();
  const phone = cleanPhone(value("loginPhone"));
  const password = value("loginPassword");

  if (!name) {
    showLoginMessage(
      "Please enter your name.",
      "error"
    );

    isLoggingIn = false;
    return;
  }

  if (phone.length !== 10) {
    showLoginMessage(
      "Please enter a valid 10-digit mobile number.",
      "error"
    );

    isLoggingIn = false;
    return;
  }

  if (!password) {
    showLoginMessage(
      "Please enter your password.",
      "error"
    );

    isLoggingIn = false;
    return;
  }

  try {
    showLoginMessage("Checking...", "info");

    if (!currentUser) {
      await startFirebaseAuth();
    }

    /* OWNER LOGIN */
    const isOwnerName =
      name.toLowerCase() ===
      OWNER_NAME.toLowerCase();

    if (isOwnerName) {
      const enteredHash =
        await hashPassword(password);

      let ownerPasswordHash = "";

      try {
        const settingsSnap = await getDoc(
          doc(db, "appSettings", "main")
        );

        if (settingsSnap.exists()) {
          ownerPasswordHash =
            settingsSnap.data().ownerPasswordHash || "";
        }
      } catch (e) {
        console.warn("Owner settings read:", e);
      }

      const bootHash =
        await hashPassword(OWNER_BOOT_PASSWORD);

      if (
        enteredHash !== bootHash &&
        enteredHash !== ownerPasswordHash
      ) {
        showLoginMessage(
          "Owner password is incorrect.",
          "error"
        );

        isLoggingIn = false;
        return;
      }

      currentStudent = {
        id: "owner",
        name: OWNER_NAME,
        phone,
        permission: "owner",
        role: "owner",
        status: "approved"
      };

      currentPermission = "owner";

      localStorage.setItem(
        "studyName",
        OWNER_NAME
      );

      localStorage.setItem(
        "studyPhone",
        phone
      );

      localStorage.setItem(
        "studyRole",
        "owner"
      );

      showLoginMessage(
        "Owner verified.",
        "success"
      );

      setTimeout(() => {
        showOwnerWelcome();
      }, 200);

      isLoggingIn = false;
      return;
    }


    /* STUDENT LOGIN */

    const studentRef =
      doc(db, "students", profileId(phone));

    const studentSnap =
      await getDoc(studentRef);

    if (!studentSnap.exists()) {

      if (appFeatures.registration === false) {
        showLoginMessage(
          "Registration is currently disabled.",
          "error"
        );

        isLoggingIn = false;
        return;
      }

      const newStudent = {
        name,
        phone,
        passwordHash:
          await hashPassword(password),
        permission: "restricted",
        status: "pending",
        role: "student",
        followers: [],
        following: [],
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      };

      await setDoc(
        studentRef,
        newStudent
      );

      showLoginMessage(
        "Registration submitted. Please wait for Owner approval.",
        "success"
      );

      isLoggingIn = false;
      return;
    }


    const student =
      studentSnap.data();

    if (student.status === "blocked") {
      showLoginMessage(
        "Your account is blocked.",
        "error"
      );

      isLoggingIn = false;
      return;
    }

    if (student.status === "pending") {
      showLoginMessage(
        "Your account is waiting for Owner approval.",
        "error"
      );

      isLoggingIn = false;
      return;
    }

    const enteredHash =
      await hashPassword(password);

    let correctHash =
      student.passwordHash || "";

    /* Existing old accounts may still use password "123". */
    const oldBootHash =
      await hashPassword(STUDENT_BOOT_PASSWORD);

    const passwordOK =
      enteredHash === correctHash ||
      (
        !correctHash &&
        enteredHash === oldBootHash
      );

    if (!passwordOK) {
      showLoginMessage(
        "Incorrect password.",
        "error"
      );

      isLoggingIn = false;
      return;
    }


    currentStudent = {
      id: studentSnap.id,
      ...student
    };

    currentPermission =
      student.permission || "restricted";

    localStorage.setItem(
      "studyName",
      student.name || name
    );

    localStorage.setItem(
      "studyPhone",
      student.phone || phone
    );

    localStorage.setItem(
      "studyRole",
      "student"
    );

    try {
      await updateDoc(studentRef, {
        lastSeen: serverTimestamp(),
        online: true
      });
    } catch (e) {
      console.warn("Online update:", e);
    }

    showLoginMessage(
      "Login successful.",
      "success"
    );

    setTimeout(() => {
      openApp();
    }, 250);

  } catch (error) {
    console.error("Login:", error);

    showLoginMessage(
      "Something went wrong. Please try again.",
      "error"
    );
  }

  isLoggingIn = false;
}


/* =========================================================
   OPEN APP
   ========================================================= */

function openApp() {
  hide("loginScreen");
  show("app");

  const app = $("app");

  if (app) {
    app.classList.add("active");
  }

  updateProfileUI();
  applyPermissionUI();

  navigateTo("home", false);

  loadHomeData();

  updateOnlineStatus();
}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {
  if (!currentStudent) return;

  const name =
    currentStudent.name || "";

  const phone =
    currentStudent.phone || "";

  text("profileName", name);
  text("profilePhone", phone);

  const initial =
    name.trim().charAt(0).toUpperCase() || "?";

  text("profileAvatar", initial);
  text("headerProfileInitial", initial);

  text("homeGreeting", `Hello, ${name}`);

  if (
    currentStudent.role === "owner" ||
    currentPermission === "owner"
  ) {
    const ownerCard =
      $("ownerSettingsCard");

    if (ownerCard) {
      ownerCard.hidden = false;
    }
  }
}


/* =========================================================
   PERMISSIONS
   ========================================================= */

function applyPermissionUI() {
  const isOwner =
    currentStudent?.role === "owner" ||
    currentPermission === "owner";

  if (isOwner) {
    document.querySelectorAll(
      ".nav-item"
    ).forEach(item => {
      item.style.display = "";
    });

    return;
  }

  document.querySelectorAll(
    ".nav-item"
  ).forEach(item => {

    const page =
      item.dataset.page;

    let allowed = false;

    if (
      page === "home" ||
      page === "homework" ||
      page === "school"
    ) {
      allowed = true;
    }

    if (
      currentPermission === "normal" &&
      page === "chat"
    ) {
      allowed = true;
    }

    if (
      currentPermission === "allow"
    ) {
      allowed = true;
    }

    item.style.display =
      allowed ? "" : "none";
  });
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function navigateTo(page, saveHistory = true) {
  if (!page) return;

  if (saveHistory && currentPage !== page) {
    navigationHistory.push(currentPage);
  }

  currentPage = page;

  document.querySelectorAll(
    ".page"
  ).forEach(section => {
    section.classList.remove("active");
    section.hidden = true;
  });

  const target =
    $(`page-${page}`);

  if (target) {
    target.classList.add("active");
    target.hidden = false;
  }

  document.querySelectorAll(
    ".nav-item, .bottom-nav-item"
  ).forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === page
    );
  });

  const titles = {
    home: "StudyConnect",
    chat: t("chat"),
    groups: t("groups"),
    homework: t("homework"),
    school: t("school"),
    notes: t("notes"),
    settings: t("settings"),
    owner: t("ownerPanel")
  };

  text(
    "appTitle",
    globalSettings.appName ||
    titles[page] ||
    "StudyConnect"
  );

  if (page === "home") {
    loadHomeData();
  }

  if (page === "chat") {
    loadChatPeople();
  }

  if (page === "groups") {
    loadGroups();
  }

  if (page === "homework") {
    loadHomework();
  }

  if (page === "school") {
    loadSchoolUpdates();
  }

  if (page === "notes") {
    loadNotes();
  }

  if (page === "owner") {
    if (
      currentStudent?.role === "owner"
    ) {
      openOwnerPanel();
    } else {
      navigateTo("home", false);
      toast("Owner access required", "!");
    }
  }
}


/* =========================================================
   BACK
   ========================================================= */

function goBack() {
  if (currentPage === "owner") {
    navigateTo(
      navigationHistory.pop() || "settings",
      false
    );
    return;
  }

  if (navigationHistory.length) {
    const previous =
      navigationHistory.pop();

    navigateTo(previous, false);
  } else {
    navigateTo("home", false);
  }
}


/* =========================================================
   NAV BUTTONS
   ========================================================= */

document.querySelectorAll(
  ".nav-item, .bottom-nav-item"
).forEach(item => {
  item.addEventListener("click", () => {

    const page =
      item.dataset.page;

    if (!page) return;

    if (
      page === "owner" &&
      currentStudent?.role !== "owner"
    ) {
      toast("Owner access required", "!");
      return;
    }

    navigateTo(page);
  });
});


/* =========================================================
   MOBILE MENU
   ========================================================= */

const mobileMenuBtn =
  $("mobileMenuBtn");

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener(
    "click",
    () => {
      const sidebar =
        $("sidebar");

      if (sidebar) {
        sidebar.classList.toggle(
          "open"
        );
      }
    }
  );
}


/* =========================================================
   CLOSE MOBILE SIDEBAR AFTER NAV
   ========================================================= */

document.querySelectorAll(
  ".nav-item"
).forEach(item => {
  item.addEventListener("click", () => {
    $("sidebar")?.classList.remove(
      "open"
    );
  });
});


/* =========================================================
   HOME
   ========================================================= */

async function loadHomeData() {
  try {
    const schoolRef =
      collection(db, "school");

    const snap =
      await getDocs(schoolRef);

    const announcements =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(item =>
          item.published !== false
        )
        .sort((a, b) => {

          const ad =
            a.createdAt?.toMillis?.() || 0;

          const bd =
            b.createdAt?.toMillis?.() || 0;

          return bd - ad;
        })
        .slice(0, 5);

    renderHomeAnnouncements(
      announcements
    );

  } catch (error) {
    console.warn(
      "Home data:",
      error
    );
  }
}


function renderHomeAnnouncements(items) {
  const container =
    $("homeAnnouncements");

  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        ${escapeHTML(t("noData"))}
      </div>
    `;
    return;
  }

  container.innerHTML =
    items.map(item => `
      <article class="announcement-card">
        <div class="announcement-card-title">
          ${escapeHTML(item.title || "")}
        </div>

        <div class="announcement-card-text">
          ${escapeHTML(item.description || item.text || "")}
        </div>

        <div class="announcement-card-date">
          ${escapeHTML(dateText(item.createdAt))}
        </div>
      </article>
    `).join("");
}


/* =========================================================
   CHAT PEOPLE
   ========================================================= */

async function loadChatPeople() {
  const container =
    $("chatPeopleList");

  if (!container) return;

  if (
    currentPermission !== "normal" &&
    currentPermission !== "allow" &&
    currentPermission !== "owner"
  ) {
    container.innerHTML = `
      <div class="empty-state">
        Chat is not available for this account.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="loading-state">
      ${escapeHTML(t("loading"))}
    </div>
  `;

  try {
    const snap =
      await getDocs(
        collection(db, "students")
      );

    const people =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(person => {

          if (
            person.status === "blocked"
          ) {
            return false;
          }

          if (
            currentStudent?.phone &&
            cleanPhone(person.phone) ===
            cleanPhone(currentStudent.phone)
          ) {
            return false;
          }

          return true;
        })
        .sort((a, b) =>
          String(a.name || "")
            .localeCompare(
              String(b.name || "")
            )
        );

    renderChatPeople(people);

  } catch (error) {
    console.error(
      "Chat people:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        Unable to load students.
      </div>
    `;
  }
}


function renderChatPeople(people) {
  const container =
    $("chatPeopleList");

  if (!container) return;

  if (!people.length) {
    container.innerHTML = `
      <div class="empty-state">
        No students found.
      </div>
    `;
    return;
  }

  container.innerHTML =
    people.map(person => {

      const initial =
        String(person.name || "?")
          .trim()
          .charAt(0)
          .toUpperCase();

      return `
        <button
          type="button"
          class="chat-person"
          data-phone="${escapeHTML(person.phone || "")}"
        >
          <span class="chat-person-avatar">
            ${escapeHTML(initial)}
          </span>

          <span class="chat-person-info">
            <strong>
              ${escapeHTML(person.name || "Student")}
            </strong>

            <small>
              ${person.online === true
                ? escapeHTML(t("online"))
                : ""}
            </small>
          </span>
        </button>
      `;
    }).join("");

  container
    .querySelectorAll(".chat-person")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const phone =
            button.dataset.phone;

          const person =
            people.find(
              p =>
                cleanPhone(p.phone) ===
                cleanPhone(phone)
            );

          if (person) {
            openChat(person);
          }
        }
      );
    });
}


/* =========================================================
   OPEN CHAT
   ========================================================= */

async function openChat(person) {
  if (!person) return;

  currentChatUser = person;

  const windowEl =
    $("chatWindow");

  if (!windowEl) return;

  windowEl.innerHTML = `
    <div class="chat-header">
      <button
        type="button"
        class="chat-back-btn"
        id="chatBackBtn"
      >
        ←
      </button>

      <div class="chat-header-avatar">
        ${escapeHTML(
          String(person.name || "?")
            .trim()
            .charAt(0)
            .toUpperCase()
        )}
      </div>

      <div class="chat-header-info">
        <strong>
          ${escapeHTML(person.name || "Student")}
        </strong>

        <small>
          ${person.online === true
            ? escapeHTML(t("online"))
            : ""}
        </small>
      </div>
    </div>

    <div
      class="chat-messages"
      id="chatMessages"
    ></div>

    <form
      class="chat-input-area"
      id="chatForm"
    >
      <button
        type="button"
        class="emoji-btn"
        id="emojiBtn"
        title="Emoji"
      >
        😊
      </button>

      <input
        id="messageInput"
        type="text"
        autocomplete="off"
        placeholder="Type a message..."
      />

      <button
        type="submit"
        class="send-message-btn"
        id="sendMessageBtn"
      >
        ➤
      </button>
    </form>
  `;

  $("chatBackBtn")?.addEventListener(
    "click",
    () => {
      currentChatUser = null;

      windowEl.innerHTML = `
        <div class="chat-empty">
          Select a student to start chatting.
        </div>
      `;
    }
  );

  $("chatForm")?.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      sendMessage();
    }
  );

  $("messageInput")?.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    }
  );

  $("emojiBtn")?.addEventListener(
    "click",
    () => {
      const input =
        $("messageInput");

      if (!input) return;

      input.value += "😊";
      input.focus();
    }
  );

  listenChatMessages(
    currentStudent.phone,
    person.phone
  );
}


/* =========================================================
   CHAT LISTENER
   ========================================================= */

function listenChatMessages(
  myPhone,
  otherPhone
) {
  if (currentChatUnsubscribe) {
    currentChatUnsubscribe();
    currentChatUnsubscribe = null;
  }

  const chatId =
    makeChatId(
      myPhone,
      otherPhone
    );

  const messagesRef =
    collection(
      db,
      "messages"
    );

  const q =
    query(
      messagesRef,
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc"),
      limit(300)
    );

  currentChatUnsubscribe =
    onSnapshot(
      q,
      snapshot => {

        const messages =
          snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          }));

        renderMessages(messages);

        markReceivedMessagesSeen(
          messages
        );
      },

      error => {
        console.error(
          "Chat listener:",
          error
        );

        /* Fallback without orderBy */
        fallbackChatLoad(
          chatId
        );
      }
    );
}


async function fallbackChatLoad(chatId) {
  try {
    const snap =
      await getDocs(
        query(
          collection(db, "messages"),
          where("chatId", "==", chatId),
          limit(300)
        )
      );

    const messages =
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))
      .sort((a, b) => {
        const at =
          a.createdAt?.toMillis?.() || 0;

        const bt =
          b.createdAt?.toMillis?.() || 0;

        return at - bt;
      });

    renderMessages(messages);

  } catch (error) {
    console.error(
      "Fallback chat:",
      error
    );
  }
}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages(messages) {
  const container =
    $("chatMessages");

  if (!container) return;

  if (!messages.length) {
    container.innerHTML = `
      <div class="chat-empty">
        No messages yet.
      </div>
    `;

    return;
  }

  let previousDate = null;

  container.innerHTML =
    messages.map(message => {

      const mine =
        cleanPhone(message.senderPhone) ===
        cleanPhone(currentStudent.phone);

      const messageDate =
        message.createdAt
          ? (
              message.createdAt.toDate
                ? message.createdAt.toDate()
                : new Date(message.createdAt)
            )
          : new Date();

      let separator = "";

      if (
        !previousDate ||
        !sameDay(
          previousDate,
          messageDate
        )
      ) {
        separator = `
          <div class="chat-date-separator">
            ${escapeHTML(
              dateText(message.createdAt)
            )}
          </div>
        `;
      }

      previousDate =
        messageDate;

      let ticks = "✓";

      if (mine) {
        if (
          message.seen === true
        ) {
          ticks = "✓✓";
        } else if (
          message.delivered === true
        ) {
          ticks = "✓✓";
        }
      }

      return `
        ${separator}

        <div
          class="message-row ${mine ? "sent" : "received"}"
        >
          <div class="message-bubble">

            <div class="message-text">
              ${escapeHTML(
                message.text || ""
              )}
            </div>

            <div class="message-meta">
              <span>
                ${escapeHTML(
                  nowText(message.createdAt)
                )}
              </span>

              ${
                mine
                  ? `
                    <span class="message-ticks ${
                      message.seen
                        ? "seen"
                        : ""
                    }">
                      ${ticks}
                    </span>
                  `
                  : ""
              }
            </div>

          </div>
        </div>
      `;
    }).join("");

  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {
  if (
    !currentStudent ||
    !currentChatUser
  ) {
    return;
  }

  const input =
    $("messageInput");

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;

  const myPhone =
    cleanPhone(
      currentStudent.phone
    );

  const otherPhone =
    cleanPhone(
      currentChatUser.phone
    );

  const chatId =
    makeChatId(
      myPhone,
      otherPhone
    );

  input.value = "";

  try {
    await addDoc(
      collection(db, "messages"),
      {
        chatId,

        senderPhone: myPhone,
        senderName:
          currentStudent.name,

        receiverPhone:
          otherPhone,

        receiverName:
          currentChatUser.name,

        text: message,

        delivered: false,
        seen: false,

        createdAt:
          serverTimestamp()
      }
    );

    toast("Message sent", "✓");

  } catch (error) {
    console.error(
      "Send message:",
      error
    );

    input.value = message;

    toast(
      "Message could not be sent",
      "!"
    );
  }
}


/* =========================================================
   MESSAGE SEEN
   ========================================================= */

async function markReceivedMessagesSeen(
  messages
) {
  if (!currentStudent) return;

  const myPhone =
    cleanPhone(
      currentStudent.phone
    );

  for (const message of messages) {

    if (
      cleanPhone(
        message.receiverPhone
      ) !== myPhone
    ) {
      continue;
    }

    if (message.seen === true) {
      continue;
    }

    try {
      await updateDoc(
        doc(
          db,
          "messages",
          message.id
        ),
        {
          delivered: true,
          seen: true
        }
      );
    } catch (error) {
      console.warn(
        "Seen update:",
        error
      );
    }
  }
}


/* =========================================================
   CHAT SEARCH
   ========================================================= */

$("chatSearchBtn")?.addEventListener(
  "click",
  () => {

    const box =
      $("chatSearchBox");

    if (box) {
      box.classList.toggle(
        "active"
      );
    }
  }
);

$("chatSearchInput")?.addEventListener(
  "input",
  async event => {

    const term =
      event.target.value
        .trim()
        .toLowerCase();

    const container =
      $("chatPeopleList");

    if (!container) return;

    try {
      const snap =
        await getDocs(
          collection(
            db,
            "students"
          )
        );

      const people =
        snap.docs
          .map(d => ({
            id: d.id,
            ...d.data()
          }))
          .filter(person => {

            if (
              person.status === "blocked"
            ) {
              return false;
            }

            if (
              currentStudent?.phone &&
              cleanPhone(person.phone) ===
              cleanPhone(currentStudent.phone)
            ) {
              return false;
            }

            return (
              !term ||
              String(person.name || "")
                .toLowerCase()
                .includes(term) ||
              cleanPhone(
                person.phone
              ).includes(term)
            );
          });

      renderChatPeople(people);

    } catch (error) {
      console.error(
        "Chat search:",
        error
      );
    }
  }
);


/* =========================================================
   GROUP MODAL OPEN
   ========================================================= */

$("createGroupBtn")?.addEventListener(
  "click",
  () => {

    if (
      currentPermission !== "allow" &&
      currentPermission !== "owner"
    ) {
      toast(
        "Group access is not available",
        "!"
      );
      return;
    }

    const modal =
      $("groupModal");

    if (modal) {
      modal.classList.add("active");
      modal.hidden = false;
    }

    loadGroupMembers();
  }
);


/* =========================================================
   GROUP MODAL CLOSE
   ========================================================= */

$("closeGroupModalBtn")?.addEventListener(
  "click",
  closeGroupModal
);


function closeGroupModal() {
  const modal =
    $("groupModal");

  if (modal) {
    modal.classList.remove(
      "active"
    );

    modal.hidden = true;
  }
}


/* =========================================================
   GROUP MEMBERS
   ========================================================= */

let selectedGroupMembers = [];


async function loadGroupMembers() {
  const results =
    $("groupMemberResults");

  if (!results) return;

  results.innerHTML = `
    <div class="loading-state">
      ${escapeHTML(t("loading"))}
    </div>
  `;

  try {
    const snap =
      await getDocs(
        collection(
          db,
          "students"
        )
      );

    const people =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(person =>
          person.status !== "blocked" &&
          cleanPhone(person.phone) !==
          cleanPhone(currentStudent?.phone)
        );

    renderGroupMembers(
      people
    );

  } catch (error) {
    console.error(
      "Group members:",
      error
    );

    results.innerHTML = `
      <div class="empty-state">
        Unable to load students.
      </div>
    `;
  }
}


function renderGroupMembers(
  people
) {
  const results =
    $("groupMemberResults");

  if (!results) return;

  results.innerHTML =
    people.map(person => {

      const selected =
        selectedGroupMembers.some(
          member =>
            cleanPhone(member.phone) ===
            cleanPhone(person.phone)
        );

      return `
        <button
          type="button"
          class="group-member-result ${
            selected ? "selected" : ""
          }"
          data-phone="${escapeHTML(person.phone || "")}"
        >
          <span>
            ${escapeHTML(
              person.name || "Student"
            )}
          </span>

          <small>
            ${escapeHTML(
              cleanPhone(person.phone)
            )}
          </small>
        </button>
      `;
    }).join("");

  results
    .querySelectorAll(
      ".group-member-result"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const phone =
            cleanPhone(
              button.dataset.phone
            );

          const person =
            people.find(
              p =>
                cleanPhone(p.phone) ===
                phone
            );

          if (!person) return;

          const index =
            selectedGroupMembers.findIndex(
              member =>
                cleanPhone(member.phone) ===
                phone
            );

          if (index >= 0) {
            selectedGroupMembers.splice(
              index,
              1
            );
          } else {
            selectedGroupMembers.push(
              person
            );
          }

          renderSelectedGroupMembers();
          renderGroupMembers(people);
        }
      );
    });
}


function renderSelectedGroupMembers() {
  const container =
    $("selectedGroupMembers");

  if (!container) return;

  container.innerHTML =
    selectedGroupMembers.map(
      member => `
        <span class="selected-member">
          ${escapeHTML(
            member.name || "Student"
          )}
        </span>
      `
    ).join("");
}


/* =========================================================
   GROUP MEMBER SEARCH
   ========================================================= */

$("groupMemberSearch")?.addEventListener(
  "input",
  async event => {

    const term =
      event.target.value
        .trim()
        .toLowerCase();

    const results =
      $("groupMemberResults");

    if (!results) return;

    try {
      const snap =
        await getDocs(
          collection(
            db,
            "students"
          )
        );

      const people =
        snap.docs
          .map(d => ({
            id: d.id,
            ...d.data()
          }))
          .filter(person => {

            if (
              person.status === "blocked"
            ) {
              return false;
            }

            if (
              cleanPhone(person.phone) ===
              cleanPhone(currentStudent?.phone)
            ) {
              return false;
            }

            return (
              !term ||
              String(person.name || "")
                .toLowerCase()
                .includes(term) ||
              cleanPhone(
                person.phone
              ).includes(term)
            );
          });

      renderGroupMembers(
        people
      );

    } catch (error) {
      console.error(
        "Group member search:",
        error
      );
    }
  }
);


/* =========================================================
   CREATE GROUP
   ========================================================= */

$("groupForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const groupName =
      value("groupNameInput").trim();

    const password =
      value("groupPasswordInput");

    if (!groupName) {
      toast(
        "Enter group name",
        "!"
      );
      return;
    }

    if (
      selectedGroupMembers.length === 0
    ) {
      toast(
        "Select at least one member",
        "!"
      );
      return;
    }

    if (password.length < 4) {
      toast(
        "Group password must be at least 4 characters",
        "!"
      );
      return;
    }

    try {
      const passwordHash =
        await hashPassword(
          password
        );

      const members = [
        {
          name: currentStudent.name,
          phone: cleanPhone(
            currentStudent.phone
          )
        },

        ...selectedGroupMembers.map(
          member => ({
            name: member.name,
            phone: cleanPhone(
              member.phone
            )
          })
        )
      ];

      await addDoc(
        collection(
          db,
          "groups"
        ),
        {
          name: groupName,

          creatorPhone:
            cleanPhone(
              currentStudent.phone
            ),

          creatorName:
            currentStudent.name,

          members,

          passwordHash,

          active: true,

          createdAt:
            serverTimestamp()
        }
      );

      selectedGroupMembers = [];

      renderSelectedGroupMembers();

      setValue(
        "groupNameInput",
        ""
      );

      setValue(
        "groupPasswordInput",
        ""
      );

      closeGroupModal();

      toast(
        "Group created successfully",
        "✓"
      );

      loadGroups();

    } catch (error) {
      console.error(
        "Create group:",
        error
      );

      toast(
        "Group could not be created",
        "!"
      );
    }
  }
);


/* =========================================================
   GROUPS
   ========================================================= */

async function loadGroups() {
  const container =
    $("groupsList");

  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      ${escapeHTML(t("loading"))}
    </div>
  `;

  try {
    const snap =
      await getDocs(
        collection(
          db,
          "groups"
        )
      );

    const myPhone =
      cleanPhone(
        currentStudent?.phone
      );

    const groups =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(group => {

          if (group.active === false) {
            return false;
          }

          return (
            group.creatorPhone === myPhone ||
            (group.members || []).some(
              member =>
                cleanPhone(
                  member.phone
                ) === myPhone
            )
          );
        });

    renderGroups(groups);

  } catch (error) {
    console.error(
      "Groups:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        Unable to load groups.
      </div>
    `;
  }
}


function renderGroups(groups) {
  const container =
    $("groupsList");

  if (!container) return;

  if (!groups.length) {
    container.innerHTML = `
      <div class="empty-state">
        No groups yet.
      </div>
    `;
    return;
  }

  container.innerHTML =
    groups.map(group => `
      <article
        class="group-card"
        data-group-id="${escapeHTML(group.id)}"
      >
        <div class="group-card-main">
          <div class="group-avatar">
            ${escapeHTML(
              String(group.name || "G")
                .trim()
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div>
            <h3>
              ${escapeHTML(
                group.name || "Group"
              )}
            </h3>

            <p>
              ${(group.members || []).

/* =========================================================
   STUDYCONNECT — FINAL SCRIPT.JS
   PART 2 / 2
   ========================================================= */


/* =========================================================
   GROUP CARD ACTION
   ========================================================= */

function openGroup(group) {
  if (!group) return;

  const members = group.members || [];

  const memberHTML = members.length
    ? members.map(member => `
        <div class="group-member-row">
          <div class="group-member-avatar">
            ${escapeHTML(
              String(member.name || "?")
                .trim()
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div class="group-member-info">
            <strong>
              ${escapeHTML(member.name || "Student")}
            </strong>
            <small>
              ${escapeHTML(cleanPhone(member.phone || ""))}
            </small>
          </div>
        </div>
      `).join("")
    : `<p>${escapeHTML(t("noData"))}</p>`;

  openAppModal(
    group.name || "Group",
    `
      <div class="group-modal-view">

        <div class="group-modal-title">
          ${escapeHTML(group.name || "Group")}
        </div>

        <div class="group-modal-creator">
          Created by:
          ${escapeHTML(group.creatorName || "Student")}
        </div>

        <div class="group-modal-members">
          ${memberHTML}
        </div>

      </div>
    `
  );
}


/* =========================================================
   GROUP CARD CLICK
   ========================================================= */

$("groupsList")?.addEventListener(
  "click",
  event => {

    const card =
      event.target.closest(".group-card");

    if (!card) return;

    const groupId =
      card.dataset.groupId;

    if (!groupId) return;

    getDoc(
      doc(db, "groups", groupId)
    ).then(snapshot => {

      if (snapshot.exists()) {
        openGroup({
          id: snapshot.id,
          ...snapshot.data()
        });
      }

    }).catch(error => {
      console.error(
        "Open group:",
        error
      );
    });
  }
);


/* =========================================================
   HOMEWORK
   ========================================================= */

async function loadHomework() {
  const container =
    $("homeworkList");

  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      ${escapeHTML(t("loading"))}
    </div>
  `;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "homework"
        )
      );

    const items =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(item =>
          item.published !== false
        )
        .sort((a, b) => {

          const at =
            a.createdAt?.toMillis?.() || 0;

          const bt =
            b.createdAt?.toMillis?.() || 0;

          return bt - at;
        });

    renderHomework(items);

  } catch (error) {

    console.error(
      "Homework:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        Unable to load homework.
      </div>
    `;
  }
}


function renderHomework(items) {
  const container =
    $("homeworkList");

  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        ${escapeHTML(t("noData"))}
      </div>
    `;
    return;
  }

  container.innerHTML =
    items.map(item => `
      <article class="content-card">

        <div class="content-card-top">
          <span class="content-badge">
            ${escapeHTML(item.subject || "Homework")}
          </span>

          <span class="content-date">
            ${escapeHTML(
              dateText(item.createdAt)
            )}
          </span>
        </div>

        <h3>
          ${escapeHTML(item.title || "")}
        </h3>

        ${
          item.className
            ? `
              <div class="content-meta">
                Class:
                ${escapeHTML(item.className)}
              </div>
            `
            : ""
        }

        ${
          item.chapter
            ? `
              <div class="content-meta">
                Chapter:
                ${escapeHTML(item.chapter)}
              </div>
            `
            : ""
        }

        <p>
          ${escapeHTML(
            item.description ||
            item.text ||
            ""
          )}
        </p>

      </article>
    `).join("");
}


/* =========================================================
   SCHOOL UPDATES
   ========================================================= */

async function loadSchoolUpdates() {
  const container =
    $("schoolUpdatesList");

  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      ${escapeHTML(t("loading"))}
    </div>
  `;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "school"
        )
      );

    const items =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(item =>
          item.published !== false
        )
        .sort((a, b) => {

          const at =
            a.createdAt?.toMillis?.() || 0;

          const bt =
            b.createdAt?.toMillis?.() || 0;

          return bt - at;
        });

    renderSchoolUpdates(items);

  } catch (error) {

    console.error(
      "School updates:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        Unable to load school updates.
      </div>
    `;
  }
}


function renderSchoolUpdates(items) {
  const container =
    $("schoolUpdatesList");

  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        ${escapeHTML(t("noData"))}
      </div>
    `;
    return;
  }

  container.innerHTML =
    items.map(item => `
      <article class="content-card">

        <div class="content-card-top">

          <span class="content-badge">
            School Update
          </span>

          <span class="content-date">
            ${escapeHTML(
              dateText(item.createdAt)
            )}
          </span>

        </div>

        <h3>
          ${escapeHTML(item.title || "")}
        </h3>

        <p>
          ${escapeHTML(
            item.description ||
            item.text ||
            ""
          )}
        </p>

      </article>
    `).join("");
}


/* =========================================================
   NOTES
   ========================================================= */

async function loadNotes() {
  const container =
    $("notesList");

  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      ${escapeHTML(t("loading"))}
    </div>
  `;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "notes"
        )
      );

    const items =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(item =>
          item.published !== false
        )
        .sort((a, b) => {

          const at =
            a.createdAt?.toMillis?.() || 0;

          const bt =
            b.createdAt?.toMillis?.() || 0;

          return bt - at;
        });

    renderNotes(items);

  } catch (error) {

    console.error(
      "Notes:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">
        Unable to load notes.
      </div>
    `;
  }
}


function renderNotes(items) {
  const container =
    $("notesList");

  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        ${escapeHTML(t("noData"))}
      </div>
    `;
    return;
  }

  container.innerHTML =
    items.map(item => `
      <article class="content-card">

        <div class="content-card-top">

          <span class="content-badge">
            ${escapeHTML(item.subject || "Notes")}
          </span>

          <span class="content-date">
            ${escapeHTML(
              dateText(item.createdAt)
            )}
          </span>

        </div>

        <h3>
          ${escapeHTML(item.title || "")}
        </h3>

        ${
          item.chapter
            ? `
              <div class="content-meta">
                Chapter:
                ${escapeHTML(item.chapter)}
              </div>
            `
            : ""
        }

        <p>
          ${escapeHTML(
            item.description ||
            item.text ||
            ""
          )}
        </p>

      </article>
    `).join("");
}


/* =========================================================
   SETTINGS
   ========================================================= */

$("profileSettingsBtn")?.addEventListener(
  "click",
  () => {
    navigateTo("settings");
  }
);


$("settingsLogoutBtn")?.addEventListener(
  "click",
  () => {
    logout();
  }
);


$("logoutBtn")?.addEventListener(
  "click",
  () => {
    logout();
  }
);


/* =========================================================
   LANGUAGE SELECT
   ========================================================= */

$("languageSelect")?.addEventListener(
  "change",
  event => {

    const language =
      event.target.value;

    if (
      language !== "hi" &&
      language !== "en"
    ) {
      return;
    }

    globalSettings.language =
      language;

    applyGlobalSettings();

    toast(
      language === "hi"
        ? "भाषा बदल दी गई"
        : "Language changed",
      "✓"
    );
  }
);


/* =========================================================
   THEME SELECT
   ========================================================= */

$("themeSelect")?.addEventListener(
  "change",
  event => {

    const theme =
      event.target.value;

    globalSettings.theme =
      theme;

    applyTheme(theme);

    toast(
      "Theme changed",
      "✓"
    );
  }
);


/* =========================================================
   NOTIFICATION TOGGLE
   ========================================================= */

$("notificationToggle")?.addEventListener(
  "change",
  event => {

    localStorage.setItem(
      "studyNotifications",
      event.target.checked
        ? "on"
        : "off"
    );

    toast(
      event.target.checked
        ? "Notifications enabled"
        : "Notifications disabled",
      "✓"
    );
  }
);


/* =========================================================
   OWNER PANEL OPEN
   ========================================================= */

$("openOwnerPanelBtn")?.addEventListener(
  "click",
  () => {

    if (
      currentStudent?.role !== "owner"
    ) {
      toast(
        "Owner access required",
        "!"
      );
      return;
    }

    navigateTo("owner");
  }
);


/* =========================================================
   OWNER PANEL BACK
   ========================================================= */

$("closeOwnerPanelBtn")?.addEventListener(
  "click",
  () => {
    navigateTo(
      "settings"
    );
  }
);


/* =========================================================
   OWNER PANEL
   ========================================================= */

function openOwnerPanel() {

  if (
    currentStudent?.role !== "owner"
  ) {
    toast(
      "Owner access required",
      "!"
    );
    return;
  }

  navigateTo(
    "owner",
    false
  );

  loadOwnerDashboard();
  loadOwnerStudents();
  loadOwnerApprovals();
  loadOwnerGroups();
  loadOwnerContent();
  loadOwnerActivity();
}


/* =========================================================
   OWNER TABS
   ========================================================= */

document.querySelectorAll(
  ".owner-tab"
).forEach(tab => {

  tab.addEventListener(
    "click",
    () => {

      const section =
        tab.dataset.ownerSection;

      if (!section) return;

      document.querySelectorAll(
        ".owner-tab"
      ).forEach(item => {
        item.classList.toggle(
          "active",
          item === tab
        );
      });

      document.querySelectorAll(
        ".owner-section"
      ).forEach(item => {
        item.hidden =
          item.id !==
          `ownerSection-${section}`;
      });

      if (section === "dashboard") {
        loadOwnerDashboard();
      }

      if (section === "students") {
        loadOwnerStudents();
      }

      if (section === "approvals") {
        loadOwnerApprovals();
      }

      if (section === "groups") {
        loadOwnerGroups();
      }

      if (section === "content") {
        loadOwnerContent();
      }

      if (section === "activity") {
        loadOwnerActivity();
      }
    }
  );
});


/* =========================================================
   OWNER DASHBOARD
   ========================================================= */

async function loadOwnerDashboard() {

  if (
    currentStudent?.role !== "owner"
  ) {
    return;
  }

  try {

    const studentsSnap =
      await getDocs(
        collection(
          db,
          "students"
        )
      );

    const students =
      studentsSnap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    const approved =
      students.filter(
        s => s.status === "approved"
      );

    const pending =
      students.filter(
        s => s.status === "pending"
      );

    const online =
      students.filter(
        s => s.online === true
      );

    text(
      "ownerTotalStudents",
      students.length
    );

    text(
      "ownerOnlineStudents",
      online.length
    );

    text(
      "ownerPendingStudents",
      pending.length
    );


    const messagesSnap =
      await getDocs(
        collection(
          db,
          "messages"
        )
      );

    text(
      "ownerTotalMessages",
      messagesSnap.size
    );


    const groupsSnap =
      await getDocs(
        collection(
          db,
          "groups"
        )
      );

    text(
      "ownerTotalGroups",
      groupsSnap.size
    );


    const homeworkSnap =
      await getDocs(
        collection(
          db,
          "homework"
        )
      );

    text(
      "ownerTotalHomework",
      homeworkSnap.size
    );

  } catch (error) {

    console.error(
      "Owner dashboard:",
      error
    );
  }
}


/* =========================================================
   OWNER STUDENTS
   ========================================================= */

let ownerStudentsCache = [];


async function loadOwnerStudents() {

  const list =
    $("ownerPeopleList");

  if (!list) return;

  list.innerHTML = `
    <div class="loading-state">
      ${escapeHTML(t("loading"))}
    </div>
  `;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "students"
        )
      );

    ownerStudentsCache =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .sort((a, b) =>
          String(a.name || "")
            .localeCompare(
              String(b.name || "")
            )
        );

    renderOwnerStudents(
      ownerStudentsCache
    );

  } catch (error) {

    console.error(
      "Owner students:",
      error
    );

    list.innerHTML = `
      <div class="empty-state">
        Unable to load students.
      </div>
    `;
  }
}


function renderOwnerStudents(
  students
) {

  const list =
    $("ownerPeopleList");

  if (!list) return;

  if (!students.length) {
    list.innerHTML = `
      <div class="empty-state">
        No students found.
      </div>
    `;
    return;
  }

  list.innerHTML =
    students.map(student => `
      <button
        type="button"
        class="owner-person-item"
        data-student-id="${escapeHTML(student.id)}"
      >

        <span class="owner-person-avatar">
          ${escapeHTML(
            String(student.name || "?")
              .trim()
              .charAt(0)
              .toUpperCase()
          )}
        </span>

        <span class="owner-person-info">

          <strong>
            ${escapeHTML(
              student.name || "Student"
            )}
          </strong>

          <small>
            ${escapeHTML(
              cleanPhone(student.phone || "")
            )}
          </small>

        </span>

        <span class="owner-person-status">
          ${escapeHTML(
            student.status || ""
          )}
        </span>

      </button>
    `).join("");


  list.querySelectorAll(
    ".owner-person-item"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const student =
          ownerStudentsCache.find(
            s =>
              s.id ===
              button.dataset.studentId
          );

        if (student) {
          renderOwnerPersonDetails(
            student
          );
        }
      }
    );
  });
}


/* =========================================================
   OWNER STUDENT SEARCH
   ========================================================= */

$("ownerStudentSearch")?.addEventListener(
  "input",
  event => {

    const term =
      event.target.value
        .trim()
        .toLowerCase();

    const filtered =
      ownerStudentsCache.filter(
        student =>
          String(student.name || "")
            .toLowerCase()
            .includes(term) ||
          cleanPhone(
            student.phone || ""
          ).includes(term)
      );

    renderOwnerStudents(
      filtered
    );
  }
);


/* =========================================================
   OWNER PERSON DETAILS
   ========================================================= */

function renderOwnerPersonDetails(
  student
) {

  const box =
    $("ownerPersonDetails");

  if (!box) return;

  const followers =
    Array.isArray(student.followers)
      ? student.followers.length
      : 0;

  const following =
    Array.isArray(student.following)
      ? student.following.length
      : 0;

  box.innerHTML = `
    <div class="owner-detail-card">

      <div class="owner-detail-avatar">
        ${escapeHTML(
          String(student.name || "?")
            .trim()
            .charAt(0)
            .toUpperCase()
        )}
      </div>

      <h2>
        ${escapeHTML(
          student.name || "Student"
        )}
      </h2>

      <p>
        ${escapeHTML(
          cleanPhone(student.phone || "")
        )}
      </p>

      <div class="owner-detail-status">
        ${escapeHTML(
          student.status || ""
        )}
      </div>

      <div class="owner-detail-stats">

        <div>
          <strong>
            ${followers}
          </strong>
          <span>Followers</span>
        </div>

        <div>
          <strong>
            ${following}
          </strong>
          <span>Following</span>
        </div>

      </div>

      <div class="owner-detail-actions">

        <button
          type="button"
          class="owner-action-btn"
          data-action="permission"
        >
          Permission
        </button>

        <button
          type="button"
          class="owner-action-btn"
          data-action="block"
        >
          ${
            student.status === "blocked"
              ? "Unblock"
              : "Block"
          }
        </button>

        <button
          type="button"
          class="owner-action-btn danger"
          data-action="remove"
        >
          Remove
        </button>

      </div>

    </div>
  `;


  box.querySelectorAll(
    ".owner-action-btn"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const action =
          button.dataset.action;

        if (action === "permission") {
          changeStudentPermission(
            student
          );
        }

        if (action === "block") {
          toggleStudentBlock(
            student
          );
        }

        if (action === "remove") {
          removeStudent(
            student
          );
        }
      }
    );
  });
}


/* =========================================================
   CHANGE PERMISSION
   ========================================================= */

async function changeStudentPermission(
  student
) {

  const choice =
    prompt(
      "Enter permission:\nrestricted / normal / allow",
      student.permission || "normal"
    );

  if (!choice) return;

  const permission =
    choice.trim().toLowerCase();

  if (
    ![
      "restricted",
      "normal",
      "allow"
    ].includes(permission)
  ) {
    toast(
      "Invalid permission",
      "!"
    );
    return;
  }

  try {

    await updateDoc(
      doc(
        db,
        "students",
        student.id
      ),
      {
        permission
      }
    );

    toast(
      "Permission updated",
      "✓"
    );

    await loadOwnerStudents();
    await loadOwnerDashboard();

  } catch (error) {

    console.error(
      "Permission:",
      error
    );

    toast(
      "Permission update failed",
      "!"
    );
  }
}


/* =========================================================
   BLOCK / UNBLOCK
   ========================================================= */

async function toggleStudentBlock(
  student
) {

  const blocked =
    student.status !== "blocked";

  try {

    await updateDoc(
      doc(
        db,
        "students",
        student.id
      ),
      {
        status:
          blocked
            ? "blocked"
            : "approved",

        online: false
      }
    );

    toast(
      blocked
        ? "Student blocked"
        : "Student unblocked",
      "✓"
    );

    await loadOwnerStudents();

  } catch (error) {

    console.error(
      "Block:",
      error
    );

    toast(
      "Action failed",
      "!"
    );
  }
}


/* =========================================================
   REMOVE STUDENT
   ========================================================= */

async function removeStudent(
  student
) {

  const confirmed =
    confirm(
      `Remove ${student.name || "this student"}?`
    );

  if (!confirmed) return;

  try {

    await deleteDoc(
      doc(
        db,
        "students",
        student.id
      )
    );

    toast(
      "Student removed",
      "✓"
    );

    const details =
      $("ownerPersonDetails");

    if (details) {
      details.innerHTML = "";
    }

    await loadOwnerStudents();
    await loadOwnerDashboard();

  } catch (error) {

    console.error(
      "Remove student:",
      error
    );

    toast(
      "Could not remove student",
      "!"
    );
  }
}


/* =========================================================
   OWNER APPROVALS
   ========================================================= */

async function loadOwnerApprovals() {

  const list =
    $("ownerApprovalList");

  if (!list) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "students"
        )
      );

    const pending =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(
          student =>
            student.status === "pending"
        );

    if (!pending.length) {

      list.innerHTML = `
        <div class="empty-state">
          No pending approvals.
        </div>
      `;

      return;
    }

    list.innerHTML =
      pending.map(student => `
        <div
          class="approval-card"
          data-student-id="${escapeHTML(student.id)}"
        >

          <div>
            <strong>
              ${escapeHTML(
                student.name || "Student"
              )}
            </strong>

            <small>
              ${escapeHTML(
                cleanPhone(student.phone || "")
              )}
            </small>
          </div>

          <div class="approval-actions">

            <button
              type="button"
              class="approve-btn"
              data-approval="approve"
            >
              Approve
            </button>

            <button
              type="button"
              class="reject-btn"
              data-approval="reject"
            >
              Reject
            </button>

          </div>

        </div>
      `).join("");


    list.querySelectorAll(
      ".approval-card"
    ).forEach(card => {

      const id =
        card.dataset.studentId;

      card.querySelector(
        "[data-approval='approve']"
      )?.addEventListener(
        "click",
        () =>
          approveStudent(id)
      );

      card.querySelector(
        "[data-approval='reject']"
      )?.addEventListener(
        "click",
        () =>
          rejectStudent(id)
      );
    });

  } catch (error) {

    console.error(
      "Approvals:",
      error
    );

    list.innerHTML = `
      <div class="empty-state">
        Unable to load approvals.
      </div>
    `;
  }
}


/* =========================================================
   APPROVE
   ========================================================= */

async function approveStudent(
  id
) {

  try {

    await updateDoc(
      doc(
        db,
        "students",
        id
      ),
      {
        status: "approved",
        permission: "normal"
      }
    );

    toast(
      "Student approved",
      "✓"
    );

    loadOwnerApprovals();
    loadOwnerStudents();
    loadOwnerDashboard();

  } catch (error) {

    console.error(
      "Approve:",
      error
    );

    toast(
      "Approval failed",
      "!"
    );
  }
}


/* =========================================================
   REJECT
   ========================================================= */

async function rejectStudent(
  id
) {

  try {

    await updateDoc(
      doc(
        db,
        "students",
        id
      ),
      {
        status: "blocked",
        online: false
      }
    );

    toast(
      "Student rejected",
      "✓"
    );

    loadOwnerApprovals();
    loadOwnerStudents();
    loadOwnerDashboard();

  } catch (error) {

    console.error(
      "Reject:",
      error
    );

    toast(
      "Reject failed",
      "!"
    );
  }
}


/* =========================================================
   OWNER GROUPS
   ========================================================= */

async function loadOwnerGroups() {

  const list =
    $("ownerGroupsList");

  if (!list) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "groups"
        )
      );

    const groups =
      snap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    if (!groups.length) {

      list.innerHTML = `
        <div class="empty-state">
          No groups found.
        </div>
      `;

      return;
    }

    list.innerHTML =
      groups.map(group => `
        <div
          class="owner-group-card"
          data-group-id="${escapeHTML(group.id)}"
        >

          <div>
            <strong>
              ${escapeHTML(
                group.name || "Group"
              )}
            </strong>

            <small>
              Creator:
              ${escapeHTML(
                group.creatorName || ""
              )}
            </small>

            <small>
              Members:
              ${(group.members || []).length}
            </small>
          </div>

          <button
            type="button"
            class="owner-action-btn"
            data-group-action="disable"
          >
            ${
              group.active === false
                ? "Enable"
                : "Disable"
            }
          </button>

        </div>
      `).join("");


    list.querySelectorAll(
      ".owner-group-card"
    ).forEach(card => {

      const id =
        card.dataset.groupId;

      card.querySelector(
        "[data-group-action='disable']"
      )?.addEventListener(
        "click",
        () =>
          toggleOwnerGroup(id)
      );
    });

  } catch (error) {

    console.error(
      "Owner groups:",
      error
    );
  }
}


/* =========================================================
   ENABLE / DISABLE GROUP
   ========================================================= */

async function toggleOwnerGroup(
  id
) {

  try {

    const ref =
      doc(
        db,
        "groups",
        id
      );

    const snap =
      await getDoc(ref);

    if (!snap.exists()) return;

    const current =
      snap.data().active !== false;

    await updateDoc(
      ref,
      {
        active: !current
      }
    );

    toast(
      current
        ? "Group disabled"
        : "Group enabled",
      "✓"
    );

    loadOwnerGroups();

  } catch (error) {

    console.error(
      "Group toggle:",
      error
    );

    toast(
      "Group action failed",
      "!"
    );
  }
}


/* =========================================================
   OWNER CONTENT
   ========================================================= */

async function loadOwnerContent() {

  await loadOwnerHomework();
  await loadOwnerNotes();
  await loadOwnerAnnouncements();
}


/* =========================================================
   OWNER HOMEWORK
   ========================================================= */

async function loadOwnerHomework() {

  const list =
    $("ownerHomeworkList");

  if (!list) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "homework"
        )
      );

    const items =
      snap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    list.innerHTML =
      items.length
        ? items.map(item => `
            <div class="owner-content-row">

              <div>
                <strong>
                  ${escapeHTML(
                    item.title || ""
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    item.subject || ""
                  )}
                </small>
              </div>

              <button
                type="button"
                class="owner-action-btn danger"
                data-delete-homework="${escapeHTML(item.id)}"
              >
                Delete
              </button>

            </div>
          `).join("")
        : `
          <div class="empty-state">
            No homework.
          </div>
        `;

    list.querySelectorAll(
      "[data-delete-homework]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteOwnerContent(
            "homework",
            button.dataset.deleteHomework
          )
      );
    });

  } catch (error) {
    console.error(
      "Owner homework:",
      error
    );
  }
}


/* =========================================================
   OWNER NOTES
   ========================================================= */

async function loadOwnerNotes() {

  const list =
    $("ownerNotesList");

  if (!list) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "notes"
        )
      );

    const items =
      snap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    list.innerHTML =
      items.length
        ? items.map(item => `
            <div class="owner-content-row">

              <div>
                <strong>
                  ${escapeHTML(
                    item.title || ""
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    item.subject || ""
                  )}
                </small>
              </div>

              <button
                type="button"
                class="owner-action-btn danger"
                data-delete-note="${escapeHTML(item.id)}"
              >
                Delete
              </button>

            </div>
          `).join("")
        : `
          <div class="empty-state">
            No notes.
          </div>
        `;

    list.querySelectorAll(
      "[data-delete-note]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteOwnerContent(
            "notes",
            button.dataset.deleteNote
          )
      );
    });

  } catch (error) {
    console.error(
      "Owner notes:",
      error
    );
  }
}


/* =========================================================
   OWNER ANNOUNCEMENTS
   ========================================================= */

async function loadOwnerAnnouncements() {

  const list =
    $("ownerAnnouncementsList");

  if (!list) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "school"
        )
      );

    const items =
      snap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      );

    list.innerHTML =
      items.length
        ? items.map(item => `
            <div class="owner-content-row">

              <div>
                <strong>
                  ${escapeHTML(
                    item.title || ""
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    item.description ||
                    item.text ||
                    ""
                  )}
                </small>
              </div>

              <button
                type="button"
                class="owner-action-btn danger"
                data-delete-announcement="${escapeHTML(item.id)}"
              >
                Delete
              </button>

            </div>
          `).join("")
        : `
          <div class="empty-state">
            No announcements.
          </div>
        `;

    list.querySelectorAll(
      "[data-delete-announcement]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteOwnerContent(
            "school",
            button.dataset.deleteAnnouncement
          )
      );
    });

  } catch (error) {
    console.error(
      "Owner announcements:",
      error
    );
  }
}


/* =========================================================
   DELETE OWNER CONTENT
   ========================================================= */

async function deleteOwnerContent(
  collectionName,
  id
) {

  if (!id) return;

  if (
    !confirm("Delete this content?")
  ) {
    return;
  }

  try {

    await deleteDoc(
      doc(
        db,
        collectionName,
        id
      )
    );

    toast(
      "Deleted",
      "✓"
    );

    loadOwnerContent();
    loadHomework();
    loadNotes();
    loadSchoolUpdates();

  } catch (error) {

    console.error(
      "Delete content:",
      error
    );

    toast(
      "Delete failed",
      "!"
    );
  }
}


/* =========================================================
   ADD HOMEWORK
   ========================================================= */

$("ownerAddHomeworkBtn")?.addEventListener(
  "click",
  async () => {

    const title =
      prompt("Homework title:");

    if (!title) return;

    const subject =
      prompt("Subject:");

    if (!subject) return;

    const chapter =
      prompt("Chapter:");

    const description =
      prompt("Homework details:");

    try {

      await addDoc(
        collection(
          db,
          "homework"
        ),
        {
          title,
          subject,
          chapter:
            chapter || "",
          description:
            description || "",
          published: true,
          createdAt:
            serverTimestamp()
        }
      );

      toast(
        "Homework added",
        "✓"
      );

      loadOwnerHomework();
      loadHomework();

    } catch (error) {

      console.error(
        "Add homework:",
        error
      );

      toast(
        "Could not add homework",
        "!"
      );
    }
  }
);


/* =========================================================
   ADD NOTE
   ========================================================= */

$("ownerAddNoteBtn")?.addEventListener(
  "click",
  async () => {

    const title =
      prompt("Note title:");

    if (!title) return;

    const subject =
      prompt("Subject:");

    if (!subject) return;

    const chapter =
      prompt("Chapter:");

    const description =
      prompt("Note content:");

    try {

      await addDoc(
        collection(
          db,
          "notes"
        ),
        {
          title,
          subject,
          chapter:
            chapter || "",
          description:
            description || "",
          published: true,
          createdAt:
            serverTimestamp()
        }
      );

      toast(
        "Note added",
        "✓"
      );

      loadOwnerNotes();
      loadNotes();

    } catch (error) {

      console.error(
        "Add note:",
        error
      );

      toast(
        "Could not add note",
        "!"
      );
    }
  }
);


/* =========================================================
   ADD ANNOUNCEMENT
   ========================================================= */

$("ownerAddAnnouncementBtn")?.addEventListener(
  "click",
  async () => {

    const title =
      prompt("Announcement title:");

    if (!title) return;

    const description =
      prompt("Announcement details:");

    try {

      await addDoc(
        collection(
          db,
          "school"
        ),
        {
          title,
          description:
            description || "",
          published: true,
          createdAt:
            serverTimestamp()
        }
      );

      toast(
        "Announcement added",
        "✓"
      );

      loadOwnerAnnouncements();
      loadSchoolUpdates();
      loadHomeData();

    } catch (error) {

      console.error(
        "Announcement:",
        error
      );

      toast(
        "Could not add announcement",
        "!"
      );
    }
  }
);


/* =========================================================
   OWNER GLOBAL SETTINGS
   ========================================================= */

$("saveGlobalSettingsBtn")?.addEventListener(
  "click",
  async () => {

    if (
      currentStudent?.role !== "owner"
    ) {
      return;
    }

    const appName =
      value(
        "ownerAppName",
        "StudyConnect"
      ).trim();

    const language =
      value(
        "ownerGlobalLanguage",
        "en"
      );

    const theme =
      value(
        "ownerGlobalTheme",
        "system"
      );

    const welcomeValue =
      value(
        "ownerWelcomeAnimation",
        "on"
      );

    const settings = {
      appName:
        appName || "StudyConnect",

      language:
        language === "hi"
          ? "hi"
          : "en",

      theme:
        ["light", "dark", "system"]
          .includes(theme)
          ? theme
          : "system",

      welcomeAnimation:
        welcomeValue !== "off",

      features: {
        ...appFeatures
      },

      updatedAt:
        serverTimestamp()
    };

    try {

      await setDoc(
        doc(
          db,
          "appSettings",
          "main"
        ),
        settings,
        {
          merge: true
        }
      );

      globalSettings = {
        ...globalSettings,
        ...settings
      };

      applyGlobalSettings();

      toast(
        "Global settings saved",
        "✓"
      );

    } catch (error) {

      console.error(
        "Global settings:",
        error
      );

      toast(
        "Settings could not be saved",
        "!"
      );
    }
  }
);


/* =========================================================
   OWNER FEATURE SETTINGS
   ========================================================= */

$("saveFeatureSettingsBtn")?.addEventListener(
  "click",
  async () => {

    if (
      currentStudent?.role !== "owner"
    ) {
      return;
    }

    appFeatures = {
      ...appFeatures,

      chat:
        $("featureChat")?.checked ?? true,

      groups:
        $("featureGroups")?.checked ?? true,

      homework:
        $("featureHomework")?.checked ?? true,

      notes:
        $("featureNotes")?.checked ?? true,

      announcements:
        $("featureAnnouncements")?.checked ?? true,

      registration:
        $("featureRegistration")?.checked ?? true,

      maintenance:
        $("featureMaintenance")?.checked ?? false
    };

    try {

      await setDoc(
        doc(
          db,
          "appSettings",
          "main"
        ),
        {
          features:
            appFeatures,

          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );

      globalSettings.features =
        appFeatures;

      applyFeatureVisibility();

      toast(
        "Feature settings saved",
        "✓"
      );

    } catch (error) {

      console.error(
        "Feature settings:",
        error
      );

      toast(
        "Could not save feature settings",
        "!"
      );
    }
  }
);


/* =========================================================
   LOAD OWNER FEATURE CONTROLS
   ========================================================= */

function loadOwnerFeatureControls() {

  const controls = {
    featureChat: appFeatures.chat,
    featureGroups: appFeatures.groups,
    featureHomework: appFeatures.homework,
    featureNotes: appFeatures.notes,
    featureAnnouncements:
      appFeatures.announcements,
    featureRegistration:
      appFeatures.registration,
    featureMaintenance:
      appFeatures.maintenance
  };

  Object.entries(
    controls
  ).forEach(
    ([id, state]) => {

      const el = $(id);

      if (el) {
        el.checked =
          state !== false;
      }
    }
  );
}


/* =========================================================
   OWNER SECURITY
   ========================================================= */

$("changeOwnerPasswordBtn")?.addEventListener(
  "click",
  async () => {

    if (
      currentStudent?.role !== "owner"
    ) {
      return;
    }

    const password =
      value(
        "ownerNewPassword"
      );

    const confirmPassword =
      value(
        "ownerConfirmPassword"
      );

    if (
      password.length < 4
    ) {
      toast(
        "Password must be at least 4 characters",
        "!"
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      toast(
        "Passwords do not match",
        "!"
      );
      return;
    }

    try {

      const passwordHash =
        await hashPassword(
          password
        );

      await setDoc(
        doc(
          db,
          "appSettings",
          "main"
        ),
        {
          ownerPasswordHash:
            passwordHash,

          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );

      setValue(
        "ownerNewPassword",
        ""
      );

      setValue(
        "ownerConfirmPassword",
        ""
      );

      toast(
        "Owner password changed",
        "✓"
      );

    } catch (error) {

      console.error(
        "Owner password:",
        error
      );

      toast(
        "Password change failed",
        "!"
      );
    }
  }
);


/* =========================================================
   OWNER ACTIVITY LOG
   ========================================================= */

async function loadOwnerActivity() {

  const list =
    $("ownerActivityLog");

  if (!list) return;

  try {

    const snap =
      await getDocs(
        query(
          collection(
            db,
            "activityLogs"
          ),
          limit(100)
        )
      );

    const items =
      snap.docs.map(
        d => ({
          id: d.id,
          ...d.data()
        })
      )
      .sort((a, b) => {

        const at =
          a.createdAt?.toMillis?.() || 0;

        const bt =
          b.createdAt?.toMillis?.() || 0;

        return bt - at;
      });

    if (!items.length) {

      list.innerHTML = `
        <div class="empty-state">
          No activity yet.
        </div>
      `;

      return;
    }

    list.innerHTML =
      items.map(item => `
        <div class="activity-row">

          <div>
            <strong>
              ${escapeHTML(
                item.action || "Activity"
              )}
            </strong>

            <small>
              ${escapeHTML(
                item.actorName || ""
              )}
            </small>
          </div>

          <time>
            ${escapeHTML(
              dateText(item.createdAt)
            )}
          </time>

        </div>
      `).join("");

  } catch (error) {

    console.error(
      "Activity:",
      error
    );

    list.innerHTML = `
      <div class="empty-state">
        Unable to load activity.
      </div>
    `;
  }
}


/* =========================================================
   HEADER PROFILE
   ========================================================= */

$("headerProfileBtn")?.addEventListener(
  "click",
  () => {
    navigateTo("settings");
  }
);


/* =========================================================
   HEADER NOTIFICATIONS
   ========================================================= */

$("headerNotificationBtn")?.addEventListener(
  "click",
  async () => {

    try {

      const snap =
        await getDocs(
          query(
            collection(
              db,
              "school"
            ),
            limit(10)
          )
        );

      const items =
        snap.docs.map(
          d => ({
            id: d.id,
            ...d.data()
          })
        )
        .filter(
          item =>
            item.published !== false
        )
        .sort((a, b) => {

          const at =
            a.createdAt?.toMillis?.() || 0;

          const bt =
            b.createdAt?.toMillis?.() || 0;

          return bt - at;
        });

      const body =
        items.length
          ? items.map(item => `
              <div class="notification-item">

                <strong>
                  ${escapeHTML(
                    item.title || ""
                  )}
                </strong>

                <p>
                  ${escapeHTML(
                    item.description ||
                    item.text ||
                    ""
                  )}
                </p>

              </div>
            `).join("")
          : `
            <div class="empty-state">
              No notifications.
            </div>
          `;

      openAppModal(
        "Notifications",
        body
      );

    } catch (error) {

      console.error(
        "Notifications:",
        error
      );

      toast(
        "Notifications unavailable",
        "!"
      );
    }
  }
);


/* =========================================================
   FEATURE CARDS
   ========================================================= */

document.querySelectorAll(
  ".feature-card"
).forEach(card => {

  card.addEventListener(
    "click",
    () => {

      const page =
        card.dataset.page ||
        card.dataset.feature;

      if (!page) return;

      if (
        page === "chat" &&
        appFeatures.chat === false
      ) {
        toast(
          "Chat is disabled",
          "!"
        );
        return;
      }

      if (
        page === "groups" &&
        appFeatures.groups === false
      ) {
        toast(
          "Groups are disabled",
          "!"
        );
        return;
      }

      navigateTo(page);
    }
  );
});


/* =========================================================
   GENERIC APP MODAL CLOSE
   ========================================================= */

$("closeAppModalBtn")?.addEventListener(
  "click",
  closeAppModal
);


$("appModal")?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      $("appModal")
    ) {
      closeAppModal();
    }
  }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {
      closeAppModal();
      closeGroupModal();
    }
  }
);


/* =========================================================
   ONLINE STATUS
   ========================================================= */

async function updateOnlineStatus() {

  if (!currentStudent) return;

  if (
    currentStudent.role === "owner"
  ) {
    text(
      "onlineStatus",
      "Owner"
    );
    return;
  }

  try {

    await updateDoc(
      doc(
        db,
        "students",
        currentStudent.id
      ),
      {
        online: true,
        lastSeen:
          serverTimestamp()
      }
    );

    text(
      "onlineStatus",
      t("online")
    );

  } catch (error) {

    console.warn(
      "Online status:",
      error
    );
  }
}


/* =========================================================
   SET OFFLINE WHEN PAGE HIDDEN
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  async () => {

    if (
      document.visibilityState !==
      "hidden"
    ) {
      updateOnlineStatus();
      return;
    }

    if (
      !currentStudent ||
      currentStudent.role === "owner"
    ) {
      return;
    }

    try {

      await updateDoc(
        doc(
          db,
          "students",
          currentStudent.id
        ),
        {
          online: false,
          lastSeen:
            serverTimestamp()
        }
      );

    } catch (error) {
      console.warn(
        "Offline update:",
        error
      );
    }
  }
);


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  if (
    currentStudent &&
    currentStudent.role !== "owner"
  ) {

    try {

      await updateDoc(
        doc(
          db,
          "students",
          currentStudent.id
        ),
        {
          online: false,
          lastSeen:
            serverTimestamp()
        }
      );

    } catch (error) {
      console.warn(
        "Logout status:",
        error
      );
    }
  }

  if (currentChatUnsubscribe) {
    currentChatUnsubscribe();
    currentChatUnsubscribe =
      null;
  }

  currentStudent = null;
  currentChatUser = null;
  currentPermission =
    "restricted";

  navigationHistory = [];
  currentPage = "home";

  localStorage.removeItem(
    "studyName"
  );

  localStorage.removeItem(
    "studyPhone"
  );

  localStorage.removeItem(
    "studyRole"
  );

  hide("app");
  show("loginScreen");

  const app =
    $("app");

  if (app) {
    app.classList.remove(
      "active"
    );
  }

  setValue(
    "loginPassword",
    ""
  );

  showLoginMessage(
    "",
    ""
  );

  toast(
    "Logged out",
    "✓"
  );
}


/* =========================================================
   BROWSER BACK BUTTON
   ========================================================= */

window.addEventListener(
  "popstate",
  () => {
    goBack();
  }
);


/* =========================================================
   LOGIN BUTTON
   ========================================================= */

$("loginForm")?.addEventListener(
  "submit",
  event => {
    event.preventDefault();
    handleLogin();
  }
);


$("loginBtn")?.addEventListener(
  "click",
  event => {

    if (
      $("loginForm")
    ) {
      return;
    }

    event.preventDefault();
    handleLogin();
  }
);


/* =========================================================
   ENTER KEY LOGIN
   ========================================================= */

[
  "loginName",
  "loginPhone",
  "loginPassword"
].forEach(id => {

  $(id)?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {
        event.preventDefault();
        handleLogin();
      }
    }
  );
});


/* =========================================================
   PHONE INPUT
   ========================================================= */

$("loginPhone")?.addEventListener(
  "input",
  event => {

    event.target.value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 10);
  }
);


/* =========================================================
   LOAD OWNER CONTROLS WHEN OWNER SECTION OPENS
   ========================================================= */

document.querySelectorAll(
  ".owner-tab"
).forEach(tab => {

  tab.addEventListener(
    "click",
    () => {

      if (
        tab.dataset.ownerSection ===
        "features"
      ) {
        loadOwnerFeatureControls();
      }

      if (
        tab.dataset.ownerSection ===
        "appearance"
      ) {
        loadOwnerAppearanceControls();
      }
    }
  );
});


/* =========================================================
   OWNER APPEARANCE CONTROLS
   ========================================================= */

function loadOwnerAppearanceControls() {

  setValue(
    "ownerAppName",
    globalSettings.appName ||
      "StudyConnect"
  );

  setValue(
    "ownerGlobalLanguage",
    globalSettings.language ||
      "en"
  );

  setValue(
    "ownerGlobalTheme",
    globalSettings.theme ||
      "system"
  );

  setValue(
    "ownerWelcomeAnimation",
    globalSettings.welcomeAnimation === false
      ? "off"
      : "on"
  );
}


/* =========================================================
   OWNER SECTION INITIAL STATE
   ========================================================= */

function resetOwnerSections() {

  document.querySelectorAll(
    ".owner-section"
  ).forEach(section => {

    section.hidden =
      section.id !==
      "ownerSection-dashboard";
  });

  document.querySelectorAll(
    ".owner-tab"
  ).forEach(tab => {

    tab.classList.toggle(
      "active",
      tab.dataset.ownerSection ===
      "dashboard"
    );
  });
}


/* =========================================================
   STARTUP
   ========================================================= */

async function startup() {

  await startFirebaseAuth();

  await loadGlobalSettings();

  resetOwnerSections();

  const savedName =
    localStorage.getItem(
      "studyName"
    );

  const savedPhone =
    localStorage.getItem(
      "studyPhone"
    );

  const savedRole =
    localStorage.getItem(
      "studyRole"
    );

  /*
   Do not automatically trust localStorage
   for Owner or permissions.
   It is only used to refill login fields.
  */

  if (
    savedName &&
    exists("loginName")
  ) {
    setValue(
      "loginName",
      savedName
    );
  }

  if (
    savedPhone &&
    exists("loginPhone")
  ) {
    setValue(
      "loginPhone",
      savedPhone
    );
  }

  if (
    savedRole === "owner"
  ) {
    localStorage.removeItem(
      "studyRole"
    );
  }

  hide("app");
  show("loginScreen");
}


/* =========================================================
   INITIAL START
   ========================================================= */

startup().catch(
  error => {
    console.error(
      "Startup:",
      error
    );
  }
);


/* =========================================================
   END OF PART 2
   ========================================================= */
                
