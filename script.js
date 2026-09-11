/* =========================================================
   STUDYCONNECT — COMPLETE SCRIPT.JS
   Firebase • Chat • Online • DP • Groups • Homework
   School Updates • Notes • Notifications • Owner Panel
   Search • Typing • Seen • Delete • Settings
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCquRY2YB59FObuIyi3SwWc3aUCdPWypag",
  authDomain: "studyconnect-99006.firebaseapp.com",
  projectId: "studyconnect-99006",
  storageBucket: "studyconnect-99006.firebasestorage.app",
  messagingSenderId: "15964627995",
  appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
  measurementId: "G-SYJYMREJJL"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/* =========================================================
   APP CONFIG
   ========================================================= */

const APP_PASSWORD = "123";

const OWNER_NAME = "Krishna Yadav";
const OWNER_FIRST_NAME = "Krishna";
const OWNER_PHONE = "8738084554";
const OWNER_PASSWORD = "12341";

const ONLINE_HEARTBEAT = 45000;
const ONLINE_TIMEOUT = 90000;

let currentUser = {
  name: "",
  phone: "",
  photo: ""
};

let accessStatus = "basic";
let isOwner = false;

let onlineInterval = null;
let typingInterval = null;

let selectionMode = false;
let selectedItems = new Set();

let allMessages = [];
let allHomework = [];
let allSchoolUpdates = [];
let allNotes = [];
let allNotifications = [];
let allGroups = [];
let allUsers = [];

/* =========================================================
   HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowDate() {
  return new Date();
}

function timestampValue(item) {
  const value = item?.createdAt || item?.timestamp || item?.time;

  if (!value) return 0;

  if (typeof value === "number") return value;

  if (value?.toDate) {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value) {
  let date;

  if (!value) {
    date = new Date();
  } else if (value?.toDate) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    date = new Date(value);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    date = new Date();
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function formatTime(value) {
  let date;

  if (value?.toDate) date = value.toDate();
  else if (value instanceof Date) date = value;
  else date = new Date(value || Date.now());

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function avatarHTML(photo, name = "Student", className = "avatar") {
  const initial = escapeHTML(
    String(name || "S").trim().charAt(0).toUpperCase()
  );

  if (photo) {
    return `<img class="${className}" src="${photo}" alt="${escapeHTML(name)}">`;
  }

  return `
    <div class="${className}" style="
      display:flex;
      align-items:center;
      justify-content:center;
      background:#e8eef7;
      color:#2563eb;
      font-weight:800;
      font-size:17px;
    ">${initial}</div>
  `;
}

function show(el) {
  if (el) el.classList.remove("hidden");
}

function hide(el) {
  if (el) el.classList.add("hidden");
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function showMessage(id, text, type = "info") {
  const el = $(id);
  if (!el) return;

  el.textContent = text;
  el.className = `alert alert-${type}`;

  show(el);
}

function saveLocalUser() {
  localStorage.setItem(
    "studyconnect_user",
    JSON.stringify(currentUser)
  );
}

function loadLocalUser() {
  try {
    const data = JSON.parse(
      localStorage.getItem("studyconnect_user") || "null"
    );

    if (data) {
      currentUser = {
        name: data.name || "",
        phone: data.phone || "",
        photo: data.photo || ""
      };
    }
  } catch {
    currentUser = {
      name: "",
      phone: "",
      photo: ""
    };
  }
}

function isCurrentUser(item) {
  const itemPhone = normalizePhone(
    item?.senderPhone || item?.phone || item?.userPhone
  );

  if (
    currentUser.phone &&
    itemPhone &&
    itemPhone === normalizePhone(currentUser.phone)
  ) {
    return true;
  }

  return (
    normalize(item?.senderName || item?.userName) ===
    normalize(currentUser.name)
  );
}

/* =========================================================
   AUTH / PASSWORD
   ========================================================= */

function setupPassword() {
  const unlockBtn = $("unlockBtn");
  const input = $("appPassword");

  if (!unlockBtn || !input) return;

  unlockBtn.addEventListener("click", unlockApp);

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") unlockApp();
  });

  $("ownerContactBtn")?.addEventListener("click", () => {
    input.value = OWNER_PASSWORD;
    unlockApp();
  });
}

function unlockApp() {
  const input = $("appPassword");
  const error = $("passwordError");

  if (!input) return;

  if (input.value.trim() !== APP_PASSWORD) {
    if (error) {
      error.textContent = "गलत password.";
      error.classList.remove("hidden");
    }
    return;
  }

  if (error) error.classList.add("hidden");

  hide($("passwordScreen"));

  loadLocalUser();

  if (currentUser.name) {
    enterWithSavedUser();
  } else {
    show($("contactScreen"));
  }
}

async function enterWithSavedUser() {
  await determineAccess();
  openMainApp();
}

/* =========================================================
   USER / OWNER ACCESS
   ========================================================= */

function isOwnerIdentity(name, phone) {
  const n = normalize(name);
  const p = normalizePhone(phone);

  return (
    p === normalizePhone(OWNER_PHONE) ||
    n === normalize(OWNER_FIRST_NAME) ||
    n === normalize(OWNER_NAME)
  );
}

async function determineAccess() {
  const name = currentUser.name.trim();
  const phone = normalizePhone(currentUser.phone);

  if (isOwnerIdentity(name, phone)) {
    isOwner = true;
    accessStatus = "owner";
    return;
  }

  isOwner = false;

  if (!phone) {
    accessStatus = "basic";
    return;
  }

  try {
    const ref = doc(db, "allowedUsers", phone);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        name,
        phone,
        photo: currentUser.photo || "",
        status: "basic",
        allowed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      accessStatus = "basic";
      return;
    }

    const data = snap.data();

    if (data.status === "blocked" || data.allowed === false && data.status === "blocked") {
      accessStatus = "blocked";
    } else if (data.status === "allowed" || data.allowed === true) {
      accessStatus = "allowed";
    } else {
      accessStatus = "basic";
    }
  } catch (error) {
    console.error("Access error:", error);
    accessStatus = "basic";
  }
}

function canUseFullAccess() {
  return isOwner || accessStatus === "allowed";
}

function canViewBasicPage(pageName) {
  return (
    isOwner ||
    accessStatus === "allowed" ||
    pageName === "home" ||
    pageName === "homework" ||
    pageName === "school"
  );
}

/* =========================================================
   PROFILE SETUP
   ========================================================= */

function setupProfile() {
  const enterBtn = $("enterAppBtn");

  enterBtn?.addEventListener("click", async () => {
    const nameInput = $("openUserName");
    const phoneInput = $("openUserPhone");

    const name = nameInput?.value.trim() || "";
    const phone = normalizePhone(phoneInput?.value || "");

    if (!name) {
      showMessage(
        "loginMessage",
        "अपना नाम लिखिए.",
        "danger"
      );
      return;
    }

    currentUser.name = name;
    currentUser.phone = phone;

    saveLocalUser();

    await determineAccess();

    openMainApp();

    if (isOwner) {
      showOwnerWelcome();
    }
  });
}

