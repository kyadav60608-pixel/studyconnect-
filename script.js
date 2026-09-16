
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
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
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

/* =========================
   FIREBASE
========================= */

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

/* =========================
   APP
========================= */

const OWNER_NAME = "Krishna Yadav";
const OWNER_PASSWORD = "12341";
const STUDENT_PASSWORD = "123";

let currentUser = null;
let currentStudent = null;
let currentPage = "home";
let previousPage = "home";
let currentChatUser = null;
let globalSettings = {};
let studentsCache = [];
let groupsCache = [];
let unsubscribeMessages = null;

const $ = id => document.getElementById(id);

const qs = selector => document.querySelector(selector);

const qsa = selector => [...document.querySelectorAll(selector)];

function show(el) {
  if (el) el.classList.remove("hidden");
}

function hide(el) {
  if (el) el.classList.add("hidden");
}

function text(el, value) {
  if (el) el.textContent = value ?? "";
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   TOAST
========================= */

function toast(message, icon = "✓") {
  text($("toastMessage"), message);
  text($("toastIcon"), icon);

  const t = $("toast");
  if (!t) return;

  t.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 2500);
}

/* =========================
   MODAL
========================= */

function openModal(title, body) {
  text($("appModalTitle"), title);

  if ($("appModalBody")) {
    $("appModalBody").innerHTML = body;
  }

  show($("appModal"));
}

function closeModal() {
  hide($("appModal"));
}

/* =========================
   HASH
========================= */

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(hashBuffer)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================
   FIREBASE AUTH
========================= */

async function startFirebase() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    return true;
  } catch (error) {
    console.error(error);
    toast("Firebase connection failed", "!");
    return false;
  }
}

/* =========================
   DEFAULT SETTINGS
========================= */

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

async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "appSettings", "main"));

    if (snap.exists()) {
      globalSettings = {
        ...DEFAULT_SETTINGS,
        ...snap.data(),
        features: {
          ...DEFAULT_SETTINGS.features,
          ...(snap.data().features || {})
        }
      };
    } else {
      globalSettings = structuredClone(DEFAULT_SETTINGS);
    }

    applySettings();
  } catch (error) {
    console.error(error);
    globalSettings = structuredClone(DEFAULT_SETTINGS);
    applySettings();
  }
}

/* =========================
   SETTINGS UI
========================= */

function applySettings() {
  const name = globalSettings.appName || "StudyConnect";

  text($("appTitle"), name);
  text($("loginTitle"), name);

  document.title = name;

  applyTheme(globalSettings.theme || "system");
  applyFeatureVisibility();
  applyLanguage(globalSettings.language || "en");
}

function applyTheme(theme) {
  document.body.classList.remove("dark");

  if (theme === "dark") {
    document.body.classList.add("dark");
  }

  if (theme === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.body.classList.add("dark");
    }
  }

  if ($("themeSelect")) {
    $("themeSelect").value = theme;
  }
}

function applyFeatureVisibility() {
  const f = globalSettings.features || DEFAULT_SETTINGS.features;

  qsa('[data-page="chat"]').forEach(el => {
    el.classList.toggle("feature-disabled", f.chat === false);
  });

  qsa('[data-page="groups"]').forEach(el => {
    el.classList.toggle("feature-disabled", f.groups === false);
  });

  qsa('[data-page="homework"]').forEach(el => {
    el.classList.toggle("feature-disabled", f.homework === false);
  });

  qsa('[data-page="notes"]').forEach(el => {
    el.classList.toggle("feature-disabled", f.notes === false);
  });

  qsa('[data-page="school"]').forEach(el => {
    el.classList.toggle(
      "feature-disabled",
      f.announcements === false
    );
  });

  if ($("createGroupBtn")) {
    $("createGroupBtn").disabled = f.groups === false;
  }
}

const translations = {
  en: {
    home: "Home",
    chat: "Chat",
    groups: "Groups",
    homework: "Homework",
    school: "School Updates",
    notes: "Notes",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome",
    studentCommunity: "Student Community"
  },

  hi: {
    home: "होम",
    chat: "चैट",
    groups: "ग्रुप",
    homework: "होमवर्क",
    school: "स्कूल अपडेट",
    notes: "नोट्स",
    settings: "सेटिंग्स",
    logout: "लॉगआउट",
    welcome: "स्वागत है",
    studentCommunity: "विद्यार्थी समुदाय"
  }
};

function applyLanguage(lang) {
  const t = translations[lang] || translations.en;

  const map = {
    home: t.home,
    chat: t.chat,
    groups: t.groups,
    homework: t.homework,
    school: t.school,
    notes: t.notes,
    settings: t.settings
  };

  qsa("[data-page]").forEach(btn => {
    const page = btn.dataset.page;
    const span = btn.querySelector("span");

    if (span && map[page]) {
      span.textContent = map[page];
    }
  });

  if ($("loginSubtitle")) {
    $("loginSubtitle").textContent = t.studentCommunity;
  }

  if ($("logoutBtn")) {
    $("logoutBtn").textContent = "↪ " + t.logout;
  }

  if ($("languageSelect")) {
    $("languageSelect").value = lang;
  }
}

/* =========================
   OWNER WELCOME
========================= */

function ownerWelcome() {
  if (globalSettings.welcomeAnimation === false) {
    openPage("owner");
    return;
  }

  const screen = $("ownerWelcome");

  if (!screen) {
    openPage("owner");
    return;
  }

  show(screen);

  text(
    $("ownerWelcomeTitle"),
    "Welcome Owner Krishna Ji"
  );

  text(
    $("ownerWelcomeText"),
    "Control Center is opening…"
  );

  const stars = $("fallingStars");

  if (stars) {
    stars.innerHTML = "";

    for (let i = 0; i < 35; i++) {
      const star = document.createElement("span");

      star.textContent = "✦";

      star.style.left = Math.random() * 100 + "%";
      star.style.animationDelay =
        Math.random() * 1.5 + "s";

      stars.appendChild(star);
    }
  }

  setTimeout(() => {
    hide(screen);
    openPage("owner");
  }, 2200);
}

/* =========================
   LOGIN
========================= */

let loginStep = 1;

