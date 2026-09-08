import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  onSnapshot,
  limit,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyCquRX2YB59FObuIyi3SwWc3aUCdPWypag",
  authDomain: "studyconnect-99006.firebaseapp.com",
  projectId: "studyconnect-99006",
  storageBucket: "studyconnect-99006.firebasestorage.app",
  messagingSenderId: "15964627995",
  appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
  measurementId: "G-SYJYMREJJL"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const APP_PASSWORD = "123";
const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";
const OWNER_PASSWORD = "12341";

let currentUser = {
  name: "",
  phone: ""
};

let selectedGroupId = null;
let selectedGroupData = null;

let unsubscribeChat = null;
let unsubscribeGroupChat = null;
let unsubscribeOnline = null;
let onlineHeartbeat = null;


/* =========================
   HELPERS
========================= */

const $ = id => document.getElementById(id);

function normalizePhone(phone) {
  return String(phone || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(value) {
  if (!value) return "अभी";

  try {
    const date = value.toDate
      ? value.toDate()
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "अभी";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "अभी";
  }
}

function setMessage(element, text, type = "error") {
  if (!element) return;

  element.textContent = text;
  element.style.color =
    type === "success"
      ? "var(--success)"
      : "var(--danger)";
}

function buttonBusy(button, busy) {
  if (!button) return;

  if (busy) {
    button.disabled = true;
    button.dataset.oldText = button.textContent;
    button.textContent = "⏳ Please wait...";
  } else {
    button.disabled = false;

    if (button.dataset.oldText) {
      button.textContent = button.dataset.oldText;
    }
  }
}

async function hashText(text) {
  const data = new TextEncoder().encode(text);

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return [...new Uint8Array(hash)]
    .map(byte =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

function setUser(name, phone) {
  currentUser = {
    name: String(name).trim(),
    phone: normalizePhone(phone)
  };

  localStorage.setItem(
    "studyUser",
    JSON.stringify(currentUser)
  );
}

function getSavedUser() {
  try {
    const saved =
      localStorage.getItem("studyUser");

    if (!saved) return null;

    const user = JSON.parse(saved);

    if (!user?.name || !user?.phone) {
      return null;
    }

    return {
      name: user.name,
      phone: normalizePhone(user.phone)
    };
  } catch {
    return null;
  }
}


/* =========================
   NAVIGATION
========================= */

function showPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });

  const page =
    $(`${pageName}Page`);

  if (page) {
    page.classList.add("active");
  }

  $("navMenu")?.classList.remove("open");

  if (pageName === "chat") {
    startChatListener();
  } else {
    stopChatListener();
  }

  if (pageName === "groups") {
    loadGroups();
  }

  if (pageName === "home") {
    startOnlineListener();
  } else {
    stopOnlineListener();
  }
}

function setupNavigation() {

  $("menuBtn")?.addEventListener(
    "click",
    () => {
      $("navMenu")
        ?.classList.toggle("open");
    }
  );

  document
    .querySelectorAll("[data-page]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;

          if (page) {
            showPage(page);
          }
        }
      );
    });

  document.addEventListener(
    "click",
    event => {

      const menu = $("navMenu");
      const menuButton = $("menuBtn");

      if (
        menu &&
        menu.classList.contains("open") &&
        !menu.contains(event.target) &&
        !menuButton?.contains(event.target)
      ) {
        menu.classList.remove("open");
      }
    }
  );
}


/* =========================
   LOGIN
========================= */

async function checkAllowedUser(
  phone,
  name = "",
  exactName = false
) {

  const cleanPhone =
    normalizePhone(phone);

  const ref =
    doc(db, "allowedUsers", cleanPhone);

  const snap =
    await getDoc(ref);

  if (!snap.exists()) {
    return false;
  }

  const data = snap.data();

  if (data.allowed !== true) {
    return false;
  }

  if (exactName) {
    return (
      normalizeName(data.name) ===
      normalizeName(name)
    );
  }

  return true;
}

function showContactScreen() {

  $("passwordScreen")
    ?.classList.add("hidden");

  $("contactScreen")
    ?.classList.remove("hidden");
}

function openApp() {

  $("passwordScreen")
    ?.classList.add("hidden");

  $("contactScreen")
    ?.classList.add("hidden");

  $("app")
    ?.classList.remove("hidden");

  updateProfileUI();

  loadHomework();
  loadSchool();
  loadNotes();
  loadGroups();

  showPage("home");
}