function openMainApp() {
  hide($("passwordScreen"));
  hide($("contactScreen"));
  hide($("ownerWelcomeScreen"));

  const main = $("mainApp");

  if (main) {
    main.classList.remove("hidden");
    main.style.display = "";
  }

  updateProfileUI();
  applyAccessUI();

  setupOnline();
  loadEverything();
}

function showOwnerWelcome() {
  const screen = $("ownerWelcomeScreen");
  if (!screen) return;

  const dp = $("ownerWelcomeDP");

  if (dp && currentUser.photo) {
    dp.src = currentUser.photo;
  }

  screen.classList.remove("hidden");

  setTimeout(() => {
    screen.classList.add("hidden");
  }, 2800);
}

function updateProfileUI() {
  const name =
    currentUser.name || OWNER_FIRST_NAME;

  const possibleNameIds = [
    "currentUserName",
    "profileName",
    "homeUserName",
    "welcomeName"
  ];

  possibleNameIds.forEach(id => {
    if ($(id)) $(id).textContent = name;
  });

  const phoneEl = $("currentUserPhone");
  if (phoneEl) {
    phoneEl.textContent = currentUser.phone || "";
  }

  const avatarIds = [
    "currentUserProfile",
    "profileAvatar",
    "currentUserPhoto",
    "settingsProfilePhoto"
  ];

  avatarIds.forEach(id => {
    const el = $(id);

    if (!el) return;

    if (el.tagName === "IMG") {
      if (currentUser.photo) {
        el.src = currentUser.photo;
      }
    }
  });
}

function applyAccessUI() {
  if (accessStatus === "blocked") {
    showBlockedScreen();
    return;
  }

  qsa("[data-page]").forEach(button => {
    const page = button.dataset.page;

    if (!canViewBasicPage(page)) {
      button.style.display = "none";
    } else {
      button.style.display = "";
    }
  });

  if ($("ownerLoginBtn")) {
    $("ownerLoginBtn").style.display = isOwner
      ? ""
      : "";
  }
}

function showBlockedScreen() {
  const main = $("mainApp");

  if (main) {
    main.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:24px;
        background:#f8fafc;
      ">
        <div style="
          width:min(100%,420px);
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:20px;
          padding:30px;
          text-align:center;
          box-shadow:0 15px 45px rgba(15,23,42,.10);
        ">
          <div style="font-size:42px;margin-bottom:12px;">🔒</div>
          <h2 style="margin-bottom:8px;">Access Blocked</h2>
          <p style="color:#64748b;">
            आपका StudyConnect access अभी blocked है।
          </p>
        </div>
      </div>
    `;
  }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
  document.addEventListener("click", e => {
    const button = e.target.closest("[data-page]");

    if (!button) return;

    e.preventDefault();

    const page = button.dataset.page;

    if (!canViewBasicPage(page)) {
      alert("इस section के लिए Owner की अनुमति चाहिए।");
      return;
    }

    openPage(page);
  });

  qsa("[data-back]").forEach(button => {
    button.addEventListener("click", () => {
      openPage("home");
    });
  });
}

function openPage(pageName) {
  if (!canViewBasicPage(pageName)) return;

  qsa(".page").forEach(page => {
    page.classList.remove("active");
  });

  const target =
    $(`${pageName}Page`) ||
    $(`${pageName}Section`) ||
    document.querySelector(`[data-section="${pageName}"]`);

  if (target) {
    target.classList.add("active");
  }

  qsa("[data-page]").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.page === pageName
    );
  });

  if (pageName === "chat") {
    setTimeout(() => {
      markMessagesSeen();
      scrollChatToBottom();
    }, 250);
  }

  if (pageName === "owner" || pageName === "ownerPanel") {
    if (!isOwner) {
      alert("Owner access required.");
      openPage("home");
      return;
    }

    openOwnerPanel();
  }
}

/* =========================================================
   ONLINE SYSTEM
   ========================================================= */

function setupOnline() {
  if (!currentUser.name) return;

  addOnlineUser();

  if (onlineInterval) {
    clearInterval(onlineInterval);
  }

  onlineInterval = setInterval(() => {
    addOnlineUser();
  }, ONLINE_HEARTBEAT);

  window.addEventListener("beforeunload", () => {
    setOffline();
  });

  loadOnlineUsers();
}

async function addOnlineUser() {
  if (!currentUser.name) return;

  const phone =
    normalizePhone(currentUser.phone) ||
    `local_${normalize(currentUser.name).replace(/\s+/g, "_")}`;

  try {
    await setDoc(
      doc(db, "onlineUsers", phone),
      {
        name: currentUser.name,
        phone: currentUser.phone || "",
        photo: currentUser.photo || "",
        online: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    loadOnlineUsers();
  } catch (error) {
    console.error("Online error:", error);
  }
}

async function setOffline() {
  if (!currentUser.name) return;

  const phone =
    normalizePhone(currentUser.phone) ||
    `local_${normalize(currentUser.name).replace(/\s+/g, "_")}`;

  try {
    await setDoc(
      doc(db, "onlineUsers", phone),
      {
        online: false,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch {}
}

async function loadOnlineUsers() {
  const container = $("onlineUsers");
  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "onlineUsers")
    );

    const users = [];

    snapshot.forEach(snap => {
      const data = snap.data();

      const lastSeen = timestampValue({
        createdAt: data.lastSeen
      });

      const active =
        data.online === true &&
        Date.now() - lastSeen < ONLINE_TIMEOUT;

      if (active) {
        users.push({
          id: snap.id,
          ...data
        });
      }
    });

    users.sort((a, b) =>
      normalize(a.name).localeCompare(normalize(b.name))
    );

    renderOnlineUsers(users);
  } catch (error) {
    console.error("Online list error:", error);
  }
}

function renderOnlineUsers(users) {
  const container = $("onlineUsers");
  if (!container) return;

  setText("onlineCount", users.length);

  if (!users.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">●</div>
        <strong>No one is online</strong>
        <span>Online students यहाँ दिखाई देंगे।</span>
      </div>
    `;
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="online-user">
      ${avatarHTML(user.photo, user.name)}
      <div class="online-user-info">
        <div class="online-user-name">
          ${escapeHTML(user.name)}
        </div>
        <div class="online-user-status">
          <span class="online-dot"></span>
          Online
        </div>
      </div>
    </div>
  `).join("");
}

function setupOnlineUI() {
  $("onlineToggleBtn")?.addEventListener(
    "click",
    async () => {
      const panel = $("onlineUsersPanel");

      if (!panel) return;

      panel.classList.toggle("hidden");

      if (!panel.classList.contains("hidden")) {
        await loadOnlineUsers();
      }
    }
  );

  $("addOnlineBtn")?.addEventListener(
    "click",
    addOnlineUser
  );
}

/* =========================================================
   PROFILE PHOTO / DP
   ========================================================= */

function setupProfilePhoto() {
  const input = $("profilePhotoInput");

  if (!input) return;

  input.addEventListener("change", async e => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const dataURL = await compressImage(file);

      currentUser.photo = dataURL;
      saveLocalUser();
      updateProfileUI();

      if (currentUser.phone) {
        await setDoc(
          doc(db, "allowedUsers", normalizePhone(currentUser.phone)),
          {
            name: currentUser.name,
            phone: currentUser.phone,
            photo: dataURL,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }

      await addOnlineUser();

      alert("Profile photo updated.");
    } catch (error) {
      console.error(error);
      alert("Photo save नहीं हो पाई।");
    }
  });

  $("removeProfilePhotoBtn")?.addEventListener(
    "click",
    removeProfilePhoto
  );

  $("clearPhotoBtn")?.addEventListener(
    "click",
    removeProfilePhoto
  );
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();

      img.onload = () => {
        const max = 256;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > max) {
            height *= max / width;
            width = max;
          }
        } else {
          if (height > max) {
            width *= max / height;
            height = max;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        resolve(
          canvas.toDataURL("image/jpeg", 0.72)
        );
      };

      img.onerror = reject;
      img.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function removeProfilePhoto() {
  currentUser.photo = "";
  saveLocalUser();
  updateProfileUI();

  if (currentUser.phone) {
    await setDoc(
      doc(db, "allowedUsers", normalizePhone(currentUser.phone)),
      {
        photo: "",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  await addOnlineUser();
}

/* =========================================================
   CHAT — LOAD ALL HISTORY
   ========================================================= */

async function loadMessages() {
  const container = $("chatMessages");

  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "messages")
    );

    allMessages = [];

    snapshot.forEach(snap => {
      const data = snap.data();

      allMessages.push({
        id: snap.id,
        ...data
      });
    });

    allMessages.sort(
      (a, b) => timestampValue(a) - timestampValue(b)
    );

    renderMessages();
    await markMessagesSeen();
  } catch (error) {
    console.error("Messages error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <strong>Chat load नहीं हुआ</strong>
        <span>Firebase connection check करें।</span>
      </div>
    `;
  }
}

