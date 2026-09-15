/* =========================================================
   STUDYCONNECT - script.js
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
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
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
   APP CONFIG
   ========================================================= */

const OWNER_NAME = "Krishna Yadav";
const OWNER_PASSWORD = "12341";
const DEFAULT_STUDENT_PASSWORD = "123";

const STORAGE_NAME = "studyName";
const STORAGE_PHONE = "studyPhone";
const STORAGE_ID = "studyProfileId";

let currentUser = null;
let currentProfile = null;
let currentPage = "home";
let currentChatUser = null;
let currentGroup = null;

let appSettings = {
  appName: "StudyConnect",
  globalLanguage: "hi",
  globalTheme: "light",
  welcomeAnimation: true,

  chat: true,
  groups: true,
  homework: true,
  notes: true,
  announcements: true,
  registration: true,
  maintenance: false
};

let selectedGroupMembers = [];
let unsubscribeChat = null;
let unsubscribeStudents = null;
let unsubscribeMessages = null;
let unsubscribeGroups = null;
let unsubscribeSettings = null;

let navigationHistory = [];


/* =========================================================
   SHORTCUTS
   ========================================================= */

const $ = id => document.getElementById(id);

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function show(el) {
  if (el) el.style.display = "";
}

function hide(el) {
  if (el) el.style.display = "none";
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message, icon = "✓") {
  const box = $("toast");
  const msg = $("toastMessage");
  const ico = $("toastIcon");

  if (!box || !msg) return;

  msg.textContent = message;
  if (ico) ico.textContent = icon;

  box.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    box.classList.remove("show");
  }, 2500);
}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(title, body) {
  setText("appModalTitle", title);

  const bodyEl = $("appModalBody");
  if (bodyEl) bodyEl.innerHTML = body;

  const modal = $("appModal");
  if (modal) modal.classList.add("active");
}

function closeModal() {
  const modal = $("appModal");
  if (modal) modal.classList.remove("active");
}


/* =========================================================
   HASH PASSWORD
   ========================================================= */

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(hash)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}


/* =========================================================
   PROFILE ID
   ========================================================= */

function makeProfileId(phone) {
  return btoa(
    encodeURIComponent(String(phone).trim())
  )
    .replaceAll("=", "")
    .replaceAll("/", "_")
    .replaceAll("+", "-");
}


/* =========================================================
   DATE / TIME
   ========================================================= */

function formatTime(timestamp) {
  if (!timestamp) return "";

  let date;

  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "";

  let date;

  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}


/* =========================================================
   AUTH
   ========================================================= */

async function startFirebaseAuth() {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    toast("Firebase connection failed", "!");
  }
}

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    console.log("Firebase connected:", user.uid);
  }
});


/* =========================================================
   APP SETTINGS
   ========================================================= */

async function loadAppSettings() {
  try {
    const ref = doc(db, "appSettings", "global");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      appSettings = {
        ...appSettings,
        ...snap.data()
      };
    }

    applyGlobalSettings();

  } catch (error) {
    console.error("Settings error:", error);
  }
}