function setupLogin() {

  $("unlockBtn")?.addEventListener(
    "click",
    async () => {

      const password =
        $("appPassword")?.value.trim();

      if (!password) {
        setMessage(
          $("passwordError"),
          "App password डालें।"
        );
        return;
      }

      if (password !== APP_PASSWORD) {
        setMessage(
          $("passwordError"),
          "❌ गलत App Password"
        );
        return;
      }

      setMessage(
        $("passwordError"),
        ""
      );

      const savedUser =
        getSavedUser();

      if (savedUser) {

        try {

          const allowed =
            await checkAllowedUser(
              savedUser.phone
            );

          if (!allowed) {
            showContactScreen();
            return;
          }

          setUser(
            savedUser.name,
            savedUser.phone
          );

          openApp();

        } catch (error) {

          console.error(error);

          setMessage(
            $("passwordError"),
            "Firebase connection में समस्या है।"
          );
        }

        return;
      }

      $("loginStep")
        ?.classList.add("hidden");

      $("userStep")
        ?.classList.remove("hidden");

      $("openUserName")?.focus();
    }
  );


  $("enterAppBtn")?.addEventListener(
    "click",
    async () => {

      const name =
        $("openUserName")?.value.trim();

      const phone =
        normalizePhone(
          $("openUserPhone")?.value
        );

      if (!name) {
        setMessage(
          $("loginMessage"),
          "अपना नाम लिखें।"
        );
        return;
      }

      if (phone.length !== 10) {
        setMessage(
          $("loginMessage"),
          "सही 10 digit mobile number डालें।"
        );
        return;
      }

      buttonBusy(
        $("enterAppBtn"),
        true
      );

      try {

        const allowed =
          await checkAllowedUser(
            phone,
            name,
            true
          );

        if (!allowed) {
          showContactScreen();
          return;
        }

        setUser(name, phone);

        openApp();

      } catch (error) {

        console.error(error);

        setMessage(
          $("loginMessage"),
          "Internet/Firebase connection में समस्या है।"
        );

      } finally {

        buttonBusy(
          $("enterAppBtn"),
          false
        );
      }
    }
  );


  $("backToLoginBtn")?.addEventListener(
    "click",
    () => {

      $("contactScreen")
        ?.classList.add("hidden");

      $("passwordScreen")
        ?.classList.remove("hidden");

      $("loginStep")
        ?.classList.remove("hidden");

      $("userStep")
        ?.classList.add("hidden");

      if ($("appPassword")) {
        $("appPassword").value = "";
      }
    }
  );
}


/* =========================
   PROFILE
========================= */

function updateProfileUI() {

  if ($("currentUserProfile")) {
    $("currentUserProfile").textContent =
      `${currentUser.name} • ${currentUser.phone}`;
  }

  if ($("studentName")) {
    $("studentName").value =
      currentUser.name;
  }

  if ($("changeNameInput")) {
    $("changeNameInput").value =
      currentUser.name;
  }
}

function setupNameSettings() {

  $("saveNameBtn")?.addEventListener(
    "click",
    () => {

      const name =
        $("studentName")?.value.trim();

      if (!name) {
        setMessage(
          $("nameMessage"),
          "नाम खाली नहीं हो सकता।"
        );
        return;
      }

      setUser(
        name,
        currentUser.phone
      );

      updateProfileUI();

      setMessage(
        $("nameMessage"),
        "✅ Name saved",
        "success"
      );

      updateOnlineUser();
    }
  );


  $("changeNameBtn")?.addEventListener(
    "click",
    () => {

      const name =
        $("changeNameInput")?.value.trim();

      if (!name) {
        setMessage(
          $("changeNameMessage"),
          "नया नाम डालें।"
        );
        return;
      }

      setUser(
        name,
        currentUser.phone
      );

      updateProfileUI();

      setMessage(
        $("changeNameMessage"),
        "✅ Name changed successfully",
        "success"
      );

      updateOnlineUser();
    }
  );
}


/* =========================
   MAIN CHAT
========================= */

function stopChatListener() {

  if (unsubscribeChat) {
    unsubscribeChat();
    unsubscribeChat = null;
  }
}

function startChatListener() {

  if (unsubscribeChat) return;

  const messagesQuery =
    query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

  unsubscribeChat =
    onSnapshot(
      messagesQuery,
      snapshot => {

        const messages =
          snapshot.docs
            .map(item => ({
              id: item.id,
              ...item.data()
            }))
            .reverse();

        renderMessages(
          $("chatMessages"),
          messages
        );

        markMessagesSeen(
          messages,
          "messages"
        );
      },
      error => {

        console.error(error);

        if ($("chatMessages")) {
          $("chatMessages").innerHTML = `
            <div class="empty-state">
              <span>⚠️</span>
              <p>Chat load नहीं हो पाया।</p>
            </div>
          `;
        }
      }
    );
}