function setupLogin() {
  const nameWrap = $("loginNameWrap");
  const phoneWrap = $("loginPhoneWrap");
  const nameInput = $("loginName");
  const phoneInput = $("loginPhone");

  hide(nameWrap);
  hide(phoneWrap);

  nameInput.required = false;
  phoneInput.required = false;

  $("loginForm")?.addEventListener("submit", handleLogin);

  nameInput?.addEventListener("input", () => {
    const isOwner =
      nameInput.value.trim().toLowerCase() ===
      OWNER_NAME.toLowerCase();

    phoneInput.required = !isOwner;

    if (isOwner) {
      phoneWrap?.classList.add("owner-phone-optional");
    }
  });

  $("loginPassword")?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("loginForm")?.requestSubmit();
    }
  });
}

async function handleLogin(event) {
  event.preventDefault();
  event.stopPropagation();

  const password = $("loginPassword")?.value.trim() || "";

  if (!password) {
    text($("loginMessage"), "Password डालो।");
    return;
  }

  /* FIRST CLICK = show name/mobile */

  if (loginStep === 1) {
    loginStep = 2;

    show($("loginNameWrap"));
    show($("loginPhoneWrap"));

    $("loginName").required = true;

    if ($("loginBtn")) {
      $("loginBtn").textContent = "Login →";
    }

    text(
      $("loginMessage"),
      "अब अपना नाम डालो।"
    );

    return;
  }

  const name =
    $("loginName")?.value.trim() || "";

  const phone =
    ($("loginPhone")?.value || "")
      .replace(/\D/g, "");

  const isOwner =
    name.toLowerCase() ===
    OWNER_NAME.toLowerCase();

  /* OWNER */

  if (isOwner) {
    if (password !== OWNER_PASSWORD) {
      text(
        $("loginMessage"),
        "Owner password गलत है।"
      );
      return;
    }

    currentStudent = {
      id: "owner",
      name: OWNER_NAME,
      phone: "",
      permission: "owner",
      status: "approved",
      isOwner: true
    };

    localStorage.setItem(
      "studyName",
      OWNER_NAME
    );

    localStorage.setItem(
      "studyPhone",
      ""
    );

    openApp();

    ownerWelcome();

    return;
  }

  /* STUDENT */

  if (!name) {
    text($("loginMessage"), "Name डालो।");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    text(
      $("loginMessage"),
      "10 digit mobile number डालो।"
    );
    return;
  }

  try {
    const q = query(
      collection(db, "students"),
      where("phone", "==", phone),
      limit(1)
    );

    const result = await getDocs(q);

    if (result.empty) {
      text(
        $("loginMessage"),
        "Student account नहीं मिला।"
      );
      return;
    }

    const studentDoc = result.docs[0];
    const student = studentDoc.data();

    if (student.status === "blocked") {
      text(
        $("loginMessage"),
        "यह account blocked है।"
      );
      return;
    }

    if (student.status !== "approved") {
      text(
        $("loginMessage"),
        "पहले Owner से approval चाहिए।"
      );
      return;
    }

    if (student.passwordHash) {
      const enteredHash =
        await hashPassword(password);

      if (enteredHash !== student.passwordHash) {
        text(
          $("loginMessage"),
          "Password गलत है।"
        );
        return;
      }
    } else if (password !== STUDENT_PASSWORD) {
      text(
        $("loginMessage"),
        "Password गलत है।"
      );
      return;
    }

    currentStudent = {
      id: studentDoc.id,
      ...student,
      isOwner: false
    };

    localStorage.setItem(
      "studyName",
      student.name || name
    );

    localStorage.setItem(
      "studyPhone",
      student.phone || phone
    );

    openApp();

  } catch (error) {
    console.error(error);

    text(
      $("loginMessage"),
      "Login में समस्या आई।"
    );
  }
}

/* =========================
   OPEN APP
========================= */

function openApp() {
  hide($("loginScreen"));
  show($("app"));

  updateProfile();

  if (currentStudent?.isOwner) {
    show($("controlPanelNav"));
    show($("ownerSettingsCard"));
  } else {
    hide($("controlPanelNav"));
    hide($("ownerSettingsCard"));
  }

  openPage("home");

  loadHome();
}

/* =========================
   PROFILE
========================= */

function updateProfile() {
  if (!currentStudent) return;

  const name =
    currentStudent.name || "Student";

  const phone =
    currentStudent.phone || "";

  text($("profileName"), name);
  text($("profilePhone"), phone);

  text(
    $("profileAvatar"),
    name.charAt(0).toUpperCase()
  );

  text(
    $("headerProfileInitial"),
    name.charAt(0).toUpperCase()
  );

  text(
    $("homeGreeting"),
    `Welcome, ${name} 👋`
  );
}

/* =========================
   PERMISSION
========================= */

function canUse(permission) {
  if (currentStudent?.isOwner) return true;

  const level =
    currentStudent?.permission || "normal";

  if (level === "allow") return true;

  if (level === "normal") {
    return [
      "home",
      "chat",
      "homework",
      "school"
    ].includes(permission);
  }

  return [
    "home",
    "homework",
    "school"
  ].includes(permission);
}

/* =========================
   PAGE NAVIGATION
========================= */

function openPage(page) {
  if (!page) return;

  if (
    page !== "home" &&
    !canUse(page) &&
    !currentStudent?.isOwner
  ) {
    toast("इस feature की permission नहीं है।", "!");
    return;
  }

  previousPage = currentPage;
  currentPage = page;

  qsa(".page").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === `page-${page}`
    );
  });

  qsa(".nav-item, .bottom-nav-item").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.page === page
    );
  });

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
    loadSchool();
  }

  if (page === "notes") {
    loadNotes();
  }

  if (page === "owner") {
    if (!currentStudent?.isOwner) {
      openPage("home");
      return;
    }

    loadOwnerPanel();
  }

  hide($("sidebar"));
}

/* =========================
   NAV BUTTONS
========================= */

function setupNavigation() {
  qsa("[data-page]").forEach(button => {
    button.addEventListener("click", e => {
      e.preventDefault();

      const page =
        button.dataset.page;

      openPage(page);
    });
  });

  qsa("[data-back]").forEach(button => {
    button.addEventListener("click", e => {
      e.preventDefault();

      openPage(
        previousPage && previousPage !== currentPage
          ? previousPage
          : "home"
      );
    });
  });
}

/* =========================
   MOBILE MENU
========================= */

function setupMenu() {
  $("mobileMenuBtn")?.addEventListener(
    "click",
    () => {
      $("sidebar")?.classList.toggle("open");
    }
  );
}

/* =========================
   HOME
========================= */

