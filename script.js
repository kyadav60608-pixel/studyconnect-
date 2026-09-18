
/* =========================================================
   STUDYCONNECT — SCRIPT.JS
   PART 1 / 2
   Firebase + Login + Permissions + Navigation
   Personal Chat + Private Groups
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
  limit,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyYOUR_FIREBASE_API_KEY",
  authDomain: "studyconnect-99006.firebaseapp.com",
  projectId: "studyconnect-99006",
  storageBucket: "studyconnect-99006.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);


/* =========================================================
   APP CONSTANTS
========================================================= */

const OWNER_NAME = "Krishna Yadav";
const OWNER_SHORT_NAME = "Krishna Ji";

const OWNER_PASSWORD = "12341";
const STUDENT_PASSWORD = "123";

const CHAT_LIMIT = 2;
const PERMISSION_HOURS = 24;

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
    maintenance: false
  }
};


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentStudent = null;
let currentChatUser = null;
let currentGroup = null;

let currentPage = "home";
let previousPage = "home";

let globalSettings = {
  ...DEFAULT_SETTINGS,
  features: {
    ...DEFAULT_SETTINGS.features
  }
};

let studentsCache = [];
let groupsCache = [];

let unsubscribeMessages = null;
let unsubscribeGroupMessages = null;
let unsubscribeOnline = null;

let selectedGroupMembers = [];

let loginStep = 1;

let firebaseReady = false;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const qs = (selector, parent = document) =>
  parent.querySelector(selector);

const qsa = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

function show(element) {
  if (!element) return;
  element.classList.remove("hidden");
  element.style.display = "";
}

function hide(element) {
  if (!element) return;
  element.classList.add("hidden");
  element.style.display = "none";
}

function text(element, value) {
  if (!element) return;
  element.textContent = value ?? "";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message, type = "success") {
  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  const icon = $("toastIcon");

  text(toast, "");
  toast.innerHTML = "";

  const iconEl = document.createElement("span");
  iconEl.id = "toastIcon";

  if (type === "error") {
    iconEl.textContent = "✕";
  } else if (type === "warning") {
    iconEl.textContent = "!";
  } else {
    iconEl.textContent = "✓";
  }

  const messageEl = document.createElement("span");
  messageEl.textContent = message;

  toast.append(iconEl, messageEl);

  show(toast);

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    hide(toast);
  }, 3000);
}


/* =========================================================
   MODAL
========================================================= */

function openModal(title, message, options = {}) {
  const overlay = $("appModal");

  if (!overlay) {
    alert(`${title}\n\n${message}`);
    return;
  }

  const titleEl = $("appModalTitle");
  const bodyEl = $("appModalBody");

  if (titleEl) text(titleEl, title);

  if (bodyEl) {
    bodyEl.innerHTML = message;
  }

  show(overlay);

  if (options.onOpen) {
    options.onOpen();
  }
}

function closeModal() {
  hide($("appModal"));
}


/* =========================================================
   PASSWORD HASH
========================================================= */

async function hashPassword(password) {
  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return [...new Uint8Array(hashBuffer)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}


/* =========================================================
   FIREBASE START
========================================================= */

async function startFirebase() {
  try {
    await signInAnonymously(auth);

    firebaseReady = true;

    console.log("StudyConnect Firebase connected.");
    return true;

  } catch (error) {

    console.error("Firebase connection error:", error);

    firebaseReady = false;

    showToast(
      "Firebase connection नहीं हो पाया। Internet और Firebase settings check करें।",
      "error"
    );

    return false;
  }
}


/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {
  try {

    const ref = doc(db, "appSettings", "main");

    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {

      const data = snapshot.data();

      globalSettings = {
        ...DEFAULT_SETTINGS,
        ...data,

        features: {
          ...DEFAULT_SETTINGS.features,
          ...(data.features || {})
        }
      };

    } else {

      globalSettings = {
        ...DEFAULT_SETTINGS,
        features: {
          ...DEFAULT_SETTINGS.features
        }
      };

    }

    applySettings();

  } catch (error) {

    console.error("Settings load error:", error);

    globalSettings = {
      ...DEFAULT_SETTINGS,
      features: {
        ...DEFAULT_SETTINGS.features
      }
    };

    applySettings();
  }
}


/* =========================================================
   APPLY SETTINGS
========================================================= */

function applySettings() {

  const appName =
    globalSettings.appName || "StudyConnect";

  document.title = appName;

  const titleElements = qsa("[data-app-name]");

  titleElements.forEach(element => {
    text(element, appName);
  });

  applyTheme();
  applyLanguage();
  applyFeatureVisibility();
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

  const theme = globalSettings.theme || "system";

  let dark = false;

  if (theme === "dark") {
    dark = true;
  }

  if (theme === "system") {
    dark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  document.body.classList.toggle("dark", dark);
}


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {

  en: {
    chat: "💬 Chat / चैट",
    groups: "👥 Groups / ग्रुप",
    homework: "📝 Homework / होमवर्क",
    school: "📢 School Updates / स्कूल अपडेट्स",
    notes: "📚 Notes / नोट्स",
    settings: "⚙️ Settings / सेटिंग्स",
    home: "🏠 Home / होम",
    owner: "👑 Owner Panel / ओनर पैनल",
    logout: "🚪 Logout / लॉगआउट",

    englishGrammar: "English Grammar",
    hindiGrammar: "Hindi Grammar",
    activityPeriod: "Activity Period",
    sst: "SST"
  },

  hi: {
    chat: "💬 चैट / Chat",
    groups: "👥 ग्रुप / Groups",
    homework: "📝 होमवर्क / Homework",
    school: "📢 स्कूल अपडेट्स / School Updates",
    notes: "📚 नोट्स / Notes",
    settings: "⚙️ सेटिंग्स / Settings",
    home: "🏠 होम / Home",
    owner: "👑 ओनर पैनल / Owner Panel",
    logout: "🚪 लॉगआउट / Logout",

    englishGrammar: "English Grammar",
    hindiGrammar: "Hindi Grammar",
    activityPeriod: "Activity Period",
    sst: "SST"
  }
};


function applyLanguage() {

  const language =
    globalSettings.language === "hi"
      ? "hi"
      : "en";

  const dictionary =
    translations[language];

  qsa("[data-i18n]").forEach(element => {

    const key = element.dataset.i18n;

    if (dictionary[key]) {
      text(element, dictionary[key]);
    }

  });

  qsa("[data-i18n-placeholder]").forEach(element => {

    const key = element.dataset.i18nPlaceholder;

    if (dictionary[key]) {
      element.placeholder = dictionary[key];
    }

  });
}


/* =========================================================
   FEATURE VISIBILITY
========================================================= */

function applyFeatureVisibility() {

  const features = globalSettings.features || {};

  const mapping = {
    chat: ["chat"],
    groups: ["groups"],
    homework: ["homework"],
    notes: ["notes"],
    announcements: ["school"],
    registration: ["registration"]
  };

  Object.entries(mapping).forEach(([feature, pages]) => {

    const enabled = features[feature] !== false;

    pages.forEach(page => {

      qsa(`[data-page="${page}"]`).forEach(element => {

        element.classList.toggle(
          "feature-disabled",
          !enabled
        );

      });

    });

  });

  qsa('[data-feature="chat"]').forEach(el => {
    el.classList.toggle(
      "feature-disabled",
      features.chat === false
    );
  });

  qsa('[data-feature="groups"]').forEach(el => {
    el.classList.toggle(
      "feature-disabled",
      features.groups === false
    );
  });
}


/* =========================================================
   PERMISSION HELPERS
========================================================= */

function getPermissionExpiryMillis(student) {

  if (!student?.permissionExpiresAt) {
    return 0;
  }

  return getMillis(student.permissionExpiresAt);
}


function permissionExpired(student) {

  const expiry = getPermissionExpiryMillis(student);

  if (!expiry) {
    return false;
  }

  return Date.now() >= expiry;
}


function effectivePermission(student) {

  if (!student) {
    return "restricted";
  }

  if (student.isOwner === true) {
    return "owner";
  }

  if (
    student.status === "blocked" ||
    student.status === "rejected"
  ) {
    return "restricted";
  }

  if (permissionExpired(student)) {
    return "restricted";
  }

  return student.permission || "restricted";
}


function canUse(feature) {

  if (!currentStudent) {
    return false;
  }

  const permission =
    effectivePermission(currentStudent);

  if (permission === "owner") {
    return true;
  }

  if (globalSettings.features?.maintenance) {

    return [
      "home",
      "school",
      "homework"
    ].includes(feature);

  }

  if (permission === "restricted") {

    return [
      "home",
      "school",
      "homework",
      "settings"
    ].includes(feature);

  }

  if (permission === "normal") {

    return [
      "home",
      "school",
      "homework",
      "chat",
      "settings"
    ].includes(feature);

  }

  if (
    permission === "allow" ||
    permission === "full"
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   APPLY USER ACCESS
========================================================= */

function applyUserAccess() {

  if (!currentStudent) return;

  const permission =
    effectivePermission(currentStudent);

  qsa("[data-page]").forEach(element => {

    const page = element.dataset.page;

    if (page === "owner") {
      element.classList.toggle(
        "feature-disabled",
        permission !== "owner"
      );

      return;
    }

    if (
      page === "settings" ||
      page === "home"
    ) {
      return;
    }

    const allowed = canUse(page);

    element.classList.toggle(
      "feature-disabled",
      !allowed
    );

  });

  qsa("[data-owner-only]").forEach(element => {

    element.classList.toggle(
      "feature-disabled",
      permission !== "owner"
    );

  });
}


/* =========================================================
   OWNER WELCOME ANIMATION
========================================================= */

function ownerWelcomeAnimation() {

  const overlay = $("ownerWelcome");

  if (!overlay) {
    openPage("owner");
    return;
  }

  show(overlay);

  const title =
    $("ownerWelcomeTitle");

  const message =
    $("ownerWelcomeText");

  if (title) {
    text(
      title,
      `Welcome Owner ${OWNER_SHORT_NAME}`
    );
  }

  if (message) {
    text(
      message,
      "Control Center is opening..."
    );
  }

  const stars =
    $("fallingStars");

  if (stars) {

    stars.innerHTML = "";

    for (let i = 0; i < 35; i++) {

      const star =
        document.createElement("span");

      star.textContent = "✦";

      star.style.position = "absolute";
      star.style.left =
        `${Math.random() * 100}%`;

      star.style.top =
        `${Math.random() * 100}%`;

      star.style.opacity =
        `${0.25 + Math.random() * 0.75}`;

      star.style.fontSize =
        `${8 + Math.random() * 14}px`;

      star.style.animation =
        `starFall ${2 + Math.random() * 3}s linear infinite`;

      star.style.animationDelay =
        `${Math.random() * 2}s`;

      stars.appendChild(star);
    }

  }

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioContext) {

      const audio =
        new AudioContext();

      const oscillator =
        audio.createOscillator();

      const gain =
        audio.createGain();

      oscillator.frequency.value = 660;

      gain.gain.value = 0.025;

      oscillator.connect(gain);
      gain.connect(audio.destination);

      oscillator.start();

      oscillator.frequency.exponentialRampToValueAtTime(
        880,
        audio.currentTime + 0.7
      );

      oscillator.stop(
        audio.currentTime + 0.8
      );

    }

  } catch (error) {
    console.log("Welcome sound unavailable.");
  }

  setTimeout(() => {

    hide(overlay);

    openPage("owner");

  }, 2200);
}


/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

  const form = $("loginForm");

  if (!form) return;

  form.addEventListener(
    "submit",
    handleLogin
  );

  const password =
    $("loginPassword");

  if (password) {

    password.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          event.preventDefault();
          form.requestSubmit();
        }

      }
    );

  }
}


function setLoginStep(step) {

  loginStep = step;

  const nameWrap =
    $("loginNameWrap");

  const phoneWrap =
    $("loginPhoneWrap");

  const button =
    $("loginBtn");

  if (step === 1) {

    hide(nameWrap);
    hide(phoneWrap);

    if (button) {
      text(button, "Next →");
    }

  } else {

    show(nameWrap);
    show(phoneWrap);

    if (button) {
      text(button, "Login →");
    }

  }
}