function renderMessages(
  container,
  messages
) {

  if (!container) return;

  if (!messages.length) {

    container.innerHTML = `
      <div class="empty-state">
        <span>💬</span>
        <p>अभी कोई message नहीं है।</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    messages.map(message => {

      const mine =
        normalizePhone(message.phone) ===
        normalizePhone(currentUser.phone);

      const seen =
        Array.isArray(message.seenBy) &&
        message.seenBy.length > 0;

      const tick =
        mine
          ? (
              seen
                ? `<span title="Seen">✓✓</span>`
                : `<span title="Sent">✓</span>`
            )
          : "";

      return `
        <div class="message ${mine ? "mine" : ""}">
          <div class="message-name">
            ${escapeHTML(
              message.name || "Student"
            )}
          </div>

          <div class="message-text">
            ${escapeHTML(
              message.text || ""
            )}
          </div>

          <div class="message-meta">
            ${formatTime(message.createdAt)}
            ${tick}
          </div>
        </div>
      `;

    }).join("");

  container.scrollTop =
    container.scrollHeight;
}

async function sendMessage() {

  const input =
    $("messageInput");

  const text =
    input?.value.trim();

  if (!text) return;

  const button =
    $("sendMessageBtn");

  buttonBusy(button, true);

  try {

    await addDoc(
      collection(db, "messages"),
      {
        name: currentUser.name,
        phone: currentUser.phone,
        text: text.slice(0, 1000),
        createdAt: serverTimestamp(),
        seenBy: []
      }
    );

    input.value = "";
    input.focus();

  } catch (error) {

    console.error(error);

    alert(
      "Message भेजा नहीं जा सका। Internet check करें।"
    );

  } finally {

    buttonBusy(button, false);
  }
}

function setupChat() {

  $("sendMessageBtn")?.addEventListener(
    "click",
    sendMessage
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

  const emojis = [
    "😊",
    "👍",
    "❤️",
    "😂",
    "🎉",
    "🔥",
    "📚"
  ];

  let emojiIndex = 0;

  $("emojiBtn")?.addEventListener(
    "click",
    () => {

      const input =
        $("messageInput");

      if (!input) return;

      input.value +=
        emojis[emojiIndex];

      emojiIndex =
        (emojiIndex + 1) %
        emojis.length;

      input.focus();
    }
  );
}

async function markMessagesSeen(
  messages,
  type
) {

  const recent =
    messages
      .filter(message =>
        normalizePhone(message.phone) !==
        normalizePhone(currentUser.phone)
      )
      .slice(-10);

  for (const message of recent) {

    const seenBy =
      Array.isArray(message.seenBy)
        ? message.seenBy
        : [];

    if (
      seenBy.includes(
        currentUser.phone
      )
    ) {
      continue;
    }

    try {

      const ref =
        type === "messages"
          ? doc(
              db,
              "messages",
              message.id
            )
          : doc(
              db,
              "groups",
              selectedGroupId,
              "messages",
              message.id
            );

      await updateDoc(
        ref,
        {
          seenBy: arrayUnion(
            currentUser.phone
          )
        }
      );

    } catch (error) {
      console.warn(
        "Seen update failed",
        error
      );
    }
  }
}


/* =========================
   ONLINE
========================= */

function stopOnlineListener() {

  if (unsubscribeOnline) {
    unsubscribeOnline();
    unsubscribeOnline = null;
  }

  if (onlineHeartbeat) {
    clearInterval(
      onlineHeartbeat
    );

    onlineHeartbeat = null;
  }
}

function startOnlineListener() {

  if (!currentUser.phone) return;

  if (unsubscribeOnline) return;

  unsubscribeOnline =
    onSnapshot(
      collection(db, "onlineUsers"),
      snapshot => {

        const now = Date.now();

        const users =
          snapshot.docs
            .map(item => item.data())
            .filter(user =>
              user.online === true &&
              typeof user.lastSeen === "number" &&
              now - user.lastSeen < 90000
            );

        renderOnlineUsers(users);
      },
      error => {
        console.warn(
          "Online listener error",
          error
        );
      }
    );

  updateOnlineUser();

  onlineHeartbeat =
    setInterval(
      updateOnlineUser,
      45000
    );
}

async function updateOnlineUser() {

  if (!currentUser.phone) return;

  try {

    await setDoc(
      doc(
        db,
        "onlineUsers",
        currentUser.phone
      ),
      {
        name: currentUser.name,
        phone: currentUser.phone,
        online: true,
        lastSeen: Date.now()
      },
      {
        merge: true
      }
    );

  } catch (error) {
    console.warn(
      "Online update failed",
      error
    );
  }
}

function renderOnlineUsers(users) {

  const list =
    $("onlineUsers");

  const count =
    $("onlineCount");

  if (!list || !count) return;

  count.textContent =
    users.length;

  if (!users.length) {

    list.innerHTML = `
      <div class="empty-state">
        <span>👥</span>
        <p>कोई student online नहीं है।</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    users.map(user => `
      <div class="online-user">
        <span class="online-dot"></span>
        <span>
          ${escapeHTML(
            user.name || "Student"
          )}
        </span>
      </div>
    `).join("");
}

function setupOnline() {

  $("onlineToggleBtn")?.addEventListener(
    "click",
    () => {

      $("onlineUsers")
        ?.classList.toggle("hidden");

      const hidden =
        $("onlineUsers")
          ?.classList.contains("hidden");

      if ($("onlineArrow")) {
        $("onlineArrow").textContent =
          hidden ? "▼" : "▲";
      }
    }
  );
}


/* =========================
   GROUPS
========================= */

async function loadGroups() {

  const list =
    $("groupList");

  if (!list || !currentUser.phone) {
    return;
  }

  list.innerHTML = `
    <div class="empty-state">
      <span>⏳</span>
      <p>Groups loading...</p>
    </div>
  `;

  try {

    const groupsQuery =
      query(
        collection(db, "groups"),
        where(
          "memberPhones",
          "array-contains",
          currentUser.phone
        ),
        limit(50)
      );

    const snapshot =
      await getDocs(groupsQuery);

    if (snapshot.empty) {

      list.innerHTML = `
        <div class="empty-state">
          <span>👥</span>
          <p>अभी कोई group नहीं है।</p>
        </div>
      `;

      return;
    }

    const groups =
      snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

    list.innerHTML =
      groups.map(group => `
        <div
          class="group-item"
          data-group-id="${escapeHTML(group.id)}"
        >
          <h3>
            🔒 ${escapeHTML(
              group.name || "Group"
            )}
          </h3>

          <p>
            Owner:
            ${escapeHTML(
              group.ownerName || "Unknown"
            )}
          </p>

          <p>
            👥 ${(group.memberPhones || []).length}
            members
          </p>
        </div>
      `).join("");

    list
      .querySelectorAll(".group-item")
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            openGroup(
              item.dataset.groupId,
              groups
            );
          }
        );
      });

  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <p>Groups load नहीं हो पाए।</p>
      </div>
    `;
  }
}

async function openGroup(
  groupId,
  groups
) {

  const group =
    groups.find(
      item => item.id === groupId
    );

  if (!group) return;

  selectedGroupId =
    groupId;

  selectedGroupData =
    group;

  stopGroupChatListener();

  $("groupChatSection")
    ?.classList.remove("hidden");

  $("selectedGroupName").textContent =
    `🔒 ${group.name || "Group"}`;

  $("selectedGroupOwner").textContent =
    `Owner: ${group.ownerName || "Unknown"}`;

  $("groupUnlockBox")
    ?.classList.remove("hidden");

  $("groupContent")
    ?.classList.add("hidden");

  $("groupPasswordMessage").textContent =
    "";

  if ($("enterGroupPasswordInput")) {
    $("enterGroupPasswordInput").value = "";
    $("enterGroupPasswordInput").focus();
  }
}

async function createGroup() {

  const name =
    $("groupInput")?.value.trim();

  const password =
    $("groupPasswordInput")?.value;

  if (!name) {
    alert("Group name डालें।");
    return;
  }

  if (!password || password.length < 3) {
    alert(
      "Group password कम से कम 3 characters का रखें।"
    );
    return;
  }

  const button =
    $("createGroupBtn");

  buttonBusy(button, true);

  try {

    const passwordHash =
      await hashText(password);

    await addDoc(
      collection(db, "groups"),
      {
        name: name.slice(0, 60),
        ownerName: currentUser.name,
        ownerPhone: currentUser.phone,
        passwordHash,
        memberNames: [currentUser.name],
        memberPhones: [currentUser.phone],
        createdAt: serverTimestamp()
      }
    );

    $("groupInput").value = "";
    $("groupPasswordInput").value = "";

    alert(
      "✅ Group successfully created!"
    );

    await loadGroups();

  } catch (error) {

    console.error(error);

    alert(
      "Group create नहीं हो पाया।"
    );

  } finally {

    buttonBusy(button, false);
  }
}

async function unlockGroup() {

  if (!selectedGroupData) {
    return;
  }

  const password =
    $("enterGroupPasswordInput")
      ?.value;

  if (!password) {

    setMessage(
      $("groupPasswordMessage"),
      "Group password डालें।"
    );

    return;
  }

  const enteredHash =
    await hashText(password);

  if (
    enteredHash !==
    selectedGroupData.passwordHash
  ) {

    setMessage(
      $("groupPasswordMessage"),
      "❌ गलत group password"
    );

    return;
  }

  setMessage(
    $("groupPasswordMessage"),
    "✅ Group unlocked",
    "success"
  );

  $("groupUnlockBox")
    ?.classList.add("hidden");

  $("groupContent")
    ?.classList.remove("hidden");

  renderMembers(
    selectedGroupData
  );

  startGroupChatListener();
}

function renderMembers(group) {

  const list =
    $("memberList");

  if (!list) return;

  const names =
    group.memberNames || [];

  const phones =
    group.memberPhones || [];

  if (!phones.length) {
    list.innerHTML =
      "<p>No members.</p>";
    return;
  }

  list.innerHTML =
    phones.map((phone, index) => {

      const name =
        names[index] || "Student";

      const owner =
        normalizePhone(phone) ===
        normalizePhone(group.ownerPhone);

      return `
        <div class="member">
          👤 ${escapeHTML(name)}
          ${owner ? " 👑 Owner" : ""}
        </div>
      `;

    }).join("");
}

async function addMember() {

  if (
    !selectedGroupId ||
    !selectedGroupData
  ) {
    alert("पहले कोई group खोलें।");
    return;
  }

  if (
    normalizePhone(currentUser.phone) !==
    normalizePhone(selectedGroupData.ownerPhone)
  ) {
    alert(
      "सिर्फ Group Owner member add कर सकता है।"
    );
    return;
  }

  const name =
    $("memberNameInput")?.value.trim();

  const phone =
    normalizePhone(
      $("memberPhoneInput")?.value
    );

  if (!name) {
    alert("Member name डालें।");
    return;
  }

  if (phone.length !== 10) {
    alert(
      "सही 10 digit mobile number डालें।"
    );
    return;
  }

  if (
    (selectedGroupData.memberPhones || [])
      .includes(phone)
  ) {
    alert(
      "यह student पहले से group में है।"
    );
    return;
  }

  const button =
    $("addMemberBtn");

  buttonBusy(button, true);

  try {

    const allowedSnap =
      await getDoc(
        doc(
          db,
          "allowedUsers",
          phone
        )
      );

    if (!allowedSnap.exists()) {
      alert(
        "यह student StudyConnect में allowed नहीं है।"
      );
      return;
    }

    const allowedData =
      allowedSnap.data();

    if (allowedData.allowed !== true) {
      alert(
        "यह student allowed नहीं है।"
      );
      return;
    }

    await updateDoc(
      doc(
        db,
        "groups",
        selectedGroupId
      ),
      {
        memberNames:
          arrayUnion(name),

        memberPhones:
          arrayUnion(phone)
      }
    );

    selectedGroupData.memberNames =
      [
        ...(selectedGroupData.memberNames || []),
        name
      ];

    selectedGroupData.memberPhones =
      [
        ...(selectedGroupData.memberPhones || []),
        phone
      ];

    renderMembers(
      selectedGroupData
    );

    $("memberNameInput").value = "";
    $("memberPhoneInput").value = "";

    alert(
      "✅ Member added successfully!"
    );

  } catch (error) {

    console.error(error);

    alert(
      "Member add नहीं हो पाया।"
    );

  } finally {

    buttonBusy(button, false);
  }
}


/* =========================
   GROUP CHAT
========================= */

function stopGroupChatListener() {

  if (unsubscribeGroupChat) {
    unsubscribeGroupChat();
    unsubscribeGroupChat = null;
  }
}

function startGroupChatListener() {

  if (
    !selectedGroupId ||
    unsubscribeGroupChat
  ) {
    return;
  }

  const messagesQuery =
    query(
      collection(
        db,
        "groups",
        selectedGroupId,
        "messages"
      ),
      orderBy("createdAt", "desc"),
      limit(50)
    );

  unsubscribeGroupChat =
    onSnapshot(
      messagesQuery,
      snapshot => {

        const messages =
          snapshot.docs
            .map(item => ({
              id: item.id,
              ...item.data()
            }))
            .reverse();

        renderMessages(
          $("groupMessages"),
          messages
        );

        markMessagesSeen(
          messages,
          "group"
        );
      },
      error => {

        console.error(error);

        if ($("groupMessages")) {
          $("groupMessages").innerHTML = `
            <div class="empty-state">
              <span>⚠️</span>
              <p>Group chat load नहीं हो पाया।</p>
            </div>
          `;
        }
      }
    );
}

async function sendGroupMessage() {

  if (
    !selectedGroupId ||
    !selectedGroupData
  ) {
    return;
  }

  const input =
    $("groupMessageInput");

  const text =
    input?.value.trim();

  if (!text) return;

  if (
    !(selectedGroupData.memberPhones || [])
      .includes(currentUser.phone)
  ) {
    alert(
      "आप इस group के member नहीं हैं।"
    );
    return;
  }

  const button =
    $("sendGroupMessageBtn");

  buttonBusy(button, true);

  try {

    await addDoc(
      collection(
        db,
        "groups",
        selectedGroupId,
        "messages"
      ),
      {
        name: currentUser.name,
        phone: currentUser.phone,
        text: text.slice(0, 1000),
        createdAt: serverTimestamp(),
        seenBy: []
      }
    );

    input.value = "";
    input.focus();

  } catch (error) {

    console.error(error);

    alert(
      "Group message भेजा नहीं जा सका।"
    );

  } finally {

    buttonBusy(button, false);
  }
}

function setupGroups() {

  $("createGroupBtn")?.addEventListener(
    "click",
    createGroup
  );

  $("unlockGroupBtn")?.addEventListener(
    "click",
    unlockGroup
  );

  $("addMemberBtn")?.addEventListener(
    "click",
    addMember
  );

  $("sendGroupMessageBtn")?.addEventListener(
    "click",
    sendGroupMessage
  );

  $("enterGroupPasswordInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          event.preventDefault();
          unlockGroup();
        }
      }
    );

  $("groupMessageInput")
    ?.addEventListener(
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


/* =========================
   HOMEWORK
========================= */

async function loadHomework() {

  const list =
    $("homeworkList");

  if (!list) return;

  try {

    const q =
      query(
        collection(db, "homework"),
        orderBy("createdAt", "desc"),
        limit(30)
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      list.innerHTML = `
        <div class="empty-state">
          <span>📚</span>
          <p>अभी homework नहीं है।</p>
        </div>
      `;

      return;
    }

    list.innerHTML =
      snapshot.docs.map(item => {

        const data = item.data();

        const entries =
          data.entries || {};

        const subjects =
          Object.entries(entries)
            .filter(
              ([, value]) =>
                String(value || "").trim()
            );

        return `
          <div class="list-item">

            <h3>
              📅 ${escapeHTML(
                data.date || "Date"
              )}
            </h3>

            ${subjects.map(
              ([subject, homework]) => `
                <p>
                  <strong>
                    ${escapeHTML(subject)}
                  :</strong>
                  ${escapeHTML(homework)}
                </p>
              `
            ).join("")}

          </div>
        `;

      }).join("");

  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <p>Homework load नहीं हो पाया।</p>
      </div>
    `;
  }
}