async function loadHome() {
  try {
    const q = query(
      collection(db, "school"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const snap = await getDocs(q);

    const container =
      $("homeAnnouncements");

    if (!container) return;

    if (snap.empty) {
      container.innerHTML =
        `<div class="empty-state">
          No announcements yet.
        </div>`;
      return;
    }

    container.innerHTML =
      snap.docs.map(d => {
        const x = d.data();

        return `
          <article class="content-card">
            <h3>${escapeHTML(x.title || "Announcement")}</h3>
            <p>${escapeHTML(x.text || "")}</p>
          </article>
        `;
      }).join("");

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   CHAT PEOPLE
========================= */

async function loadChatPeople() {
  const container = $("chatPeopleList");

  if (!container) return;

  try {
    const snap =
      await getDocs(collection(db, "students"));

    studentsCache = snap.docs
      .map(d => ({
        id: d.id,
        ...d.data()
      }))
      .filter(x =>
        x.id !== currentStudent?.id &&
        x.status === "approved"
      );

    renderChatPeople(studentsCache);

  } catch (error) {
    console.error(error);

    container.innerHTML =
      `<div class="empty-state">
        Students load नहीं हुए।
      </div>`;
  }
}

function renderChatPeople(list) {
  const container =
    $("chatPeopleList");

  if (!container) return;

  if (!list.length) {
    container.innerHTML =
      `<div class="empty-state">
        No approved students.
      </div>`;
    return;
  }

  container.innerHTML =
    list.map(person => `
      <button
        class="person-item"
        data-chat-user="${escapeHTML(person.id)}"
      >
        <span class="avatar">
          ${escapeHTML(
            (person.name || "S")
              .charAt(0)
              .toUpperCase()
          )}
        </span>

        <span class="person-info">
          <strong>
            ${escapeHTML(person.name || "Student")}
          </strong>

          <small>
            ${escapeHTML(person.phone || "")}
          </small>
        </span>
      </button>
    `).join("");

  qsa("[data-chat-user]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.chatUser;

      const person =
        studentsCache.find(x => x.id === id);

      if (person) {
        openChat(person);
      }
    });
  });
}
/* =========================
   CHAT
========================= */

function openChat(person) {
  currentChatUser = person;

  const windowEl = $("chatWindow");
  if (!windowEl) return;

  windowEl.classList.remove("empty-chat");

  windowEl.innerHTML = `
    <div class="chat-header">
      <button class="back-btn chat-back">←</button>

      <div class="avatar">
        ${escapeHTML(
          (person.name || "S").charAt(0).toUpperCase()
        )}
      </div>

      <div class="chat-header-info">
        <strong>${escapeHTML(person.name || "Student")}</strong>
        <small>● Online</small>
      </div>
    </div>

    <div id="chatMessages" class="chat-messages">
      <div class="empty-state">Loading messages...</div>
    </div>

    <div class="chat-composer">
      <button id="emojiBtn" class="icon-btn" type="button">
        😊
      </button>

      <input
        id="messageInput"
        type="text"
        placeholder="Type a message..."
        autocomplete="off"
      >

      <button
        id="sendMessageBtn"
        class="send-btn"
        type="button"
      >
        ➤
      </button>
    </div>
  `;

  windowEl
    .querySelector(".chat-back")
    ?.addEventListener("click", () => {
      currentChatUser = null;

      windowEl.innerHTML = `
        <div class="empty-state">
          💬
          <h3>Select a friend</h3>
          <p>Choose someone from the list.</p>
        </div>
      `;

      windowEl.classList.add("empty-chat");
    });

  $("sendMessageBtn")?.addEventListener(
    "click",
    sendMessage
  );

  $("messageInput")?.addEventListener(
    "keydown",
    e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }
  );

  $("emojiBtn")?.addEventListener(
    "click",
    () => {
      const input = $("messageInput");

      if (!input) return;

      input.value += " 😊";
      input.focus();
    }
  );

  subscribeMessages(person);
}

function makeChatId(a, b) {
  return [a, b].sort().join("_");
}

function subscribeMessages(person) {
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  if (!currentStudent || !person) return;

  const chatId = makeChatId(
    currentStudent.id,
    person.id
  );

  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(
    q,
    snapshot => {
      const messages =
        snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));

      renderMessages(messages);

      markMessagesSeen(messages);
    },
    error => {
      console.error(error);

      const box = $("chatMessages");

      if (box) {
        box.innerHTML = `
          <div class="empty-state">
            Messages load नहीं हुए।
          </div>
        `;
      }
    }
  );
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  let date;

  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function formatDate(timestamp) {
  if (!timestamp) return "";

  let date;

  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}

function renderMessages(messages) {
  const box = $("chatMessages");

  if (!box) return;

  if (!messages.length) {
    box.innerHTML = `
      <div class="empty-state">
        💬
        <h3>Start chatting</h3>
        <p>Send your first message.</p>
      </div>
    `;

    return;
  }

  let lastDate = "";

  box.innerHTML = messages.map(message => {
    const mine =
      message.senderId === currentStudent?.id;

    const dateText =
      formatDate(message.createdAt);

    let separator = "";

    if (dateText !== lastDate) {
      separator = `
        <div class="chat-date">
          ${escapeHTML(dateText)}
        </div>
      `;

      lastDate = dateText;
    }

    let ticks = "✓";

    if (mine) {
      if (message.seen) {
        ticks = "✓✓";
      } else if (message.delivered) {
        ticks = "✓✓";
      }
    }

    return `
      ${separator}

      <div class="message-row ${mine ? "sent" : "received"}">
        <div class="message-bubble">

          <div class="message-text">
            ${escapeHTML(message.text || "")}
          </div>

          <div class="message-meta">
            ${escapeHTML(formatTime(message.createdAt))}

            ${
              mine
                ? `<span class="message-ticks ${
                    message.seen ? "seen" : ""
                  }">${ticks}</span>`
                : ""
            }
          </div>

        </div>
      </div>
    `;
  }).join("");

  box.scrollTop = box.scrollHeight;
}

async function sendMessage() {
  if (!currentStudent || !currentChatUser) {
    toast("पहले कोई friend select करो।", "!");
    return;
  }

  const input = $("messageInput");

  if (!input) return;

  const message = input.value.trim();

  if (!message) return;

  const chatId = makeChatId(
    currentStudent.id,
    currentChatUser.id
  );

  try {
    input.disabled = true;

    await addDoc(
      collection(db, "messages"),
      {
        chatId,
        senderId: currentStudent.id,
        receiverId: currentChatUser.id,
        text: message,
        delivered: false,
        seen: false,
        createdAt: serverTimestamp()
      }
    );

    input.value = "";

  } catch (error) {
    console.error(error);
    toast("Message send नहीं हुआ।", "!");
  } finally {
    input.disabled = false;
    input.focus();
  }
}

async function markMessagesSeen(messages) {
  if (!currentStudent) return;

  const incoming = messages.filter(
    m =>
      m.receiverId === currentStudent.id &&
      !m.seen
  );

  for (const message of incoming) {
    try {
      await updateDoc(
        doc(db, "messages", message.id),
        {
          seen: true,
          delivered: true
        }
      );
    } catch (error) {
      console.error(error);
    }
  }
}

/* =========================
   CHAT SEARCH
========================= */

function setupChatSearch() {
  $("chatSearchBtn")?.addEventListener(
    "click",
    () => {
      $("chatSearchBox")?.classList.toggle("hidden");
      $("chatSearchInput")?.focus();
    }
  );

  $("chatSearchInput")?.addEventListener(
    "input",
    e => {
      const value =
        e.target.value.trim().toLowerCase();

      const filtered =
        studentsCache.filter(person =>
          String(person.name || "")
            .toLowerCase()
            .includes(value) ||
          String(person.phone || "")
            .includes(value)
        );

      renderChatPeople(filtered);
    }
  );
}

/* =========================
   GROUPS
========================= */

async function loadGroups() {
  const container = $("groupsList");

  if (!container || !currentStudent) return;

  try {
    const snap =
      await getDocs(collection(db, "groups"));

    groupsCache = snap.docs
      .map(d => ({
        id: d.id,
        ...d.data()
      }))
      .filter(group =>
        Array.isArray(group.memberIds) &&
        group.memberIds.includes(currentStudent.id)
      );

    renderGroups(groupsCache);

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        Groups load नहीं हुए।
      </div>
    `;
  }
}