function renderMessages(searchTerm = "") {
  const container = $("chatMessages");

  if (!container) return;

  let messages = [...allMessages];

  if (searchTerm.trim()) {
    const term = normalize(searchTerm);

    messages = messages.filter(message =>
      normalize(message.text).includes(term) ||
      normalize(message.senderName).includes(term)
    );
  }

  if (!messages.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <strong>No messages</strong>
        <span>अभी कोई message नहीं है।</span>
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(message => {
    const mine = isCurrentUser(message);

    const seenBy = Array.isArray(message.seenBy)
      ? message.seenBy
      : [];

    const otherSeen = seenBy.filter(
      person =>
        normalizePhone(person.phone) !==
        normalizePhone(currentUser.phone)
    );

    const delivered =
      message.delivered === true ||
      otherSeen.length > 0;

    let ticks = "✓";

    if (delivered) {
      ticks = "✓✓";
    }

    if (otherSeen.length > 0) {
      ticks = `<span class="message-ticks seen">✓✓</span>`;
    }

    const seenButton =
      mine && otherSeen.length
        ? `
          <button
            class="seen-info-btn"
            data-message-info="${escapeHTML(message.id)}"
            type="button"
          >
            👁 ${otherSeen.length} seen
          </button>
        `
        : "";

    return `
      <div
        class="chat-message ${mine ? "mine" : ""}"
        data-message-id="${escapeHTML(message.id)}"
      >
        <div
          class="message-bubble selectable-item"
          data-selectable="true"
          data-collection="messages"
          data-id="${escapeHTML(message.id)}"
          data-owner-phone="${escapeHTML(message.senderPhone || "")}"
        >
          ${
            !mine
              ? `
                <div class="message-sender">
                  ${escapeHTML(message.senderName || "Student")}
                </div>
              `
              : ""
          }

          <div class="message-text">
            ${escapeHTML(message.text || "")}
          </div>

          <div class="message-meta">
            <span>${formatTime(message.createdAt || message.timestamp)}</span>

            ${
              mine
                ? `<span class="message-ticks ${
                    otherSeen.length ? "seen" : ""
                  }">${ticks}</span>`
                : ""
            }

            ${seenButton}
          </div>
        </div>
      </div>
    `;
  }).join("");

  setupLongPressSelection();
}

function scrollChatToBottom() {
  const container = $("chatMessages");

  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

/* =========================================================
   SEND MESSAGE
   ========================================================= */

function setupChat() {
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

  $("messageInput")?.addEventListener(
    "input",
    handleTyping
  );

  $("chatSearchBox")?.addEventListener(
    "input",
    e => {
      renderMessages(e.target.value);
    }
  );

  $("emojiBtn")?.addEventListener(
    "click",
    () => {
      const input = $("messageInput");

      if (!input) return;

      input.value += " 😊";
      input.focus();
      handleTyping();
    }
  );
}

async function sendMessage() {
  const input = $("messageInput");

  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  if (!canUseFullAccess()) {
    alert("Chat के लिए Owner की permission चाहिए।");
    return;
  }

  const message = {
    text,
    senderName: currentUser.name,
    senderPhone: currentUser.phone || "",
    senderPhoto: currentUser.photo || "",
    createdAt: serverTimestamp(),
    timestamp: serverTimestamp(),
    delivered: true,
    seenBy: []
  };

  try {
    await addDoc(
      collection(db, "messages"),
      message
    );

    input.value = "";

    await stopTyping();
    await logActivity(
      "message_added",
      `${currentUser.name} sent a message`
    );

    await loadMessages();
    scrollChatToBottom();
  } catch (error) {
    console.error(error);
    alert("Message send नहीं हुआ।");
  }
}

/* =========================================================
   SEEN / MESSAGE INFO
   ========================================================= */

async function markMessagesSeen() {
  if (!currentUser.name || !allMessages.length) return;

  const updates = allMessages.filter(
    message => !isCurrentUser(message)
  );

  for (const message of updates) {
    const seenBy = Array.isArray(message.seenBy)
      ? [...message.seenBy]
      : [];

    const alreadySeen = seenBy.some(
      person =>
        normalizePhone(person.phone) ===
        normalizePhone(currentUser.phone) &&
        currentUser.phone
    );

    if (alreadySeen) continue;

    const person = {
      name: currentUser.name,
      phone: currentUser.phone || "",
      seenAt: new Date().toISOString()
    };

    seenBy.push(person);

    try {
      await updateDoc(
        doc(db, "messages", message.id),
        {
          seenBy,
          delivered: true
        }
      );

      message.seenBy = seenBy;
    } catch {}
  }

  renderMessages(
    $("chatSearchBox")?.value || ""
  );
}

function setupMessageInfo() {
  document.addEventListener("click", e => {
    const button =
      e.target.closest("[data-message-info]");

    if (!button) return;

    const id = button.dataset.messageInfo;

    const message = allMessages.find(
      item => item.id === id
    );

    if (!message) return;

    openMessageInfo(message);
  });
}

function openMessageInfo(message) {
  const modal = $("messageInfoModal");

  if (!modal) {
    alert(
      (message.seenBy || [])
        .map(user => user.name)
        .join("\n") || "No one has seen this message yet."
    );
    return;
  }

  const list =
    modal.querySelector(".seen-by-list") ||
    modal.querySelector("[data-seen-list]") ||
    modal.querySelector(".modal-body");

  const people = Array.isArray(message.seenBy)
    ? message.seenBy
    : [];

  if (list) {
    list.innerHTML = people.length
      ? people.map(person => `
          <div class="seen-by-user">
            ${avatarHTML("", person.name, "avatar")}
            <div>
              <div class="seen-by-user-name">
                ${escapeHTML(person.name)}
              </div>
              <div class="seen-by-user-time">
                ${formatDateTime(person.seenAt)}
              </div>
            </div>
          </div>
        `).join("")
      : `
        <div class="empty-state">
          <strong>Not seen yet</strong>
        </div>
      `;
  }

  modal.classList.add("show");
  modal.classList.remove("hidden");
}

/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function handleTyping() {
  if (!currentUser.name) return;

  updateTyping();

  if (typingInterval) {
    clearTimeout(typingInterval);
  }

  typingInterval = setTimeout(
    stopTyping,
    2500
  );
}

async function updateTyping() {
  const id =
    normalizePhone(currentUser.phone) ||
    normalize(currentUser.name).replace(/\s+/g, "_");

  try {
    await setDoc(
      doc(db, "typing", id),
      {
        name: currentUser.name,
        phone: currentUser.phone || "",
        typing: true,
        updatedAt: serverTimestamp()
      }
    );
  } catch {}
}

async function stopTyping() {
  const id =
    normalizePhone(currentUser.phone) ||
    normalize(currentUser.name).replace(/\s+/g, "_");

  try {
    await setDoc(
      doc(db, "typing", id),
      {
        name: currentUser.name,
        phone: currentUser.phone || "",
        typing: false,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch {}
}

async function loadTypingUsers() {
  const indicator = $("typingIndicator");

  if (!indicator) return;

  try {
    const snapshot = await getDocs(
      collection(db, "typing")
    );

    const people = [];

    snapshot.forEach(snap => {
      const data = snap.data();

      if (
        data.typing &&
        normalizePhone(data.phone) !==
          normalizePhone(currentUser.phone)
      ) {
        people.push(data.name);
      }
    });

    indicator.textContent = people.length
      ? `${people.join(", ")} typing...`
      : "";
  } catch {}
}

/* =========================================================
   HOMEWORK
   ========================================================= */

async function loadHomework() {
  const container =
    $("homeworkList") ||
    $("homeworkItems");

  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "homework")
    );

    allHomework = [];

    snapshot.forEach(snap => {
      allHomework.push({
        id: snap.id,
        ...snap.data()
      });
    });

    allHomework.sort(
      (a, b) => timestampValue(b) - timestampValue(a)
    );

    renderHomework();
  } catch (error) {
    console.error(error);
  }
}

function renderHomework() {
  const container =
    $("homeworkList") ||
    $("homeworkItems");

  if (!container) return;

  if (!allHomework.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <strong>No Homework</strong>
        <span>Homework यहाँ दिखाई देगा।</span>
      </div>
    `;
    return;
  }

  container.innerHTML = allHomework.map(item => `
    <div
      class="selectable-item"
      data-selectable="true"
      data-collection="homework"
      data-id="${escapeHTML(item.id)}"
      data-owner-phone="${escapeHTML(item.senderPhone || "")}"
    >
      <div class="item-title">
        ${escapeHTML(item.title || item.subject || "Homework")}
      </div>

      <div class="item-body">
        ${escapeHTML(item.text || item.description || "")}
      </div>

      <div class="item-meta">
        <span>
          By <strong>${escapeHTML(item.senderName || "Teacher")}</strong>
        </span>
        <span>${formatDateTime(item.createdAt || item.timestamp)}</span>
      </div>
    </div>
  `).join("");

  setupLongPressSelection();
}