async function handleLogin(event) {

  event.preventDefault();

  const password =
    $("loginPassword")?.value.trim();

  const message =
    $("loginMessage");

  if (!password) {

    text(
      message,
      "Password डालें।"
    );

    return;
  }


  /* -------------------------
     STEP 1
  ------------------------- */

  if (loginStep === 1) {

    const enteredHash =
      await hashPassword(password);

    let savedOwnerHash = "";

    try {

      const settingsSnap =
        await getDoc(
          doc(db, "appSettings", "main")
        );

      if (settingsSnap.exists()) {

        savedOwnerHash =
          settingsSnap.data()
            ?.ownerPasswordHash || "";

      }

    } catch (error) {

      console.error(
        "Owner password check error:",
        error
      );

    }


    if (
      password === OWNER_PASSWORD ||
      (
        savedOwnerHash &&
        enteredHash === savedOwnerHash
      )
    ) {

      currentStudent = {
        id: "owner",
        name: OWNER_NAME,
        phone: "",
        status: "approved",
        permission: "owner",
        isOwner: true
      };

      localStorage.setItem(
        "studyName",
        OWNER_NAME
      );

      localStorage.setItem(
        "studyPhone",
        "owner"
      );

      openApp();

      if (
        globalSettings.welcomeAnimation !== false
      ) {

        ownerWelcomeAnimation();

      } else {

        openPage("owner");

      }

      return;
    }


    if (password === STUDENT_PASSWORD) {

      setLoginStep(2);

      text(
        message,
        ""
      );

      const nameInput =
        $("loginName");

      if (nameInput) {
        setTimeout(
          () => nameInput.focus(),
          50
        );
      }

      return;
    }


    text(
      message,
      "Wrong password."
    );

    return;
  }


  /* -------------------------
     STEP 2
  ------------------------- */

  const name =
    $("loginName")?.value.trim();

  const phone =
    $("loginPhone")?.value.trim();


  if (!name) {

    text(
      message,
      "अपना नाम डालें।"
    );

    return;
  }


  if (!/^\d{10}$/.test(phone)) {

    text(
      message,
      "10 digit mobile number डालें।"
    );

    return;
  }


  await loginStudent(
    name,
    phone
  );
}


/* =========================================================
   STUDENT LOGIN
========================================================= */

async function loginStudent(name, phone) {

  const message =
    $("loginMessage");

  try {

    const q =
      query(
        collection(db, "students"),
        where("phone", "==", phone),
        limit(1)
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      text(
        message,
        "यह mobile number registered नहीं है।"
      );

      return;
    }

    const studentDoc =
      snapshot.docs[0];

    const student =
      {
        id: studentDoc.id,
        ...studentDoc.data()
      };


    if (
      String(student.name || "")
        .trim()
        .toLowerCase() !==
      name.trim().toLowerCase()
    ) {

      text(
        message,
        "Name और registered name match नहीं कर रहे।"
      );

      return;
    }


    if (
      student.status === "blocked" ||
      student.status === "rejected"
    ) {

      text(
        message,
        "आपका account blocked/rejected है।"
      );

      return;
    }


    if (
      student.status === "pending"
    ) {

      text(
        message,
        "Owner approval pending है।"
      );

      return;
    }


    currentStudent = student;

    localStorage.setItem(
      "studyName",
      student.name
    );

    localStorage.setItem(
      "studyPhone",
      student.phone
    );


    await setStudentOnline(
      student.id,
      true
    );


    openApp();

  } catch (error) {

    console.error(
      "Student login error:",
      error
    );

    text(
      message,
      "Login में समस्या हुई। फिर कोशिश करें।"
    );
  }
}


/* =========================================================
   OPEN APP
========================================================= */

function openApp() {

  hide($("loginScreen"));
  show($("app"));

  updateProfile();
  applyUserAccess();

  openPage("home");

  loadHome();
}


/* =========================================================
   PROFILE
========================================================= */

function updateProfile() {

  if (!currentStudent) return;

  const name =
    currentStudent.name ||
    OWNER_NAME;

  const avatar =
    name
      .trim()
      .charAt(0)
      .toUpperCase();

  qsa("[data-user-name]").forEach(
    element => text(element, name)
  );

  qsa("[data-user-avatar]").forEach(
    element => text(element, avatar)
  );

  qsa("[data-user-phone]").forEach(
    element =>
      text(
        element,
        currentStudent.phone || "Owner"
      )
  );

  const ownerBadge =
    $("ownerBadge");

  if (ownerBadge) {

    ownerBadge.classList.toggle(
      "hidden",
      effectivePermission(currentStudent) !== "owner"
    );

  }
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

  qsa("[data-page]").forEach(button => {

    button.addEventListener(
      "click",
      event => {

        const page =
          event.currentTarget.dataset.page;

        if (!page) return;

        openPage(page);

      }
    );

  });

  qsa(".bottom-nav-item[data-page]")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          const page =
            event.currentTarget.dataset.page;

          if (page) {
            openPage(page);
          }

        }
      );

    });
}


async function openPage(page) {

  if (!currentStudent) return;

  const permission =
    effectivePermission(currentStudent);


  if (
    page === "owner" &&
    permission !== "owner"
  ) {

    showToast(
      "Owner Panel सिर्फ Owner के लिए है।",
      "error"
    );

    return;
  }


  if (
    page !== "owner" &&
    !canUse(page)
  ) {

    showToast(
      "इस feature की permission अभी नहीं है।",
      "warning"
    );

    return;
  }


  previousPage = currentPage;
  currentPage = page;


  qsa(".page").forEach(section => {

    section.classList.toggle(
      "active",
      section.id === `${page}Page`
    );

  });


  qsa(
    `[data-page="${page}"]`
  ).forEach(element => {

    element.classList.add("active");

  });


  qsa("[data-page]").forEach(element => {

    if (
      element.dataset.page !== page
    ) {
      element.classList.remove("active");
    }

  });


  /* Mobile menu close */
  document.body.classList.remove(
    "menu-open"
  );


  switch (page) {

    case "home":
      await loadHome();
      break;

    case "chat":
      await loadChatPeople();
      break;

    case "groups":
      await loadGroups();
      break;

    case "homework":
      await loadHomework();
      break;

    case "school":
      await loadSchool();
      break;

    case "notes":
      await loadNotes();
      break;

    case "owner":
      await loadOwnerPanel();
      break;

    case "settings":
      loadSettingsPage();
      break;

  }
}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMenu() {

  const toggle =
    $("menuToggle");

  if (!toggle) return;

  toggle.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "menu-open"
      );

    }
  );

  document.addEventListener(
    "click",
    event => {

      if (
        !document.body.classList.contains(
          "menu-open"
        )
      ) {
        return;
      }

      const sidebar =
        $("sidebar");

      if (
        sidebar &&
        !sidebar.contains(event.target) &&
        !toggle.contains(event.target)
      ) {

        document.body.classList.remove(
          "menu-open"
        );

      }

    }
  );
}


/* =========================================================
   HOME
========================================================= */

async function loadHome() {

  const container =
    $("homeAnnouncements");

  if (!container) return;

  container.innerHTML =
    `<div class="loading-card">
      Loading school updates...
    </div>`;

  try {

    const q =
      query(
        collection(db, "school"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

    const snapshot =
      await getDocs(q);

    const items =
      snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        .filter(item =>
          item.published !== false
        );


    if (!items.length) {

      container.innerHTML =
        `<div class="empty-card">
          अभी कोई school update नहीं है।
        </div>`;

      return;
    }


    container.innerHTML =
      items.map(item => {

        return `
          <article class="announcement-card">

            <h3>
              ${escapeHTML(item.title || "School Update")}
            </h3>

            <p>
              ${escapeHTML(item.text || item.description || "")}
            </p>

          </article>
        `;

      }).join("");


  } catch (error) {

    console.error(
      "Home loading error:",
      error
    );

    container.innerHTML =
      `<div class="empty-card">
        School updates अभी load नहीं हो सके।
      </div>`;
  }
}


/* =========================================================
   ONLINE STATUS
========================================================= */

async function setStudentOnline(
  studentId,
  online
) {

  if (!studentId || studentId === "owner") {
    return;
  }

  try {

    await updateDoc(
      doc(db, "students", studentId),
      {
        online,
        lastSeen: serverTimestamp()
      }
    );

  } catch (error) {

    console.error(
      "Online status error:",
      error
    );

  }
}


/* =========================================================
   CHAT — STUDENT LIST
========================================================= */

async function loadChatPeople() {

  const container =
    $("chatPeople");

  if (!container) return;

  container.innerHTML =
    `<div class="loading-card">
      Students loading...
    </div>`;

  try {

    const snapshot =
      await getDocs(
        collection(db, "students")
      );

    studentsCache =
      snapshot.docs.map(
        docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })
      );


    const people =
      studentsCache.filter(student => {

        if (
          student.id === currentStudent?.id
        ) {
          return false;
        }

        if (
          student.status !== "approved"
        ) {
          return false;
        }

        if (
          student.status === "blocked" ||
          student.status === "rejected"
        ) {
          return false;
        }

        return true;

      });


    renderChatPeople(people);

  } catch (error) {

    console.error(
      "Chat people error:",
      error
    );

    container.innerHTML =
      `<div class="empty-card">
        Students load नहीं हो सके।
      </div>`;
  }
}


/* =========================================================
   RENDER CHAT PEOPLE
========================================================= */

function renderChatPeople(people) {

  const container =
    $("chatPeople");

  if (!container) return;

  if (!people.length) {

    container.innerHTML =
      `<div class="empty-card">
        अभी कोई दूसरा approved student नहीं है।
      </div>`;

    return;
  }


  container.innerHTML =
    people.map(person => {

      const name =
        person.name || "Student";

      const initial =
        name.charAt(0).toUpperCase();

      const online =
        person.online === true;

      return `
        <button
          type="button"
          class="chat-person"
          data-chat-person="${escapeHTML(person.id)}"
        >

          <div class="chat-person-avatar">
            ${escapeHTML(initial)}
          </div>

          <div class="person-meta">

            <strong>
              ${escapeHTML(name)}
            </strong>

            <span>
              ${online ? "🟢 Online" : "Offline"}
            </span>

          </div>

        </button>
      `;

    }).join("");


  qsa(
    "[data-chat-person]",
    container
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const person =
          people.find(
            item =>
              item.id ===
              button.dataset.chatPerson
          );

        if (person) {
          openChat(person);
        }

      }
    );

  });
}


/* =========================================================
   CHAT SEARCH
========================================================= */

function setupChatSearch() {

  const input =
    $("chatSearch");

  if (!input) return;

  input.addEventListener(
    "input",
    () => {

      const term =
        input.value
          .trim()
          .toLowerCase();

      const filtered =
        studentsCache.filter(student => {

          if (
            student.id === currentStudent?.id
          ) {
            return false;
          }

          if (
            student.status !== "approved"
          ) {
            return false;
          }

          const name =
            String(
              student.name || ""
            ).toLowerCase();

          const phone =
            String(
              student.phone || ""
            );

          return (
            name.includes(term) ||
            phone.includes(term)
          );

        });

      renderChatPeople(filtered);

    }
  );
}


/* =========================================================
   CHAT PERMISSION
========================================================= */

function canCreateGroup() {

  if (!currentStudent) {
    return false;
  }

  return (
    effectivePermission(currentStudent) === "owner" ||
    effectivePermission(currentStudent) === "allow" ||
    effectivePermission(currentStudent) === "full"
  );
}


/* =========================================================
   PRIVATE GROUPS
========================================================= */