function renderGroups(groups) {
  const container = $("groupsList");

  if (!container) return;

  if (!groups.length) {
    container.innerHTML = `
      <div class="empty-state">
        👥
        <h3>No groups yet</h3>
        <p>Create your first private study group.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = groups.map(group => `
    <article
      class="group-card"
      data-group-id="${escapeHTML(group.id)}"
    >
      <div class="group-icon">👥</div>

      <div class="group-info">
        <h3>${escapeHTML(group.name || "Study Group")}</h3>

        <p>
          ${Array.isArray(group.memberIds)
            ? group.memberIds.length
            : 0}
          members
        </p>
      </div>

      <button
        class="secondary-btn group-open-btn"
        data-group="${escapeHTML(group.id)}"
      >
        Open
      </button>
    </article>
  `).join("");

  qsa(".group-open-btn").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.group;

      const group =
        groupsCache.find(x => x.id === id);

      if (!group) return;

      openGroup(group);
    });
  });
}

function openGroup(group) {
  openModal(
    group.name || "Study Group",
    `
      <div class="group-modal-content">

        <div class="avatar group-big-avatar">
          👥
        </div>

        <h3>${escapeHTML(group.name || "")}</h3>

        <p>
          Members:
          ${
            Array.isArray(group.memberIds)
              ? group.memberIds.length
              : 0
          }
        </p>

        <button
          id="closeGroupView"
          class="primary-btn"
        >
          Close
        </button>

      </div>
    `
  );

  $("closeGroupView")?.addEventListener(
    "click",
    closeModal
  );
}

/* =========================
   CREATE GROUP
========================= */

function setupGroupModal() {
  $("createGroupBtn")?.addEventListener(
    "click",
    () => {
      if (!canUse("groups")) {
        toast("Groups की permission नहीं है।", "!");
        return;
      }

      openGroupModal();
    }
  );

  $("closeGroupModalBtn")?.addEventListener(
    "click",
    closeGroupModal
  );

  $("groupForm")?.addEventListener(
    "submit",
    createGroup
  );

  $("groupMemberSearch")?.addEventListener(
    "input",
    searchGroupMembers
  );
}

function openGroupModal() {
  $("groupForm")?.reset();

  if ($("groupMemberResults")) {
    $("groupMemberResults").innerHTML = "";
  }

  if ($("selectedGroupMembers")) {
    $("selectedGroupMembers").innerHTML = "";
  }

  show($("groupModal"));
}

function closeGroupModal() {
  hide($("groupModal"));
}

let selectedGroupMembers = [];

function searchGroupMembers(event) {
  const value =
    event.target.value.trim();

  const container =
    $("groupMemberResults");

  if (!container) return;

  if (!value) {
    container.innerHTML = "";
    return;
  }

  const results =
    studentsCache.filter(person =>
      String(person.phone || "").includes(value) ||
      String(person.name || "")
        .toLowerCase()
        .includes(value.toLowerCase())
    );

  container.innerHTML =
    results.map(person => `
      <button
        type="button"
        class="person-item group-member-result"
        data-id="${escapeHTML(person.id)}"
      >
        <span class="avatar">
          ${escapeHTML(
            (person.name || "S")
              .charAt(0)
              .toUpperCase()
          )}
        </span>

        <span class="person-info">
          <strong>${escapeHTML(person.name || "")}</strong>
          <small>${escapeHTML(person.phone || "")}</small>
        </span>
      </button>
    `).join("");

  qsa(".group-member-result").forEach(button => {
    button.addEventListener("click", () => {
      const person =
        studentsCache.find(
          x => x.id === button.dataset.id
        );

      if (!person) return;

      addSelectedMember(person);
    });
  });
}

function addSelectedMember(person) {
  if (
    selectedGroupMembers.some(
      x => x.id === person.id
    )
  ) {
    return;
  }

  selectedGroupMembers.push(person);
  renderSelectedMembers();
}

function renderSelectedMembers() {
  const container =
    $("selectedGroupMembers");

  if (!container) return;

  container.innerHTML =
    selectedGroupMembers.map(person => `
      <span class="chip">
        ${escapeHTML(person.name || "")}

        <button
          type="button"
          class="remove-chip"
          data-id="${escapeHTML(person.id)}"
        >
          ×
        </button>
      </span>
    `).join("");

  qsa(".remove-chip").forEach(button => {
    button.addEventListener("click", () => {
      selectedGroupMembers =
        selectedGroupMembers.filter(
          x => x.id !== button.dataset.id
        );

      renderSelectedMembers();
    });
  });
}

async function createGroup(event) {
  event.preventDefault();

  if (!currentStudent) return;

  const name =
    $("groupNameInput")?.value.trim();

  const password =
    $("groupPasswordInput")?.value.trim();

  if (!name) {
    toast("Group name डालो।", "!");
    return;
  }

  if (!password) {
    toast("Group password डालो।", "!");
    return;
  }

  try {
    const memberIds = [
      currentStudent.id,
      ...selectedGroupMembers.map(x => x.id)
    ];

    const uniqueMembers =
      [...new Set(memberIds)];

    const passwordHash =
      await hashPassword(password);

    await addDoc(
      collection(db, "groups"),
      {
        name,
        creatorId: currentStudent.id,
        memberIds: uniqueMembers,
        passwordHash,
        createdAt: serverTimestamp(),
        active: true
      }
    );

    selectedGroupMembers = [];

    closeGroupModal();

    toast("Private group created.", "✓");

    loadGroups();

  } catch (error) {
    console.error(error);
    toast("Group create नहीं हुआ।", "!");
  }
}

/* =========================
   HOMEWORK
========================= */

async function loadHomework() {
  const container = $("homeworkList");

  if (!container) return;

  try {
    const snap =
      await getDocs(collection(db, "homework"));

    const items =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(x => x.published !== false);

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          📝
          <h3>No homework</h3>
          <p>Published homework will appear here.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      items.map(item => `
        <article class="content-card">
          <span class="content-badge">
            ${escapeHTML(item.subject || "Homework")}
          </span>

          <h3>
            ${escapeHTML(item.title || "Homework")}
          </h3>

          <p>
            ${escapeHTML(item.description || item.text || "")}
          </p>

          ${
            item.chapter
              ? `<small>Chapter: ${escapeHTML(item.chapter)}</small>`
              : ""
          }
        </article>
      `).join("");

  } catch (error) {
    console.error(error);
    container.innerHTML =
      `<div class="empty-state">
        Homework load नहीं हुआ।
      </div>`;
  }
}

/* =========================
   SCHOOL UPDATES
========================= */

async function loadSchool() {
  const container =
    $("schoolUpdatesList");

  if (!container) return;

  try {
    const snap =
      await getDocs(collection(db, "school"));

    const items =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(x => x.published !== false);

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          📢
          <h3>No updates</h3>
          <p>School updates will appear here.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      items.map(item => `
        <article class="content-card">
          <h3>
            ${escapeHTML(item.title || "School Update")}
          </h3>

          <p>
            ${escapeHTML(item.text || item.description || "")}
          </p>
        </article>
      `).join("");

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   NOTES
========================= */

async function loadNotes() {
  const container = $("notesList");

  if (!container) return;

  try {
    const snap =
      await getDocs(collection(db, "notes"));

    const items =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(x => x.published !== false);

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          📚
          <h3>No notes</h3>
          <p>Published notes will appear here.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      items.map(item => `
        <article class="content-card">
          <span class="content-badge">
            ${escapeHTML(item.subject || "Notes")}
          </span>

          <h3>
            ${escapeHTML(item.title || "Note")}
          </h3>

          <p>
            ${escapeHTML(item.text || item.description || "")}
          </p>

          ${
            item.chapter
              ? `<small>
                  Chapter: ${escapeHTML(item.chapter)}
                </small>`
              : ""
          }
        </article>
      `).join("");

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   SETTINGS
========================= */

function setupSettings() {
  $("themeSelect")?.addEventListener(
    "change",
    event => {
      applyTheme(event.target.value);

      localStorage.setItem(
        "studyTheme",
        event.target.value
      );
    }
  );

  $("languageSelect")?.addEventListener(
    "change",
    event => {
      const lang = event.target.value;

      applyLanguage(lang);

      localStorage.setItem(
        "studyLanguage",
        lang
      );
    }
  );

  $("profileSettingsBtn")?.addEventListener(
    "click",
    editProfile
  );

  $("settingsLogoutBtn")?.addEventListener(
    "click",
    logout
  );

  $("logoutBtn")?.addEventListener(
    "click",
    logout
  );

  $("openOwnerPanelBtn")?.addEventListener(
    "click",
    () => {
      if (currentStudent?.isOwner) {
        openPage("owner");
      }
    }
  );

  $("headerProfileBtn")?.addEventListener(
    "click",
    () => {
      openPage("settings");
    }
  );

  $("headerNotificationBtn")?.addEventListener(
    "click",
    () => {
      openPage("school");
    }
  );
}

function editProfile() {
  if (!currentStudent) return;

  openModal(
    "Edit Profile",
    `
      <div class="form-stack">

        <label>Name</label>

        <input
          id="editProfileName"
          class="text-input"
          value="${escapeHTML(currentStudent.name || "")}"
        >

        <button
          id="saveProfileName"
          class="primary-btn"
        >
          Save
        </button>

      </div>
    `
  );

  $("saveProfileName")?.addEventListener(
    "click",
    async () => {
      const name =
        $("editProfileName")?.value.trim();

      if (!name) {
        toast("Name डालो।", "!");
        return;
      }

      try {
        if (currentStudent.id !== "owner") {
          await updateDoc(
            doc(
              db,
              "students",
              currentStudent.id
            ),
            { name }
          );
        }

        currentStudent.name = name;

        localStorage.setItem(
          "studyName",
          name
        );

        updateProfile();
        closeModal();

        toast("Profile updated.", "✓");

      } catch (error) {
        console.error(error);
        toast("Profile update नहीं हुआ।", "!");
      }
    }
  );
}

/* =========================
   OWNER PANEL
========================= */

async function loadOwnerPanel() {
  if (!currentStudent?.isOwner) return;

  await loadOwnerStudents();
  await loadOwnerStats();
  await loadOwnerApprovals();
  await loadOwnerGroups();
  await loadOwnerContent();
  await loadOwnerActivity();

  loadOwnerControls();
}

async function loadOwnerStudents() {
  try {
    const snap =
      await getDocs(collection(db, "students"));

    studentsCache =
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

    renderOwnerPeople(
      studentsCache
    );

  } catch (error) {
    console.error(error);
  }
}

function renderOwnerPeople(list) {
  const container =
    $("ownerPeopleList");

  if (!container) return;

  if (!list.length) {
    container.innerHTML =
      `<div class="empty-state">
        No students.
      </div>`;

    return;
  }

  container.innerHTML =
    list.map(person => `
      <button
        class="person-item owner-person"
        data-person-id="${escapeHTML(person.id)}"
      >
        <span class="avatar">
          ${escapeHTML(
            (person.name || "S")
              .charAt(0)
              .toUpperCase()
          )}
        </span>

        <span class="person-info">
          <strong>
            ${escapeHTML(person.name || "Student")}
          </strong>

          <small>
            ${escapeHTML(person.phone || "")}
          </small>
        </span>
      </button>
    `).join("");

  qsa(".owner-person").forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const person =
          studentsCache.find(
            x =>
              x.id ===
              button.dataset.personId
          );

        if (person) {
          showOwnerPerson(person);
        }
      }
    );
  });
}

function showOwnerPerson(person) {
  const container =
    $("ownerPersonDetails");

  if (!container) return;

  container.innerHTML = `
    <div class="owner-profile-detail">

      <div class="avatar profile-large">
        ${escapeHTML(
          (person.name || "S")
            .charAt(0)
            .toUpperCase()
        )}
      </div>

      <h2>
        ${escapeHTML(person.name || "Student")}
      </h2>

      <p>
        📱 ${escapeHTML(person.phone || "")}
      </p>

      <p>
        Status:
        <strong>
          ${escapeHTML(person.status || "pending")}
        </strong>
      </p>

      <p>
        Permission:
        <strong>
          ${escapeHTML(person.permission || "normal")}
        </strong>
      </p>

      <div class="owner-actions">

        <button
          class="secondary-btn"
          id="approvePersonBtn"
        >
          Approve
        </button>

        <button
          class="secondary-btn"
          id="allowPersonBtn"
        >
          Full Allow
        </button>

        <button
          class="secondary-btn"
          id="normalPersonBtn"
        >
          Normal
        </button>

        <button
          class="danger-btn"
          id="blockPersonBtn"
        >
          Block
        </button>

      </div>

    </div>
  `;

  $("approvePersonBtn")?.addEventListener(
    "click",
    () => updateStudent(person.id, {
      status: "approved"
    })
  );

  $("allowPersonBtn")?.addEventListener(
    "click",
    () => updateStudent(person.id, {
      permission: "allow"
    })
  );

  $("normalPersonBtn")?.addEventListener(
    "click",
    () => updateStudent(person.id, {
      permission: "normal"
    })
  );

  $("blockPersonBtn")?.addEventListener(
    "click",
    () => updateStudent(person.id, {
      status: "blocked"
    })
  );
}

async function updateStudent(id, data) {
  try {
    await updateDoc(
      doc(db, "students", id),
      data
    );

    toast("Student updated.", "✓");

    await loadOwnerStudents();
    await loadOwnerStats();

  } catch (error) {
    console.error(error);
    toast("Student update failed.", "!");
  }
}

/* =========================
   OWNER SEARCH
========================= */

function setupOwnerSearch() {
  $("ownerStudentSearch")?.addEventListener(
    "input",
    event => {
      const value =
        event.target.value
          .trim()
          .toLowerCase();

      const filtered =
        studentsCache.filter(person =>
          String(person.name || "")
            .toLowerCase()
            .includes(value) ||
          String(person.phone || "")
            .includes(value)
        );

      renderOwnerPeople(filtered);
    }
  );
}

/* =========================
   OWNER TABS
========================= */

function setupOwnerTabs() {
  qsa(".owner-tab").forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const section =
          button.dataset.ownerSection;

        qsa(".owner-tab").forEach(btn =>
          btn.classList.remove("active")
        );

        button.classList.add("active");

        qsa(".owner-section").forEach(
          item => {
            item.classList.toggle(
              "active",
              item.id ===
                `ownerSection-${section}`
            );
          }
        );
      }
    );
  });
}

/* =========================
   OWNER STATS
========================= */

async function loadOwnerStats() {
  try {
    const students =
      await getDocs(
        collection(db, "students")
      );

    const messages =
      await getDocs(
        collection(db, "messages")
      );

    const groups =
      await getDocs(
        collection(db, "groups")
      );

    const homework =
      await getDocs(
        collection(db, "homework")
      );

    const pending =
      students.docs.filter(
        d => d.data().status === "pending"
      ).length;

    const online =
      students.docs.filter(
        d => d.data().online === true
      ).length;

    text(
      $("ownerTotalStudents"),
      students.size
    );

    text(
      $("ownerOnlineStudents"),
      online
    );

    text(
      $("ownerPendingStudents"),
      pending
    );

    text(
      $("ownerTotalMessages"),
      messages.size
    );

    text(
      $("ownerTotalGroups"),
      groups.size
    );

    text(
      $("ownerTotalHomework"),
      homework.size
    );

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   APPROVALS
========================= */

async function loadOwnerApprovals() {
  const container =
    $("ownerApprovalList");

  if (!container) return;

  try {
    const snap =
      await getDocs(collection(db, "students"));

    const pending =
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).filter(
        x => x.status === "pending"
      );

    if (!pending.length) {
      container.innerHTML =
        `<div class="empty-state">
          No pending approvals.
        </div>`;

      return;
    }

    container.innerHTML =
      pending.map(person => `
        <article class="content-card">

          <h3>
            ${escapeHTML(person.name || "Student")}
          </h3>

          <p>
            📱 ${escapeHTML(person.phone || "")}
          </p>

          <button
            class="primary-btn approval-btn"
            data-id="${escapeHTML(person.id)}"
          >
            Approve
          </button>

        </article>
      `).join("");

    qsa(".approval-btn").forEach(button => {
      button.addEventListener(
        "click",
        () =>
          updateStudent(
            button.dataset.id,
            { status: "approved" }
          )
      );
    });

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   OWNER GROUPS
========================= */

async function loadOwnerGroups() {
  const container =
    $("ownerGroupsList");

  if (!container) return;

  try {
    const snap =
      await getDocs(
        collection(db, "groups")
      );

    const groups =
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

    if (!groups.length) {
      container.innerHTML =
        `<div class="empty-state">
          No groups.
        </div>`;

      return;
    }

    container.innerHTML =
      groups.map(group => `
        <article class="content-card">

          <h3>
            👥 ${escapeHTML(group.name || "Group")}
          </h3>

          <p>
            Members:
            ${
              Array.isArray(group.memberIds)
                ? group.memberIds.length
                : 0
            }
          </p>

          <button
            class="danger-btn delete-group-btn"
            data-id="${escapeHTML(group.id)}"
          >
            Remove Group
          </button>

        </article>
      `).join("");

    qsa(".delete-group-btn").forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          if (
            !confirm(
              "Remove this group?"
            )
          ) return;

          try {
            await deleteDoc(
              doc(
                db,
                "groups",
                button.dataset.id
              )
            );

            toast("Group removed.", "✓");
            loadOwnerGroups();
            loadGroups();

          } catch (error) {
            console.error(error);
            toast("Group remove failed.", "!");
          }
        }
      );
    });

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   OWNER CONTENT
========================= */

async function loadOwnerContent() {
  await loadOwnerHomework();
  await loadOwnerNotes();
  await loadOwnerAnnouncements();
}

async function loadOwnerHomework() {
  const container =
    $("ownerHomeworkList");

  if (!container) return;

  try {
    const snap =
      await getDocs(
        collection(db, "homework")
      );

    container.innerHTML =
      snap.docs.map(d => {
        const x = d.data();

        return `
          <article class="content-card">

            <h3>
              ${escapeHTML(x.title || "Homework")}
            </h3>

            <p>
              ${escapeHTML(
                x.description || x.text || ""
              )}
            </p>

            <button
              class="danger-btn delete-homework-btn"
              data-id="${escapeHTML(d.id)}"
            >
              Delete
            </button>

          </article>
        `;
      }).join("") ||
      `<div class="empty-state">
        No homework.
      </div>`;

    qsa(".delete-homework-btn").forEach(
      button => {
        button.addEventListener(
          "click",
          () =>
            deleteOwnerContent(
              "homework",
              button.dataset.id
            )
        );
      }
    );

  } catch (error) {
    console.error(error);
  }
}

async function loadOwnerNotes() {
  const container = $("ownerNotesList");

  if (!container) return;

  try {
    const snap = await getDocs(
      collection(db, "notes")
    );

    if (snap.empty) {
      container.innerHTML =
        '<div class="empty-state">No notes yet.</div>';
      return;
    }

    container.innerHTML = "";

    snap.docs.forEach((docSnap) => {
      const x = docSnap.data();

      const article = document.createElement("article");
      article.className = "content-card";

      const title = document.createElement("h3");
      title.textContent = x.title || "Note";

      const subject = document.createElement("p");
      subject.textContent =
        "Subject: " + (x.subject || "General");

      const content = document.createElement("p");
      content.textContent =
        x.content || x.description || "";

      article.appendChild(title);
      article.appendChild(subject);
      article.appendChild(content);

      container.appendChild(article);
    });

  } catch (error) {
    console.error("loadOwnerNotes error:", error);

    container.innerHTML =
      '<div class="empty-state">Unable to load notes.</div>';
  }
}

async function loadOwnerAnnouncements() {
  const container =
    $("ownerAnnouncementsList");

  if (!container) return;

  try {
    const snap =
      await getDocs(
        collection(db, "school")
      );

    container.innerHTML =
      snap.docs.map(d => {
        const x = d.data();

        return `
          <article class="content-card">

            <h3>
              ${escapeHTML(
                x.title || "Announcement"
              )}
            </h3>

            <p>
              ${escapeHTML(x.text || "")}
            </p>

            <button
              class="danger-btn delete-announcement-btn"
              data-id="${escapeHTML(d.id)}"
            >
              Delete
            </button>

          </article>
        `;
      }).join("") ||
      `<div class="empty-state">
        No announcements.
      </div>`;

    qsa(".delete-announcement-btn")
      .forEach(button => {
        button.addEventListener(
          "click",
          () =>
            deleteOwnerContent(
              "school",
              button.dataset.id
            )
        );
      });

  } catch (error) {
    console.error(error);
  }
}

async function deleteOwnerContent(
  collectionName,
  id
) {
  try {
    await deleteDoc(
      doc(db, collectionName, id)
    );

    toast("Deleted successfully.", "✓");

    loadOwnerContent();
    loadHomework();
    loadNotes();
    loadSchool();

  } catch (error) {
    console.error(error);
    toast("Delete failed.", "!");
  }
}

/* =========================
   ADD OWNER CONTENT
========================= */

function setupOwnerContentButtons() {
  $("ownerAddHomeworkBtn")
    ?.addEventListener(
      "click",
      () => openContentForm("homework")
    );

  $("ownerAddNoteBtn")
    ?.addEventListener(
      "click",
      () => openContentForm("notes")
    );

  $("ownerAddAnnouncementBtn")
    ?.addEventListener(
      "click",
      () => openContentForm("school")
    );
}

function openContentForm(type) {
  const titles = {
    homework: "Add Homework",
    notes: "Add Note",
    school: "Add Announcement"
  };

  openModal(
    titles[type],
    `
      <div class="form-stack">

        <input
          id="contentTitle"
          class="text-input"
          placeholder="Title"
        >

        ${
          type !== "school"
            ? `
              <input
                id="contentSubject"
                class="text-input"
                placeholder="Subject"
              >

              <input
                id="contentChapter"
                class="text-input"
                placeholder="Chapter"
              >
            `
            : ""
        }

        <textarea
          id="contentText"
          class="text-input"
          rows="6"
          placeholder="Write content..."
        ></textarea>

        <button
          id="saveContentBtn"
          class="primary-btn"
        >
          Publish
        </button>

      </div>
    `
  );

  $("saveContentBtn")
    ?.addEventListener(
      "click",
      async () => {

        const title =
          $("contentTitle")?.value.trim();

        const content =
          $("contentText")?.value.trim();

        if (!title || !content) {
          toast("Title और content डालो।", "!");
          return;
        }

        try {
          const data = {
            title,
            text: content,
            published: true,
            createdAt: serverTimestamp()
          };

          if (type !== "school") {
            data.subject =
              $("contentSubject")
                ?.value.trim() || "";

            data.chapter =
              $("contentChapter")
                ?.value.trim() || "";
          }

          await addDoc(
            collection(db, type),
            data
          );

          closeModal();

          toast("Published successfully.", "✓");

          loadOwnerContent();

          if (type === "homework") {
            loadHomework();
          }

          if (type === "notes") {
            loadNotes();
          }

          if (type === "school") {
            loadSchool();
            loadHome();
          }

        } catch (error) {
          console.error(error);
          toast("Publish failed.", "!");
        }
      }
    );
}

/* =========================
   OWNER APPEARANCE
========================= */

function loadOwnerControls() {
  if (!currentStudent?.isOwner) return;

  const f =
    globalSettings.features ||
    DEFAULT_SETTINGS.features;

  if ($("ownerAppName")) {
    $("ownerAppName").value =
      globalSettings.appName ||
      "StudyConnect";
  }

  if ($("ownerGlobalLanguage")) {
    $("ownerGlobalLanguage").value =
      globalSettings.language || "en";
  }

  if ($("ownerGlobalTheme")) {
    $("ownerGlobalTheme").value =
      globalSettings.theme || "system";
  }

  if ($("ownerWelcomeAnimation")) {
    $("ownerWelcomeAnimation").checked =
      globalSettings.welcomeAnimation !== false;
  }

  if ($("featureChat")) {
    $("featureChat").checked =
      f.chat !== false;
  }

  if ($("featureGroups")) {
    $("featureGroups").checked =
      f.groups !== false;
  }

  if ($("featureHomework")) {
    $("featureHomework").checked =
      f.homework !== false;
  }

  if ($("featureNotes")) {
    $("featureNotes").checked =
      f.notes !== false;
  }

  if ($("featureAnnouncements")) {
    $("featureAnnouncements").checked =
      f.announcements !== false;
  }

  if ($("featureRegistration")) {
    $("featureRegistration").checked =
      f.registration !== false;
  }

  if ($("featureMaintenance")) {
    $("featureMaintenance").checked =
      f.maintenance === true;
  }
}

function setupOwnerSettings() {
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
}

async function saveGlobalSettings() {
  if (!currentStudent?.isOwner) return;

  try {
    globalSettings = {
      ...globalSettings,

      appName:
        $("ownerAppName")?.value.trim() ||
        "StudyConnect",

      language:
        $("ownerGlobalLanguage")?.value ||
        "en",

      theme:
        $("ownerGlobalTheme")?.value ||
        "system",

      welcomeAnimation:
        $("ownerWelcomeAnimation")?.checked !== false
    };

    await setDoc(
      doc(db, "appSettings", "main"),
      globalSettings,
      { merge: true }
    );

    applySettings();

    toast(
      "Global settings saved.",
      "✓"
    );

  } catch (error) {
    console.error(error);
    toast(
      "Settings save नहीं हुए।",
      "!"
    );
  }
}

async function saveFeatureSettings() {
  if (!currentStudent?.isOwner) return;

  try {
    const features = {
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

    globalSettings.features = features;

    await setDoc(
      doc(db, "appSettings", "main"),
      {
        features
      },
      { merge: true }
    );

    applyFeatureVisibility();

    toast(
      "Feature settings saved.",
      "✓"
    );

  } catch (error) {
    console.error(error);
    toast(
      "Feature settings save नहीं हुए।",
      "!"
    );
  }
}

async function changeOwnerPassword() {
  if (!currentStudent?.isOwner) return;

  const password =
    $("ownerNewPassword")
      ?.value.trim();

  const confirmPassword =
    $("ownerConfirmPassword")
      ?.value.trim();

  if (!password || !confirmPassword) {
    toast("दोनों password डालो।", "!");
    return;
  }

  if (password !== confirmPassword) {
    toast("Passwords match नहीं हैं।", "!");
    return;
  }

  try {
    const passwordHash =
      await hashPassword(password);

    await setDoc(
      doc(db, "appSettings", "main"),
      {
        ownerPasswordHash: passwordHash
      },
      { merge: true }
    );

    $("ownerNewPassword").value = "";
    $("ownerConfirmPassword").value = "";

    toast(
      "Owner password updated.",
      "✓"
    );

  } catch (error) {
    console.error(error);
    toast(
      "Password update failed.",
      "!"
    );
  }
}

/* =========================
   ACTIVITY
========================= */

async function loadOwnerActivity() {
  const container =
    $("ownerActivityLog");

  if (!container) return;

  try {
    const snap =
      await getDocs(
        collection(db, "activityLogs")
      );

    const logs =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .slice(-50)
        .reverse();

    if (!logs.length) {
      container.innerHTML =
        `<div class="empty-state">
          No activity yet.
        </div>`;

      return;
    }

    container.innerHTML =
      logs.map(log => `
        <article class="content-card">
          <strong>
            ${escapeHTML(
              log.action || "Activity"
            )}
          </strong>

          <p>
            ${escapeHTML(
              log.text || log.message || ""
            )}
          </p>
        </article>
      `).join("");

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   LOGOUT
========================= */

function logout() {
  currentStudent = null;
  currentChatUser = null;

  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  localStorage.removeItem("studyName");
  localStorage.removeItem("studyPhone");

  hide($("app"));
  show($("loginScreen"));

  loginStep = 1;

  hide($("loginNameWrap"));
  hide($("loginPhoneWrap"));

  $("loginName").value = "";
  $("loginPhone").value = "";
  $("loginPassword").value = "";

  $("loginName").required = false;
  $("loginPhone").required = false;

  $("loginBtn").textContent = "Next →";

  text($("loginMessage"), "");

  toast("Logged out.", "✓");
}

/* =========================
   GLOBAL MODAL BUTTON
========================= */

function setupModal() {
  $("closeAppModalBtn")
    ?.addEventListener(
      "click",
      closeModal
    );

  $("appModal")
    ?.addEventListener(
      "click",
      event => {
        if (
          event.target === $("appModal")
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
          event.target === $("groupModal")
        ) {
          closeGroupModal();
        }
      }
    );
}

/* =========================
   PASSWORD BUTTON
========================= */

function setupPasswordToggle() {
  const password =
    $("loginPassword");

  if (!password) return;

  const wrapper =
    password.parentElement;

  if (!wrapper) return;

  const button =
    document.createElement("button");

  button.type = "button";
  button.className =
    "password-toggle";

  button.textContent = "👁";

  wrapper.appendChild(button);

  button.addEventListener(
    "click",
    () => {
      if (
        password.type === "password"
      ) {
        password.type = "text";
        button.textContent = "🙈";
      } else {
        password.type = "password";
        button.textContent = "👁";
      }
    }
  );
}

/* =========================
   INITIALIZE
========================= */

async function init() {
  console.log(
    "StudyConnect starting..."
  );

  setupLogin();
  setupNavigation();
  setupMenu();
  setupChatSearch();
  setupGroupModal();
  setupSettings();
  setupOwnerSearch();
  setupOwnerTabs();
  setupOwnerContentButtons();
  setupOwnerSettings();
  setupModal();
  setupPasswordToggle();

  await startFirebase();
  await loadSettings();

  const savedName =
    localStorage.getItem("studyName");

  const savedPhone =
    localStorage.getItem("studyPhone");

  if (savedName && savedPhone) {
    console.log(
      "Previous login found:",
      savedName
    );
  }

  console.log(
    "StudyConnect ready."
  );
}

window.addEventListener(
  "DOMContentLoaded",
  init
);