async function addHomework() {
  if (!canUseFullAccess()) {
    alert("Homework add करने के लिए permission चाहिए।");
    return;
  }

  const title =
    $("homeworkTitle")?.value.trim() ||
    $("homeworkSubject")?.value.trim();

  const text =
    $("homeworkText")?.value.trim() ||
    $("homeworkDescription")?.value.trim();

  if (!title || !text) {
    alert("Title और homework लिखें।");
    return;
  }

  try {
    await addDoc(
      collection(db, "homework"),
      {
        title,
        text,
        senderName: currentUser.name,
        senderPhone: currentUser.phone || "",
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      }
    );

    clearFields([
      "homeworkTitle",
      "homeworkSubject",
      "homeworkText",
      "homeworkDescription"
    ]);

    await logActivity(
      "homework_added",
      `${currentUser.name} added homework`
    );

    await loadHomework();
  } catch (error) {
    console.error(error);
    alert("Homework save नहीं हुआ।");
  }
}

/* =========================================================
   SCHOOL UPDATES
   ========================================================= */

async function loadSchoolUpdates() {
  const container =
    $("schoolUpdatesList") ||
    $("schoolList");

  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "schoolUpdates")
    );

    allSchoolUpdates = [];

    snapshot.forEach(snap => {
      allSchoolUpdates.push({
        id: snap.id,
        ...snap.data()
      });
    });

    allSchoolUpdates.sort(
      (a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return timestampValue(b) - timestampValue(a);
      }
    );

    renderSchoolUpdates();
  } catch (error) {
    console.error(error);
  }
}