function applyGlobalSettings() {
  const root = document.documentElement;

  if (appSettings.globalTheme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  setText(
    "appTitle",
    appSettings.appName || "StudyConnect"
  );

  setText(
    "appNameInput",
    appSettings.appName || "StudyConnect"
  );

  if ($("languageSelect")) {
    $("languageSelect").value =
      appSettings.globalLanguage || "hi";
  }

  if ($("ownerGlobalLanguage")) {
    $("ownerGlobalLanguage").value =
      appSettings.globalLanguage || "hi";
  }

  if ($("ownerGlobalTheme")) {
    $("ownerGlobalTheme").value =
      appSettings.globalTheme || "light";
  }

  if ($("ownerAppName")) {
    $("ownerAppName").value =
      appSettings.appName || "StudyConnect";
  }

  updateFeatureVisibility();
  applyLanguage();
}


/* =========================================================
   GLOBAL SETTINGS LISTENER
   ========================================================= */

function listenGlobalSettings() {
  if (unsubscribeSettings) unsubscribeSettings();

  const ref = doc(db, "appSettings", "global");

  unsubscribeSettings = onSnapshot(ref, snap => {
    if (snap.exists()) {
      appSettings = {
        ...appSettings,
        ...snap.data()
      };

      applyGlobalSettings();
    }
  });
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(name, phone, password) {
  const cleanName = String(name || "").trim();
  const cleanPhone = String(phone || "").trim();
  const cleanPassword = String(password || "");

  /* OWNER LOGIN
     Owner only needs password.
  */

  if (
    cleanPassword === OWNER_PASSWORD &&
    (
      cleanName.toLowerCase() === OWNER_NAME.toLowerCase() ||
      cleanName === ""
    )
  ) {
    const ownerId = "owner";

    const ownerRef = doc(db, "students", ownerId);
    const ownerSnap = await getDoc(ownerRef);

    if (!ownerSnap.exists()) {
      await setDoc(ownerRef, {
        id: ownerId,
        name: OWNER_NAME,
        phone: "",
        role: "owner",
        status: "approved",
        permission: "allow",
        followers: [],
        following: [],
        joinedAt: serverTimestamp()
      });
    }

    currentProfile = {
      id: ownerId,
      name: OWNER_NAME,
      phone: "",
      role: "owner",
      status: "approved",
      permission: "allow",
      followers: [],
      following: []
    };

    localStorage.setItem(STORAGE_NAME, OWNER_NAME);
    localStorage.setItem(STORAGE_PHONE, "");
    localStorage.setItem(STORAGE_ID, ownerId);

    showOwnerWelcome();
    return true;
  }

  if (!cleanName || !cleanPhone || !cleanPassword) {
    showLoginMessage("नाम, मोबाइल और पासवर्ड भरें।", true);
    return false;
  }

  const id = makeProfileId(cleanPhone);
  const ref = doc(db, "students", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {

    if (appSettings.registration === false) {
      showLoginMessage(
        "नई registration अभी बंद है।",
        true
      );
      return false;
    }

    const passwordHash = await hashPassword(cleanPassword);

    await setDoc(ref, {
      id,
      name: cleanName,
      phone: cleanPhone,
      passwordHash,
      role: "student",
      status: "pending",
      permission: "none",
      followers: [],
      following: [],
      joinedAt: serverTimestamp()
    });

    showLoginMessage(
      "Registration हो गई। Owner की approval का इंतजार करें।",
      false
    );

    toast("Registration submitted", "✓");
    return false;
  }

  const data = snap.data();

  if (data.status === "blocked") {
    showLoginMessage(
      "आपका account blocked है।",
      true
    );
    return false;
  }

  const enteredHash = await hashPassword(cleanPassword);

  if (data.passwordHash !== enteredHash) {
    showLoginMessage(
      "गलत password।",
      true
    );
    return false;
  }

  if (data.status !== "approved") {
    showLoginMessage(
      "आपका account अभी Owner approval में है।",
      true
    );
    return false;
  }

  currentProfile = {
    id,
    ...data
  };

  localStorage.setItem(STORAGE_NAME, data.name || cleanName);
  localStorage.setItem(STORAGE_PHONE, data.phone || cleanPhone);
  localStorage.setItem(STORAGE_ID, id);

  openMainApp();

  return true;
}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(message, error = false) {
  const el = $("loginMessage");

  if (!el) return;

  el.textContent = message;
  el.className = error
    ? "login-message error"
    : "login-message success";
}


/* =========================================================
   OWNER WELCOME
   ========================================================= */

function showOwnerWelcome() {
  const screen = $("ownerWelcome");

  if (!screen) {
    openMainApp();
    return;
  }

  setText(
    "ownerWelcomeTitle",
    "Welcome Owner Krishna Ji"
  );

  setText(
    "ownerWelcomeText",
    "StudyConnect Owner Panel"
  );

  const stars = $("fallingStars");

  if (stars) {
    stars.innerHTML = "";

    for (let i = 0; i < 35; i++) {
      const star = document.createElement("span");

      star.className = "falling-star";

      star.textContent =
        Math.random() > 0.5 ? "★" : "✦";

      star.style.left =
        Math.random() * 100 + "%";

      star.style.animationDelay =
        Math.random() * 1.4 + "s";

      star.style.animationDuration =
        1.5 + Math.random() * 1.5 + "s";

      stars.appendChild(star);
    }
  }

  screen.classList.add("active");

  playOwnerTone();

  setTimeout(() => {
    screen.classList.remove("active");
    openMainApp();
    navigateTo("owner", false);
  }, 2100);
}


/* =========================================================
   OWNER TONE
   ========================================================= */

function playOwnerTone() {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(
      0.001,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.08,
      ctx.currentTime + 0.04
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.45
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.log("Tone unavailable");
  }
}


/* =========================================================
   OPEN APP
   ========================================================= */

function openMainApp() {
  hide($("loginScreen"));

  const app = $("app");

  if (app) {
    app.classList.add("active");
  }

  updateProfileUI();
  updatePermissionUI();

  if (currentProfile?.role === "owner") {
    show($("ownerSettingsCard"));
  } else {
    hide($("ownerSettingsCard"));
  }

  navigateTo("home", false);
  loadHomeData();
}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {
  if (!currentProfile) return;

  setText(
    "profileName",
    currentProfile.name || "Student"
  );

  setText(
    "profilePhone",
    currentProfile.phone || ""
  );

  const initial =
    (currentProfile.name || "S").charAt(0).toUpperCase();

  setText("headerProfileInitial", initial);

  const avatar = $("profileAvatar");

  if (avatar) {
    avatar.textContent = initial;
  }

  setText(
    "homeGreeting",
    `Hello, ${currentProfile.name || "Student"} 👋`
  );

  if ($("profileSettingsName")) {
    $("profileSettingsName").value =
      currentProfile.name || "";
  }

  if ($("profileSettingsPhone")) {
    $("profileSettingsPhone").value =
      currentProfile.phone || "";
  }
}


/* =========================================================
   PERMISSIONS
   ========================================================= */

function isOwner() {
  return currentProfile?.role === "owner";
}

function permissionLevel() {
  if (isOwner()) return "allow";
  return currentProfile?.permission || "none";
}

function canUsePage(page) {
  if (isOwner()) return true;

  const permission = permissionLevel();

  if (page === "home" || page === "settings") {
    return true;
  }

  if (page === "homework" || page === "school") {
    return true;
  }

  if (page === "chat") {
    return (
      permission === "normal" ||
      permission === "allow"
    );
  }

  if (page === "groups" || page === "notes") {
    return permission === "allow";
  }

  if (page === "owner") {
    return false;
  }

  return false;
}

function updatePermissionUI() {
  qsa(".nav-item[data-page]").forEach(item => {
    const page = item.dataset.page;

    if (
      page === "owner" &&
      !isOwner()
    ) {
      hide(item);
      return;
    }

    if (
      !canUsePage(page) ||
      !featureEnabledForPage(page)
    ) {
      item.classList.add("disabled-nav");
    } else {
      item.classList.remove("disabled-nav");
    }
  });
}


/* =========================================================
   FEATURE CHECK
   ========================================================= */

function featureEnabledForPage(page) {
  if (isOwner()) return true;

  if (page === "chat") {
    return appSettings.chat !== false;
  }

  if (page === "groups") {
    return appSettings.groups !== false;
  }

  if (page === "homework") {
    return appSettings.homework !== false;
  }

  if (page === "notes") {
    return appSettings.notes !== false;
  }

  if (page === "school") {
    return appSettings.announcements !== false;
  }

  return true;
}

function updateFeatureVisibility() {
  updatePermissionUI();

  const featureMap = {
    chat: "featureChat",
    groups: "featureGroups",
    homework: "featureHomework",
    notes: "featureNotes",
    school: "featureAnnouncements"
  };

  Object.entries(featureMap).forEach(
    ([page, id]) => {
      const enabled =
        appSettings[
          page === "school"
            ? "announcements"
            : page
        ] !== false;

      qsa(
        `[data-page="${page}"]`
      ).forEach(el => {
        el.style.display =
          enabled ? "" : "none";
      });
    }
  );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function navigateTo(page, addHistory = true) {
  if (!page) return;

  if (
    page !== "owner" &&
    !canUsePage(page)
  ) {
    toast("इस feature की permission नहीं है।", "!");
    return;
  }

  if (
    page !== "owner" &&
    !featureEnabledForPage(page)
  ) {
    toast("यह feature अभी बंद है।", "!");
    return;
  }

  if (addHistory && currentPage !== page) {
    navigationHistory.push(currentPage);

    if (navigationHistory.length > 30) {
      navigationHistory.shift();
    }
  }

  currentPage = page;

  qsa(".page").forEach(p => {
    p.classList.remove("active");
  });

  const target = $(`page-${page}`);

  if (target) {
    target.classList.add("active");
  }

  qsa(".nav-item[data-page]").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === page
    );
  });

  qsa(".bottom-nav-item[data-page]").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === page
    );
  });

  setText(
    "appTitle",
    page === "owner"
      ? "Owner Panel"
      : appSettings.appName || "StudyConnect"
  );

  const sidebar = $("sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  if (page === "home") loadHomeData();
  if (page === "chat") loadChatPeople();
  if (page === "groups") loadGroups();
  if (page === "homework") loadHomework();
  if (page === "school") loadSchoolUpdates();
  if (page === "notes") loadNotes();
  if (page === "owner") loadOwnerPanel();
  if (page === "settings") loadSettingsPage();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function goBack() {
  if (navigationHistory.length === 0) {
    navigateTo("home", false);
    return;
  }

  const previous =
    navigationHistory.pop();

  navigateTo(previous, false);
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleMobileMenu() {
  const sidebar = $("sidebar");

  if (!sidebar) return;

  sidebar.classList.toggle("open");
}


/* =========================================================
   HOME
   ========================================================= */

async function loadHomeData() {
  updateProfileUI();

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

    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📢</div>
          <p>अभी कोई announcement नहीं है।</p>
        </div>
      `;
      return;
    }

    snap.forEach(item => {
      const data = item.data();

      container.innerHTML += `
        <div class="announcement-card">
          <div class="announcement-icon">📢</div>
          <div class="announcement-content">
            <h3>${escapeHTML(data.title || "")}</h3>
            <p>${escapeHTML(data.description || data.text || "")}</p>
            <small>${formatDate(data.createdAt)}</small>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error("Home data error:", error);
  }
}


/* =========================================================
   CHAT ID
   ========================================================= */

function makeChatId(id1, id2) {
  return [id1, id2]
    .sort()
    .join("_");
}


/* =========================================================
   LOAD CHAT PEOPLE
   ========================================================= */

async function loadChatPeople(searchText = "") {
  const container =
    $("chatPeopleList");

  if (!container || !currentProfile) return;

  try {
    const snap =
      await getDocs(collection(db, "students"));

    container.innerHTML = "";

    let people = [];

    snap.forEach(item => {
      const data = item.data();

      if (
        data.id === currentProfile.id ||
        data.role === "owner" &&
        !isOwner()
      ) {
        return;
      }

      if (
        data.status !== "approved"
      ) {
        return;
      }

      if (
        searchText &&
        !String(data.name || "")
          .toLowerCase()
          .includes(searchText.toLowerCase()) &&
        !String(data.phone || "")
          .includes(searchText)
      ) {
        return;
      }

      people.push({
        id: item.id,
        ...data
      });
    });

    people.sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || "")
      )
    );

    if (people.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>कोई student नहीं मिला।</p>
        </div>
      `;
      return;
    }

    people.forEach(person => {
      const initial =
        (person.name || "S")
          .charAt(0)
          .toUpperCase();

      const item =
        document.createElement("button");

      item.className = "chat-person-item";

      item.innerHTML = `
        <div class="person-avatar">
          ${escapeHTML(initial)}
        </div>
        <div class="person-info">
          <strong>
            ${escapeHTML(person.name || "Student")}
          </strong>
          <small>
            ${escapeHTML(person.phone || "")}
          </small>
        </div>
      `;

      item.addEventListener(
        "click",
        () => openChat(person)
      );

      container.appendChild(item);
    });

  } catch (error) {
    console.error("Chat people error:", error);
  }
}


/* =========================================================
   OPEN CHAT
   ========================================================= */

function openChat(person) {
  currentChatUser = person;

  const windowEl = $("chatWindow");

  if (!windowEl) return;

  windowEl.innerHTML = `
    <div class="chat-header">
      <button class="chat-back-btn" id="chatBackBtn">
        ←
      </button>

      <div class="chat-user-avatar">
        ${escapeHTML(
          (person.name || "S")
            .charAt(0)
            .toUpperCase()
        )}
      </div>

      <div class="chat-user-info">
        <strong>
          ${escapeHTML(person.name || "Student")}
        </strong>
        <small>Student</small>
      </div>
    </div>

    <div class="chat-messages" id="chatMessages">
      <div class="chat-loading">
        Loading...
      </div>
    </div>

    <div class="emoji-panel" id="emojiPanel">
      ${[
        "😀","😂","😊","😍","👍",
        "❤️","🔥","🎉","😎","🙏",
        "👏","💯","✨","🤝","📚"
      ].map(e => `
        <button class="emoji-item">
          ${e}
        </button>
      `).join("")}
    </div>

    <div class="chat-input-area">
      <button
        class="emoji-btn"
        id="emojiBtn"
        type="button"
      >
        😊
      </button>

      <input
        id="messageInput"
        type="text"
        maxlength="1000"
        autocomplete="off"
        placeholder="Message..."
      />

      <button
        class="send-message-btn"
        id="sendMessageBtn"
        type="button"
      >
        ➤
      </button>
    </div>
  `;

  $("chatBackBtn")?.addEventListener(
    "click",
    () => {
      currentChatUser = null;
      loadChatPeople();
    }
  );

  $("sendMessageBtn")?.addEventListener(
    "click",
    sendChatMessage
  );

  $("messageInput")?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
      }
    }
  );

  $("emojiBtn")?.addEventListener(
    "click",
    () => {
      $("emojiPanel")?.classList.toggle("show");
    }
  );

  qsa(".emoji-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = $("messageInput");

      if (!input) return;

      input.value += btn.textContent.trim();
      input.focus();
    });
  });

  listenChatMessages();
}


/* =========================================================
   CHAT MESSAGES
   ========================================================= */

function listenChatMessages() {
  if (unsubscribeChat) {
    unsubscribeChat();
    unsubscribeChat = null;
  }

  if (
    !currentProfile ||
    !currentChatUser
  ) {
    return;
  }

  const chatId = makeChatId(
    currentProfile.id,
    currentChatUser.id
  );

  const messagesRef =
    collection(db, "messages");

  const q = query(
    messagesRef,
    where("chatId", "==", chatId),
    orderBy("createdAt", "asc")
  );

  unsubscribeChat = onSnapshot(
    q,
    snap => {
      renderChatMessages(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
      );
    },
    error => {
      console.error(
        "Chat listener error:",
        error
      );

      const box = $("chatMessages");

      if (box) {
        box.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <p>Messages load नहीं हो पाए।</p>
          </div>
        `;
      }
    }
  );
}


