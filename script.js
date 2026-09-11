// StudyConnect - script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
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
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCquBX2YB59FObuIyi3swcWc3aUCdPWypag",
  authDomain: "studyconnect-99006.firebaseapp.com",
  projectId: "studyconnect-99006",
  storageBucket: "studyconnect-99006.firebasestorage.app",
  messagingSenderId: "15964627995",
  appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
  measurementId: "G-SYJYMREJJL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const APP_PASSWORD = "123";
const OWNER_PASSWORD = "12341";
const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

let currentUser = null;
let accessStatus = "basic";
let isOwner = false;
let unsubscribeMessages = null;
let unsubscribeTyping = null;
let unsubscribeOnline = null;
let typingTimer = null;
let onlineHeartbeat = null;

const $ = id => document.getElementById(id);

function show(id) {
  const el = $(id);
  if (el) el.style.display = "";
}

function hide(id) {
  const el = $(id);
  if (el) el.style.display = "none";
}

function text(id, value) {
  const el = $(id);
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

function formatTime(value) {
  if (!value) return "";

  let date;

  if (value?.toDate) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ownerIdentity(name = "", phone = "") {
  const n = name.trim().toLowerCase();
  const p = phone.trim();

  return (
    n === "krishna" ||
    n === "krishna yadav" ||
    n === OWNER_NAME.toLowerCase() ||
    p === OWNER_PHONE
  );
}

/* ---------------- PASSWORD ---------------- */

function setupPassword() {
  const unlockBtn = $("unlockBtn");

  if (!unlockBtn) return;

  unlockBtn.onclick = async () => {
    const password = $("appPassword")?.value.trim();

    if (password !== APP_PASSWORD) {
      text("passwordError", "गलत App Password");
      return;
    }

    text("passwordError", "");
    hide("passwordScreen");

    const savedName = localStorage.getItem("studyName");
    const savedPhone = localStorage.getItem("studyPhone");

    if (savedName && savedPhone) {
      await loginUser(savedName, savedPhone);
    } else {
      show("contactScreen");
    }
  };
}

/* ---------------- PROFILE / LOGIN ---------------- */

async function loginUser(name, phone) {
  name = name.trim();
  phone = phone.trim();

  if (!name || !phone) {
    text("loginMessage", "नाम और मोबाइल नंबर डालें");
    return;
  }

  isOwner = ownerIdentity(name, phone);

  currentUser = {
    name,
    phone,
    isOwner
  };

  localStorage.setItem("studyName", name);
  localStorage.setItem("studyPhone", phone);

  if (isOwner) {
    accessStatus = "owner";
    await enterMainApp();
    showOwnerWelcome();
    return;
  }

  try {
    const ref = doc(db, "allowedUsers", phone);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        name,
        phone,
        status: "basic",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      accessStatus = "basic";
    } else {
      const data = snap.data();

      accessStatus = data.status || "basic";

      await updateDoc(ref, {
        name,
        updatedAt: serverTimestamp()
      }).catch(() => {});
    }

    if (accessStatus === "blocked") {
      showBlockedScreen();
      return;
    }

    await enterMainApp();
  } catch (error) {
    console.error(error);
    text("loginMessage", "Firebase से connection नहीं हो पाया");
  }
}

function setupContact() {
  const btn = $("enterAppBtn");

  if (!btn) return;

  btn.onclick = async () => {
    const name = $("openUserName")?.value.trim();
    const phone = $("openUserPhone")?.value.trim();

    await loginUser(name, phone);
  };
}

/* ---------------- MAIN APP ---------------- */

async function enterMainApp() {
  hide("passwordScreen");
  hide("contactScreen");
  show("mainApp");

  applyAccessUI();

  updateProfileUI();
  setupNavigation();
  setupChat();
  setupTyping();
  setupOnline();
  setupHomework();
  setupSchool();
  setupNotes();
  setupSettings();
  setupSearch();
  setupDeleteSystem();

  await loadAllContent();
  startOnlineHeartbeat();
}

function applyAccessUI() {
  const fullAccess =
    isOwner ||
    accessStatus === "owner" ||
    accessStatus === "allowed";

  const restricted = [
    "chatNav",
    "groupsNav",
    "notesNav",
    "notificationsNav",
    "chatSection",
    "groupsSection",
    "notesSection",
    "notificationsSection"
  ];

  restricted.forEach(id => {
    const el = $(id);
    if (!el) return;

    el.style.display = fullAccess ? "" : "none";
  });

  const ownerButtons = document.querySelectorAll(
    ".owner-only, #ownerPanelNav, #ownerPanelBtn"
  );

  ownerButtons.forEach(el => {
    el.style.display = isOwner ? "" : "none";
  });
}

/* ---------------- OWNER WELCOME ---------------- */

function showOwnerWelcome() {
  const screen = $("ownerWelcomeScreen");

  if (!screen) return;

  screen.style.display = "flex";

  const dp = $("ownerWelcomeDP");

  if (dp) {
    dp.textContent = "K";
  }

  setTimeout(() => {
    screen.style.display = "none";
  }, 3000);
}

/* ---------------- BLOCKED ---------------- */

function showBlockedScreen() {
  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:25px;
      background:#f5f6f8;
      font-family:Arial,sans-serif;
    ">
      <div style="
        width:min(420px,100%);
        background:white;
        border-radius:18px;
        padding:30px;
        text-align:center;
        box-shadow:0 10px 35px rgba(0,0,0,.08);
      ">
        <div style="font-size:48px;margin-bottom:15px;">🔒</div>
        <h2>Access Blocked</h2>
        <p style="color:#666;">
          Owner ने आपके account की access बंद कर दी है।
        </p>
      </div>
    </div>
  `;
}

/* ---------------- PROFILE ---------------- */

function updateProfileUI() {
  if (!currentUser) return;

  text("currentUserProfile", currentUser.name);
  text("currentUserName", currentUser.name);
  text("currentUserPhone", currentUser.phone);

  const savedDP = localStorage.getItem("studyDP");

  document.querySelectorAll("[data-profile-dp]").forEach(el => {
    if (savedDP) {
      el.src = savedDP;
    }
  });
}

function setupSettings() {
  const saveNameBtn = $("saveNameBtn");

  if (saveNameBtn) {
    saveNameBtn.onclick = async () => {
      if (!currentUser) return;

      const input =
        $("profileNameInput") ||
        $("currentUserNameInput") ||
        $("settingsName");

      const newName = input?.value.trim();

      if (!newName) return;

      currentUser.name = newName;
      localStorage.setItem("studyName", newName);

      if (!isOwner) {
        await setDoc(
          doc(db, "allowedUsers", currentUser.phone),
          {
            name: newName,
            phone: currentUser.phone,
            status: accessStatus,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }

      updateProfileUI();
    };
  }

  const photoInput = $("profilePhotoInput");

  if (photoInput) {
    photoInput.onchange = async () => {
      const file = photoInput.files?.[0];

      if (!file || !currentUser) return;

      if (!file.type.startsWith("image/")) return;

      const dataURL = await compressImage(file);

      localStorage.setItem("studyDP", dataURL);

      document.querySelectorAll("[data-profile-dp]").forEach(el => {
        el.src = dataURL;
      });

      await setDoc(
        doc(db, "allowedUsers", currentUser.phone),
        {
          name: currentUser.name,
          phone: currentUser.phone,
          dp: dataURL,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    };
  }

  const ownerLoginBtn = $("ownerLoginBtn");

  if (ownerLoginBtn) {
    ownerLoginBtn.onclick = async () => {
      const password = prompt("Owner Password:");

      if (password !== OWNER_PASSWORD) {
        alert("गलत Owner Password");
        return;
      }

      if (!isOwner) {
        alert("Owner access केवल Owner account के लिए है।");
        return;
      }

      openOwnerPanel();
    };
  }

  const clearBtn = $("clearDataBtn");

  if (clearBtn) {
    clearBtn.onclick = () => {
      if (!confirm("क्या local profile data हटाना है?")) return;

      localStorage.removeItem("studyName");
      localStorage.removeItem("studyPhone");
      localStorage.removeItem("studyDP");

      location.reload();
    };
  }
}

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 256;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          height = height * (max / width);
          width = max;
        } else {
          width = width * (max / height);
          height = max;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/* ---------------- NAVIGATION ---------------- */

function setupNavigation() {
  const buttons = document.querySelectorAll("[data-section]");

  buttons.forEach(btn => {
    if (btn.dataset.navReady) return;

    btn.dataset.navReady = "1";

    btn.onclick = () => {
      const sectionId = btn.dataset.section;
      if (!sectionId) return;

      const fullAccess =
        isOwner ||
        accessStatus === "owner" ||
        accessStatus === "allowed";

      if (
        !fullAccess &&
        ["chatSection", "groupsSection", "notesSection", "notificationsSection"]
          .includes(sectionId)
      ) {
        alert("Owner की Allow permission मिलने के बाद यह feature खुलेगा।");
        return;
      }

      document.querySelectorAll(".app-section").forEach(section => {
        section.style.display = "none";
      });

      const section = $(sectionId);

      if (section) {
        section.style.display = "";
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };
  });

  document.querySelectorAll("[data-back]").forEach(btn => {
    if (btn.dataset.backReady) return;

    btn.dataset.backReady = "1";

    btn.onclick = () => {
      const target = btn.dataset.back || "homeSection";

      document.querySelectorAll(".app-section").forEach(section => {
        section.style.display = "none";
      });

      show(target);
    };
  });
}

/* ---------------- ONLINE ---------------- */

function setupOnline() {
  const addBtn = $("addOnlineBtn");

  if (addBtn) {
    addBtn.onclick = async () => {
      if (!currentUser) return;

      await setDoc(
        doc(db, "onlineUsers", currentUser.phone),
        {
          name: currentUser.name,
          phone: currentUser.phone,
          dp: localStorage.getItem("studyDP") || "",
          online: true,
          lastSeen: serverTimestamp()
        },
        { merge: true }
      );

      loadOnlineUsers();
    };
  }

  const toggle = $("onlineToggleBtn");

  if (toggle) {
    toggle.onclick = () => {
      const panel = $("onlineUsersPanel");

      if (!panel) return;

      panel.style.display =
        panel.style.display === "none" ? "" : "none";
    };
  }

  loadOnlineUsers();
}

function startOnlineHeartbeat() {
  if (!currentUser) return;

  clearInterval(onlineHeartbeat);

  const updatePresence = async () => {
    try {
      await setDoc(
        doc(db, "onlineUsers", currentUser.phone),
        {
          name: currentUser.name,
          phone: currentUser.phone,
          dp: localStorage.getItem("studyDP") || "",
          online: true,
          lastSeen: serverTimestamp()
        },
        { merge: true }
      );
    } catch (e) {
      console.error(e);
    }
  };

  updatePresence();

  onlineHeartbeat = setInterval(updatePresence, 45000);

  window.addEventListener("beforeunload", () => {
    setDoc(
      doc(db, "onlineUsers", currentUser.phone),
      {
        online: false,
        lastSeen: serverTimestamp()
      },
      { merge: true }
    ).catch(() => {});
  });
}

function loadOnlineUsers() {
  if (unsubscribeOnline) unsubscribeOnline();

  const box = $("onlineUsers");

  if (!box) return;

  unsubscribeOnline = onSnapshot(
    collection(db, "onlineUsers"),
    snapshot => {
      const now = Date.now();

      const users = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(user => {
          if (!user.lastSeen?.toDate) return user.online === true;

          const last = user.lastSeen.toDate().getTime();

          return user.online === true && now - last < 90000;
        });

      text("onlineCount", users.length);

      box.innerHTML = users.length
        ? users.map(user => `
          <div class="online-user">
            ${
              user.dp
                ? `<img src="${user.dp}" class="online-dp">`
                : `<div class="online-dp default-dp">
                    ${escapeHTML((user.name || "?")[0])}
                  </div>`
            }
            <div>
              <strong>${escapeHTML(user.name)}</strong>
              <div class="online-status">
                <span>●</span> Online
              </div>
            </div>
          </div>
        `).join("")
        : `<div class="empty-state">अभी कोई student online नहीं है।</div>`;
    },
    error => console.error("Online error:", error)
  );
}

/* ---------------- CHAT ---------------- */

function setupChat() {
  const sendBtn = $("sendMessageBtn");
  const input = $("messageInput");

  if (sendBtn && !sendBtn.dataset.ready) {
    sendBtn.dataset.ready = "1";

    sendBtn.onclick = sendMessage;
  }

  if (input && !input.dataset.ready) {
    input.dataset.ready = "1";

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    input.addEventListener("input", handleTyping);
  }

  const emojiBtn = $("emojiBtn");

  if (emojiBtn) {
    emojiBtn.onclick = () => {
      if (!input) return;

      input.value += " 😊";
      input.focus();
    };
  }

  loadMessages();
}

async function sendMessage() {
  if (!currentUser) return;

  const input = $("messageInput");
  const message = input?.value.trim();

  if (!message) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: message,
      senderName: currentUser.name,
      senderPhone: currentUser.phone,
      createdAt: serverTimestamp(),
      deliveredTo: [],
      seenBy: []
    });

    input.value = "";
    stopTyping();
  } catch (error) {
    console.error(error);
    alert("Message भेजा नहीं गया।");
  }
}

function loadMessages() {
  const box = $("chatMessages");

  if (!box) return;

  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeMessages = onSnapshot(
    collection(db, "messages"),
    snapshot => {
      const messages = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      messages.sort((a, b) => {
        const ta =
          a.createdAt?.toDate?.()?.getTime() ||
          a.timestamp?.toDate?.()?.getTime() ||
          0;

        const tb =
          b.createdAt?.toDate?.()?.getTime() ||
          b.timestamp?.toDate?.()?.getTime() ||
          0;

        return ta - tb;
      });

      box.innerHTML = messages.map(renderMessage).join("");

      box.scrollTop = box.scrollHeight;

      markVisibleMessagesSeen(messages);
    },
    error => {
      console.error("Messages error:", error);
      box.innerHTML =
        `<div class="empty-state">Chat load नहीं हो पाया।</div>`;
    }
  );
}

function renderMessage(message) {
  const mine =
    currentUser &&
    message.senderPhone === currentUser.phone;

  const seen = Array.isArray(message.seenBy)
    ? message.seenBy
    : [];

  const delivered = Array.isArray(message.deliveredTo)
    ? message.deliveredTo
    : [];

  let ticks = "✓";

  if (delivered.length > 0) ticks = "✓✓";
  if (seen.some(x =>
    typeof x === "string"
      ? x !== currentUser?.phone
      : x.phone !== currentUser?.phone
  )) {
    ticks = `<span class="blue-ticks">✓✓</span>`;
  }

  const time = formatTime(
    message.createdAt || message.timestamp
  );

  return `
    <div
      class="chat-message ${mine ? "mine" : "other"}"
      data-message-id="${escapeHTML(message.id)}"
      data-delete-type="message"
      data-delete-id="${escapeHTML(message.id)}"
    >
      <div class="message-sender">
        ${escapeHTML(message.senderName || "Student")}
      </div>

      <div class="message-text">
        ${escapeHTML(message.text || "")}
      </div>

      <div class="message-meta">
        <span>${escapeHTML(time)}</span>

        ${
          mine
            ? `<span class="message-ticks">${ticks}</span>`
            : ""
        }

        ${
          mine && seen.length
            ? `<button
                class="seen-button"
                data-seen-id="${escapeHTML(message.id)}"
                type="button"
              >
                👁 ${seen.length} seen
              </button>`
            : ""
        }
      </div>
    </div>
  `;
}

async function markVisibleMessagesSeen(messages) {
  if (!currentUser) return;

  for (const message of messages) {
    if (message.senderPhone === currentUser.phone) continue;

    const seen = Array.isArray(message.seenBy)
      ? message.seenBy
      : [];

    const alreadySeen = seen.some(x =>
      typeof x === "string"
        ? x === currentUser.phone
        : x.phone === currentUser.phone
    );

    if (alreadySeen) continue;

    try {
      const updated = [
        ...seen,
        {
          phone: currentUser.phone,
          name: currentUser.name
        }
      ];

      await updateDoc(
        doc(db, "messages", message.id),
        {
          seenBy: updated,
          deliveredTo: Array.isArray(message.deliveredTo)
            ? message.deliveredTo
            : []
        }
      );
    } catch (e) {
      console.error(e);
    }
  }
}

/* ---------------- TYPING ---------------- */

function setupTyping() {
  if (unsubscribeTyping) unsubscribeTyping();

  unsubscribeTyping = onSnapshot(
    collection(db, "typing"),
    snapshot => {
      const typingUsers = snapshot.docs
        .map(d => d.data())
        .filter(user =>
          user.typing === true &&
          user.phone !== currentUser?.phone
        );

      const indicator = $("typingIndicator");

      if (!indicator) return;

      indicator.textContent = typingUsers.length
        ? `${typingUsers[0].name || "Student"} typing...`
        : "";
    }
  );
}

async function handleTyping() {
  if (!currentUser) return;

  await setDoc(
    doc(db, "typing", currentUser.phone),
    {
      phone: currentUser.phone,
      name: currentUser.name,
      typing: true,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  ).catch(() => {});

  clearTimeout(typingTimer);

  typingTimer = setTimeout(stopTyping, 1500);
}

async function stopTyping() {
  if (!currentUser) return;

  await setDoc(
    doc(db, "typing", currentUser.phone),
    {
      phone: currentUser.phone,
      name: currentUser.name,
      typing: false,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  ).catch(() => {});
}

/* ---------------- HOMEWORK ---------------- */

function setupHomework() {
  const btn = $("addHomeworkBtn");

  if (!btn || btn.dataset.ready) return;

  btn.dataset.ready = "1";

  btn.onclick = async () => {
    const subject = prompt("Subject:");
    const question = prompt("Homework:");

    if (!subject || !question || !currentUser) return;

    await addDoc(collection(db, "homework"), {
      subject,
      question,
      senderName: currentUser.name,
      senderPhone: currentUser.phone,
      createdAt: serverTimestamp()
    });

    loadHomework();
  };
}

async function loadHomework() {
  const box = $("homeworkList");

  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "homework"));

    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort(sortByDate);

    box.innerHTML = items.length
      ? items.map(item => `
        <div
          class="content-card"
          data-delete-type="homework"
          data-delete-id="${item.id}"
          data-owner-phone="${escapeHTML(item.senderPhone || "")}"
        >
          <h3>${escapeHTML(item.subject)}</h3>
          <p>${escapeHTML(item.question)}</p>
          <small>
            By ${escapeHTML(item.senderName || "Student")}
            • ${escapeHTML(formatTime(item.createdAt))}
          </small>
        </div>
      `).join("")
      : `<div class="empty-state">अभी Homework नहीं है।</div>`;
  } catch (e) {
    console.error(e);
  }
}

/* ---------------- SCHOOL ---------------- */

function setupSchool() {
  const btn = $("saveSchoolBtn");

  if (!btn || btn.dataset.ready) return;

  btn.dataset.ready = "1";

  btn.onclick = async () => {
    const title = $("schoolTitle")?.value.trim();
    const content = $("schoolContent")?.value.trim();

    if (!title || !content || !currentUser) return;

    await addDoc(collection(db, "schoolUpdates"), {
      title,
      content,
      senderName: currentUser.name,
      senderPhone: currentUser.phone,
      createdAt: serverTimestamp()
    });

    if ($("schoolTitle")) $("schoolTitle").value = "";
    if ($("schoolContent")) $("schoolContent").value = "";

    loadSchoolUpdates();
  };
}

async function loadSchoolUpdates() {
  const box = $("schoolUpdatesList");

  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "schoolUpdates"));

    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort(sortByDate);

    box.innerHTML = items.length
      ? items.map(item => `
        <div
          class="content-card"
          data-delete-type="school"
          data-delete-id="${item.id}"
          data-owner-phone="${escapeHTML(item.senderPhone || "")}"
        >
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.content)}</p>
          <small>
            By ${escapeHTML(item.senderName || "Student")}
            • ${escapeHTML(formatTime(item.createdAt))}
          </small>
        </div>
      `).join("")
      : `<div class="empty-state">अभी कोई School Update नहीं है।</div>`;
  } catch (e) {
    console.error(e);
  }
}

/* ---------------- NOTES ---------------- */

function setupNotes() {
  const btn = $("saveNoteBtn");

  if (!btn || btn.dataset.ready) return;

  btn.dataset.ready = "1";

  btn.onclick = async () => {
    const title = $("noteTitle")?.value.trim();
    const content = $("noteContent")?.value.trim();

    if (!title || !content || !currentUser) return;

    await addDoc(collection(db, "notes"), {
      title,
      content,
      senderName: currentUser.name,
      senderPhone: currentUser.phone,
      createdAt: serverTimestamp()
    });

    if ($("noteTitle")) $("noteTitle").value = "";
    if ($("noteContent")) $("noteContent").value = "";

    loadNotes();
  };
}

async function loadNotes() {
  const box = $("notesList");

  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "notes"));

    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort(sortByDate);

    box.innerHTML = items.length
      ? items.map(item => `
        <div
          class="content-card"
          data-delete-type="notes"
          data-delete-id="${item.id}"
          data-owner-phone="${escapeHTML(item.senderPhone || "")}"
        >
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.content)}</p>
          <small>
            By ${escapeHTML(item.senderName || "Student")}
            • ${escapeHTML(formatTime(item.createdAt))}
          </small>
        </div>
      `).join("")
      : `<div class="empty-state">अभी कोई Notes नहीं हैं।</div>`;
  } catch (e) {
    console.error(e);
  }
}

/* ---------------- GROUPS ---------------- */

async function loadGroups() {
  const box = $("groupList");

  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "groups"));

    const groups = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    box.innerHTML = groups.length
      ? groups.map(group => `
        <div class="content-card group-card">
          <h3>${escapeHTML(group.name || "Group")}</h3>
          <p>
            Members:
            ${Array.isArray(group.members)
              ? group.members.length
              : 0}
          </p>
        </div>
      `).join("")
      : `<div class="empty-state">अभी कोई Group नहीं है।</div>`;
  } catch (e) {
    console.error(e);
  }
}

/* ---------------- NOTIFICATIONS ---------------- */

async function loadNotifications() {
  const box = $("notificationsList");

  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "notifications"));

    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort(sortByDate);

    box.innerHTML = items.length
      ? items.map(item => `
        <div
          class="content-card"
          data-delete-type="notification"
          data-delete-id="${item.id}"
          data-owner-phone="${escapeHTML(item.senderPhone || "")}"
        >
          <h3>${escapeHTML(item.title || "Notification")}</h3>
          <p>${escapeHTML(item.message || "")}</p>
          <small>
            By ${escapeHTML(item.senderName || "Owner")}
            • ${escapeHTML(formatTime(item.createdAt))}
          </small>
        </div>
      `).join("")
      : `<div class="empty-state">कोई notification नहीं है।</div>`;
  } catch (e) {
    console.error(e);
  }
}

/* ---------------- SEARCH ---------------- */

function setupSearch() {
  const input = $("chatSearchBox") || $("globalSearch");

  if (!input || input.dataset.ready) return;

  input.dataset.ready = "1";

  input.addEventListener("input", () => {
    const value = input.value.toLowerCase().trim();

    document.querySelectorAll(
      ".content-card, .chat-message, .online-user, .group-card"
    ).forEach(card => {
      card.style.display =
        !value || card.textContent.toLowerCase().includes(value)
          ? ""
          : "none";
    });
  });
}

/* ---------------- DELETE SYSTEM ---------------- */

let selectedForDelete = new Set();
let longPressTimer = null;

function setupDeleteSystem() {
  document.addEventListener("pointerdown", startLongPress);
  document.addEventListener("pointerup", cancelLongPress);
  document.addEventListener("pointerleave", cancelLongPress);

  document.addEventListener("click", async e => {
    const seenBtn = e.target.closest(".seen-button");

    if (seenBtn) {
      e.stopPropagation();

      const id = seenBtn.dataset.seenId;

      await showSeenBy(id);
      return;
    }

    const selected = e.target.closest("[data-selected-delete]");

    if (selected) {
      e.stopPropagation();
      toggleDeleteSelection(selected);
    }
  });
}

function startLongPress(e) {
  const item = e.target.closest(
    ".chat-message, .content-card"
  );

  if (!item) return;

  longPressTimer = setTimeout(() => {
    enterDeleteMode(item);
  }, 600);
}

function cancelLongPress() {
  clearTimeout(longPressTimer);
}

function enterDeleteMode(item) {
  const type = item.dataset.deleteType;
  const id = item.dataset.deleteId;

  if (!type || !id) return;

  if (!canDeleteItem(item)) return;

  item.dataset.selectedDelete = "1";
  item.classList.add("delete-selected");

  selectedForDelete.add(`${type}:${id}`);

  showDeleteBar();
}

function toggleDeleteSelection(item) {
  const type = item.dataset.deleteType;
  const id = item.dataset.deleteId;

  if (!type || !id) return;

  const key = `${type}:${id}`;

  if (selectedForDelete.has(key)) {
    selectedForDelete.delete(key);
    item.classList.remove("delete-selected");
    delete item.dataset.selectedDelete;
  } else {
    selectedForDelete.add(key);
    item.classList.add("delete-selected");
    item.dataset.selectedDelete = "1";
  }

  showDeleteBar();
}

function canDeleteItem(item) {
  if (isOwner) return true;

  const ownerPhone = item.dataset.ownerPhone;

  if (item.dataset.deleteType === "message") {
    const messageId = item.dataset.deleteId;

    const messageEl = document.querySelector(
      `[data-message-id="${CSS.escape(messageId)}"]`
    );

    const sender = messageEl
      ?.querySelector(".message-sender")
      ?.textContent
      ?.trim();

    return sender === currentUser?.name;
  }

  return ownerPhone === currentUser?.phone;
}

function showDeleteBar() {
  let bar = $("deleteBar");

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "deleteBar";

    bar.style.cssText = `
      position:fixed;
      left:15px;
      right:15px;
      bottom:15px;
      z-index:9999;
      background:#fff;
      border:1px solid #ddd;
      border-radius:14px;
      padding:10px 14px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      box-shadow:0 8px 25px rgba(0,0,0,.12);
    `;

    bar.innerHTML = `
      <span id="deleteCount">0 selected</span>
      <button id="deleteSelectedBtn" type="button">
        Delete
      </button>
    `;

    document.body.appendChild(bar);

    $("deleteSelectedBtn").onclick = deleteSelectedItems;
  }

  if (selectedForDelete.size === 0) {
    bar.remove();
    return;
  }

  bar.style.display = "flex";
  text("deleteCount", `${selectedForDelete.size} selected`);
}

async function deleteSelectedItems() {
  if (!selectedForDelete.size) return;

  if (!confirm(`क्या ${selectedForDelete.size} items delete करें?`)) {
    return;
  }

  for (const key of selectedForDelete) {
    const [type, id] = key.split(":");

    try {
      await deleteDoc(doc(db, getCollectionName(type), id));
    } catch (e) {
      console.error(e);
    }
  }

  selectedForDelete.clear();

  document.querySelectorAll(".delete-selected").forEach(el => {
    el.classList.remove("delete-selected");
    delete el.dataset.selectedDelete;
  });

  showDeleteBar();

  await loadAllContent();
}

function getCollectionName(type) {
  const map = {
    message: "messages",
    homework: "homework",
    school: "schoolUpdates",
    notes: "notes",
    notification: "notifications",
    group: "groups"
  };

  return map[type] || type;
}

/* ---------------- SEEN INFO ---------------- */

async function showSeenBy(messageId) {
  try {
    const snap = await getDoc(
      doc(db, "messages", messageId)
    );

    if (!snap.exists()) return;

    const data = snap.data();

    const seen = Array.isArray(data.seenBy)
      ? data.seenBy
      : [];

    const names = seen.map(x =>
      typeof x === "string"
        ? x
        : x.name || x.phone
    );

    openSimpleModal(
      "Seen By",
      names.length
        ? names.map(escapeHTML).join("<br>")
        : "अभी किसी ने नहीं देखा।"
    );
  } catch (e) {
    console.error(e);
  }
}

function openSimpleModal(title, content) {
  let modal = $("infoModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "infoModal";

    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.45);
      z-index:10000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    `;

    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="
      background:white;
      width:min(380px,100%);
      border-radius:16px;
      padding:20px;
    ">
      <h3>${escapeHTML(title)}</h3>
      <div style="line-height:1.8">${content}</div>
      <button type="button" id="closeInfoModal">
        Close
      </button>
    </div>
  `;

  modal.style.display = "flex";

  $("closeInfoModal").onclick = () => {
    modal.style.display = "none";
  };
}

/* ---------------- OWNER PANEL ---------------- */

async function openOwnerPanel() {
  const panel = $("ownerPanel");

  if (panel) {
    panel.style.display = "";
  }

  await loadOwnerUsers();
  await updateOwnerStats();
  await loadOwnerMessages();
}

async function loadOwnerUsers() {
  const box =
    $("ownerUsersList") ||
    $("usersManagementList");

  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "allowedUsers"));

    box.innerHTML = snap.docs.map(d => {
      const user = d.data();

      return `
        <div class="content-card owner-user-card">
          <strong>${escapeHTML(user.name || "Student")}</strong>
          <div>${escapeHTML(user.phone || "")}</div>
          <div>
            Status:
            <b>${escapeHTML(user.status || "basic")}</b>
          </div>

          <button
            type="button"
            data-owner-allow="${escapeHTML(user.phone || "")}"
          >
            Allow
          </button>

          <button
            type="button"
            data-owner-block="${escapeHTML(user.phone || "")}"
          >
            No Allow
          </button>
        </div>
      `;
    }).join("");

    box.querySelectorAll("[data-owner-allow]").forEach(btn => {
      btn.onclick = () =>
        changeUserAccess(
          btn.dataset.ownerAllow,
          "allowed"
        );
    });

    box.querySelectorAll("[data-owner-block]").forEach(btn => {
      btn.onclick = () =>
        changeUserAccess(
          btn.dataset.ownerBlock,
          "blocked"
        );
    });
  } catch (e) {
    console.error(e);
  }
}

async function changeUserAccess(phone, status) {
  if (!isOwner) return;

  if (phone === OWNER_PHONE) {
    alert("Owner को block नहीं किया जा सकता।");
    return;
  }

  await setDoc(
    doc(db, "allowedUsers", phone),
    {
      status,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await loadOwnerUsers();
  await updateOwnerStats();
}

async function updateOwnerStats() {
  try {
    const users = await getDocs(collection(db, "allowedUsers"));
    const messages = await getDocs(collection(db, "messages"));
    const groups = await getDocs(collection(db, "groups"));

    let allowed = 0;
    let blocked = 0;

    users.docs.forEach(d => {
      const status = d.data().status || "basic";

      if (status === "allowed") allowed++;
      if (status === "blocked") blocked++;
    });

    text("totalStudents", users.size);
    text("allowedStudents", allowed);
    text("blockedStudents", blocked);
    text("totalMessages", messages.size);
    text("totalGroups", groups.size);
  } catch (e) {
    console.error(e);
  }
}

async function loadOwnerMessages() {
  const box =
    $("ownerMessagesList") ||
    $("chatManagementList");

  if (!box) return;

  try {
    const snap = await getDocs(collection(db, "messages"));

    const messages = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort(sortByDate)
      .slice(-30)
      .reverse();

    box.innerHTML = messages.map(m => `
      <div class="content-card">
        <strong>${escapeHTML(m.senderName || "")}</strong>
        <p>${escapeHTML(m.text || "")}</p>
        <small>${escapeHTML(formatTime(m.createdAt || m.timestamp))}</small>
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
  }
}

/* ---------------- DATA LOADING ---------------- */

async function loadAllContent() {
  await Promise.allSettled([
    loadHomework(),
    loadSchoolUpdates(),
    loadNotes(),
    loadGroups(),
    loadNotifications()
  ]);
}

function sortByDate(a, b) {
  const ta =
    a.createdAt?.toDate?.()?.getTime() ||
    a.timestamp?.toDate?.()?.getTime() ||
    0;

  const tb =
    b.createdAt?.toDate?.()?.getTime() ||
    b.timestamp?.toDate?.()?.getTime() ||
    0;

  return tb - ta;
}

/* ---------------- STARTUP ---------------- */

async function initStudyConnect() {
  setupPassword();
  setupContact();

  const savedName = localStorage.getItem("studyName");
  const savedPhone = localStorage.getItem("studyPhone");

  if (savedName && savedPhone) {
    hide("passwordScreen");
    hide("contactScreen");

    await loginUser(savedName, savedPhone);
  } else {
    show("passwordScreen");
    hide("contactScreen");
    hide("mainApp");
  }
}

initStudyConnect();