function renderSchoolUpdates() {
  const container =
    $("schoolUpdatesList") ||
    $("schoolList");

  if (!container) return;

  if (!allSchoolUpdates.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏫</div>
        <strong>No School Updates</strong>
      </div>
    `;
    return;
  }

  container.innerHTML = allSchoolUpdates.map(item => `
    <div
      class="selectable-item"
      data-selectable="true"
      data-collection="schoolUpdates"
      data-id="${escapeHTML(item.id)}"
      data-owner-phone="${escapeHTML(item.senderPhone || "")}"
    >
      ${
        item.pinned
          ? `<div class="pin-badge">📌 Important</div>`
          : ""
      }

      <div class="item-title">
        ${escapeHTML(item.title || "School Update")}
      </div>

      <div class="item-body">
        ${escapeHTML(item.text || item.description || "")}
      </div>

      <div class="item-meta">
        <span>
          By <strong>${escapeHTML(item.senderName || "School")}</strong>
        </span>
        <span>${formatDateTime(item.createdAt || item.timestamp)}</span>
      </div>
    </div>
  `).join("");

  setupLongPressSelection();
}

async function addSchoolUpdate() {
  if (!canUseFullAccess()) {
    alert("School Update add करने के लिए permission चाहिए।");
    return;
  }

  const title =
    $("schoolTitle")?.value.trim() ||
    $("schoolUpdateTitle")?.value.trim();

  const text =
    $("schoolText")?.value.trim() ||
    $("schoolUpdateText")?.value.trim();

  if (!title || !text) {
    alert("Title और update लिखें।");
    return;
  }

  try {
    await addDoc(
      collection(db, "schoolUpdates"),
      {
        title,
        text,
        senderName: currentUser.name,
        senderPhone: currentUser.phone || "",
        pinned: false,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      }
    );

    clearFields([
      "schoolTitle",
      "schoolUpdateTitle",
      "schoolText",
      "schoolUpdateText"
    ]);

    await logActivity(
      "school_update_added",
      `${currentUser.name} added a school update`
    );

    await loadSchoolUpdates();
  } catch (error) {
    console.error(error);
    alert("School update save नहीं हुआ।");
  }
}

/* =========================================================
   NOTES
   ========================================================= */

async function loadNotes() {
  const container =
    $("notesList") ||
    $("noteList");

  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "notes")
    );

    allNotes = [];

    snapshot.forEach(snap => {
      allNotes.push({
        id: snap.id,
        ...snap.data()
      });
    });

    allNotes.sort(
      (a, b) => timestampValue(b) - timestampValue(a)
    );

    renderNotes();
  } catch (error) {
    console.error(error);
  }
}

function renderNotes() {
  const container =
    $("notesList") ||
    $("noteList");

  if (!container) return;

  if (!allNotes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <strong>No Notes</strong>
      </div>
    `;
    return;
  }

  container.innerHTML = allNotes.map(note => `
    <div
      class="selectable-item"
      data-selectable="true"
      data-collection="notes"
      data-id="${escapeHTML(note.id)}"
      data-owner-phone="${escapeHTML(note.senderPhone || "")}"
    >
      <div class="item-title">
        ${escapeHTML(note.title || "Note")}
      </div>

      <div class="item-body">
        ${escapeHTML(note.text || note.content || "")}
      </div>

      <div class="item-meta">
        <span>
          By <strong>${escapeHTML(note.senderName || "Student")}</strong>
        </span>
        <span>${formatDateTime(note.createdAt || note.timestamp)}</span>
      </div>
    </div>
  `).join("");

  setupLongPressSelection();
}

async function addNote() {
  if (!canUseFullAccess()) {
    alert("Notes add करने के लिए permission चाहिए।");
    return;
  }

  const title =
    $("noteTitle")?.value.trim() ||
    "Note";

  const text =
    $("noteText")?.value.trim() ||
    $("noteContent")?.value.trim();

  if (!text) {
    alert("Note लिखें।");
    return;
  }

  try {
    await addDoc(
      collection(db, "notes"),
      {
        title,
        text,
        senderName: currentUser.name,
        senderPhone: currentUser.phone || "",
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      }
    );

    clearFields([
      "noteTitle",
      "noteText",
      "noteContent"
    ]);

    await logActivity(
      "note_added",
      `${currentUser.name} added a note`
    );

    await loadNotes();
  } catch (error) {
    console.error(error);
    alert("Note save नहीं हुआ।");
  }
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

async function loadNotifications() {
  const container =
    $("notificationsList") ||
    $("notificationList");

  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "notifications")
    );

    allNotifications = [];

    snapshot.forEach(snap => {
      allNotifications.push({
        id: snap.id,
        ...snap.data()
      });
    });

    allNotifications.sort(
      (a, b) => timestampValue(b) - timestampValue(a)
    );

    renderNotifications();
  } catch (error) {
    console.error(error);
  }
}

function renderNotifications() {
  const container =
    $("notificationsList") ||
    $("notificationList");

  if (!container) return;

  if (!allNotifications.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔔</div>
        <strong>No Notifications</strong>
      </div>
    `;
    return;
  }

  container.innerHTML = allNotifications.map(item => `
    <div
      class="notification-item selectable-item"
      data-selectable="true"
      data-collection="notifications"
      data-id="${escapeHTML(item.id)}"
      data-owner-phone="${escapeHTML(item.senderPhone || "")}"
    >
      <div class="notification-icon">🔔</div>

      <div class="notification-content">
        <div class="notification-title">
          ${escapeHTML(item.title || "Notification")}
        </div>

        <div class="notification-text">
          ${escapeHTML(item.text || item.message || "")}
        </div>

        <div class="notification-time">
          ${formatDateTime(item.createdAt || item.timestamp)}
        </div>
      </div>
    </div>
  `).join("");

  setupLongPressSelection();
}

async function sendNotification() {
  if (!isOwner) {
    alert("Only Owner can send announcements.");
    return;
  }

  const title =
    $("notificationTitle")?.value.trim() ||
    $("announcementTitle")?.value.trim();

  const text =
    $("notificationText")?.value.trim() ||
    $("announcementText")?.value.trim();

  if (!title || !text) {
    alert("Title और message लिखें।");
    return;
  }

  try {
    await addDoc(
      collection(db, "notifications"),
      {
        title,
        text,
        senderName: OWNER_NAME,
        senderPhone: OWNER_PHONE,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      }
    );

    clearFields([
      "notificationTitle",
      "announcementTitle",
      "notificationText",
      "announcementText"
    ]);

    await logActivity(
      "notification_sent",
      `${OWNER_NAME} sent an announcement`
    );

    await loadNotifications();

    alert("Announcement sent.");
  } catch (error) {
    console.error(error);
    alert("Notification send नहीं हुई।");
  }
}

/* =========================================================
   GROUPS
   ========================================================= */

async function loadGroups() {
  const container =
    $("groupList") ||
    $("groupsList");

  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "groups")
    );

    allGroups = [];

    snapshot.forEach(snap => {
      allGroups.push({
        id: snap.id,
        ...snap.data()
      });
    });

    allGroups.sort(
      (a, b) => timestampValue(b) - timestampValue(a)
    );

    renderGroups();
  } catch (error) {
    console.error("Groups:", error);
  }
}

function renderGroups() {
  const container =
    $("groupList") ||
    $("groupsList");

  if (!container) return;

  if (!allGroups.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <strong>No Groups</strong>
        <span>अभी कोई group नहीं बना है।</span>
      </div>
    `;
    return;
  }

  container.innerHTML = allGroups.map(group => `
    <div
      class="group-item selectable-item"
      data-selectable="true"
      data-collection="groups"
      data-id="${escapeHTML(group.id)}"
      data-owner-phone="${escapeHTML(group.ownerPhone || "")}"
    >
      <div class="group-icon">👥</div>

      <div class="group-info">
        <div class="group-name">
          ${escapeHTML(group.name || "Group")}
        </div>

        <div class="group-members">
          ${Array.isArray(group.members)
            ? group.members.length
            : 0} members
        </div>
      </div>
    </div>
  `).join("");

  setupLongPressSelection();
}