async function loadGroups() {

  const container =
    $("groupsList");

  if (!container) return;

  container.innerHTML =
    `<div class="loading-card">
      Groups loading...
    </div>`;

  try {

    const snapshot =
      await getDocs(
        collection(db, "groups")
      );

    groupsCache =
      snapshot.docs.map(
        docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })
      );


    const myGroups =
      groupsCache.filter(group => {

        if (group.active === false) {
          return false;
        }

        return (
          Array.isArray(group.memberIds) &&
          group.memberIds.includes(
            currentStudent.id
          )
        );

      });


    renderGroups(myGroups);

  } catch (error) {

    console.error(
      "Groups loading error:",
      error
    );

    container.innerHTML =
      `<div class="empty-card">
        Groups load नहीं हो सके।
      </div>`;
  }
}


/* =========================================================
   RENDER GROUPS
========================================================= */

function renderGroups(groups) {

  const container =
    $("groupsList");

  if (!container) return;

  if (!groups.length) {

    container.innerHTML =
      `<div class="empty-card">
        अभी कोई private group नहीं है।
      </div>`;

    return;
  }


  container.innerHTML =
    groups.map(group => {

      const memberCount =
        Array.isArray(group.memberIds)
          ? group.memberIds.length
          : 0;

      return `
        <article
          class="group-card"
          data-group-id="${escapeHTML(group.id)}"
        >

          <div class="group-card-header">

            <div class="group-card-icon">
              👥
            </div>

            <div>

              <h3>
                ${escapeHTML(group.name || "Private Group")}
              </h3>

              <p>
                ${memberCount} members
              </p>

            </div>

          </div>

          <button
            type="button"
            class="primary-btn open-group-btn"
            data-open-group="${escapeHTML(group.id)}"
          >
            💬 Open Group
          </button>

        </article>
      `;

    }).join("");


  qsa(
    "[data-open-group]",
    container
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const group =
          groups.find(
            item =>
              item.id ===
              button.dataset.openGroup
          );

        if (group) {
          openGroup(group);
        }

      }
    );

  });
}


/* =========================================================
   GROUP MODAL
========================================================= */

function setupGroupModal() {

  const openButton =
    $("createGroupBtn");

  if (openButton) {

    openButton.addEventListener(
      "click",
      openGroupModal
    );

  }

  const closeButton =
    $("closeGroupModal");

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeGroupModal
    );

  }

  const form =
    $("groupForm");

  if (form) {

    form.addEventListener(
      "submit",
      createGroup
    );

  }

  const search =
    $("groupMemberSearch");

  if (search) {

    search.addEventListener(
      "input",
      searchGroupMembers
    );

  }
}


function openGroupModal() {

  if (!canCreateGroup()) {

    showToast(
      "Group बनाने की permission नहीं है।",
      "warning"
    );

    return;
  }

  selectedGroupMembers = [];

  const name =
    $("groupName");

  const password =
    $("groupPassword");

  if (name) name.value = "";
  if (password) password.value = "";

  renderSelectedMembers();

  show($("groupModal"));

  const search =
    $("groupMemberSearch");

  if (search) {
    search.value = "";
  }

  const results =
    $("groupMemberResults");

  if (results) {
    results.innerHTML = "";
  }
}


function closeGroupModal() {

  hide($("groupModal"));

  selectedGroupMembers = [];

}


/* =========================================================
   GROUP MEMBER SEARCH
========================================================= */

async function ensureStudentsCache() {

  if (studentsCache.length) {
    return;
  }

  const snapshot =
    await getDocs(
      collection(db, "students")
    );

  studentsCache =
    snapshot.docs.map(
      docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })
    );
}


async function searchGroupMembers() {

  const input =
    $("groupMemberSearch");

  const results =
    $("groupMemberResults");

  if (!input || !results) return;

  const term =
    input.value
      .trim()
      .toLowerCase();


  if (!term) {

    results.innerHTML = "";
    return;

  }


  try {

    await ensureStudentsCache();

    const people =
      studentsCache.filter(student => {

        if (
          student.id ===
          currentStudent?.id
        ) {
          return false;
        }

        if (
          student.status !== "approved"
        ) {
          return false;
        }

        const name =
          String(
            student.name || ""
          ).toLowerCase();

        const phone =
          String(
            student.phone || ""
          );

        return (
          name.includes(term) ||
          phone.includes(term)
        );

      });


    if (!people.length) {

      results.innerHTML =
        `<div class="empty-card">
          कोई registered/approved student नहीं मिला।
        </div>`;

      return;
    }


    results.innerHTML =
      people.map(person => {

        const alreadySelected =
          selectedGroupMembers.some(
            member =>
              member.id === person.id
          );

        return `
          <div class="member-result">

            <div>

              <strong>
                ${escapeHTML(person.name || "Student")}
              </strong>

              <small>
                ${escapeHTML(person.phone || "")}
              </small>

            </div>

            <button
              type="button"
              class="secondary-btn"
              data-add-member="${escapeHTML(person.id)}"
              ${alreadySelected ? "disabled" : ""}
            >
              ${alreadySelected ? "✓ Added" : "+ Add"}
            </button>

          </div>
        `;

      }).join("");


    qsa(
      "[data-add-member]",
      results
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const person =
            people.find(
              item =>
                item.id ===
                button.dataset.addMember
            );

          if (person) {
            addSelectedMember(person);
          }

        }
      );

    });

  } catch (error) {

    console.error(
      "Group member search error:",
      error
    );

    results.innerHTML =
      `<div class="empty-card">
        Student search में समस्या हुई।
      </div>`;
  }
}


/* =========================================================
   ADD GROUP MEMBER
========================================================= */

function addSelectedMember(person) {

  if (
    selectedGroupMembers.some(
      member =>
        member.id === person.id
    )
  ) {
    return;
  }

  selectedGroupMembers.push(person);

  renderSelectedMembers();

  searchGroupMembers();
}


/* =========================================================
   SELECTED MEMBERS
========================================================= */

function renderSelectedMembers() {

  const container =
    $("selectedMembers");

  if (!container) return;

  if (!selectedGroupMembers.length) {

    container.innerHTML =
      `<span class="empty-members">
        अभी कोई member select नहीं है।
      </span>`;

    return;
  }


  container.innerHTML =
    selectedGroupMembers.map(member => {

      return `
        <span class="selected-member">

          ${escapeHTML(member.name || "Student")}

          <button
            type="button"
            data-remove-member="${escapeHTML(member.id)}"
            aria-label="Remove member"
          >
            ×
          </button>

        </span>
      `;

    }).join("");


  qsa(
    "[data-remove-member]",
    container
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedGroupMembers =
          selectedGroupMembers.filter(
            member =>
              member.id !==
              button.dataset.removeMember
          );

        renderSelectedMembers();

        searchGroupMembers();

      }
    );

  });
}


/* =========================================================
   CREATE GROUP
========================================================= */

async function createGroup(event) {

  event.preventDefault();

  if (!currentStudent) {
    return;
  }


  if (!canCreateGroup()) {

    showToast(
      "Group बनाने की permission नहीं है।",
      "warning"
    );

    return;
  }


  const name =
    $("groupName")?.value.trim();

  const password =
    $("groupPassword")?.value.trim();


  if (!name) {

    showToast(
      "Group name डालें।",
      "error"
    );

    return;
  }


  if (!password || password.length < 4) {

    showToast(
      "Group password कम से कम 4 characters का रखें।",
      "error"
    );

    return;
  }


  if (!selectedGroupMembers.length) {

    showToast(
      "कम से कम एक member select करें।",
      "error"
    );

    return;
  }


  try {

    const passwordHash =
      await hashPassword(password);


    const memberIds = [
      currentStudent.id,
      ...selectedGroupMembers.map(
        member => member.id
      )
    ];


    const memberNames = [
      currentStudent.name,
      ...selectedGroupMembers.map(
        member => member.name
      )
    ];


    const groupRef =
      await addDoc(
        collection(db, "groups"),
        {

          name,

          creatorId:
            currentStudent.id,

          creatorName:
            currentStudent.name,

          memberIds,

          memberNames,

          passwordHash,

          active: true,

          createdAt:
            serverTimestamp()

        }
      );


    showToast(
      "Private group successfully बन गया।"
    );


    closeGroupModal();

    await loadGroups();

    const createdGroup =
      {
        id: groupRef.id,
        name,
        creatorId: currentStudent.id,
        creatorName: currentStudent.name,
        memberIds,
        memberNames,
        passwordHash,
        active: true
      };


    setTimeout(() => {
      openGroup(createdGroup);
    }, 250);


  } catch (error) {

    console.error(
      "Create group error:",
      error
    );

    showToast(
      "Group create नहीं हो पाया।",
      "error"
    );
  }
}


/* =========================================================
   OPEN GROUP
========================================================= */

function openGroup(group) {

  if (!currentStudent) return;

  if (
    !Array.isArray(group.memberIds) ||
    !group.memberIds.includes(
      currentStudent.id
    )
  ) {

    showToast(
      "आप इस group के member नहीं हैं।",
      "error"
    );

    return;
  }


  if (group.active === false) {

    showToast(
      "यह group Owner द्वारा disabled है।",
      "warning"
    );

    return;
  }


  currentGroup = group;


  /*
    Password protection:
    Creator और members को group खोलते समय
    password verify कराया जाएगा।
  */

  const savedAccess =
    sessionStorage.getItem(
      `studyconnect_group_${group.id}`
    );


  if (savedAccess === "true") {

    openGroupChatWindow(group);
    return;

  }


  const password =
    prompt(
      `🔐 ${group.name}\n\nGroup password डालें:`
    );


  if (password === null) {
    currentGroup = null;
    return;
  }


  verifyGroupPassword(
    group,
    password
  );
}


/* =========================================================
   VERIFY GROUP PASSWORD
========================================================= */

async function verifyGroupPassword(
  group,
  password
) {

  try {

    const hash =
      await hashPassword(password);


    if (
      hash !== group.passwordHash
    ) {

      showToast(
        "Wrong group password.",
        "error"
      );

      currentGroup = null;
      return;
    }


    sessionStorage.setItem(
      `studyconnect_group_${group.id}`,
      "true"
    );


    openGroupChatWindow(group);

  } catch (error) {

    console.error(
      "Group password error:",
      error
    );

    showToast(
      "Group verification में समस्या हुई।",
      "error"
    );
  }
}


/* =========================================================
   GROUP CHAT WINDOW
========================================================= */

function openGroupChatWindow(group) {

  const modal =
    $("groupChatModal");

  if (!modal) {

    showToast(
      `Group "${group.name}" खुल गया।`,
      "success"
    );

    return;
  }


  const title =
    $("groupChatTitle");

  const subtitle =
    $("groupChatSubtitle");


  if (title) {
    text(
      title,
      group.name
    );
  }


  if (subtitle) {

    text(
      subtitle,
      `${group.memberIds?.length || 0} members`
    );

  }


  show(modal);

  subscribeGroupMessages(group);
}


/* =========================================================
   CLOSE GROUP CHAT
========================================================= */

function closeGroupChat() {

  if (unsubscribeGroupMessages) {

    unsubscribeGroupMessages();

    unsubscribeGroupMessages = null;

  }

  currentGroup = null;

  hide($("groupChatModal"));
}


/* =========================================================
   GROUP CHAT ID
========================================================= */

function makeGroupChatId(groupId) {

  return `group_${groupId}`;
}


/* =========================================================
   GROUP REALTIME MESSAGES
========================================================= */

function subscribeGroupMessages(group) {

  if (unsubscribeGroupMessages) {

    unsubscribeGroupMessages();

    unsubscribeGroupMessages = null;

  }


  const chatId =
    makeGroupChatId(group.id);


  const messagesRef =
    collection(
      db,
      "groupMessages"
    );


  const q =
    query(
      messagesRef,
      where(
        "groupId",
        "==",
        group.id
      ),
      orderBy(
        "createdAt",
        "asc"
      )
    );


  unsubscribeGroupMessages =
    onSnapshot(
      q,
      snapshot => {

        const messages =
          snapshot.docs.map(
            docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
            })
          );


        renderGroupMessages(messages);

      },

      error => {

        console.error(
          "Group realtime error:",
          error
        );

        showToast(
          "Group messages realtime load नहीं हो पाया।",
          "error"
        );

      }
    );
}