async function saveHomework() {

  const fields = {
    Hindi: $("hindiHomework")?.value.trim(),
    English: $("englishHomework")?.value.trim(),
    Math: $("mathHomework")?.value.trim(),
    Science: $("scienceHomework")?.value.trim(),
    SST: $("sstHomework")?.value.trim(),
    Computer: $("computerHomework")?.value.trim(),
    Art: $("artHomework")?.value.trim()
  };

  const entries =
    Object.fromEntries(
      Object.entries(fields)
        .filter(([, value]) => value)
    );

  if (!Object.keys(entries).length) {
    alert(
      "कम से कम एक homework लिखें।"
    );
    return;
  }

  const date =
    $("homeworkDate")?.value ||
    new Date().toISOString().slice(0, 10);

  const button =
    $("addHomeworkBtn");

  buttonBusy(button, true);

  try {

    await addDoc(
      collection(db, "homework"),
      {
        date,
        entries,
        createdBy: currentUser.phone,
        createdAt: serverTimestamp()
      }
    );

    [
      "hindiHomework",
      "englishHomework",
      "mathHomework",
      "scienceHomework",
      "sstHomework",
      "computerHomework",
      "artHomework"
    ].forEach(id => {
      if ($(id)) $(id).value = "";
    });

    alert(
      "✅ Homework saved!"
    );

    loadHomework();

  } catch (error) {

    console.error(error);

    alert(
      "Homework save नहीं हो पाया।"
    );

  } finally {

    buttonBusy(button, false);
  }
}