async function createGroup() {
  if (!canUseFullAccess()) {
    alert("Group create करने के लिए permission चाहिए।");
    return;
  }

  const name =
    $("groupName")?.value.trim() ||
    $("newGroupName")?.value.trim();

  if (!name) {
    alert("Group name लिखें।");
    return;
  }

  const password =
    $("groupPassword")?.value.trim() || "";

  try {
    await addDoc(
      collection(db, "groups"),
      {
        name,
        password,
        ownerName: currentUser.name,
        ownerPhone: currentUser.phone || "",
        members: [
          {
            name: currentUser.name,
            phone: currentUser.phone || ""
          }
        ],
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      }
    );

    clearFields([
      "groupName",
      "newGroupName",
      "groupPassword"
    ]);

    await logActivity(
      "group_created",
      `${currentUser.name} created ${name}`
    );

    await loadGroups();
  } catch (error) {
    console.error(error);
    alert("Group create नहीं हुआ।");
  }
}

/* =========================================================
   GROUP UNLOCK
   ========================================================= */

function setupGroupUnlock() {
  $("unlockGroupBtn")?.addEventListener(
    "click",
    async () => {
      const password =
        $("groupPasswordInput")?.value || "";

      const selectedGroup =
        allGroups[0];

      if (!selectedGroup) {
        showMessage(
          "groupPasswordMessage",
          "कोई group available नहीं है।",
          "danger"
        );
        return;
      }

      if (
        selectedGroup.password &&
        password !== selectedGroup.password
      ) {
        showMessage(
          "groupPasswordMessage",
          "गलत group password.",
          "danger"
        );
        return;
      }

      show($("groupContent"));
      hide($("groupUnlockBox"));

      renderGroupMembers(selectedGroup);
    }
  );
}

function renderGroupMembers(group) {
  const container = $("memberList");

  if (!container) return;

  const members =
    Array.isArray(group.members)
      ? group.members
      : [];

  container.innerHTML = members.length
    ? members.map(member => `
        <div class="online-user">
          ${avatarHTML("", member.name)}
          <div class="online-user-info">
            <div class="online-user-name">
              ${escapeHTML(member.name)}
            </div>
            <div class="online-user-status">
              Member
            </div>
          </div>
        </div>
      `).join("")
    : `
      <div class="empty-state">
        No members
      </div>
    `;
}

/* =========================================================
   DELETE / LONG PRESS MULTI SELECT
   ========================================================= */

function setupLongPressSelection() {
  qsa("[data-selectable='true']").forEach(item => {
    if (item.dataset.longPressReady === "true") return;

    item.dataset.longPressReady = "true";

    let timer = null;

    const start = () => {
      timer = setTimeout(() => {
        enterSelectionMode(item);
      }, 650);
    };

    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    item.addEventListener(
      "touchstart",
      start,
      { passive: true }
    );

    item.addEventListener(
      "touchend",
      cancel
    );

    item.addEventListener(
      "touchmove",
      cancel
    );

    item.addEventListener(
      "mousedown",
      start
    );

    item.addEventListener(
      "mouseup",
      cancel
    );

    item.addEventListener(
      "mouseleave",
      cancel
    );

    item.addEventListener(
      "click",
      () => {
        if (selectionMode) {
          toggleSelection(item);
        }
      }
    );
  });
}

function enterSelectionMode(item) {
  selectionMode = true;
  selectedItems.clear();

  addSelectionToolbar();

  toggleSelection(item);
}

function toggleSelection(item) {
  const id =
    `${item.dataset.collection}:${item.dataset.id}`;

  if (selectedItems.has(id)) {
    selectedItems.delete(id);
    item.classList.remove("selected");
  } else {
    selectedItems.add(id);
    item.classList.add("selected");
  }

  updateSelectionToolbar();

  if (!selectedItems.size) {
    exitSelectionMode();
  }
}

function addSelectionToolbar() {
  if ($("selectionToolbar")) return;

  const toolbar = document.createElement("div");

  toolbar.id = "selectionToolbar";
  toolbar.className = "selection-toolbar";

  toolbar.innerHTML = `
    <div class="selection-count">
      <span id="selectionCount">0</span> selected
    </div>

    <div class="selection-actions">
      <button
        class="btn btn-secondary btn-sm"
        id="cancelSelectionBtn"
        type="button"
      >
        Cancel
      </button>

      <button
        class="btn btn-danger btn-sm"
        id="deleteSelectedBtn"
        type="button"
      >
        Delete
      </button>
    </div>
  `;

  document.body.appendChild(toolbar);

  $("cancelSelectionBtn")?.addEventListener(
    "click",
    exitSelectionMode
  );

  $("deleteSelectedBtn")?.addEventListener(
    "click",
    deleteSelectedItems
  );
}

function updateSelectionToolbar() {
  setText(
    "selectionCount",
    selectedItems.size
  );
}

function exitSelectionMode() {
  selectionMode = false;
  selectedItems.clear();

  qsa(".selectable-item.selected").forEach(item => {
    item.classList.remove("selected");
  });

  $("selectionToolbar")?.remove();
}

async function deleteSelectedItems() {
  if (!selectedItems.size) return;

  const confirmed = confirm(
    `${selectedItems.size} item delete करना है?`
  );

  if (!confirmed) return;

  for (const selected of selectedItems) {
    const [collectionName, id] =
      selected.split(":");

    const item =
      findItemByCollection(
        collectionName,
        id
      );

    if (!isOwner && item) {
      const ownerPhone = normalizePhone(
        item.senderPhone ||
        item.ownerPhone ||
        item.userPhone ||
        ""
      );

      const myPhone =
        normalizePhone(currentUser.phone);

      const owns =
        ownerPhone &&
        myPhone &&
        ownerPhone === myPhone;

      if (!owns) {
        continue;
      }
    }

    try {
      await deleteDoc(
        doc(db, collectionName, id)
      );

      await logActivity(
        "content_deleted",
        `${currentUser.name} deleted ${collectionName}/${id}`
      );
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );
    }
  }

  exitSelectionMode();

  await loadEverything();
}

function findItemByCollection(collectionName, id) {
  const map = {
    messages: allMessages,
    homework: allHomework,
    schoolUpdates: allSchoolUpdates,
    notes: allNotes,
    notifications: allNotifications,
    groups: allGroups
  };

  return (
    map[collectionName]?.find(
      item => item.id === id
    ) || null
  );
}

/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

function setupGlobalSearch() {
  const input =
    $("globalSearch") ||
    $("searchInput");

  if (!input) return;

  input.addEventListener(
    "input",
    e => {
      performGlobalSearch(e.target.value);
    }
  );
}