/* =========================================================
   RENDER GROUP MESSAGES
========================================================= */

function renderGroupMessages(messages) {

  const container =
    $("groupChatMessages");

  if (!container) return;


  if (!messages.length) {

    container.innerHTML =
      `<div class="empty-chat">

        <div class="empty-chat-icon">
          👥
        </div>

        <h3>
          Group Chat शुरू करें
        </h3>

        <p>
          पहला message भेजें।
        </p>

      </div>`;

    return;
  }


  let lastDate = "";

  const html = [];


  messages.forEach(message => {

    const date =
      formatDate(
        message.createdAt
      );


    if (date !== lastDate) {

      html.push(`
        <div class="date-separator">
          ${escapeHTML(date)}
        </div>
      `);

      lastDate = date;
    }


    const own =
      message.senderId ===
      currentStudent?.id;


    html.push(`
      <div
        class="chat-message ${
          own
            ? "message-sent"
            : "message-received"
        }"
      >

        <div class="message-bubble">

          ${
            !own
              ? `
                <div style="
                  font-size:.68rem;
                  font-weight:800;
                  color:var(--primary);
                  margin-bottom:3px;
                ">
                  ${escapeHTML(
                    message.senderName || "Student"
                  )}
                </div>
              `
              : ""
          }

          <div class="message-text">
            ${escapeHTML(message.text || "")}
          </div>

          <div class="message-meta">

            <span>
              ${escapeHTML(
                formatTime(message.createdAt)
              )}
            </span>

            ${
              own
                ? `
                  <span class="message-ticks seen">
                    ✓✓
                  </span>
                `
                : ""
            }

          </div>

        </div>

      </div>
    `);

  });


  container.innerHTML =
    html.join("");


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   PERSONAL CHAT
========================================================= */

function makeChatId(a, b) {

  return [
    String(a),
    String(b)
  ]
    .sort()
    .join("_");
}


function openChat(person) {

  if (!currentStudent) return;


  if (!canUse("chat")) {

    showToast(
      "Chat की permission अभी नहीं है।",
      "warning"
    );

    return;
  }


  currentChatUser = person;


  const layout =
    $("chatLayout");

  if (layout) {
    layout.classList.add("chat-open");
  }


  const title =
    $("chatPersonName");

  const subtitle =
    $("chatPersonStatus");

  const avatar =
    $("chatPersonAvatar");


  if (title) {
    text(
      title,
      person.name || "Student"
    );
  }


  if (subtitle) {

    text(
      subtitle,
      person.online
        ? "🟢 Online"
        : "Offline"
    );

  }


  if (avatar) {

    text(
      avatar,
      (
        person.name ||
        "S"
      ).charAt(0).toUpperCase()
    );

  }


  subscribeMessages(person);

  markMessagesSeen(person);
}


/* =========================================================
   CLOSE PERSONAL CHAT
========================================================= */

function closeChat() {

  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages = null;

  }

  currentChatUser = null;

  const layout =
    $("chatLayout");

  if (layout) {
    layout.classList.remove("chat-open");
  }
}


/* =========================================================
   PERSONAL CHAT REALTIME
========================================================= */

function subscribeMessages(person) {

  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages = null;

  }


  const chatId =
    makeChatId(
      currentStudent.id,
      person.id
    );


  const q =
    query(
      collection(db, "messages"),
      where(
        "chatId",
        "==",
        chatId
      ),
      orderBy(
        "createdAt",
        "asc"
      )
    );


  unsubscribeMessages =
    onSnapshot(
      q,
      snapshot => {

        const messages =
          snapshot.docs.map(
            docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
            })
          );


        renderMessages(messages);

        markMessagesDelivered(person);

      },

      error => {

        console.error(
          "Messages realtime error:",
          error
        );

        showToast(
          "Chat realtime connection में समस्या हुई।",
          "error"
        );

      }
    );
}


/* =========================================================
   RENDER PERSONAL MESSAGES
========================================================= */