function setupHomework() {

  const dateInput =
    $("homeworkDate");

  if (dateInput && !dateInput.value) {
    dateInput.value =
      new Date()
        .toISOString()
        .slice(0, 10);
  }

  $("addHomeworkBtn")?.addEventListener(
    "click",
    saveHomework
  );
}


/* =========================
   SCHOOL
========================= */

async function loadSchool() {

  const list =
    $("schoolList");

  if (!list) return;

  try {

    const q =
      query(
        collection(db, "school"),
        orderBy("createdAt", "desc"),
        limit(30)
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      list.innerHTML = `
        <div class="empty-state">
          <span>🏫</span>
          <p>अभी कोई school update नहीं है।</p>
        </div>
      `;

      return;
    }

    list.innerHTML =
      snapshot.docs.map(item => {

        const data = item.data();

        return `
          <div class="list-item">
            <h3>
              📢 ${escapeHTML(
                data.name || "School Update"
              )}
            </h3>

            <p>
              ${escapeHTML(data.text || "")}
            </p>

            <small>
              ${formatTime(data.createdAt)}
            </small>
          </div>
        `;

      }).join("");

  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <p>School updates load नहीं हुए।</p>
      </div>
    `;
  }
}

async function saveSchool() {

  const input =
    $("schoolInput");

  const text =
    input?.value.trim();

  if (!text) {
    alert(
      "School update लिखें।"
    );
    return;
  }

  const button =
    $("saveSchoolBtn");

  buttonBusy(button, true);

  try {

    await addDoc(
      collection(db, "school"),
      {
        text: text.slice(0, 2000),
        name: currentUser.name,
        phone: currentUser.phone,
        createdAt: serverTimestamp()
      }
    );

    input.value = "";

    alert(
      "✅ School update saved!"
    );

    loadSchool();

  } catch (error) {

    console.error(error);

    alert(
      "School update save नहीं हुआ।"
    );

  } finally {

    buttonBusy(button, false);
  }
}

function setupSchool() {

  $("saveSchoolBtn")?.addEventListener(
    "click",
    saveSchool
  );
}


/* =========================
   NOTES
========================= */

async function loadNotes() {

  const list =
    $("notesList");

  if (!list) return;

  try {

    const q =
      query(
        collection(db, "notes"),
        where(
          "phone",
          "==",
          currentUser.phone
        ),
        limit(50)
      );

    const snapshot =
      await getDocs(q);

    const notes =
      snapshot.docs
        .map(item => ({
          id: item.id,
          ...item.data()
        }))
        .sort((a, b) => {

          const aTime =
            a.createdAt?.toMillis?.() || 0;

          const bTime =
            b.createdAt?.toMillis?.() || 0;

          return bTime - aTime;
        });

    if (!notes.length) {

      list.innerHTML = `
        <div class="empty-state">
          <span>📝</span>
          <p>अभी कोई note नहीं है।</p>
        </div>
      `;

      return;
    }

    list.innerHTML =
      notes.map(note => `
        <div class="list-item">

          <p>
            ${escapeHTML(note.text || "")}
          </p>

          <small>
            ${formatTime(note.createdAt)}
          </small>

        </div>
      `).join("");

  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <p>Notes load नहीं हुए।</p>
      </div>
    `;
  }
}