/* =========================================================
   RENDER CHAT
   ========================================================= */

function renderChatMessages(messages) {
  const box = $("chatMessages");

  if (!box) return;

  box.innerHTML = "";

  if (messages.length === 0) {
    box.innerHTML = `
      <div class="empty-chat">
        <div class="empty-chat-icon">💬</div>
        <h3>Start a conversation</h3>
        <p>पहला message भेजिए।</p>
      </div>
    `;
    return;
  }

  let previousDate = "";

  messages.forEach(message => {
    const dateLabel =
      formatDate(message.createdAt);

    if (
      dateLabel &&
      dateLabel !== previousDate
    ) {
      const separator =
        document.createElement("div");

      separator.className =
        "chat-date-separator";

      separator.textContent =
        dateLabel;

      box.appendChild(separator);

      previousDate = dateLabel;
    }

    const outgoing =
      message.senderId === currentProfile.id;

    const bubble =
      document.createElement("div");

    bubble.className =
      outgoing
        ? "message-row outgoing"
        : "message-row incoming";

    let status = "";

    if (outgoing) {
      if (message.seen) {
        status = `<span class="message-status seen">✓✓</span>`;
      } else if (message.delivered) {
        status = `<span class="message-status">✓✓</span>`;
      } else {
        status = `<span class="message-status">✓</span>`;
      }
    }

    bubble.innerHTML = `
      <div class="message-bubble">
        <div class="message-text">
          ${escapeHTML(message.text || "")}
        </div>

        <div class="message-meta">
          <span>
            ${formatTime(message.createdAt)}
          </span>
          ${status}
        </div>
      </div>
    `;

    box.appendChild(bubble);
  });

  box.scrollTop = box.scrollHeight;

  markMessagesSeen(messages);
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendChatMessage() {
  if (
    !currentProfile ||
    !currentChatUser
  ) {
    return;
  }

  const input = $("messageInput");

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;

  if (text.length > 1000) {
    toast("Message बहुत बड़ा है।", "!");
    return;
  }

  const chatId = makeChatId(
    currentProfile.id,
    currentChatUser.id
  );

  try {
    await addDoc(
      collection(db, "messages"),
      {
        chatId,
        senderId: currentProfile.id,
        senderName: currentProfile.name,
        receiverId: currentChatUser.id,
        receiverName: currentChatUser.name,
        text,
        delivered: false,
        seen: false,
        createdAt: serverTimestamp()
      }
    );

    input.value = "";

    const emojiPanel =
      $("emojiPanel");

    if (emojiPanel) {
      emojiPanel.classList.remove("show");
    }

  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    toast(
      "Message send नहीं हुआ। Firebase Rules check करें।",
      "!"
    );
  }
}


/* =========================================================
   MESSAGE SEEN
   ========================================================= */

async function markMessagesSeen(messages) {
  if (!currentProfile) return;

  const updates = messages.filter(
    message =>
      message.receiverId === currentProfile.id &&
      !message.seen
  );

  for (const message of updates) {
    try {
      await updateDoc(
        doc(db, "messages", message.id),
        {
          delivered: true,
          seen: true
        }
      );
    } catch (error) {
      console.error(
        "Seen update error:",
        error
      );
    }
  }
}


/* =========================================================
   GROUP MEMBER SEARCH
   ========================================================= */

async function searchGroupMembers(value) {
  const container =
    $("groupMemberResults");

  if (!container) return;

  const text =
    String(value || "").trim().toLowerCase();

  container.innerHTML = "";

  if (!text) return;

  try {
    const snap =
      await getDocs(collection(db, "students"));

    snap.forEach(item => {
      const data = item.data();

      if (
        data.id === currentProfile?.id ||
        data.status !== "approved"
      ) {
        return;
      }

      const matches =
        String(data.name || "")
          .toLowerCase()
          .includes(text) ||
        String(data.phone || "")
          .includes(text);

      if (!matches) return;

      const alreadySelected =
        selectedGroupMembers.some(
          m => m.id === item.id
        );

      const row =
        document.createElement("button");

      row.type = "button";
      row.className =
        "member-result";

      row.innerHTML = `
        <span class="member-result-avatar">
          ${escapeHTML(
            (data.name || "S")
              .charAt(0)
              .toUpperCase()
          )}
        </span>

        <span class="member-result-info">
          <strong>
            ${escapeHTML(data.name || "")}
          </strong>
          <small>
            ${escapeHTML(data.phone || "")}
          </small>
        </span>

        <span>
          ${alreadySelected ? "✓" : "+"}
        </span>
      `;

      row.addEventListener(
        "click",
        () => toggleGroupMember({
          id: item.id,
          ...data
        })
      );

      container.appendChild(row);
    });

  } catch (error) {
    console.error(
      "Member search error:",
      error
    );
  }
}


/* =========================================================
   GROUP MEMBER TOGGLE
   ========================================================= */

function toggleGroupMember(member) {
  const exists =
    selectedGroupMembers.some(
      m => m.id === member.id
    );

  if (exists) {
    selectedGroupMembers =
      selectedGroupMembers.filter(
        m => m.id !== member.id
      );
  } else {
    selectedGroupMembers.push(member);
  }

  renderSelectedGroupMembers();

  const search =
    $("groupMemberSearch");

  if (search) {
    searchGroupMembers(search.value);
  }
}


/* =========================================================
   SELECTED GROUP MEMBERS
   ========================================================= */

function renderSelectedGroupMembers() {
  const container =
    $("selectedGroupMembers");

  if (!container) return;

  container.innerHTML = "";

  selectedGroupMembers.forEach(member => {
    const chip =
      document.createElement("div");

    chip.className =
      "selected-member-chip";

    chip.innerHTML = `
      <span>
        ${escapeHTML(member.name || "")}
      </span>
      <button
        type="button"
        data-member-id="${escapeHTML(member.id)}"
      >
        ×
      </button>
    `;

    chip.querySelector("button")
      ?.addEventListener(
        "click",
        () => toggleGroupMember(member)
      );

    container.appendChild(chip);
  });
}


/* =========================================================
   CREATE GROUP
   ========================================================= */

async function createGroup() {
  if (!currentProfile) return;

  const name =
    $("groupNameInput")?.value.trim();

  const password =
    $("groupPasswordInput")?.value || "";

  if (!name) {
    toast("Group name डालें।", "!");
    return;
  }

  if (
    selectedGroupMembers.length === 0
  ) {
    toast(
      "कम से कम एक member चुनें।",
      "!"
    );
    return;
  }

  if (password.length < 4) {
    toast(
      "Group password कम से कम 4 characters का रखें।",
      "!"
    );
    return;
  }

  try {
    const passwordHash =
      await hashPassword(password);

    const memberIds = [
      currentProfile.id,
      ...selectedGroupMembers.map(
        m => m.id
      )
    ];

    await addDoc(
      collection(db, "groups"),
      {
        name,
        creatorId: currentProfile.id,
        creatorName: currentProfile.name,
        memberIds: [...new Set(memberIds)],
        passwordHash,
        disabled: false,
        createdAt: serverTimestamp()
      }
    );

    toast("Group बन गया।", "✓");

    closeGroupModal();
    loadGroups();

  } catch (error) {
    console.error(
      "Create group error:",
      error
    );

    toast(
      "Group create नहीं हुआ।",
      "!"
    );
  }
}


/* =========================================================
   CLOSE GROUP MODAL
   ========================================================= */

function closeGroupModal() {
  const modal =
    $("groupModal");

  if (modal) {
    modal.classList.remove("active");
  }

  selectedGroupMembers = [];

  renderSelectedGroupMembers();

  if ($("groupForm")) {
    $("groupForm").reset();
  }

  if ($("groupMemberResults")) {
    $("groupMemberResults").innerHTML = "";
  }
}


/* =========================================================
   LOAD GROUPS
   ========================================================= */

async function loadGroups() {
  const container =
    $("groupsList");

  if (!container || !currentProfile) return;

  try {
    const snap =
      await getDocs(collection(db, "groups"));

    container.innerHTML = "";

    let groups = [];

    snap.forEach(item => {
      const data = item.data();

      if (
        isOwner() ||
        (
          Array.isArray(data.memberIds) &&
          data.memberIds.includes(
            currentProfile.id
          )
        )
      ) {
        if (!data.disabled || isOwner()) {
          groups.push({
            id: item.id,
            ...data
          });
        }
      }
    });

    if (groups.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>अभी कोई group नहीं है।</p>
        </div>
      `;
      return;
    }

    groups.forEach(group => {
      const card =
        document.createElement("div");

      card.className =
        "group-card";

      card.innerHTML = `
        <div class="group-card-icon">
          👥
        </div>

        <div class="group-card-info">
          <h3>
            ${escapeHTML(group.name || "Group")}
          </h3>

          <p>
            ${Array.isArray(group.memberIds)
              ? group.memberIds.length
              : 0}
            members
          </p>

          <small>
            Creator:
            ${escapeHTML(group.creatorName || "")}
          </small>
        </div>

        <button
          class="group-open-btn"
          type="button"
        >
          Open
        </button>
      `;

      card.querySelector(
        ".group-open-btn"
      )?.addEventListener(
        "click",
        () => openGroupDetails(group)
      );

      container.appendChild(card);
    });

  } catch (error) {
    console.error(
      "Groups error:",
      error
    );
  }
}


/* =========================================================
   GROUP DETAILS
   ========================================================= */

async function openGroupDetails(group) {
  currentGroup = group;

  let membersHTML = "";

  try {
    const snap =
      await getDocs(collection(db, "students"));

    const members =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(student =>
          Array.isArray(group.memberIds) &&
          group.memberIds.includes(student.id)
        );

    membersHTML = members.map(member => `
      <div class="group-member-row">
        <div class="person-avatar">
          ${escapeHTML(
            (member.name || "S")
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div>
          <strong>
            ${escapeHTML(member.name || "")}
          </strong>
          <small>
            ${escapeHTML(member.phone || "")}
          </small>
        </div>
      </div>
    `).join("");

  } catch (error) {
    console.error(error);
  }

  openModal(
    escapeHTML(group.name || "Group"),
    `
      <div class="group-details-modal">
        <div class="group-detail-head">
          <div class="big-group-icon">👥</div>
          <h2>
            ${escapeHTML(group.name || "Group")}
          </h2>
          <p>
            Creator:
            ${escapeHTML(group.creatorName || "")}
          </p>
        </div>

        <h3>Members</h3>

        <div class="group-members-list">
          ${membersHTML || "<p>No members</p>"}
        </div>
      </div>
    `
  );
}


/* =========================================================
   HOMEWORK
   ========================================================= */

async function loadHomework() {
  const container =
    $("homeworkList");

  if (!container) return;

  try {
    const q = query(
      collection(db, "homework"),
      orderBy("createdAt", "desc")
    );

    const snap =
      await getDocs(q);

    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <p>अभी homework उपलब्ध नहीं है।</p>
        </div>
      `;
      return;
    }

    snap.forEach(item => {
      const data = item.data();

      if (
        data.published === false &&
        !isOwner()
      ) {
        return;
      }

      const card =
        document.createElement("div");

      card.className =
        "homework-card";

      card.innerHTML = `
        <div class="homework-icon">
          📚
        </div>

        <div class="homework-content">
          <div class="homework-top">
            <span>
              ${escapeHTML(data.subject || "Subject")}
            </span>
            <small>
              ${formatDate(data.createdAt)}
            </small>
          </div>

          <h3>
            ${escapeHTML(data.title || "")}
          </h3>

          <p>
            ${escapeHTML(data.description || "")}
          </p>

          ${
            data.chapter
              ? `<small>Chapter: ${escapeHTML(data.chapter)}</small>`
              : ""
          }

          ${
            data.className
              ? `<small>Class: ${escapeHTML(data.className)}</small>`
              : ""
          }
        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {
    console.error(
      "Homework error:",
      error
    );
  }
}


/* =========================================================
   SCHOOL UPDATES
   ========================================================= */

async function loadSchoolUpdates() {
  const container =
    $("schoolUpdatesList");

  if (!container) return;

  try {
    const q = query(
      collection(db, "school"),
      orderBy("createdAt", "desc")
    );

    const snap =
      await getDocs(q);

    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📢</div>
          <p>अभी कोई school update नहीं है।</p>
        </div>
      `;
      return;
    }

    snap.forEach(item => {
      const data = item.data();

      if (
        data.published === false &&
        !isOwner()
      ) {
        return;
      }

      const card =
        document.createElement("div");

      card.className =
        "school-update-card";

      card.innerHTML = `
        <div class="update-icon">
          📢
        </div>

        <div class="update-content">
          <h3>
            ${escapeHTML(data.title || "")}
          </h3>

          <p>
            ${escapeHTML(
              data.description ||
              data.text ||
              ""
            )}
          </p>

          <small>
            ${formatDate(data.createdAt)}
          </small>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {
    console.error(
      "School update error:",
      error
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

  try {
    const q = query(
      collection(db, "notes"),
      orderBy("createdAt", "desc")
    );

    const snap =
      await getDocs(q);

    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>अभी notes उपलब्ध नहीं हैं।</p>
        </div>
      `;
      return;
    }

    snap.forEach(item => {
      const data = item.data();

      if (
        data.published === false &&
        !isOwner()
      ) {
        return;
      }

      const card =
        document.createElement("div");

      card.className =
        "note-card";

      card.innerHTML = `
        <div class="note-icon">
          📝
        </div>

        <div class="note-content">
          <div class="note-top">
            <span>
              ${escapeHTML(data.subject || "Subject")}
            </span>

            <small>
              ${formatDate(data.createdAt)}
            </small>
          </div>

          <h3>
            ${escapeHTML(data.title || "")}
          </h3>

          <p>
            ${escapeHTML(data.description || "")}
          </p>

          ${
            data.chapter
              ? `<small>
                  Chapter: ${escapeHTML(data.chapter)}
                </small>`
              : ""
          }
        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {
    console.error(
      "Notes error:",
      error
    );
  }
}


/* =========================================================
   SETTINGS PAGE
   ========================================================= */

function loadSettingsPage() {
  updateProfileUI();

  if ($("languageSelect")) {
    $("languageSelect").value =
      appSettings.globalLanguage || "hi";
  }

  if ($("themeSelect")) {
    $("themeSelect").value =
      appSettings.globalTheme || "light";
  }

  if ($("notificationToggle")) {
    $("notificationToggle").checked =
      localStorage.getItem(
        "studyNotifications"
      ) !== "off";
  }
}


/* =========================================================
   PROFILE UPDATE
   ========================================================= */

async function saveProfile() {
  if (
    !currentProfile ||
    isOwner()
  ) {
    return;
  }

  const name =
    $("profileSettingsName")
      ?.value.trim();

  if (!name) {
    toast("Name खाली नहीं हो सकता।", "!");
    return;
  }

  try {
    await updateDoc(
      doc(db, "students", currentProfile.id),
      {
        name
      }
    );

    currentProfile.name = name;

    localStorage.setItem(
      STORAGE_NAME,
      name
    );

    updateProfileUI();

    toast(
      "Profile updated",
      "✓"
    );

  } catch (error) {
    console.error(
      "Profile update error:",
      error
    );

    toast(
      "Profile update नहीं हुआ।",
      "!"
    );
  }
}


/* =========================================================
   LANGUAGE
   ========================================================= */

const translations = {
  hi: {
    home: "होम",
    chat: "चैट",
    groups: "ग्रुप्स",
    homework: "होमवर्क",
    school: "स्कूल अपडेट",
    notes: "नोट्स",
    settings: "सेटिंग्स",
    owner: "Owner Panel",
    logout: "Logout",
    search: "Search",
    send: "भेजें",
    createGroup: "ग्रुप बनाएं",
    save: "Save",
    cancel: "Cancel"
  },

  en: {
    home: "Home",
    chat: "Chat",
    groups: "Groups",
    homework: "Homework",
    school: "School Updates",
    notes: "Notes",
    settings: "Settings",
    owner: "Owner Panel",
    logout: "Logout",
    search: "Search",
    send: "Send",
    createGroup: "Create Group",
    save: "Save",
    cancel: "Cancel"
  }
};

function applyLanguage() {
  const lang =
    appSettings.globalLanguage === "en"
      ? "en"
      : "hi";

  const t =
    translations[lang];

  qsa(".nav-item[data-page]").forEach(
    item => {
      const page =
        item.dataset.page;

      const span =
        item.querySelector("span");

      if (
        span &&
        t[page]
      ) {
        span.textContent =
          t[page];
      }
    }
  );

  qsa(
    ".bottom-nav-item[data-page]"
  ).forEach(item => {
    const page =
      item.dataset.page;

    const span =
      item.querySelector("span");

    if (
      span &&
      t[page]
    ) {
      span.textContent =
        t[page];
    }
  });

  if ($("createGroupBtn")) {
    $("createGroupBtn").textContent =
      t.createGroup;
  }

  if ($("logoutBtn")) {
    $("logoutBtn").textContent =
      t.logout;
  }

  if ($("settingsLogoutBtn")) {
    $("settingsLogoutBtn").textContent =
      t.logout;
  }
}


/* =========================================================
   THEME
   ========================================================= */

function changeTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  appSettings.globalTheme =
    theme;
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
  if (unsubscribeChat) {
    unsubscribeChat();
    unsubscribeChat = null;
  }

  currentProfile = null;
  currentChatUser = null;
  currentGroup = null;
  navigationHistory = [];

  localStorage.removeItem(
    STORAGE_NAME
  );

  localStorage.removeItem(
    STORAGE_PHONE
  );

  localStorage.removeItem(
    STORAGE_ID
  );

  $("app")?.classList.remove("active");

  show($("loginScreen"));

  if ($("loginForm")) {
    $("loginForm").reset();
  }

  showLoginMessage("", false);

  toast(
    "Logged out",
    "✓"
  );
}


/* =========================================================
   EVENT LISTENERS - BASIC
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* Firebase */
    startFirebaseAuth();
    await loadAppSettings();
    listenGlobalSettings();

    /* Login */
    $("loginForm")?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const btn =
          $("loginBtn");

        if (btn) {
          btn.disabled = true;
        }

        try {
          await loginUser(
            $("loginName")?.value,
            $("loginPhone")?.value,
            $("loginPassword")?.value
          );
        } catch (error) {
          console.error(
            "Login error:",
            error
          );

          showLoginMessage(
            "Login में error आया।",
            true
          );
        }

        if (btn) {
          btn.disabled = false;
        }
      }
    );


    /* Mobile menu */
    $("mobileMenuBtn")
      ?.addEventListener(
        "click",
        toggleMobileMenu
      );


    /* Navigation */
    qsa(
      ".nav-item[data-page], .bottom-nav-item[data-page]"
    ).forEach(item => {
      item.addEventListener(
        "click",
        event => {
          event.preventDefault();

          navigateTo(
            item.dataset.page
          );
        }
      );
    });


    /* Logout */
    $("logoutBtn")
      ?.addEventListener(
        "click",
        logout
      );

    $("settingsLogoutBtn")
      ?.addEventListener(
        "click",
        logout
      );


    /* Generic modal */
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
            event.target ===
            $("appModal")
          ) {
            closeModal();
          }
        }
      );


    /* Group modal */
    $("createGroupBtn")
      ?.addEventListener(
        "click",
        () => {
          if (!canUsePage("groups")) {
            toast(
              "Groups की permission नहीं है।",
              "!"
            );
            return;
          }

          selectedGroupMembers = [];

          $("groupModal")
            ?.classList.add("active");
        }
      );


    $("closeGroupModalBtn")
      ?.addEventListener(
        "click",
        closeGroupModal
      );


    $("groupMemberSearch")
      ?.addEventListener(
        "input",
        event => {
          searchGroupMembers(
            event.target.value
          );
        }
      );


    $("groupForm")
      ?.addEventListener(
        "submit",
        event => {
          event.preventDefault();
          createGroup();
        }
      );


    /* Chat search */
    $("chatSearchBtn")
      ?.addEventListener(
        "click",
        () => {
          $("chatSearchBox")
            ?.classList.toggle("show");

          $("chatSearchInput")
            ?.focus();
        }
      );


    $("chatSearchInput")
      ?.addEventListener(
        "input",
        event => {
          loadChatPeople(
            event.target.value
          );
        }
      );


    /* Profile */
    $("profileSettingsBtn")
      ?.addEventListener(
        "click",
        saveProfile
      );


    /* Language */
    $("languageSelect")
      ?.addEventListener(
        "change",
        async event => {

          const language =
            event.target.value;

          appSettings.globalLanguage =
            language;

          applyLanguage();

          try {
            await updateDoc(
              doc(
                db,
                "appSettings",
                "global"
              ),
              {
                globalLanguage: language
              }
            );

            toast(
              "Language updated",
              "✓"
            );

          } catch (error) {
            console.error(error);
          }
        }
      );


    /* Theme */
    $("themeSelect")
      ?.addEventListener(
        "change",
        async event => {

          const theme =
            event.target.value;

          changeTheme(theme);

          try {
            await updateDoc(
              doc(
                db,
                "appSettings",
                "global"
              ),
              {
                globalTheme: theme
              }
            );

          } catch (error) {
            console.error(error);
          }
        }
      );


    /* Notifications */
    $("notificationToggle")
      ?.addEventListener(
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
              ? "Notifications ON"
              : "Notifications OFF",
            "✓"
          );
        }
      );


    /* Owner panel button */
    $("openOwnerPanelBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!isOwner()) {
            toast(
              "Owner access required.",
              "!"
            );
            return;
          }

          navigateTo("owner");
        }
      );


    /* Start default page */
    applyGlobalSettings();
  }
);


/* =========================================================
   END OF PART 1
   ========================================================= */
// =========================
// STUDYCONNECT - SCRIPT.JS
// PART 2 / 2
// =========================

// ---------- OWNER PANEL ----------

const ownerTabs = document.querySelectorAll(".owner-tab");

ownerTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    if (!isOwner) return;

    const section = tab.dataset.ownerSection;
    if (!section) return;

    ownerTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    document.querySelectorAll(".owner-section").forEach(s => {
      s.classList.remove("active");
    });

    const target = document.getElementById(`ownerSection-${section}`);
    if (target) target.classList.add("active");

    if (section === "dashboard") loadOwnerDashboard();
    if (section === "students") loadOwnerStudents();
    if (section === "approvals") loadOwnerApprovals();
    if (section === "groups") loadOwnerGroups();
    if (section === "content") loadOwnerContent();
    if (section === "activity") loadActivityLog();
  });
});

async function loadOwnerDashboard() {
  if (!isOwner) return;

  try {
    const studentsSnap = await getDocs(collection(db, "students"));
    const groupsSnap = await getDocs(collection(db, "groups"));
    const messagesSnap = await getDocs(collection(db, "messages"));
    const homeworkSnap = await getDocs(collection(db, "homework"));

    const students = studentsSnap.docs.map(d => d.data());

    setText("ownerTotalStudents", students.length);
    setText(
      "ownerOnlineStudents",
      students.filter(s => s.online === true && s.status !== "blocked").length
    );
    setText(
      "ownerPendingStudents",
      students.filter(s => s.status === "pending").length
    );
    setText("ownerTotalMessages", messagesSnap.size);
    setText("ownerTotalGroups", groupsSnap.size);
    setText("ownerTotalHomework", homeworkSnap.size);
  } catch (error) {
    console.error("Owner dashboard:", error);
  }
}


// ---------- OWNER STUDENTS ----------

const ownerStudentSearch = document.getElementById("ownerStudentSearch");

if (ownerStudentSearch) {
  ownerStudentSearch.addEventListener("input", () => {
    loadOwnerStudents(ownerStudentSearch.value.trim().toLowerCase());
  });
}

async function loadOwnerStudents(searchText = "") {
  if (!isOwner) return;

  const box = document.getElementById("ownerPeopleList");
  if (!box) return;

  box.innerHTML = `<div class="empty-state">Loading students...</div>`;

  try {
    const snap = await getDocs(collection(db, "students"));

    let students = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    students.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );

    if (searchText) {
      students = students.filter(s =>
        String(s.name || "").toLowerCase().includes(searchText) ||
        String(s.phone || "").includes(searchText)
      );
    }

    if (!students.length) {
      box.innerHTML = `<div class="empty-state">No students found.</div>`;
      return;
    }

    box.innerHTML = students.map(student => `
      <button class="owner-person-item" data-student-id="${escapeAttr(student.id)}">
        <div class="owner-person-avatar">
          ${escapeHtml(getInitial(student.name))}
        </div>
        <div class="owner-person-info">
          <strong>${escapeHtml(student.name || "Unknown")}</strong>
          <small>${escapeHtml(student.phone || "")}</small>
        </div>
        <span class="status-dot ${student.status === "blocked" ? "offline" : "online"}"></span>
      </button>
    `).join("");

    box.querySelectorAll("[data-student-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        showOwnerStudent(btn.dataset.studentId);
      });
    });

  } catch (error) {
    console.error(error);
    box.innerHTML = `<div class="empty-state">Unable to load students.</div>`;
  }
}


async function showOwnerStudent(studentId) {
  const box = document.getElementById("ownerPersonDetails");
  if (!box) return;

  box.innerHTML = `<div class="empty-state">Loading...</div>`;

  try {
    const ref = doc(db, "students", studentId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      box.innerHTML = `<div class="empty-state">Student not found.</div>`;
      return;
    }

    const s = snap.data();

    const followers = Array.isArray(s.followers) ? s.followers.length : 0;
    const following = Array.isArray(s.following) ? s.following.length : 0;

    box.innerHTML = `
      <div class="owner-detail-card">

        <div class="owner-detail-top">
          <div class="owner-large-avatar">
            ${escapeHtml(getInitial(s.name))}
          </div>

          <div>
            <h3>${escapeHtml(s.name || "Unknown")}</h3>
            <p>${escapeHtml(s.phone || "")}</p>
          </div>
        </div>

        <div class="owner-detail-stats">
          <div>
            <strong>${followers}</strong>
            <span>Followers</span>
          </div>
          <div>
            <strong>${following}</strong>
            <span>Following</span>
          </div>
          <div>
            <strong>${escapeHtml(s.permission || "normal")}</strong>
            <span>Permission</span>
          </div>
        </div>

        <div class="owner-detail-row">
          <span>Status</span>
          <strong>${escapeHtml(s.status || "approved")}</strong>
        </div>

        <div class="owner-detail-row">
          <span>Joined</span>
          <strong>${formatDate(s.createdAt)}</strong>
        </div>

        <div class="owner-detail-actions">

          <button class="owner-action-btn"
            data-owner-action="permission"
            data-id="${escapeAttr(studentId)}">
            Change Permission
          </button>

          <button class="owner-action-btn"
            data-owner-action="block"
            data-id="${escapeAttr(studentId)}">
            ${s.status === "blocked" ? "Unblock" : "Block"}
          </button>

          <button class="owner-action-btn danger"
            data-owner-action="remove"
            data-id="${escapeAttr(studentId)}">
            Remove
          </button>

        </div>

      </div>
    `;

    box.querySelectorAll("[data-owner-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.ownerAction;
        const id = btn.dataset.id;

        if (action === "permission") changeStudentPermission(id);
        if (action === "block") toggleStudentBlock(id);
        if (action === "remove") removeStudent(id);
      });
    });

  } catch (error) {
    console.error(error);
    box.innerHTML = `<div class="empty-state">Unable to load profile.</div>`;
  }
}


async function changeStudentPermission(id) {
  const value = prompt(
    "Enter permission:\n\ndontallow\nnormal\nallow"
  );

  if (!value) return;

  const permission = value.trim().toLowerCase();

  if (!["dontallow", "normal", "allow"].includes(permission)) {
    showToast("Invalid permission", "error");
    return;
  }

  try {
    await updateDoc(doc(db, "students", id), {
      permission,
      updatedAt: serverTimestamp()
    });

    showToast("Permission updated", "success");
    showOwnerStudent(id);
    loadOwnerStudents();
  } catch (error) {
    console.error(error);
    showToast("Permission update failed", "error");
  }
}


async function toggleStudentBlock(id) {
  try {
    const ref = doc(db, "students", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const current = snap.data().status;
    const next = current === "blocked" ? "approved" : "blocked";

    await updateDoc(ref, {
      status: next,
      online: false,
      updatedAt: serverTimestamp()
    });

    showToast(
      next === "blocked" ? "Student blocked" : "Student unblocked",
      "success"
    );

    showOwnerStudent(id);
    loadOwnerStudents();

  } catch (error) {
    console.error(error);
    showToast("Action failed", "error");
  }
}


async function removeStudent(id) {
  if (!confirm("Remove this student?")) return;

  try {
    await deleteDoc(doc(db, "students", id));

    showToast("Student removed", "success");

    const details = document.getElementById("ownerPersonDetails");
    if (details) {
      details.innerHTML = `<div class="empty-state">Select a student.</div>`;
    }

    loadOwnerStudents();
    loadOwnerDashboard();

  } catch (error) {
    console.error(error);
    showToast("Remove failed", "error");
  }
}


// ---------- APPROVAL ----------

async function loadOwnerApprovals() {
  if (!isOwner) return;

  const box = document.getElementById("ownerApprovalList");
  if (!box) return;

  box.innerHTML = `<div class="empty-state">Loading approvals...</div>`;

  try {
    const snap = await getDocs(collection(db, "students"));

    const pending = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => s.status === "pending");

    if (!pending.length) {
      box.innerHTML = `<div class="empty-state">No pending approvals.</div>`;
      return;
    }

    box.innerHTML = pending.map(s => `
      <div class="owner-approval-card">
        <div>
          <strong>${escapeHtml(s.name || "")}</strong>
          <p>${escapeHtml(s.phone || "")}</p>
        </div>

        <div class="owner-approval-actions">
          <button data-approve="${escapeAttr(s.id)}">Approve</button>
          <button data-reject="${escapeAttr(s.id)}">Reject</button>
        </div>
      </div>
    `).join("");

    box.querySelectorAll("[data-approve]").forEach(btn => {
      btn.addEventListener("click", () => approveStudent(btn.dataset.approve));
    });

    box.querySelectorAll("[data-reject]").forEach(btn => {
      btn.addEventListener("click", () => rejectStudent(btn.dataset.reject));
    });

  } catch (error) {
    console.error(error);
    box.innerHTML = `<div class="empty-state">Unable to load approvals.</div>`;
  }
}


async function approveStudent(id) {
  try {
    await updateDoc(doc(db, "students", id), {
      status: "approved",
      permission: "normal",
      updatedAt: serverTimestamp()
    });

    showToast("Student approved", "success");
    loadOwnerApprovals();
    loadOwnerDashboard();

  } catch (error) {
    console.error(error);
    showToast("Approval failed", "error");
  }
}


async function rejectStudent(id) {
  if (!confirm("Reject this student?")) return;

  try {
    await updateDoc(doc(db, "students", id), {
      status: "rejected",
      updatedAt: serverTimestamp()
    });

    showToast("Student rejected", "success");
    loadOwnerApprovals();
    loadOwnerDashboard();

  } catch (error) {
    console.error(error);
    showToast("Reject failed", "error");
  }
}


// ---------- OWNER GROUPS ----------

async function loadOwnerGroups() {
  if (!isOwner) return;

  const box = document.getElementById("ownerGroupsList");
  if (!box) return;

  box.innerHTML = `<div class="empty-state">Loading groups...</div>`;

  try {
    const snap = await getDocs(collection(db, "groups"));

    if (snap.empty) {
      box.innerHTML = `<div class="empty-state">No groups created.</div>`;
      return;
    }

    box.innerHTML = snap.docs.map(d => {
      const g = d.data();

      const members = Array.isArray(g.members)
        ? g.members.length
        : 0;

      return `
        <div class="owner-group-card">
          <div>
            <h3>${escapeHtml(g.name || "Group")}</h3>
            <p>Creator: ${escapeHtml(g.creatorName || g.creatorId || "Unknown")}</p>
            <small>${members} member(s)</small>
          </div>

          <button class="owner-action-btn danger"
            data-delete-group="${escapeAttr(d.id)}">
            Remove
          </button>
        </div>
      `;
    }).join("");

    box.querySelectorAll("[data-delete-group]").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteOwnerGroup(btn.dataset.deleteGroup);
      });
    });

  } catch (error) {
    console.error(error);
    box.innerHTML = `<div class="empty-state">Unable to load groups.</div>`;
  }
}


async function deleteOwnerGroup(id) {
  if (!confirm("Remove this group?")) return;

  try {
    await deleteDoc(doc(db, "groups", id));
    showToast("Group removed", "success");
    loadOwnerGroups();
    loadOwnerDashboard();
  } catch (error) {
    console.error(error);
    showToast("Could not remove group", "error");
  }
}


// ---------- OWNER CONTENT ----------

async function loadOwnerContent() {
  if (!isOwner) return;

  await loadOwnerHomework();
  await loadOwnerNotes();
  await loadOwnerAnnouncements();
}


async function loadOwnerHomework() {
  const box = document.getElementById("ownerHomeworkList");
  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "homework"));

    if (snap.empty) {
      box.innerHTML = `<div class="empty-state">No homework.</div>`;
      return;
    }

    box.innerHTML = snap.docs.map(d => {
      const h = d.data();

      return `
        <div class="owner-content-card">
          <div>
            <strong>${escapeHtml(h.title || "Homework")}</strong>
            <small>${escapeHtml(h.subject || "")}</small>
          </div>

          <button data-delete-homework="${escapeAttr(d.id)}">
            Delete
          </button>
        </div>
      `;
    }).join("");

    box.querySelectorAll("[data-delete-homework]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete homework?")) return;

        await deleteDoc(doc(db, "homework", btn.dataset.deleteHomework));
        showToast("Homework deleted", "success");
        loadOwnerHomework();
      });
    });

  } catch (error) {
    console.error(error);
  }
}


async function loadOwnerNotes() {
  const box = document.getElementById("ownerNotesList");
  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "notes"));

    if (snap.empty) {
      box.innerHTML = `<div class="empty-state">No notes.</div>`;
      return;
    }

    box.innerHTML = snap.docs.map(d => {
      const n = d.data();

      return `
        <div class="owner-content-card">
          <div>
            <strong>${escapeHtml(n.title || "Note")}</strong>
            <small>${escapeHtml(n.subject || "")}</small>
          </div>

          <button data-delete-note="${escapeAttr(d.id)}">
            Delete
          </button>
        </div>
      `;
    }).join("");

    box.querySelectorAll("[data-delete-note]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete note?")) return;

        await deleteDoc(doc(db, "notes", btn.dataset.deleteNote));
        showToast("Note deleted", "success");
        loadOwnerNotes();
      });
    });

  } catch (error) {
    console.error(error);
  }
}


async function loadOwnerAnnouncements() {
  const box = document.getElementById("ownerAnnouncementsList");
  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "school"));

    if (snap.empty) {
      box.innerHTML = `<div class="empty-state">No announcements.</div>`;
      return;
    }

    box.innerHTML = snap.docs.map(d => {
      const a = d.data();

      return `
        <div class="owner-content-card">
          <div>
            <strong>${escapeHtml(a.title || "Announcement")}</strong>
            <small>${escapeHtml(a.text || "")}</small>
          </div>

          <button data-delete-announcement="${escapeAttr(d.id)}">
            Delete
          </button>
        </div>
      `;
    }).join("");

    box.querySelectorAll("[data-delete-announcement]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete announcement?")) return;

        await deleteDoc(
          doc(db, "school", btn.dataset.deleteAnnouncement)
        );

        showToast("Announcement deleted", "success");
        loadOwnerAnnouncements();
      });
    });

  } catch (error) {
    console.error(error);
  }
}


// ---------- ADD CONTENT ----------

const ownerAddHomeworkBtn =
  document.getElementById("ownerAddHomeworkBtn");

if (ownerAddHomeworkBtn) {
  ownerAddHomeworkBtn.addEventListener("click", () => {
    openAppModal(
      "Add Homework",
      `
      <form id="dynamicHomeworkForm" class="dynamic-form">

        <input id="newHomeworkTitle"
          placeholder="Homework title" required>

        <input id="newHomeworkSubject"
          placeholder="Subject" required>

        <input id="newHomeworkChapter"
          placeholder="Chapter">

        <textarea id="newHomeworkText"
          placeholder="Homework details" required></textarea>

        <button type="submit">Publish Homework</button>

      </form>
      `
    );

    const form = document.getElementById("dynamicHomeworkForm");

    form?.addEventListener("submit", async e => {
      e.preventDefault();

      try {
        await addDoc(collection(db, "homework"), {
          title: document.getElementById("newHomeworkTitle").value.trim(),
          subject: document.getElementById("newHomeworkSubject").value.trim(),
          chapter: document.getElementById("newHomeworkChapter").value.trim(),
          text: document.getElementById("newHomeworkText").value.trim(),
          createdAt: serverTimestamp(),
          published: true
        });

        closeAppModal();
        showToast("Homework published", "success");
        loadOwnerHomework();
        loadHomework();
        loadOwnerDashboard();

      } catch (error) {
        console.error(error);
        showToast("Could not publish homework", "error");
      }
    });
  });
}


const ownerAddNoteBtn =
  document.getElementById("ownerAddNoteBtn");

if (ownerAddNoteBtn) {
  ownerAddNoteBtn.addEventListener("click", () => {

    openAppModal(
      "Add Note",
      `
      <form id="dynamicNoteForm" class="dynamic-form">

        <input id="newNoteTitle"
          placeholder="Note title" required>

        <input id="newNoteSubject"
          placeholder="Subject" required>

        <input id="newNoteChapter"
          placeholder="Chapter">

        <textarea id="newNoteText"
          placeholder="Note content" required></textarea>

        <button type="submit">Publish Note</button>

      </form>
      `
    );

    document.getElementById("dynamicNoteForm")
      ?.addEventListener("submit", async e => {

        e.preventDefault();

        try {
          await addDoc(collection(db, "notes"), {
            title: document.getElementById("newNoteTitle").value.trim(),
            subject: document.getElementById("newNoteSubject").value.trim(),
            chapter: document.getElementById("newNoteChapter").value.trim(),
            text: document.getElementById("newNoteText").value.trim(),
            createdAt: serverTimestamp(),
            published: true
          });

          closeAppModal();
          showToast("Note published", "success");
          loadOwnerNotes();
          loadNotes();

        } catch (error) {
          console.error(error);
          showToast("Could not publish note", "error");
        }
      });
  });
}


const ownerAddAnnouncementBtn =
  document.getElementById("ownerAddAnnouncementBtn");

if (ownerAddAnnouncementBtn) {
  ownerAddAnnouncementBtn.addEventListener("click", () => {

    openAppModal(
      "School Update",
      `
      <form id="dynamicAnnouncementForm" class="dynamic-form">

        <input id="newAnnouncementTitle"
          placeholder="Announcement title" required>

        <textarea id="newAnnouncementText"
          placeholder="Announcement" required></textarea>

        <button type="submit">Publish Update</button>

      </form>
      `
    );

    document.getElementById("dynamicAnnouncementForm")
      ?.addEventListener("submit", async e => {

        e.preventDefault();

        try {
          await addDoc(collection(db, "school"), {
            title: document.getElementById("newAnnouncementTitle").value.trim(),
            text: document.getElementById("newAnnouncementText").value.trim(),
            createdAt: serverTimestamp(),
            published: true
          });

          closeAppModal();
          showToast("School update published", "success");

          loadOwnerAnnouncements();
          loadSchoolUpdates();

        } catch (error) {
          console.error(error);
          showToast("Could not publish update", "error");
        }
      });
  });
}


// ---------- GLOBAL SETTINGS ----------

const saveGlobalSettingsBtn =
  document.getElementById("saveGlobalSettingsBtn");

if (saveGlobalSettingsBtn) {
  saveGlobalSettingsBtn.addEventListener("click", saveGlobalSettings);
}

async function saveGlobalSettings() {
  if (!isOwner) return;

  const appName =
    document.getElementById("ownerAppName")?.value.trim() ||
    "StudyConnect";

  const language =
    document.getElementById("ownerGlobalLanguage")?.value ||
    "hi";

  const theme =
    document.getElementById("ownerGlobalTheme")?.value ||
    "system";

  const animation =
    document.getElementById("ownerWelcomeAnimation")?.checked !== false;

  try {
    await setDoc(
      doc(db, "appSettings", "global"),
      {
        appName,
        language,
        theme,
        welcomeAnimation: animation,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    globalSettings = {
      ...globalSettings,
      appName,
      language,
      theme,
      welcomeAnimation: animation
    };

    applyGlobalSettings();
    showToast("Global settings saved", "success");

  } catch (error) {
    console.error(error);
    showToast("Could not save settings", "error");
  }
}


// ---------- FEATURE SETTINGS ----------

const saveFeatureSettingsBtn =
  document.getElementById("saveFeatureSettingsBtn");

if (saveFeatureSettingsBtn) {
  saveFeatureSettingsBtn.addEventListener("click", saveFeatureSettings);
}

async function saveFeatureSettings() {
  if (!isOwner) return;

  const features = {
    chat:
      document.getElementById("featureChat")?.checked ?? true,

    groups:
      document.getElementById("featureGroups")?.checked ?? true,

    homework:
      document.getElementById("featureHomework")?.checked ?? true,

    notes:
      document.getElementById("featureNotes")?.checked ?? true,

    announcements:
      document.getElementById("featureAnnouncements")?.checked ?? true,

    registration:
      document.getElementById("featureRegistration")?.checked ?? true,

    maintenance:
      document.getElementById("featureMaintenance")?.checked ?? false
  };

  try {
    await setDoc(
      doc(db, "appSettings", "features"),
      {
        ...features,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    featureSettings = features;
    applyFeatureSettings();

    showToast("Feature settings saved", "success");

  } catch (error) {
    console.error(error);
    showToast("Could not save feature settings", "error");
  }
}


// ---------- OWNER PASSWORD ----------

const changeOwnerPasswordBtn =
  document.getElementById("changeOwnerPasswordBtn");

if (changeOwnerPasswordBtn) {
  changeOwnerPasswordBtn.addEventListener("click", changeOwnerPassword);
}

async function changeOwnerPassword() {
  if (!isOwner) return;

  const p1 =
    document.getElementById("ownerNewPassword")?.value || "";

  const p2 =
    document.getElementById("ownerConfirmPassword")?.value || "";

  if (!p1 || p1.length < 4) {
    showToast("Password must be at least 4 characters", "error");
    return;
  }

  if (p1 !== p2) {
    showToast("Passwords do not match", "error");
    return;
  }

  try {
    const hash = await hashPassword(p1);

    await setDoc(
      doc(db, "appSettings", "security"),
      {
        ownerPasswordHash: hash,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    document.getElementById("ownerNewPassword").value = "";
    document.getElementById("ownerConfirmPassword").value = "";

    showToast("Owner password changed", "success");

  } catch (error) {
    console.error(error);
    showToast("Could not change password", "error");
  }
}


// ---------- ACTIVITY LOG ----------

async function loadActivityLog() {
  if (!isOwner) return;

  const box = document.getElementById("ownerActivityLog");
  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "activityLogs"));

    if (snap.empty) {
      box.innerHTML = `<div class="empty-state">No activity yet.</div>`;
      return;
    }

    const logs = snap.docs
      .map(d => d.data())
      .sort((a, b) => {
        const at = getMillis(a.createdAt);
        const bt = getMillis(b.createdAt);
        return bt - at;
      })
      .slice(0, 100);

    box.innerHTML = logs.map(log => `
      <div class="activity-log-item">
        <strong>${escapeHtml(log.action || "Activity")}</strong>
        <span>${escapeHtml(log.userName || "")}</span>
        <small>${formatDateTime(log.createdAt)}</small>
      </div>
    `).join("");

  } catch (error) {
    console.error(error);
    box.innerHTML = `<div class="empty-state">Unable to load activity.</div>`;
  }
}


async function writeActivity(action, extra = {}) {
  try {
    await addDoc(collection(db, "activityLogs"), {
      action,
      userId: currentUser?.id || "unknown",
      userName: currentUser?.name || "Unknown",
      createdAt: serverTimestamp(),
      ...extra
    });
  } catch (error) {
    console.warn("Activity log failed:", error);
  }
}


// ---------- HEADER BUTTONS ----------

const headerNotificationBtn =
  document.getElementById("headerNotificationBtn");

if (headerNotificationBtn) {
  headerNotificationBtn.addEventListener("click", () => {
    openAppModal(
      "Notifications",
      `
      <div class="notification-empty">
        <div class="big-icon">🔔</div>
        <h3>No new notifications</h3>
        <p>You are all caught up.</p>
      </div>
      `
    );
  });
}


const headerProfileBtn =
  document.getElementById("headerProfileBtn");

if (headerProfileBtn) {
  headerProfileBtn.addEventListener("click", () => {
    showPage("settings");
  });
}


// ---------- FEATURE CARDS ----------

document.querySelectorAll(".feature-card").forEach(card => {
  card.addEventListener("click", () => {

    const page =
      card.dataset.page ||
      card.getAttribute("data-target");

    if (page) {
      showPage(page);
    }
  });
});


// ---------- BACK BUTTON SUPPORT ----------

window.addEventListener("popstate", event => {
  const page = event.state?.page || "home";
  showPage(page, false);
});


// ---------- KEYBOARD CHAT ----------

document.addEventListener("keydown", event => {
  const input = document.getElementById("messageInput");

  if (!input) return;
  if (document.activeElement !== input) return;

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    const sendBtn = document.getElementById("sendMessageBtn");
    if (sendBtn) sendBtn.click();
  }
});


// ---------- SAFE HELPERS ----------

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function getInitial(name) {
  const text = String(name || "?").trim();
  return text ? text.charAt(0).toUpperCase() : "?";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getMillis(timestamp) {
  if (!timestamp) return 0;

  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  if (typeof timestamp === "number") {
    return timestamp;
  }

  return 0;
}

function formatDate(timestamp) {
  const ms = getMillis(timestamp);

  if (!ms) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(ms));
}

function formatDateTime(timestamp) {
  const ms = getMillis(timestamp);

  if (!ms) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(ms));
}


// ---------- APP MODAL ----------

function openAppModal(title, body) {
  const modal = document.getElementById("appModal");
  const titleEl = document.getElementById("appModalTitle");
  const bodyEl = document.getElementById("appModalBody");

  if (!modal) return;

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = body;

  modal.classList.add("active");
}

function closeAppModal() {
  const modal = document.getElementById("appModal");
  if (modal) modal.classList.remove("active");
}

const closeAppModalBtn =
  document.getElementById("closeAppModalBtn");

if (closeAppModalBtn) {
  closeAppModalBtn.addEventListener("click", closeAppModal);
}

const appModal =
  document.getElementById("appModal");

if (appModal) {
  appModal.addEventListener("click", e => {
    if (e.target === appModal) {
      closeAppModal();
    }
  });
}


// ---------- TOAST ----------

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const text = document.getElementById("toastMessage");
  const icon = document.getElementById("toastIcon");

  if (!toast) return;

  if (text) text.textContent = message;

  if (icon) {
    icon.textContent =
      type === "success" ? "✓" :
      type === "error" ? "!" :
      "i";
  }

  toast.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


// ---------- ONLINE STATUS ----------

async function setOnlineStatus(value) {
  if (!currentUser?.id) return;

  try {
    await updateDoc(
      doc(db, "students", currentUser.id),
      {
        online: value,
        lastSeen: serverTimestamp()
      }
    );
  } catch (error) {
    console.warn("Online status:", error);
  }
}

window.addEventListener("beforeunload", () => {
  if (currentUser?.id) {
    setOnlineStatus(false);
  }
});


// ---------- STARTUP ----------

(async function startStudyConnect() {
  try {
    await loadGlobalSettings();
    await loadFeatureSettings();

    const savedName =
      localStorage.getItem("studyName");

    const savedPhone =
      localStorage.getItem("studyPhone");

    if (savedName && savedPhone) {
      const studentId = makeProfileId(savedPhone);

      try {
        const snap =
          await getDoc(doc(db, "students", studentId));

        if (snap.exists()) {
          currentUser = {
            id: studentId,
            ...snap.data()
          };

          if (currentUser.status === "approved") {
            isLoggedIn = true;
            isOwner = false;

            applyGlobalSettings();
            applyFeatureSettings();
            openApp();

            return;
          }
        }
      } catch (error) {
        console.warn("Auto login:", error);
      }
    }

    showLogin();

  } catch (error) {
    console.error("Startup error:", error);
    showLogin();
  }
})();