function renderMessages(messages) {

  const container =
    $("chatMessages");

  if (!container) return;


  if (!messages.length) {

    container.innerHTML =
      `<div class="empty-chat">

        <div class="empty-chat-icon">
          💬
        </div>

        <h3>
          Chat शुरू करें
        </h3>

        <p>
          पहला message भेजें।
        </p>

      </div>`;

    return;
  }


  let lastDate = "";

  const html = [];


  messages.forEach(message => {

    const date =
      formatDate(
        message.createdAt
      );


    if (date !== lastDate) {

      html.push(`
        <div class="date-separator">
          ${escapeHTML(date)}
        </div>
      `);

      lastDate = date;
    }


    const own =
      message.senderId ===
      currentStudent?.id;


    let ticks = "";

    if (own) {

      if (message.seen === true) {

        ticks = `
          <span class="message-ticks seen">
            ✓✓
          </span>
        `;

      } else if (
        message.delivered === true
      ) {

        ticks = `
          <span class="message-ticks">
            ✓✓
          </span>
        `;

      } else {

        ticks = `
          <span class="message-ticks">
            ✓
          </span>
        `;

      }

    }


    html.push(`
      <div
        class="chat-message ${
          own
            ? "message-sent"
            : "message-received"
        }"
      >

        <div class="message-bubble">

          <div class="message-text">
            ${escapeHTML(message.text || "")}
          </div>

          <div class="message-meta">

            <span>
              ${escapeHTML(
                formatTime(message.createdAt)
              )}
            </span>

            ${ticks}

          </div>

        </div>

      </div>
    `);

  });


  container.innerHTML =
    html.join("");


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   TIMESTAMP HELPERS
========================================================= */

function getMillis(timestamp) {

  if (!timestamp) {
    return Date.now();
  }

  if (
    typeof timestamp.toMillis ===
    "function"
  ) {
    return timestamp.toMillis();
  }

  if (
    timestamp.seconds !== undefined
  ) {
    return (
      timestamp.seconds * 1000 +
      Math.floor(
        (timestamp.nanoseconds || 0) / 1000000
      )
    );
  }

  if (
    timestamp instanceof Date
  ) {
    return timestamp.getTime();
  }

  const parsed =
    new Date(timestamp).getTime();

  return Number.isNaN(parsed)
    ? Date.now()
    : parsed;
}


function convertTimestamp(timestamp) {

  return new Date(
    getMillis(timestamp)
  );
}


function formatTime(timestamp) {

  const date =
    convertTimestamp(timestamp);

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function formatDate(timestamp) {

  const date =
    convertTimestamp(timestamp);

  const now =
    new Date();

  const sameDay =
    date.toDateString() ===
    now.toDateString();


  if (sameDay) {
    return "Today / आज";
  }


  const yesterday =
    new Date(now);

  yesterday.setDate(
    yesterday.getDate() - 1
  );


  if (
    date.toDateString() ===
    yesterday.toDateString()
  ) {
    return "Yesterday / कल";
  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


/* =========================================================
   MARK DELIVERED
========================================================= */

async function markMessagesDelivered(
  person
) {

  if (!currentStudent || !person) {
    return;
  }


  try {

    const chatId =
      makeChatId(
        currentStudent.id,
        person.id
      );


    const q =
      query(
        collection(db, "messages"),
        where(
          "chatId",
          "==",
          chatId
        ),
        where(
          "receiverId",
          "==",
          currentStudent.id
        )
      );


    const snapshot =
      await getDocs(q);


    const updates =
      snapshot.docs.filter(
        docSnap =>
          docSnap.data().delivered !== true
      );


    for (const messageDoc of updates) {

      await updateDoc(
        messageDoc.ref,
        {
          delivered: true
        }
      );

    }

  } catch (error) {

    console.error(
      "Delivered update error:",
      error
    );

  }
}


/* =========================================================
   MARK SEEN
========================================================= */

async function markMessagesSeen(
  person
) {

  if (!currentStudent || !person) {
    return;
  }


  try {

    const chatId =
      makeChatId(
        currentStudent.id,
        person.id
      );


    const q =
      query(
        collection(db, "messages"),
        where(
          "chatId",
          "==",
          chatId
        ),
        where(
          "receiverId",
          "==",
          currentStudent.id
        )
      );


    const snapshot =
      await getDocs(q);


    for (const messageDoc of snapshot.docs) {

      const data =
        messageDoc.data();

      if (data.seen !== true) {

        await updateDoc(
          messageDoc.ref,
          {
            delivered: true,
            seen: true
          }
        );

      }

    }

  } catch (error) {

    console.error(
      "Seen update error:",
      error
    );

  }
}


/* =========================================================
   PERSONAL CHAT MESSAGE LIMIT
========================================================= */

async function getChatUsage() {

  if (!currentStudent) {
    return {
      count: 0,
      start: Date.now()
    };
  }


  const ref =
    doc(
      db,
      "chatUsage",
      currentStudent.id
    );


  const snapshot =
    await getDoc(ref);


  if (!snapshot.exists()) {

    return {
      count: 0,
      start: Date.now()
    };

  }


  const data =
    snapshot.data();


  const start =
    getMillis(data.windowStart);


  if (
    Date.now() -
    start >=
    24 * 60 * 60 * 1000
  ) {

    return {
      count: 0,
      start: Date.now()
    };

  }


  return {
    count: Number(data.count || 0),
    start
  };
}


/* =========================================================
   SEND PERSONAL MESSAGE
========================================================= */

async function sendMessage() {

  if (
    !currentStudent ||
    !currentChatUser
  ) {
    return;
  }


  if (!canUse("chat")) {

    showToast(
      "Chat की permission नहीं है।",
      "warning"
    );

    return;
  }


  const input =
    $("chatInput");

  if (!input) return;


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  /* 2 messages / 24 hours */

  try {

    const usage =
      await getChatUsage();


    if (
      usage.count >= CHAT_LIMIT
    ) {

      showToast(
        "आपकी 24-hour chat limit पूरी हो गई है।",
        "warning"
      );

      return;
    }


    const chatId =
      makeChatId(
        currentStudent.id,
        currentChatUser.id
      );


    await addDoc(
      collection(db, "messages"),
      {

        chatId,

        senderId:
          currentStudent.id,

        senderName:
          currentStudent.name,

        receiverId:
          currentChatUser.id,

        receiverName:
          currentChatUser.name,

        text: message,

        delivered: false,

        seen: false,

        createdAt:
          serverTimestamp()

      }
    );


    const usageRef =
      doc(
        db,
        "chatUsage",
        currentStudent.id
      );


    if (
      usage.count === 0
    ) {

      await setDoc(
        usageRef,
        {
          count: 1,
          windowStart:
            serverTimestamp()
        },
        {
          merge: true
        }
      );

    } else {

      await setDoc(
        usageRef,
        {
          count:
            usage.count + 1
        },
        {
          merge: true
        }
      );

    }


    input.value = "";

  } catch (error) {

    console.error(
      "Send message error:",
      error
    );

    showToast(
      "Message send नहीं हो पाया।",
      "error"
    );
  }
}


/* =========================================================
   CHAT COMPOSER
========================================================= */

function setupChatComposer() {

  const send =
    $("sendMessageBtn");

  const input =
    $("chatInput");


  if (send) {

    send.addEventListener(
      "click",
      sendMessage
    );

  }


  if (input) {

    input.addEventListener(
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

  }


  const back =
    $("chatBackBtn");

  if (back) {

    back.addEventListener(
      "click",
      closeChat
    );

  }


  const groupBack =
    $("groupChatBackBtn");

  if (groupBack) {

    groupBack.addEventListener(
      "click",
      closeGroupChat
    );

  }


  const groupSend =
    $("groupSendMessageBtn");

  const groupInput =
    $("groupChatInput");


  if (groupSend) {

    groupSend.addEventListener(
      "click",
      sendGroupMessage
    );

  }


  if (groupInput) {

    groupInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendGroupMessage();

        }

      }
    );

  }

}


/* =========================================================
   SEND GROUP MESSAGE
========================================================= */

async function sendGroupMessage() {

  if (
    !currentStudent ||
    !currentGroup
  ) {
    return;
  }


  const input =
    $("groupChatInput");

  if (!input) return;


  const message =
    input.value.trim();


  if (!message) return;


  if (
    !currentGroup.memberIds.includes(
      currentStudent.id
    )
  ) {

    showToast(
      "आप इस group के member नहीं हैं।",
      "error"
    );

    return;
  }


  try {

    await addDoc(
      collection(db, "groupMessages"),
      {

        groupId:
          currentGroup.id,

        chatId:
          makeGroupChatId(
            currentGroup.id
          ),

        senderId:
          currentStudent.id,

        senderName:
          currentStudent.name,

        text: message,

        createdAt:
          serverTimestamp()

      }
    );


    input.value = "";

  } catch (error) {

    console.error(
      "Group message error:",
      error
    );

    showToast(
      "Group message send नहीं हो पाया।",
      "error"
    );
  }
}


/* =========================================================
   EMOJI BUTTON
========================================================= */

function setupEmojiButtons() {

  const emoji =
    $("emojiBtn");

  if (emoji) {

    emoji.addEventListener(
      "click",
      () => {

        const input =
          $("chatInput");

        if (!input) return;

        input.value += " 😊";

        input.focus();

      }
    );

  }


  const groupEmoji =
    $("groupEmojiBtn");

  if (groupEmoji) {

    groupEmoji.addEventListener(
      "click",
      () => {

        const input =
          $("groupChatInput");

        if (!input) return;

        input.value += " 😊";

        input.focus();

      }
    );

  }
}


/* =========================================================
   SETTINGS PAGE
========================================================= */

function loadSettingsPage() {

  const language =
    $("languageSelect");

  const theme =
    $("themeSelect");


  if (language) {
    language.value =
      globalSettings.language || "en";
  }


  if (theme) {
    theme.value =
      globalSettings.theme || "system";
  }


  const welcome =
    $("welcomeAnimationToggle");

  if (welcome) {

    welcome.checked =
      globalSettings.welcomeAnimation !== false;

  }
}


/* =========================================================
   END OF PART 1
========================================================= */

/* =========================================================
   STUDYCONNECT — SCRIPT.JS
   PART 2 / 2
   Homework + Notes + School + Owner Panel + Settings
   + All Button Handlers + Logout + Initialization
========================================================= */


/* =========================================================
   HOMEWORK SUBJECTS
========================================================= */

const HOMEWORK_SUBJECTS = [
  "Hindi",
  "English",
  "Maths",
  "Science",
  "SST",
  "GK",
  "Computer",
  "Art",
  "Other",
  "Activity Period",
  "English Grammar",
  "Hindi Grammar"
];


/* =========================================================
   GENERIC FIRESTORE HELPERS
========================================================= */

async function getCollectionData(
  collectionName,
  limitCount = 50
) {

  try {

    const q = query(
      collection(db, collectionName),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

  } catch (error) {

    console.error(
      `Loading ${collectionName} failed:`,
      error
    );

    return [];
  }
}


/* =========================================================
   HOMEWORK — STUDENT
========================================================= */

async function loadHomework() {

  const container =
    $("homeworkList");

  if (!container) return;

  container.innerHTML = `
    <div class="loading-card">
      Homework loading...
    </div>
  `;

  try {

    const items =
      await getCollectionData(
        "homework",
        100
      );


    const published =
      items.filter(
        item =>
          item.published !== false
      );


    if (!published.length) {

      container.innerHTML = `
        <div class="empty-card">
          अभी कोई homework नहीं है।
        </div>
      `;

      return;
    }


    container.innerHTML =
      published.map(item => {

        const subject =
          item.subject || "Other";

        return `
          <article class="homework-card">

            <div class="homework-card-top">

              <span class="homework-subject">
                ${escapeHTML(subject)}
              </span>

              <span class="homework-date">
                ${escapeHTML(
                  item.date || formatDate(item.createdAt)
                )}
              </span>

            </div>

            <h3>
              ${escapeHTML(
                item.title ||
                item.chapter ||
                subject
              )}
            </h3>

            ${
              item.chapter
                ? `
                  <p class="homework-chapter">
                    Chapter:
                    ${escapeHTML(item.chapter)}
                  </p>
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
        `;

      }).join("");

  } catch (error) {

    console.error(
      "Homework error:",
      error
    );

    container.innerHTML = `
      <div class="empty-card">
        Homework load नहीं हो पाया।
      </div>
    `;
  }
}


/* =========================================================
   ADD HOMEWORK MODAL
========================================================= */

function openAddHomeworkModal() {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    showToast(
      "यह option सिर्फ Owner के लिए है।",
      "warning"
    );
    return;
  }


  const subjectOptions =
    HOMEWORK_SUBJECTS.map(
      subject => `
        <option value="${escapeHTML(subject)}">
          ${escapeHTML(subject)}
        </option>
      `
    ).join("");


  openModal(
    "Add Homework",
    `
      <form id="dynamicHomeworkForm">

        <div class="form-group">
          <label>Date</label>
          <input
            id="dynamicHomeworkDate"
            type="date"
            required
          >
        </div>

        <div class="form-group">
          <label>Subject</label>

          <select
            id="dynamicHomeworkSubject"
            required
          >
            <option value="">
              Select Subject
            </option>

            ${subjectOptions}

          </select>
        </div>

        <div class="form-group">
          <label>Chapter</label>

          <input
            id="dynamicHomeworkChapter"
            type="text"
            placeholder="Chapter name"
          >
        </div>

        <div class="form-group">
          <label>Title</label>

          <input
            id="dynamicHomeworkTitle"
            type="text"
            placeholder="Homework title"
            required
          >
        </div>

        <div class="form-group">
          <label>Description</label>

          <textarea
            id="dynamicHomeworkDescription"
            rows="5"
            placeholder="Homework details"
            required
          ></textarea>
        </div>

        <button
          type="submit"
          class="primary-btn save-homework-btn"
        >
          💾 Save Homework
        </button>

      </form>
    `
  );


  const form =
    $("dynamicHomeworkForm");

  if (form) {

    form.addEventListener(
      "submit",
      saveHomework
    );

  }
}


/* =========================================================
   SAVE HOMEWORK
========================================================= */

async function saveHomework(event) {

  event.preventDefault();


  const date =
    $("dynamicHomeworkDate")?.value;

  const subject =
    $("dynamicHomeworkSubject")?.value;

  const chapter =
    $("dynamicHomeworkChapter")?.value.trim();

  const title =
    $("dynamicHomeworkTitle")?.value.trim();

  const description =
    $("dynamicHomeworkDescription")?.value.trim();


  if (!date || !subject || !title || !description) {

    showToast(
      "Date, Subject, Title और Description भरें।",
      "error"
    );

    return;
  }


  try {

    await addDoc(
      collection(db, "homework"),
      {

        date,
        subject,
        chapter,
        title,
        description,

        published: true,

        createdBy:
          currentStudent.id,

        createdByName:
          currentStudent.name,

        createdAt:
          serverTimestamp()

      }
    );


    closeModal();

    showToast(
      "Homework successfully add हो गया।"
    );


    await loadHomework();

    await loadOwnerContent();

  } catch (error) {

    console.error(
      "Save homework error:",
      error
    );

    showToast(
      "Homework save नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   NOTES
========================================================= */

async function loadNotes() {

  const container =
    $("notesList");

  if (!container) return;


  container.innerHTML = `
    <div class="loading-card">
      Notes loading...
    </div>
  `;


  try {

    const items =
      await getCollectionData(
        "notes",
        100
      );


    const published =
      items.filter(
        item =>
          item.published !== false
      );


    if (!published.length) {

      container.innerHTML = `
        <div class="empty-card">
          अभी कोई notes नहीं हैं।
        </div>
      `;

      return;
    }


    container.innerHTML =
      published.map(item => {

        return `
          <article class="note-card">

            <div class="note-card-top">

              <span>
                ${escapeHTML(
                  item.subject || "Notes"
                )}
              </span>

              ${
                item.chapter
                  ? `
                    <small>
                      ${escapeHTML(item.chapter)}
                    </small>
                  `
                  : ""
              }

            </div>

            <h3>
              ${escapeHTML(
                item.title || "Note"
              )}
            </h3>

            <p>
              ${escapeHTML(
                item.content ||
                item.text ||
                ""
              )}
            </p>

          </article>
        `;

      }).join("");

  } catch (error) {

    console.error(
      "Notes error:",
      error
    );

    container.innerHTML = `
      <div class="empty-card">
        Notes load नहीं हो सके।
      </div>
    `;
  }
}


/* =========================================================
   ADD NOTE
========================================================= */

function openAddNoteModal() {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    showToast(
      "यह option सिर्फ Owner के लिए है।",
      "warning"
    );
    return;
  }


  const options =
    HOMEWORK_SUBJECTS.map(
      subject => `
        <option value="${escapeHTML(subject)}">
          ${escapeHTML(subject)}
        </option>
      `
    ).join("");


  openModal(
    "Add Note",
    `
      <form id="dynamicNoteForm">

        <div class="form-group">

          <label>Subject</label>

          <select
            id="dynamicNoteSubject"
            required
          >
            <option value="">
              Select Subject
            </option>

            ${options}

          </select>

        </div>


        <div class="form-group">

          <label>Chapter</label>

          <input
            id="dynamicNoteChapter"
            type="text"
            placeholder="Chapter"
          >

        </div>


        <div class="form-group">

          <label>Title</label>

          <input
            id="dynamicNoteTitle"
            type="text"
            placeholder="Note title"
            required
          >

        </div>


        <div class="form-group">

          <label>Content</label>

          <textarea
            id="dynamicNoteContent"
            rows="7"
            placeholder="Write note..."
            required
          ></textarea>

        </div>


        <button
          type="submit"
          class="primary-btn"
        >
          💾 Save Note
        </button>

      </form>
    `
  );


  $("dynamicNoteForm")
    ?.addEventListener(
      "submit",
      saveNote
    );
}


async function saveNote(event) {

  event.preventDefault();


  const subject =
    $("dynamicNoteSubject")?.value;

  const chapter =
    $("dynamicNoteChapter")?.value.trim();

  const title =
    $("dynamicNoteTitle")?.value.trim();

  const content =
    $("dynamicNoteContent")?.value.trim();


  if (!subject || !title || !content) {

    showToast(
      "Subject, Title और Content भरें।",
      "error"
    );

    return;
  }


  try {

    await addDoc(
      collection(db, "notes"),
      {

        subject,
        chapter,
        title,
        content,

        published: true,

        createdBy:
          currentStudent.id,

        createdByName:
          currentStudent.name,

        createdAt:
          serverTimestamp()

      }
    );


    closeModal();

    showToast(
      "Note successfully add हो गया।"
    );


    await loadNotes();
    await loadOwnerContent();

  } catch (error) {

    console.error(
      "Save note error:",
      error
    );

    showToast(
      "Note save नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   SCHOOL UPDATES
========================================================= */

async function loadSchool() {

  const container =
    $("schoolUpdatesList");

  if (!container) return;


  container.innerHTML = `
    <div class="loading-card">
      School updates loading...
    </div>
  `;


  try {

    const items =
      await getCollectionData(
        "school",
        100
      );


    const published =
      items.filter(
        item =>
          item.published !== false
      );


    if (!published.length) {

      container.innerHTML = `
        <div class="empty-card">
          अभी कोई school update नहीं है।
        </div>
      `;

      return;
    }


    container.innerHTML =
      published.map(item => {

        return `
          <article class="announcement-card">

            <h3>
              ${escapeHTML(
                item.title ||
                "School Update"
              )}
            </h3>

            <p>
              ${escapeHTML(
                item.text ||
                item.description ||
                ""
              )}
            </p>

            <small>
              ${escapeHTML(
                formatDate(item.createdAt)
              )}
            </small>

          </article>
        `;

      }).join("");

  } catch (error) {

    console.error(
      "School update error:",
      error
    );

    container.innerHTML = `
      <div class="empty-card">
        School updates load नहीं हो सके।
      </div>
    `;
  }
}


/* =========================================================
   ADD SCHOOL ANNOUNCEMENT
========================================================= */

function openAddAnnouncementModal() {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    showToast(
      "यह option सिर्फ Owner के लिए है।",
      "warning"
    );
    return;
  }


  openModal(
    "Add School Update",
    `
      <form id="dynamicAnnouncementForm">

        <div class="form-group">

          <label>Title</label>

          <input
            id="dynamicAnnouncementTitle"
            type="text"
            placeholder="Announcement title"
            required
          >

        </div>


        <div class="form-group">

          <label>Message</label>

          <textarea
            id="dynamicAnnouncementText"
            rows="7"
            placeholder="Write school update..."
            required
          ></textarea>

        </div>


        <button
          type="submit"
          class="primary-btn"
        >
          📢 Publish Update
        </button>

      </form>
    `
  );


  $("dynamicAnnouncementForm")
    ?.addEventListener(
      "submit",
      saveAnnouncement
    );
}


async function saveAnnouncement(event) {

  event.preventDefault();


  const title =
    $("dynamicAnnouncementTitle")
      ?.value.trim();

  const message =
    $("dynamicAnnouncementText")
      ?.value.trim();


  if (!title || !message) {

    showToast(
      "Title और message भरें।",
      "error"
    );

    return;
  }


  try {

    await addDoc(
      collection(db, "school"),
      {

        title,
        text: message,

        published: true,

        createdBy:
          currentStudent.id,

        createdByName:
          currentStudent.name,

        createdAt:
          serverTimestamp()

      }
    );


    closeModal();

    showToast(
      "School update publish हो गया।"
    );


    await loadSchool();
    await loadHome();
    await loadOwnerContent();

  } catch (error) {

    console.error(
      "Announcement error:",
      error
    );

    showToast(
      "School update save नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   OWNER PANEL
========================================================= */

async function loadOwnerPanel() {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    return;
  }


  await loadOwnerDashboard();
  await loadOwnerStudents();
  await loadOwnerApprovals();
  await loadOwnerGroups();
  await loadOwnerContent();
  loadOwnerAppearance();
  loadOwnerFeatures();
  loadOwnerSecurity();

}


/* =========================================================
   OWNER DASHBOARD
========================================================= */

async function loadOwnerDashboard() {

  const studentCount =
    $("ownerStudentCount");

  const messageCount =
    $("ownerMessageCount");

  const groupCount =
    $("ownerGroupCount");

  const homeworkCount =
    $("ownerHomeworkCount");


  try {

    const [
      students,
      messages,
      groups,
      homework
    ] = await Promise.all([

      getDocs(
        collection(db, "students")
      ),

      getDocs(
        collection(db, "messages")
      ),

      getDocs(
        collection(db, "groups")
      ),

      getDocs(
        collection(db, "homework")
      )

    ]);


    text(
      studentCount,
      students.size
    );

    text(
      messageCount,
      messages.size
    );

    text(
      groupCount,
      groups.size
    );

    text(
      homeworkCount,
      homework.size
    );


  } catch (error) {

    console.error(
      "Owner dashboard error:",
      error
    );

  }
}


/* =========================================================
   OWNER — STUDENTS
========================================================= */

async function loadOwnerStudents() {

  const container =
    $("ownerPeopleList");

  if (!container) return;


  container.innerHTML = `
    <div class="loading-card">
      Students loading...
    </div>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(db, "students")
      );


    studentsCache =
      snapshot.docs.map(
        docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })
      );


    renderOwnerStudents(
      studentsCache
    );

  } catch (error) {

    console.error(
      "Owner students error:",
      error
    );

    container.innerHTML = `
      <div class="empty-card">
        Students load नहीं हुए।
      </div>
    `;
  }
}


function permissionLabel(student) {

  const permission =
    effectivePermission(student);

  const labels = {

    owner: "👑 Owner",

    allow: "🟢 Allow",

    full: "🟢 Full",

    normal: "🟡 Normal",

    restricted: "🔴 Restricted"

  };

  return labels[permission] ||
    "🔴 Restricted";
}


function renderOwnerStudents(students) {

  const container =
    $("ownerPeopleList");

  if (!container) return;


  if (!students.length) {

    container.innerHTML = `
      <div class="empty-card">
        अभी कोई student registered नहीं है।
      </div>
    `;

    return;
  }


  container.innerHTML =
    students.map(student => {

      return `
        <div
          class="owner-person-card"
          data-owner-student="${escapeHTML(student.id)}"
        >

          <div class="owner-person-main">

            <div class="chat-person-avatar">
              ${escapeHTML(
                (student.name || "S")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div>

              <strong>
                ${escapeHTML(
                  student.name || "Student"
                )}
              </strong>

              <small>
                ${escapeHTML(
                  student.phone || ""
                )}
              </small>

              <small>
                ${escapeHTML(
                  permissionLabel(student)
                )}
              </small>

            </div>

          </div>

          <button
            type="button"
            class="secondary-btn"
            data-student-details="${escapeHTML(student.id)}"
          >
            Manage
          </button>

        </div>
      `;

    }).join("");


  qsa(
    "[data-student-details]",
    container
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const student =
          students.find(
            item =>
              item.id ===
              button.dataset.studentDetails
          );

        if (student) {
          showOwnerStudentDetails(student);
        }

      }
    );

  });
}