async function saveNote() {

  const input =
    $("noteInput");

  const text =
    input?.value.trim();

  if (!text) {
    alert(
      "Note लिखें।"
    );
    return;
  }

  const button =
    $("saveNoteBtn");

  buttonBusy(button, true);

  try {

    await addDoc(
      collection(db, "notes"),
      {
        text: text.slice(0, 5000),
        name: currentUser.name,
        phone: currentUser.phone,
        createdAt: serverTimestamp()
      }
    );

    input.value = "";

    alert(
      "✅ Note saved!"
    );

    loadNotes();

  } catch (error) {

    console.error(error);

    alert(
      "Note save नहीं हुआ।"
    );

  } finally {

    buttonBusy(button, false);
  }
}

function setupNotes() {

  $("saveNoteBtn")?.addEventListener(
    "click",
    saveNote
  );
}


/* =========================
   LANGUAGE
========================= */

function setupLanguage() {

  const savedLanguage =
    localStorage.getItem(
      "studyLanguage"
    ) || "hi";

  document.documentElement.lang =
    savedLanguage === "en"
      ? "en"
      : "hi";

  $("hindiLanguageBtn")
    ?.addEventListener(
      "click",
      () => {

        localStorage.setItem(
          "studyLanguage",
          "hi"
        );

        document.documentElement.lang =
          "hi";

        setMessage(
          $("languageMessage"),
          "🇮🇳 हिंदी चुनी गई।",
          "success"
        );
      }
    );

  $("englishLanguageBtn")
    ?.addEventListener(
      "click",
      () => {

        localStorage.setItem(
          "studyLanguage",
          "en"
        );

        document.documentElement.lang =
          "en";

        setMessage(
          $("languageMessage"),
          "🇬🇧 English selected.",
          "success"
        );
      }
    );
}