function performGlobalSearch(term) {
  const value = normalize(term);

  const container =
    $("globalSearchResults");

  if (!container) return;

  if (!value) {
    container.innerHTML = "";
    return;
  }

  const results = [];

  allMessages.forEach(item => {
    if (
      normalize(item.text).includes(value) ||
      normalize(item.senderName).includes(value)
    ) {
      results.push({
        type: "Chat",
        title: item.senderName || "Chat",
        text: item.text || "",
        time: item.createdAt || item.timestamp
      });
    }
  });

  allHomework.forEach(item => {
    if (
      normalize(item.title).includes(value) ||
      normalize(item.text).includes(value)
    ) {
      results.push({
        type: "Homework",
        title: item.title || "Homework",
        text: item.text || "",
        time: item.createdAt || item.timestamp
      });
    }
  });

  allSchoolUpdates.forEach(item => {
    if (
      normalize(item.title).includes(value) ||
      normalize(item.text).includes(value)
    ) {
      results.push({
        type: "School",
        title: item.title || "School Update",
        text: item.text || "",
        time: item.createdAt || item.timestamp
      });
    }
  });

  allNotes.forEach(item => {
    if (
      normalize(item.title).includes(value) ||
      normalize(item.text).includes(value)
    ) {
      results.push({
        type: "Notes",
        title: item.title || "Note",
        text: item.text || "",
        time: item.createdAt || item.timestamp
      });
    }
  });

  allGroups.forEach(item => {
    if (normalize(item.name).includes(value)) {
      results.push({
        type: "Group",
        title: item.name || "Group",
        text: "Group",
        time: item.createdAt || item.timestamp
      });
    }
  });

  allNotifications.forEach(item => {
    if (
      normalize(item.title).includes(value) ||
      normalize(item.text).includes(value)
    ) {
      results.push({
        type: "Notification",
        title: item.title || "Notification",
        text: item.text || "",
        time: item.createdAt || item.timestamp
      });
    }
  });

  if (!results.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No results</strong>
        <span>कुछ नहीं मिला।</span>
      </div>
    `;
    return;
  }

  container.innerHTML = results
    .slice(0, 50)
    .map(result => `
      <div class="selectable-item">
        <div class="item-title">
          ${escapeHTML(result.title)}
        </div>

        <div class="item-body">
          ${escapeHTML(result.text)}
        </div>

        <div class="item-meta">
          <span>${escapeHTML(result.type)}</span>
          <span>${formatDateTime(result.time)}</span>
        </div>
      </div>
    `)
    .join("");
}

/* =========================================================
   OWNER PANEL
   ========================================================= */

async function openOwnerPanel() {
  if (!isOwner) return;

  const panel =
    $("ownerPanel") ||
    $("ownerPanelScreen");

  if (panel) {
    panel.classList.remove("hidden");
  }

  await loadOwnerData();
}

async function loadOwnerData() {
  await Promise.all([
    loadAllUsers(),
    loadOnlineUsers(),
    loadMessages(),
    loadGroups(),
    loadSchoolUpdates(),
    loadHomework(),
    loadNotifications()
  ]);

  updateOwnerStats();
  renderOwnerUsers();
  renderOwnerMessages();
  renderOwnerGroups();
  renderOwnerActivity();
}

async function loadAllUsers() {
  allUsers = [];

  try {
    const snapshot = await getDocs(
      collection(db, "allowedUsers")
    );

    snapshot.forEach(snap => {
      allUsers.push({
        id: snap.id,
        ...snap.data()
      });
    });

    allUsers.sort(
      (a, b) =>
        normalize(a.name).localeCompare(
          normalize(b.name)
        )
    );
  } catch (error) {
    console.error("Users:", error);
  }
}

function updateOwnerStats() {
  const online =
    qsa(".online-user").length;

  setText(
    "totalStudents",
    allUsers.length
  );

  setText(
    "allowedStudents",
    allUsers.filter(
      user =>
        user.status === "allowed" ||
        user.allowed === true
    ).length
  );

  setText(
    "blockedStudents",
    allUsers.filter(
      user => user.status === "blocked"
    ).length
  );

  setText(
    "onlineStudents",
    online
  );

  setText(
    "totalMessages",
    allMessages.length
  );

  setText(
    "totalGroups",
    allGroups.length
  );
}

function renderOwnerUsers() {
  const container =
    $("ownerUserList") ||
    $("userManagementList") ||
    $("studentsList");

  if (!container) return;

  if (!allUsers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No registered students</strong>
      </div>
    `;
    return;
  }

  container.innerHTML = allUsers.map(user => {
    const phone =
      normalizePhone(user.phone);

    const owner =
      phone === normalizePhone(OWNER_PHONE) ||
      normalize(user.name) === normalize(OWNER_NAME) ||
      normalize(user.name) === normalize(OWNER_FIRST_NAME);

    let status = owner
      ? "owner"
      : user.status || "basic";

    return `
      <div class="management-user">
        ${avatarHTML(user.photo, user.name)}

        <div class="management-user-info">
          <div class="management-user-name">
            ${escapeHTML(user.name || "Student")}
          </div>

          <div class="management-user-phone">
            ${escapeHTML(user.phone || "")}
          </div>

          <div style="margin-top:5px;">
            <span class="status-badge status-${status}">
              ${status.toUpperCase()}
            </span>
          </div>
        </div>

        ${
          owner
            ? `
              <span class="status-badge status-owner">
                OWNER
              </span>
            `
            : `
              <div class="management-user-actions">
                <button
                  class="btn btn-success btn-sm"
                  data-allow-user="${escapeHTML(phone)}"
                  type="button"
                >
                  Allow
                </button>

                <button
                  class="btn btn-danger btn-sm"
                  data-block-user="${escapeHTML(phone)}"
                  type="button"
                >
                  No Allow
                </button>
              </div>
            `
        }
      </div>
    `;
  }).join("");
}

function setupOwnerActions() {
  document.addEventListener("click", async e => {
    const allow =
      e.target.closest("[data-allow-user]");

    if (allow) {
      await changeUserAccess(
        allow.dataset.allowUser,
        "allowed"
      );
      return;
    }

    const block =
      e.target.closest("[data-block-user]");

    if (block) {
      await changeUserAccess(
        block.dataset.blockUser,
        "blocked"
      );
      return;
    }

    const openOwner =
      e.target.closest("#ownerLoginBtn");

    if (openOwner) {
      if (isOwner) {
        openOwnerPanel();
      } else {
        const password =
          prompt("Owner password:");

        if (password === OWNER_PASSWORD) {
          isOwner = true;
          accessStatus = "owner";
          openOwnerPanel();
        } else {
          alert("Wrong owner password.");
        }
      }
    }
  });
}