/* =========================================================
   OWNER STUDENT DETAILS
========================================================= */

function showOwnerStudentDetails(student) {

  const details =
    $("ownerPersonDetails");

  if (!details) return;


  details.innerHTML = `
    <div class="owner-details-card">

      <h3>
        ${escapeHTML(
          student.name || "Student"
        )}
      </h3>

      <p>
        📱 ${escapeHTML(
          student.phone || ""
        )}
      </p>

      <p>
        Status:
        ${escapeHTML(
          student.status || "unknown"
        )}
      </p>

      <p>
        Permission:
        ${escapeHTML(
          permissionLabel(student)
        )}
      </p>

      ${
        student.permissionExpiresAt
          ? `
            <p>
              Permission:
              ${permissionExpired(student)
                ? "Expired"
                : "Active"}
            </p>
          `
          : ""
      }

      <div class="owner-action-grid">

        <button
          type="button"
          class="primary-btn"
          data-permission-action="allow"
          data-student-id="${escapeHTML(student.id)}"
        >
          🟢 Allow 24h
        </button>

        <button
          type="button"
          class="secondary-btn"
          data-permission-action="normal"
          data-student-id="${escapeHTML(student.id)}"
        >
          🟡 Normal 24h
        </button>

        <button
          type="button"
          class="secondary-btn"
          data-permission-action="restricted"
          data-student-id="${escapeHTML(student.id)}"
        >
          🔴 Restricted
        </button>

        <button
          type="button"
          class="danger-btn"
          data-permission-action="block"
          data-student-id="${escapeHTML(student.id)}"
        >
          ⛔ Block
        </button>

        <button
          type="button"
          class="secondary-btn"
          data-permission-action="unblock"
          data-student-id="${escapeHTML(student.id)}"
        >
          🔓 Unblock
        </button>

        <button
          type="button"
          class="danger-btn"
          data-permission-action="remove"
          data-student-id="${escapeHTML(student.id)}"
        >
          🗑 Remove
        </button>

      </div>

    </div>
  `;


  qsa(
    "[data-permission-action]",
    details
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        manageStudentPermission(
          button.dataset.studentId,
          button.dataset.permissionAction
        );

      }
    );

  });
}


/* =========================================================
   OWNER — PERMISSIONS
========================================================= */