/* =========================
   THEME
========================= */

function updateThemeButton() {

  const button =
    $("themeBtn");

  if (!button) return;

  button.textContent =
    document.body.classList.contains("dark")
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
}

function setupTheme() {

  const savedTheme =
    localStorage.getItem(
      "studyTheme"
    );

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  updateThemeButton();

  $("themeBtn")?.addEventListener(
    "click",
    () => {

      document.body.classList.toggle("dark");

      const dark =
        document.body.classList.contains("dark");

      localStorage.setItem(
        "studyTheme",
        dark ? "dark" : "light"
      );

      updateThemeButton();
    }
  );
}


/* =========================
   NOTIFICATIONS
========================= */

function setupNotifications() {

  $("notificationBtn")
    ?.addEventListener(
      "click",
      async () => {

        if (!("Notification" in window)) {

          setMessage(
            $("notificationMessage"),
            "इस browser में notifications available नहीं हैं।"
          );

          return;
        }

        try {

          const permission =
            await Notification.requestPermission();

          if (permission === "granted") {

            setMessage(
              $("notificationMessage"),
              "✅ Notifications enabled",
              "success"
            );

            new Notification(
              "StudyConnect",
              {
                body: "Notifications successfully enabled."
              }
            );

          } else {

            setMessage(
              $("notificationMessage"),
              "Notifications permission नहीं मिली।"
            );
          }

        } catch (error) {

          console.error(error);

          setMessage(
            $("notificationMessage"),
            "Notifications enable नहीं हो पाईं।"
          );
        }
      }
    );
}