async function changeUserAccess(
  phone,
  status
) {
  if (!isOwner) return;

  const cleanPhone =
    normalizePhone(phone);

  if (
    cleanPhone ===
    normalizePhone(OWNER_PHONE)
  ) {
    alert("Owner को block नहीं किया जा सकता।");
    return;
  }

  const user =
    allUsers.find(
      item =>
        normalizePhone(item.phone) ===
        cleanPhone
    );

  if (!user) return;

  try {
    await setDoc(
      doc(db, "allowedUsers", cleanPhone),
      {
        name: user.name,
        phone: cleanPhone,
        photo: user.photo || "",
        status,
        allowed: status === "allowed",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    await logActivity(
      status === "allowed"
        ? "user_allowed"
        : "user_blocked",
      `${user.name} was ${status}`
    );

    await loadAllUsers();
    renderOwnerUsers();
    updateOwnerStats();

    alert(
      status === "allowed"
        ? `${user.name} को full access मिल गया।`
        : `${user.name} blocked है।`
    );
  } catch (error) {
    console.error(error);
    alert("Access update नहीं हुआ।");
  }
}

function renderOwnerMessages() {
  const container =
    $("ownerMessages") ||
    $("chatManagementList");

  if (!container) return;

  container.innerHTML = allMessages
    .slice(-30)
    .reverse()
    .map(message => `
      <div class="selectable-item">
        <div class="item-title">
          ${escapeHTML(message.senderName || "Student")}
        </div>

        <div class="item-body">
          ${escapeHTML(message.text || "")}
        </div>

        <div class="item-meta">
          <span>
            ${formatDateTime(message.createdAt || message.timestamp)}
          </span>
        </div>
      </div>
    `)
    .join("");
}

function renderOwnerGroups() {
  const container =
    $("ownerGroups") ||
    $("groupManagementList");

  if (!container) return;

  container.innerHTML = allGroups.map(group => `
    <div class="management-user">
      <div class="group-icon">👥</div>

      <div class="management-user-info">
        <div class="management-user-name">
          ${escapeHTML(group.name || "Group")}
        </div>

        <div class="management-user-phone">
          Owner: ${escapeHTML(group.ownerName || "")}
        </div>
      </div>

      <button
        class="btn btn-danger btn-sm"
        data-owner-delete-group="${escapeHTML(group.id)}"
        type="button"
      >
        Delete
      </button>
    </div>
  `).join("");
}

function setupOwnerGroupDelete() {
  document.addEventListener("click", async e => {
    const button =
      e.target.closest(
        "[data-owner-delete-group]"
      );

    if (!button || !isOwner) return;

    if (!confirm("यह group delete करना है?")) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "groups",
          button.dataset.ownerDeleteGroup
        )
      );

      await logActivity(
        "group_deleted",
        `Owner deleted a group`
      );

      await loadGroups();
      renderOwnerGroups();
      updateOwnerStats();
    } catch (error) {
      console.error(error);
    }
  });
}

/* =========================================================
   ACTIVITY LOG
   ========================================================= */

async function logActivity(
  action,
  details
) {
  try {
    await addDoc(
      collection(db, "activity"),
      {
        action,
        details,
        userName: currentUser.name || OWNER_NAME,
        userPhone: currentUser.phone || OWNER_PHONE,
        time: new Date().toISOString(),
        createdAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error(
      "Activity log:",
      error
    );
  }
}

async function renderOwnerActivity() {
  const container =
    $("activityList") ||
    $("ownerActivityList");

  if (!container) return;

  try {
    const snapshot = await getDocs(
      collection(db, "activity")
    );

    const activity = [];

    snapshot.forEach(snap => {
      activity.push({
        id: snap.id,
        ...snap.data()
      });
    });

    activity.sort(
      (a, b) => timestampValue(b) - timestampValue(a)
    );

    container.innerHTML =
      activity.slice(0, 100).map(item => `
        <div class="activity-item">
          <div class="activity-text">
            ${escapeHTML(item.details || item.action || "")}
          </div>

          <div class="activity-time">
            ${escapeHTML(item.userName || "")}
            •
            ${formatDateTime(item.createdAt || item.time)}
          </div>
        </div>
      `).join("");
  } catch (error) {
    console.error(error);
  }
}

/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {
  $("saveNameBtn")?.addEventListener(
    "click",
    async () => {
      const input =
        $("settingsName") ||
        $("profileNameInput") ||
        $("newProfileName");

      if (!input) return;

      const name = input.value.trim();

      if (!name) {
        alert("Name लिखें।");
        return;
      }

      currentUser.name = name;
      saveLocalUser();
      updateProfileUI();

      if (currentUser.phone) {
        await setDoc(
          doc(
            db,
            "allowedUsers",
            normalizePhone(currentUser.phone)
          ),
          {
            name,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }

      await addOnlineUser();

      alert("Name updated.");
    }
  );

  $("clearDataBtn")?.addEventListener(
    "click",
    () => {
      const confirmed = confirm(
        "Local profile data clear करना है?"
      );

      if (!confirmed) return;

      localStorage.removeItem(
        "studyconnect_user"
      );

      location.reload();
    }
  );

  $("darkModeToggle")?.addEventListener(
    "change",
    e => {
      setTheme(
        e.target.checked ? "dark" : "light"
      );
    }
  );

  $("themeToggle")?.addEventListener(
    "click",
    () => {
      const dark =
        document.body.classList.contains(
          "dark-mode"
        );

      setTheme(
        dark ? "light" : "dark"
      );
    }
  );

  $("languageToggle")?.addEventListener(
    "change",
    e => {
      localStorage.setItem(
        "studyconnect_language",
        e.target.value
      );
    }
  );
}

function setTheme(theme) {
  const dark = theme === "dark";

  document.body.classList.toggle(
    "dark-mode",
    dark
  );

  localStorage.setItem(
    "studyconnect_theme",
    theme
  );

  const toggle =
    $("darkModeToggle");

  if (toggle) {
    toggle.checked = dark;
  }
}

function loadTheme() {
  const theme =
    localStorage.getItem(
      "studyconnect_theme"
    ) || "light";

  setTheme(theme);
}

/* =========================================================
   MODAL CLOSE
   ========================================================= */

function setupModals() {
  document.addEventListener("click", e => {
    const close =
      e.target.closest(
        "[data-close-modal]"
      );

    if (close) {
      const modal =
        close.closest(".modal-overlay");

      modal?.classList.remove("show");
      modal?.classList.add("hidden");
    }

    if (
      e.target.classList.contains(
        "modal-overlay"
      )
    ) {
      e.target.classList.remove("show");
      e.target.classList.add("hidden");
    }
  });
}

/* =========================================================
   UTILITY
   ========================================================= */

function clearFields(ids) {
  ids.forEach(id => {
    const el = $(id);

    if (el) el.value = "";
  });
}

/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadEverything() {
  await Promise.all([
    loadMessages(),
    loadHomework(),
    loadSchoolUpdates(),
    loadNotes(),
    loadNotifications(),
    loadGroups(),
    loadOnlineUsers()
  ]);

  updateOwnerStats();
}

/* =========================================================
   BUTTON FALLBACKS
   ========================================================= */

function setupContentButtons() {
  $("addHomeworkBtn")?.addEventListener(
    "click",
    addHomework
  );

  $("saveSchoolBtn")?.addEventListener(
    "click",
    addSchoolUpdate
  );

  $("saveNoteBtn")?.addEventListener(
    "click",
    addNote
  );

  $("sendNotificationBtn")?.addEventListener(
    "click",
    sendNotification
  );

  $("sendAnnouncementBt