async function manageStudentPermission(
  studentId,
  action
) {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    return;
  }


  if (!studentId) return;


  const studentRef =
    doc(
      db,
      "students",
      studentId
    );


  try {

    if (action === "remove") {

      const confirmRemove =
        confirm(
          "क्या आप इस student को permanently remove करना चाहते हैं?"
        );

      if (!confirmRemove) {
        return;
      }

      await deleteDoc(studentRef);

      showToast(
        "Student remove हो गया।"
      );

    } else if (action === "block") {

      await updateDoc(
        studentRef,
        {
          status: "blocked",
          permission: "restricted",
          permissionExpiresAt: null
        }
      );

      showToast(
        "Student blocked."
      );

    } else if (action === "unblock") {

      await updateDoc(
        studentRef,
        {
          status: "approved",
          permission: "restricted",
          permissionExpiresAt:
            new Date(
              Date.now() +
              PERMISSION_HOURS *
              60 *
              60 *
              1000
            )
        }
      );

      showToast(
        "Student unblocked."
      );

    } else if (
      action === "allow" ||
      action === "normal" ||
      action === "restricted"
    ) {

      await updateDoc(
        studentRef,
        {

          status: "approved",

          permission:
            action,

          permissionExpiresAt:
            new Date(
              Date.now() +
              PERMISSION_HOURS *
              60 *
              60 *
              1000
            )

        }
      );


      showToast(
        `${action} permission 24 hours के लिए set हो गई।`
      );

    }


    await loadOwnerStudents();
    await loadOwnerDashboard();


    const updated =
      studentsCache.find(
        student =>
          student.id === studentId
      );


    if (updated) {
      showOwnerStudentDetails(updated);
    }

  } catch (error) {

    console.error(
      "Permission error:",
      error
    );

    showToast(
      "Permission update नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   OWNER — APPROVALS
========================================================= */

async function loadOwnerApprovals() {

  const container =
    $("ownerApprovalList");

  if (!container) return;


  try {

    const q =
      query(
        collection(db, "students"),
        where(
          "status",
          "==",
          "pending"
        )
      );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      container.innerHTML = `
        <div class="empty-card">
          कोई pending approval नहीं है।
        </div>
      `;

      return;
    }


    container.innerHTML =
      snapshot.docs.map(
        docSnap => {

          const student =
            {
              id: docSnap.id,
              ...docSnap.data()
            };


          return `
            <div class="approval-card">

              <div>

                <strong>
                  ${escapeHTML(
                    student.name || "Student"
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    student.phone || ""
                  )}
                </small>

              </div>


              <div class="owner-action-grid">

                <button
                  type="button"
                  class="primary-btn"
                  data-approve="${escapeHTML(student.id)}"
                >
                  ✓ Approve
                </button>

                <button
                  type="button"
                  class="danger-btn"
                  data-reject="${escapeHTML(student.id)}"
                >
                  ✕ Reject
                </button>

              </div>

            </div>
          `;

        }
      ).join("");


    qsa(
      "[data-approve]",
      container
    ).forEach(button => {

      button.addEventListener(
        "click",
        () =>
          approveStudent(
            button.dataset.approve
          )
      );

    });


    qsa(
      "[data-reject]",
      container
    ).forEach(button => {

      button.addEventListener(
        "click",
        () =>
          rejectStudent(
            button.dataset.reject
          )
      );

    });

  } catch (error) {

    console.error(
      "Approval error:",
      error
    );

  }
}


/* =========================================================
   APPROVE STUDENT
========================================================= */

async function approveStudent(studentId) {

  try {

    await updateDoc(
      doc(db, "students", studentId),
      {

        status: "approved",

        permission: "normal",

        permissionExpiresAt:
          new Date(
            Date.now() +
            PERMISSION_HOURS *
            60 *
            60 *
            1000
          ),

        approvedAt:
          serverTimestamp(),

        approvedBy:
          OWNER_NAME

      }
    );


    showToast(
      "Student approved."
    );


    await loadOwnerApprovals();
    await loadOwnerStudents();
    await loadOwnerDashboard();

  } catch (error) {

    console.error(
      "Approve error:",
      error
    );

    showToast(
      "Approve नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   REJECT STUDENT
========================================================= */

async function rejectStudent(studentId) {

  try {

    await updateDoc(
      doc(db, "students", studentId),
      {

        status: "rejected",

        permission:
          "restricted",

        rejectedAt:
          serverTimestamp(),

        rejectedBy:
          OWNER_NAME

      }
    );


    showToast(
      "Student rejected."
    );


    await loadOwnerApprovals();

  } catch (error) {

    console.error(
      "Reject error:",
      error
    );

    showToast(
      "Reject नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   OWNER — GROUPS
========================================================= */

async function loadOwnerGroups() {

  const container =
    $("ownerGroupsList");

  if (!container) return;


  try {

    const snapshot =
      await getDocs(
        collection(db, "groups")
      );


    if (snapshot.empty) {

      container.innerHTML = `
        <div class="empty-card">
          अभी कोई group नहीं है।
        </div>
      `;

      return;
    }


    const groups =
      snapshot.docs.map(
        docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })
      );


    container.innerHTML =
      groups.map(group => {

        return `
          <div class="owner-group-card">

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
                ${
                  Array.isArray(group.memberIds)
                    ? group.memberIds.length
                    : 0
                }
              </small>

              <small>
                ${
                  group.active === false
                    ? "⛔ Disabled"
                    : "🟢 Active"
                }
              </small>

            </div>


            <button
              type="button"
              class="${
                group.active === false
                  ? "primary-btn"
                  : "danger-btn"
              }"
              data-toggle-group="${escapeHTML(group.id)}"
              data-group-active="${
                group.active === false
                  ? "false"
                  : "true"
              }"
            >
              ${
                group.active === false
                  ? "Enable"
                  : "Disable"
              }
            </button>

          </div>
        `;

      }).join("");


    qsa(
      "[data-toggle-group]",
      container
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          toggleGroupStatus(
            button.dataset.toggleGroup,
            button.dataset.groupActive !== "false"
          );

        }
      );

    });

  } catch (error) {

    console.error(
      "Owner groups error:",
      error
    );

  }
}


/* =========================================================
   TOGGLE GROUP
========================================================= */

async function toggleGroupStatus(
  groupId,
  currentlyActive
) {

  try {

    await updateDoc(
      doc(db, "groups", groupId),
      {
        active: !currentlyActive
      }
    );


    showToast(
      currentlyActive
        ? "Group disabled."
        : "Group enabled."
    );


    await loadOwnerGroups();
    await loadGroups();

  } catch (error) {

    console.error(
      "Group status error:",
      error
    );

    showToast(
      "Group status update नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   OWNER — CONTENT
========================================================= */

async function loadOwnerContent() {

  await loadOwnerHomework();
  await loadOwnerNotes();
  await loadOwnerAnnouncements();

}


async function loadOwnerHomework() {

  const container =
    $("ownerHomeworkList");

  if (!container) return;


  const items =
    await getCollectionData(
      "homework",
      100
    );


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-card">
        कोई homework नहीं है।
      </div>
    `;

    return;
  }


  container.innerHTML =
    items.map(item => {

      return `
        <div class="owner-content-row">

          <div>

            <strong>
              ${escapeHTML(
                item.title ||
                item.subject ||
                "Homework"
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
            class="danger-btn"
            data-delete-homework="${escapeHTML(item.id)}"
          >
            🗑 Delete
          </button>

        </div>
      `;

    }).join("");


  qsa(
    "[data-delete-homework]",
    container
  ).forEach(button => {

    button.addEventListener(
      "click",
      () =>
        deleteContent(
          "homework",
          button.dataset.deleteHomework
        )
    );

  });
}


async function loadOwnerNotes() {

  const container =
    $("ownerNotesList");

  if (!container) return;


  const items =
    await getCollectionData(
      "notes",
      100
    );


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-card">
        कोई notes नहीं हैं।
      </div>
    `;

    return;
  }


  container.innerHTML =
    items.map(item => {

      return `
        <div class="owner-content-row">

          <div>

            <strong>
              ${escapeHTML(
                item.title || "Note"
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
            class="danger-btn"
            data-delete-note="${escapeHTML(item.id)}"
          >
            🗑 Delete
          </button>

        </div>
      `;

    }).join("");


  qsa(
    "[data-delete-note]",
    container
  ).forEach(button => {

    button.addEventListener(
      "click",
      () =>
        deleteContent(
          "notes",
          button.dataset.deleteNote
        )
    );

  });
}


async function loadOwnerAnnouncements() {

  const container =
    $("ownerAnnouncementsList");

  if (!container) return;


  const items =
    await getCollectionData(
      "school",
      100
    );


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-card">
        कोई school update नहीं है।
      </div>
    `;

    return;
  }


  container.innerHTML =
    items.map(item => {

      return `
        <div class="owner-content-row">

          <div>

            <strong>
              ${escapeHTML(
                item.title ||
                "School Update"
              )}
            </strong>

            <small>
              ${escapeHTML(
                item.text || ""
              )}
            </small>

          </div>


          <button
            type="button"
            class="danger-btn"
            data-delete-announcement="${escapeHTML(item.id)}"
          >
            🗑 Delete
          </button>

        </div>
      `;

    }).join("");


  qsa(
    "[data-delete-announcement]",
    container
  ).forEach(button => {

    button.addEventListener(
      "click",
      () =>
        deleteContent(
          "school",
          button.dataset.deleteAnnouncement
        )
    );

  });
}


/* =========================================================
   DELETE CONTENT
========================================================= */

async function deleteContent(
  collectionName,
  id
) {

  const okay =
    confirm(
      "क्या आप इसे delete करना चाहते हैं?"
    );


  if (!okay) return;


  try {

    await deleteDoc(
      doc(
        db,
        collectionName,
        id
      )
    );


    showToast(
      "Delete successfully हो गया।"
    );


    await loadOwnerContent();


    if (collectionName === "homework") {
      await loadHomework();
    }

    if (collectionName === "notes") {
      await loadNotes();
    }

    if (collectionName === "school") {
      await loadSchool();
      await loadHome();
    }


  } catch (error) {

    console.error(
      "Delete content error:",
      error
    );

    showToast(
      "Delete नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   OWNER — APPEARANCE
========================================================= */

function loadOwnerAppearance() {

  const appName =
    $("globalAppName");

  const language =
    $("globalLanguage");

  const theme =
    $("globalTheme");

  const welcome =
    $("globalWelcomeAnimation");


  if (appName) {
    appName.value =
      globalSettings.appName ||
      "StudyConnect";
  }


  if (language) {
    language.value =
      globalSettings.language ||
      "en";
  }


  if (theme) {
    theme.value =
      globalSettings.theme ||
      "system";
  }


  if (welcome) {
    welcome.checked =
      globalSettings.welcomeAnimation !== false;
  }
}


/* =========================================================
   SAVE GLOBAL SETTINGS
========================================================= */

async function saveGlobalSettings() {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    return;
  }


  const appName =
    $("globalAppName")
      ?.value.trim() ||
    "StudyConnect";

  const language =
    $("globalLanguage")
      ?.value ||
    "en";

  const theme =
    $("globalTheme")
      ?.value ||
    "system";

  const welcome =
    $("globalWelcomeAnimation")
      ?.checked !== false;


  try {

    await setDoc(
      doc(db, "appSettings", "main"),
      {

        appName,

        language,

        theme,

        welcomeAnimation:
          welcome,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          OWNER_NAME

      },
      {
        merge: true
      }
    );


    globalSettings = {

      ...globalSettings,

      appName,
      language,
      theme,

      welcomeAnimation:
        welcome

    };


    applySettings();

    showToast(
      "Global settings save हो गईं।"
    );

  } catch (error) {

    console.error(
      "Global settings error:",
      error
    );

    showToast(
      "Settings save नहीं हुईं।",
      "error"
    );
  }
}


/* =========================================================
   OWNER — FEATURES
========================================================= */

function loadOwnerFeatures() {

  const features =
    globalSettings.features || {};


  const ids = [
    "featureChat",
    "featureGroups",
    "featureHomework",
    "featureNotes",
    "featureAnnouncements",
    "featureRegistration",
    "featureMaintenance"
  ];


  const keys = [
    "chat",
    "groups",
    "homework",
    "notes",
    "announcements",
    "registration",
    "maintenance"
  ];


  ids.forEach(
    (id, index) => {

      const element =
        $(id);

      if (!element) return;

      element.checked =
        features[keys[index]] !== false;

    }
  );
}


/* =========================================================
   SAVE FEATURES
========================================================= */

async function saveFeatureSettings() {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    return;
  }


  const featureIds = {

    chat:
      $("featureChat")?.checked !== false,

    groups:
      $("featureGroups")?.checked !== false,

    homework:
      $("featureHomework")?.checked !== false,

    notes:
      $("featureNotes")?.checked !== false,

    announcements:
      $("featureAnnouncements")?.checked !== false,

    registration:
      $("featureRegistration")?.checked !== false,

    maintenance:
      $("featureMaintenance")?.checked === true

  };


  try {

    await setDoc(
      doc(db, "appSettings", "main"),
      {

        features:
          featureIds,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          OWNER_NAME

      },
      {
        merge: true
      }
    );


    globalSettings.features =
      featureIds;


    applySettings();
    applyUserAccess();


    showToast(
      "Feature settings save हो गईं।"
    );

  } catch (error) {

    console.error(
      "Feature settings error:",
      error
    );

    showToast(
      "Feature settings save नहीं हुईं।",
      "error"
    );
  }
}


/* =========================================================
   OWNER — SECURITY
========================================================= */

function loadOwnerSecurity() {

  const field =
    $("newOwnerPassword");

  if (field) {
    field.value = "";
  }

}


/* =========================================================
   CHANGE OWNER PASSWORD
========================================================= */

async function changeOwnerPassword() {

  if (
    effectivePermission(currentStudent) !==
    "owner"
  ) {
    return;
  }


  const password =
    $("newOwnerPassword")
      ?.value.trim();


  if (!password) {

    showToast(
      "New password डालें।",
      "error"
    );

    return;
  }


  if (password.length < 4) {

    showToast(
      "Password कम से कम 4 characters का रखें।",
      "error"
    );

    return;
  }


  try {

    const passwordHash =
      await hashPassword(password);


    await setDoc(
      doc(db, "appSettings", "main"),
      {

        ownerPasswordHash:
          passwordHash,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          OWNER_NAME

      },
      {
        merge: true
      }
    );


    showToast(
      "Owner password change हो गया।"
    );


    if ($("newOwnerPassword")) {
      $("newOwnerPassword").value = "";
    }

  } catch (error) {

    console.error(
      "Owner password error:",
      error
    );

    showToast(
      "Password change नहीं हुआ।",
      "error"
    );
  }
}


/* =========================================================
   OWNER TABS
========================================================= */

function setupOwnerTabs() {

  qsa(
    "[data-owner-tab]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const tab =
          button.dataset.ownerTab;

        qsa(
          "[data-owner-tab]"
        ).forEach(item => {

          item.classList.toggle(
            "active",
            item === button
          );

        });


        qsa(
          "[data-owner-section]"
        ).forEach(section => {

          section.classList.toggle(
            "active",
            section.dataset.ownerSection ===
            tab
          );

        });

      }
    );

  });
}


/* =========================================================
   OWNER BUTTONS
========================================================= */

function setupOwnerButtons() {

  $("ownerAddHomeworkBtn")
    ?.addEventListener(
      "click",
      openAddHomeworkModal
    );


  $("ownerAddNoteBtn")
    ?.addEventListener(
      "click",
      openAddNoteModal
    );


  $("ownerAddAnnouncementBtn")
    ?.addEventListener(
      "click",
      openAddAnnouncementModal
    );


  $("saveGlobalSettingsBtn")
    ?.addEventListener(
      "click",
      saveGlobalSettings
    );


  $("saveFeatureSettingsBtn")
    ?.addEventListener(
      "click",
      saveFeatureSettings
    );


  $("changeOwnerPasswordBtn")
    ?.addEventListener(
      "click",
      changeOwnerPassword
    );


  const studentSearch =
    $("ownerStudentSearch");


  if (studentSearch) {

    studentSearch.addEventListener(
      "input",
      () => {

        const term =
          studentSearch.value
            .trim()
            .toLowerCase();


        const filtered =
          studentsCache.filter(student => {

            const name =
              String(
                student.name || ""
              ).toLowerCase();

            const phone =
              String(
                student.phone || ""
              );


            return (
              name.includes(term) ||
              phone.includes(term)
            );

          });


        renderOwnerStudents(
          filtered
        );

      }
    );

  }
}


/* =========================================================
   OWNER ACCESS
========================================================= */

function setupOwnerAccess() {

  qsa(
    "[data-owner-open]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (
          effectivePermission(
            currentStudent
          ) !== "owner"
        ) {

          showToast(
            "Owner Panel access denied.",
            "error"
          );

          return;
        }

        openPage("owner");

      }
    );

  });
}


/* =========================================================
   SETTINGS — STUDENT
========================================================= */

function setupSettingsButtons() {

  const language =
    $("languageSelect");

  if (language) {

    language.addEventListener(
      "change",
      async () => {

        globalSettings.language =
          language.value;

        applyLanguage();

      }
    );

  }


  const theme =
    $("themeSelect");

  if (theme) {

    theme.addEventListener(
      "change",
      async () => {

        globalSettings.theme =
          theme.value;

        applyTheme();

      }
    );

  }


  const welcome =
    $("welcomeAnimationToggle");

  if (welcome) {

    welcome.addEventListener(
      "change",
      async () => {

        globalSettings.welcomeAnimation =
          welcome.checked;

      }
    );

  }


  const save =
    $("saveSettingsBtn");

  if (save) {

    save.addEventListener(
      "click",
      saveStudentSettings
    );

  }

}


async function saveStudentSettings() {

  const language =
    $("languageSelect")?.value ||
    globalSettings.language;

  const theme =
    $("themeSelect")?.value ||
    globalSettings.theme;

  const welcome =
    $("welcomeAnimationToggle")
      ?.checked !== false;


  globalSettings.language =
    language;

  globalSettings.theme =
    theme;

  globalSettings.welcomeAnimation =
    welcome;


  applySettings();

  showToast(
    "Settings updated."
  );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    if (
      currentStudent &&
      currentStudent.id !== "owner"
    ) {

      await setStudentOnline(
        currentStudent.id,
        false
      );

    }

  } catch (error) {

    console.error(
      "Offline status error:",
      error
    );

  }


  if (unsubscribeMessages) {

    unsubscribeMessages();
    unsubscribeMessages = null;

  }


  if (unsubscribeGroupMessages) {

    unsubscribeGroupMessages();
    unsubscribeGroupMessages = null;

  }


  if (unsubscribeOnline) {

    unsubscribeOnline();
    unsubscribeOnline = null;

  }


  currentStudent = null;
  currentChatUser = null;
  currentGroup = null;


  localStorage.removeItem(
    "studyName"
  );

  localStorage.removeItem(
    "studyPhone"
  );


  sessionStorage.clear();


  hide($("app"));

  hide($("ownerWelcome"));

  show($("loginScreen"));


  loginStep = 1;

  setLoginStep(1);


  if ($("loginPassword")) {
    $("loginPassword").value = "";
  }

  if ($("loginName")) {
    $("loginName").value = "";
  }

  if ($("loginPhone")) {
    $("loginPhone").value = "";
  }

  if ($("loginMessage")) {
    $("loginMessage").textContent = "";
  }


  showToast(
    "Logout successful."
  );
}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

  qsa(
    "[data-logout]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const okay =
          confirm(
            "क्या आप logout करना चाहते हैं?"
          );

        if (okay) {
          logout();
        }

      }
    );

  });


  $("logoutBtn")
    ?.addEventListener(
      "click",
      () => {

        const okay =
          confirm(
            "क्या आप logout करना चाहते हैं?"
          );

        if (okay) {
          logout();
        }

      }
    );
}


/* =========================================================
   PASSWORD EYE TOGGLE
========================================================= */

function setupPasswordToggle() {

  const button =
    $("toggleLoginPassword");

  const input =
    $("loginPassword");


  if (!button || !input) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      const visible =
        input.type === "text";


      input.type =
        visible
          ? "password"
          : "text";


      button.textContent =
        visible
          ? "👁"
          : "🙈";

    }
  );
}


/* =========================================================
   MODAL CLOSE BUTTONS
========================================================= */

function setupModalButtons() {

  $("closeAppModal")
    ?.addEventListener(
      "click",
      closeModal
    );


  $("appModalClose")
    ?.addEventListener(
      "click",
      closeModal
    );


  $("appModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("appModal")
        ) {
          closeModal();
        }

      }
    );


  $("groupModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("groupModal")
        ) {
          closeGroupModal();
        }

      }
    );


  $("groupChatModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("groupChatModal")
        ) {
          closeGroupChat();
        }

      }
    );


  $("closeGroupChat")
    ?.addEventListener(
      "click",
      closeGroupChat
    );


  $("closeGroupChatModal")
    ?.addEventListener(
      "click",
      closeGroupChat
    );
}


/* =========================================================
   BACK BUTTONS
========================================================= */

function setupBackButtons() {

  $("backToHomeBtn")
    ?.addEventListener(
      "click",
      () => openPage("home")
    );


  $("settingsBackBtn")
    ?.addEventListener(
      "click",
      () => openPage("home")
    );


  $("ownerBackBtn")
    ?.addEventListener(
      "click",
      () => openPage("home")
    );

}


/* =========================================================
   REGISTRATION
========================================================= */

function setupRegistrationButton() {

  qsa(
    "[data-registration]"
  ).forEach(button => {

    button.addEventListener(
      "click",
      openRegistrationModal
    );

  });

}


function openRegistrationModal() {

  if (
    globalSettings.features?.registration ===
    false
  ) {

    showToast(
      "Registration अभी बंद है।",
      "warning"
    );

    return;
  }


  openModal(
    "Student Registration",
    `
      <form id="registrationForm">

        <div class="form-group">

          <label>Full Name</label>

          <input
            id="registrationName"
            type="text"
            required
            placeholder="Your name"
          >

        </div>


        <div class="form-group">

          <label>Mobile Number</label>

          <input
            id="registrationPhone"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            required
            placeholder="10 digit mobile"
          >

        </div>


        <button
          type="submit"
          class="primary-btn"
        >
          📝 Send Registration
        </button>

      </form>
    `
  );


  $("registrationForm")
    ?.addEventListener(
      "submit",
      submitRegistration
    );
}


async function submitRegistration(event) {

  event.preventDefault();


  const name =
    $("registrationName")
      ?.value.trim();

  const phone =
    $("registrationPhone")
      ?.value.trim();


  if (!name) {

    showToast(
      "Name डालें।",
      "error"
    );

    return;
  }


  if (!/^\d{10}$/.test(phone)) {

    showToast(
      "Valid 10 digit mobile number डालें।",
      "error"
    );

    return;
  }


  try {

    const q =
      query(
        collection(db, "students"),
        where(
          "phone",
          "==",
          phone
        ),
        limit(1)
      );


    const existing =
      await getDocs(q);


    if (!existing.empty) {

      showToast(
        "यह mobile number पहले से registered है।",
        "warning"
      );

      return;
    }


    await addDoc(
      collection(db, "students"),
      {

        name,
        phone,

        status:
          "pending",

        permission:
          "restricted",

        permissionExpiresAt:
          null,

        online:
          false,

        createdAt:
          serverTimestamp()

      }
    );


    closeModal();

    showToast(
      "Registration request Owner को भेज दी गई।"
    );

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    showToast(
      "Registration नहीं हो पाई।",
      "error"
    );
  }
}


/* =========================================================
   ONLINE STUDENT LIST
========================================================= */

function subscribeOnlineStudents() {

  if (unsubscribeOnline) {

    unsubscribeOnline();
    unsubscribeOnline = null;

  }


  try {

    const q =
      query(
        collection(db, "students"),
        where(
          "status",
          "==",
          "approved"
        )
      );


    unsubscribeOnline =
      onSnapshot(
        q,
        snapshot => {

          studentsCache =
            snapshot.docs.map(
              docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
              })
            );


          if (
            currentPage === "chat"
          ) {

            renderChatPeople(
              studentsCache.filter(
                student =>
                  student.id !==
                  currentStudent?.id
              )
            );

          }

        },

        error => {

          console.error(
            "Online subscription error:",
            error
          );

        }
      );

  } catch (error) {

    console.error(
      "Online setup error:",
      error
    );

  }
}


/* =========================================================
   RESTORE SAVED LOGIN
========================================================= */

async function trySavedLogin() {

  const savedName =
    localStorage.getItem(
      "studyName"
    );

  const savedPhone =
    localStorage.getItem(
      "studyPhone"
    );


  if (
    !savedName ||
    !savedPhone
  ) {
    return false;
  }


  if (
    savedPhone === "owner" &&
    savedName === OWNER_NAME
  ) {

    currentStudent = {

      id: "owner",

      name: OWNER_NAME,

      phone: "",

      status: "approved",

      permission: "owner",

      isOwner: true

    };


    openApp();

    if (
      globalSettings.welcomeAnimation !== false
    ) {

      ownerWelcomeAnimation();

    } else {

      openPage("owner");

    }

    return true;
  }


  try {

    const q =
      query(
        collection(db, "students"),
        where(
          "phone",
          "==",
          savedPhone
        ),
        limit(1)
      );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      localStorage.removeItem(
        "studyName"
      );

      localStorage.removeItem(
        "studyPhone"
      );

      return false;
    }


    const studentDoc =
      snapshot.docs[0];


    const student =
      {
        id: studentDoc.id,
        ...studentDoc.data()
      };


    if (
      String(student.name || "")
        .trim()
        .toLowerCase() !==
      String(savedName)
        .trim()
        .toLowerCase()
    ) {

      return false;
    }


    if (
      student.status !== "approved"
    ) {

      return false;
    }


    currentStudent =
      student;


    await setStudentOnline(
      student.id,
      true
    );


    openApp();

    return true;


  } catch (error) {

    console.error(
      "Restore login error:",
      error
    );

    return false;
  }
}


/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (
      currentStudent &&
      currentStudent.id !== "owner"
    ) {

      /*
       Firebase update may not finish
       during beforeunload.
       This is only a best-effort status update.
      */

      setStudentOnline(
        currentStudent.id,
        false
      );

    }

  }
);


/* =========================================================
   SYSTEM THEME CHANGE
========================================================= */

if (window.matchMedia) {

  const media =
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    );


  media.addEventListener(
    "change",
    () => {

      if (
        globalSettings.theme ===
        "system"
      ) {

        applyTheme();

      }

    }
  );

}


/* =========================================================
   GLOBAL ESCAPE KEY
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") {
      return;
    }


    if (
      $("appModal") &&
      !$("appModal").classList.contains("hidden")
    ) {

      closeModal();
      return;

    }


    if (
      $("groupModal") &&
      !$("groupModal").classList.contains("hidden")
    ) {

      closeGroupModal();
      return;

    }


    if (
      $("groupChatModal") &&
      !$("groupChatModal").classList.contains("hidden")
    ) {

      closeGroupChat();
      return;

    }

  }
);


/* =========================================================
   MAIN INITIALIZATION
========================================================= */

async function initStudyConnect() {

  console.log(
    "StudyConnect initializing..."
  );


  /* Login UI */

  setLoginStep(1);


  /* Main button systems */

  setupLogin();

  setupNavigation();

  setupMenu();

  setupGroupModal();

  setupChatComposer();

  setupEmojiButtons();

  setupOwnerTabs();

  setupOwnerButtons();

  setupOwnerAccess();

  setupSettingsButtons();

  setupLogoutButtons();

  setupPasswordToggle();

  setupModalButtons();

  setupBackButtons();

  setupRegistrationButton();


  /* Firebase */

  const connected =
    await startFirebase();


  if (!connected) {
    return;
  }


  /* Settings */

  await loadSettings();


  /* Online */

  subscribeOnlineStudents();


  /* Try saved login */

  const restored =
    await trySavedLogin();


  if (!restored) {

    show($("loginScreen"));
    hide($("app"));

  }


  console.log(
    "StudyConnect ready."
  );
}


/* =========================================================
   START APP
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initStudyConnect
  );

} else {

  initStudyConnect();

}


/* =========================================================
   END OF PART 2
========================================================= */