/* =========================
   OWNER PANEL
========================= */

function setupOwnerPanel() {

  $("ownerLoginBtn")
    ?.addEventListener(
      "click",
      async () => {

        const password =
          $("ownerPasswordInput")
            ?.value;

        if (password !== OWNER_PASSWORD) {

          setMessage(
            $("ownerPasswordMessage"),
            "❌ गलत Owner Password"
          );

          return;
        }

        $("ownerPanel")
          ?.classList.remove("hidden");

        setMessage(
          $("ownerPasswordMessage"),
          `✅ Welcome ${OWNER_NAME}`,
          "success"
        );

        await loadAllowedUsers();
      }
    );


  $("allowUserBtn")
    ?.addEventListener(
      "click",
      allowUser
    );
}

async function allowUser() {

  const name =
    $("allowedUserNameInput")
      ?.value.trim();

  const phone =
    normalizePhone(
      $("allowedUserPhoneInput")
        ?.value
    );

  if (!name) {
    alert("Student name डालें।");
    return;
  }

  if (phone.length !== 10) {
    alert(
      "सही 10 digit mobile number डालें।"
    );
    return;
  }

  const button =
    $("allowUserBtn");

  buttonBusy(button, true);

  try {

    await setDoc(
      doc(
        db,
        "allowedUsers",
        phone
      ),
      {
        name,
        phone,
        allowed: true,
        createdAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

    $("allowedUserNameInput").value = "";
    $("allowedUserPhoneInput").value = "";

    alert(
      "✅ User allowed successfully!"
    );

    loadAllowedUsers();

  } catch (error) {

    console.error(error);

    alert(
      "User allow नहीं हो पाया।"
    );

  } finally {

    buttonBusy(button, false);
  }
}

async function loadAllowedUsers() {

  const list =
    $("allowedUsersList");

  if (!list) return;

  list.innerHTML = `
    <div class="empty-state">
      <span>⏳</span>
      <p>Loading users...</p>
    </div>
  `;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "allowedUsers"
        )
      );

    if (snapshot.empty) {

      list.innerHTML = `
        <div class="empty-state">
          <span>👥</span>
          <p>अभी कोई allowed user नहीं है।</p>
        </div>
      `;

      return;
    }

    const users =
      snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

    list.innerHTML =
      users.map(user => `
        <div class="allowed-user">

          <div class="allowed-user-info">

            <strong>
              ${escapeHTML(
                user.name || "Student"
              )}
            </strong>

            <span>
              ${escapeHTML(
                user.phone || ""
              )}
            </span>

          </div>

          <div class="allowed-status">
            ✅ Allowed
          </div>

        </div>
      `).join("");

  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <p>Allowed users load नहीं हुए।</p>
      </div>
    `;
  }
}


/* =========================
   RESET
========================= */

function setupReset() {

  $("clearDataBtn")
    ?.addEventListener(
      "click",
      () => {

        const confirmReset =
          confirm(
            "क्या आप इस device पर StudyConnect की saved login/settings हटाना चाहते हैं?"
          );

        if (!confirmReset) {
          return;
        }

        stopChatListener();
        stopGroupChatListener();
        stopOnlineListener();

        localStorage.clear();

        currentUser = {
          name: "",
          phone: ""
        };

        selectedGroupId = null;
        selectedGroupData = null;

        setMessage(
          $("settingsMessage"),
          "✅ App data reset हो गया।",
          "success"
        );

        setTimeout(() => {
          location.reload();
        }, 700);
      }
    );
}


/* =========================
   START APP
========================= */

function startApp() {

  setupNavigation();
  setupLogin();
  setupNameSettings();
  setupChat();
  setupOnline();
  setupGroups();
  setupHomework();
  setupSchool();
  setupNotes();
  setupLanguage();
  setupTheme();
  setupNotifications();
  setupOwnerPanel();
  setupReset();

  const savedUser =
    getSavedUser();

  if (savedUser) {
    currentUser = savedUser;
  }
}

startApp();
