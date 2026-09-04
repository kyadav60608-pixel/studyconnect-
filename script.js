import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================================
// FIREBASE
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyCquRX2YB59FObuIyiw3c3AUCdPWypag",
  authDomain: "studyconnect-99006.firebaseapp.com",
  projectId: "studyconnect-99006",
  storageBucket: "studyconnect-99006.firebasestorage.app",
  messagingSenderId: "15964627995",
  appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
  measurementId: "G-SYJYMREJJL"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);


// ======================================================
// APP SETTINGS
// ======================================================

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";

const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

const USER_STORAGE_KEY = "studyconnect_current_user";
const PROFILE_STORAGE_KEY = "studyconnect_profile";
const LANGUAGE_KEY = "studyconnect_language";


// ======================================================
// STATE
// ======================================================

let currentUser = null;
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "en";

let selectedGroupId = null;
let selectedGroupData = null;

let groupUnlocked = false;

let chatUnsubscribe = null;
let groupsUnsubscribe = null;
let groupMessagesUnsubscribe = null;
let presenceUnsubscribe = null;
let membersUnsubscribe = null;

let onlineInterval = null;

let profilePhotoData = "";


// ======================================================
// SHORTCUT
// ======================================================

const $ = (id) => document.getElementById(id);


// ======================================================
// TRANSLATIONS
// ======================================================

const translations = {

  en: {

    loginDescription: "Enter your password to continue",
    enterPassword: "Enter your password",
    next: "Next",
    ownerNameLabel: "Owner",

    yourName: "Your Name",
    mobileNumber: "Mobile Number",
    profilePhoto: "Profile Photo (Optional)",
    enterApp: "Enter / Open",

    home: "Home",
    chat: "Chat",
    groups: "Groups",
    homework: "Homework",
    school: "School",
    notes: "Notes",
    settings: "Settings",

    welcome: "Welcome",
    welcomeText: "Welcome to StudyConnect.",
    saveName: "Save Name",
    onlineNow: "Online Now",

    chatTitle: "Chat",
    chatDescription: "Real-time StudyConnect chat.",
    send: "Send",

    groupsTitle: "Groups",
    groupName: "Group Name",
    groupPassword: "Group Password",
    createGroupButton: "Create Group",
    groupList: "My Groups",
    addMember: "Add Member",
    addMemberButton: "Add Member",

    homeworkTitle: "Homework",
    date: "Date",
    saveHomework: "Save Homework",

    schoolUpdateTitle: "School Update",
    schoolDescription: "Save school updates.",
    saveUpdate: "Save Update",

    notesTitle: "Notes",
    notesDescription: "Save your notes here.",
    saveNote: "Save Note",

    settingsTitle: "Settings",
    settingsDescription: "Manage your StudyConnect settings.",
    changeName: "Change Name",
    changeNameButton: "Change Name",

    language: "Language",
    theme: "Theme",
    notifications: "Notifications",
    enableNotifications: "Enable Notifications",

    owner: "Owner",
    appData: "App Data",
    resetAppData: "Reset App Data"
  },

  hi: {

    loginDescription: "आगे बढ़ने के लिए पासवर्ड डालें",
    enterPassword: "अपना पासवर्ड डालें",
    next: "आगे",
    ownerNameLabel: "मालिक",

    yourName: "आपका नाम",
    mobileNumber: "मोबाइल नंबर",
    profilePhoto: "प्रोफाइल फोटो (वैकल्पिक)",
    enterApp: "ऐप खोलें",

    home: "होम",
    chat: "चैट",
    groups: "ग्रुप",
    homework: "होमवर्क",
    school: "स्कूल",
    notes: "नोट्स",
    settings: "सेटिंग्स",

    welcome: "स्वागत है",
    welcomeText: "StudyConnect में आपका स्वागत है।",
    saveName: "नाम सेव करें",
    onlineNow: "अभी ऑनलाइन",

    chatTitle: "चैट",
    chatDescription: "StudyConnect की रियल-टाइम चैट।",
    send: "भेजें",

    groupsTitle: "ग्रुप",
    groupName: "ग्रुप का नाम",
    groupPassword: "ग्रुप पासवर्ड",
    createGroupButton: "ग्रुप बनाएं",
    groupList: "मेरे ग्रुप",
    addMember: "सदस्य जोड़ें",
    addMemberButton: "सदस्य जोड़ें",

    homeworkTitle: "होमवर्क",
    date: "तारीख",
    saveHomework: "होमवर्क सेव करें",

    schoolUpdateTitle: "स्कूल अपडेट",
    schoolDescription: "स्कूल के अपडेट सेव करें।",
    saveUpdate: "अपडेट सेव करें",

    notesTitle: "नोट्स",
    notesDescription: "अपने नोट्स यहां सेव करें।",
    saveNote: "नोट सेव करें",

    settingsTitle: "सेटिंग्स",
    settingsDescription: "StudyConnect की सेटिंग्स मैनेज करें।",
    changeName: "नाम बदलें",
    changeNameButton: "नाम बदलें",

    language: "भाषा",
    theme: "थीम",
    notifications: "नोटिफिकेशन",
    enableNotifications: "नोटिफिकेशन चालू करें",

    owner: "मालिक",
    appData: "ऐप डेटा",
    resetAppData: "ऐप डेटा रीसेट करें"
  }

};


// ======================================================
// LANGUAGE
// ======================================================

function applyLanguage() {

  const dictionary = translations[currentLanguage];

  document.documentElement.lang =
    currentLanguage === "hi" ? "hi" : "en";

  document.querySelectorAll("[data-i18n]").forEach((element) => {

    const key = element.dataset.i18n;

    if (dictionary[key]) {
      element.textContent = dictionary[key];
    }

  });

  localStorage.setItem(
    LANGUAGE_KEY,
    currentLanguage
  );
}


// ======================================================
// UI HELPERS
// ======================================================

function show(element) {

  if (!element) return;

  if (
    element.id === "passwordScreen" ||
    element.id === "contactOwnerScreen"
  ) {
    element.style.display = "flex";
  } else {
    element.style.display = "block";
  }
}


function hide(element) {

  if (!element) return;

  element.style.display = "none";
}


function message(element, text, type = "") {

  if (!element) return;

  element.textContent = text;

  element.className = "message";

  if (type) {
    element.classList.add(type);
  }
}


function normalizePhone(phone) {

  return String(phone || "")
    .replace(/\D/g, "")
    .slice(-10);
}


function formatTime(timestamp) {

  if (!timestamp) return "";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ======================================================
// LOGIN FLOW
// ======================================================

function setupPasswordLogin() {

  $("unlockBtn")?.addEventListener(
    "click",
    checkSchoolPassword
  );

  $("appPassword")?.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {
        checkSchoolPassword();
      }

    }
  );
}


function checkSchoolPassword() {

  const enteredPassword =
    $("appPassword")?.value.trim();

  if (enteredPassword !== SCHOOL_PASSWORD) {

    message(
      $("passwordError"),
      currentLanguage === "hi"
        ? "पासवर्ड गलत है।"
        : "Incorrect password.",
      "error"
    );

    return;
  }

  message($("passwordError"), "");

  hide($("schoolPasswordStep"));
  show($("ownerStep"));

}


function setupNextButton() {

  $("ownerNextBtn")?.addEventListener(
    "click",
    () => {

      hide($("ownerStep"));
      show($("userDetailsStep"));

      $("openUserName")?.focus();

    }
  );
}


// ======================================================
// PROFILE PHOTO
// ======================================================

function setupProfilePhoto() {

  $("profilePhotoInput")?.addEventListener(
    "change",
    async (event) => {

      const file = event.target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        return;
      }

      profilePhotoData =
        await resizeImage(file, 400);

      const preview = $("profilePhotoPreview");

      if (preview) {

        preview.src = profilePhotoData;
        preview.style.display = "block";

      }

    }
  );

}


function resizeImage(file, maxSize) {

  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.onload = () => {

      const image = new Image();

      image.onload = () => {

        let width = image.width;
        let height = image.height;

        if (width > height) {

          if (width > maxSize) {

            height =
              height * (maxSize / width);

            width = maxSize;
          }

        } else {

          if (height > maxSize) {

            width =
              width * (maxSize / height);

            height = maxSize;
          }

        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext("2d");

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        resolve(
          canvas.toDataURL(
            "image/jpeg",
            0.75
          )
        );

      };

      image.src = reader.result;

    };

    reader.readAsDataURL(file);

  });

}


// ======================================================
// ENTER APP
// ======================================================

function setupEnterApp() {

  $("enterAppBtn")?.addEventListener(
    "click",
    loginUser
  );

}


async function loginUser() {

  const name =
    $("openUserName")?.value.trim();

  const phone =
    normalizePhone(
      $("openUserPhone")?.value
    );

  if (!name) {

    message(
      $("passwordError"),
      currentLanguage === "hi"
        ? "अपना नाम डालें।"
        : "Enter your name.",
      "error"
    );

    return;
  }


  if (phone.length !== 10) {

    message(
      $("passwordError"),
      currentLanguage === "hi"
        ? "सही 10 अंकों का मोबाइल नंबर डालें।"
        : "Enter a valid 10-digit mobile number.",
      "error"
    );

    return;
  }


  message(
    $("passwordError"),
    currentLanguage === "hi"
      ? "चेक किया जा रहा है..."
      : "Checking authorization..."
  );


  try {

    const userRef =
      doc(db, "allowedUsers", phone);

    const userSnap =
      await getDoc(userRef);


    if (!userSnap.exists()) {

      showContactOwner();
      return;
    }


    const userData =
      userSnap.data();


    const savedName =
      String(userData.name || "")
        .trim()
        .toLowerCase();

    if (
      savedName &&
      savedName !== name.trim().toLowerCase()
    ) {

      showContactOwner();
      return;
    }


    currentUser = {

      name,
      phone,
      photo: profilePhotoData || ""
    };


    saveCurrentUser();


    message(
      $("passwordError"),
      ""
    );


    finishLogin();

  } catch (error) {

    console.error(error);

    message(
      $("passwordError"),
      currentLanguage === "hi"
        ? "कनेक्शन में समस्या है। Firebase चेक करें।"
        : "Connection problem. Check Firebase.",
      "error"
    );

  }

}


// ======================================================
// SAVE / LOAD USER
// ======================================================

function saveCurrentUser() {

  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify(currentUser)
  );

  if (profilePhotoData) {

    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      profilePhotoData
    );

  }

}


async function loadSavedUser() {

  const saved =
    localStorage.getItem(USER_STORAGE_KEY);

  if (!saved) return;

  try {

    const user =
      JSON.parse(saved);

    if (!user?.name || !user?.phone) {
      return;
    }

    const phone =
      normalizePhone(user.phone);

    const userRef =
      doc(db, "allowedUsers", phone);

    const snap =
      await getDoc(userRef);

    if (!snap.exists()) {

      localStorage.removeItem(
        USER_STORAGE_KEY
      );

      return;
    }

    const data = snap.data();

    if (
      data.name &&
      String(data.name).trim().toLowerCase() !==
      String(user.name).trim().toLowerCase()
    ) {

      localStorage.removeItem(
        USER_STORAGE_KEY
      );

      return;
    }

    currentUser = {
      name: user.name,
      phone,
      photo:
        user.photo ||
        localStorage.getItem(
          PROFILE_STORAGE_KEY
        ) ||
        ""
    };

    finishLogin();

  } catch (error) {

    console.error(
      "Saved user error:",
      error
    );

  }

}


// ======================================================
// FINISH LOGIN
// ======================================================

function finishLogin() {

  hide($("passwordScreen"));
  hide($("contactOwnerScreen"));

  show($("appContainer"));

  updateProfileUI();

  startOnlinePresence();

  startChatRealtime();

  startGroupsRealtime();

  loadLocalData();

  showPage("home");

}


// ======================================================
// CONTACT OWNER
// ======================================================

function showContactOwner() {

  hide($("passwordScreen"));
  show($("contactOwnerScreen"));

}


function setupOwnerContact() {

  $("callOwnerBtn")?.addEventListener(
    "click",
    () => {

      window.location.href =
        `tel:${OWNER_PHONE}`;

    }
  );


  $("whatsappOwnerBtn")?.addEventListener(
    "click",
    () => {

      window.open(
        `https://wa.me/91${OWNER_PHONE}`,
        "_blank"
      );

    }
  );


  $("backToLoginBtn")?.addEventListener(
    "click",
    () => {

      hide($("contactOwnerScreen"));
      show($("passwordScreen"));

      hide($("ownerStep"));
      hide($("userDetailsStep"));
      show($("schoolPasswordStep"));

      $("appPassword").value = "";
      $("passwordError").textContent = "";

    }
  );

}


// ======================================================
// NAVIGATION
// ======================================================

function setupNavigation() {

  $("menuBtn")?.addEventListener(
    "click",
    () => {

      $("navMenu")?.classList.toggle(
        "open"
      );

    }
  );


  document.querySelectorAll(
    ".nav-item"
  ).forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

        $("navMenu")?.classList.remove(
          "open"
        );

      }
    );

  });

}


function showPage(pageId) {

  document.querySelectorAll(
    ".page"
  ).forEach((page) => {

    page.classList.remove(
      "active"
    );

  });


  const page =
    $(pageId);

  if (page) {

    page.classList.add(
      "active"
    );

  }

}


// ======================================================
// PROFILE / HOME
// ======================================================

function updateProfileUI() {

  if (!currentUser) return;

  const name =
    currentUser.name;

  $("currentUserName").textContent =
    name;

  $("currentUserPhone").textContent =
    currentUser.phone;


  const circle =
    $("profileCircle");

  if (!circle) return;


  if (currentUser.photo) {

    circle.innerHTML =
      `<img src="${currentUser.photo}" alt="Profile">`;

  } else {

    circle.textContent = "👤";

  }


  if ($("saveNameInput")) {

    $("saveNameInput").value =
      name;

  }

}


function setupHomeName() {

  $("saveNameBtn")?.addEventListener(
    "click",
    () => {

      if (!currentUser) return;

      const name =
        $("saveNameInput")?.value.trim();

      if (!name) {

        message(
          $("nameMessage"),
          currentLanguage === "hi"
            ? "नाम डालें।"
            : "Enter your name.",
          "error"
        );

        return;
      }


      currentUser.name = name;

      saveCurrentUser();

      updateProfileUI();

      message(
        $("nameMessage"),
        currentLanguage === "hi"
          ? "नाम सेव हो गया।"
          : "Name saved.",
        "success"
      );

    }
  );

}


// ======================================================
// ONLINE PRESENCE
// ======================================================

async function startOnlinePresence() {

  if (!currentUser) return;

  const phone =
    currentUser.phone;

  const presenceRef =
    doc(db, "presence", phone);


  const updatePresence =
    async () => {

      try {

        await setDoc(
          presenceRef,
          {
            name: currentUser.name,
            phone,
            online: true,
            lastSeen: serverTimestamp()
          },
          { merge: true }
        );

      } catch (error) {

        console.error(
          "Presence error:",
          error
        );

      }

    };


  await updatePresence();


  if (onlineInterval) {

    clearInterval(
      onlineInterval
    );

  }


  onlineInterval =
    setInterval(
      updatePresence,
      30000
    );


  window.addEventListener(
    "beforeunload",
    () => {

      setDoc(
        presenceRef,
        {
          online: false,
          lastSeen: serverTimestamp()
        },
        { merge: true }
      );

    }
  );


  if (presenceUnsubscribe) {
    presenceUnsubscribe();
  }


  presenceUnsubscribe =
    onSnapshot(
      collection(db, "presence"),
      (snapshot) => {

        const users = [];

        const now =
          Date.now();


        snapshot.forEach((item) => {

          const data =
            item.data();

          let lastSeenTime = 0;

          if (data.lastSeen?.toDate) {

            lastSeenTime =
              data.lastSeen.toDate().getTime();

          }


          if (
            data.online === true &&
            (
              !lastSeenTime ||
              now - lastSeenTime < 90000
            )
          ) {

            users.push(data);

          }

        });


        renderOnlineUsers(users);

      }
    );

}


function renderOnlineUsers(users) {

  $("onlineCount").textContent =
    users.length;


  const container =
    $("onlineUsers");

  if (!container) return;


  if (!users.length) {

    container.innerHTML =
      `<div class="online-user">${
        currentLanguage === "hi"
          ? "अभी कोई ऑनलाइन नहीं है।"
          : "No one is online right now."
      }</div>`;

    return;
  }


  container.innerHTML = "";


  users.forEach((user) => {

    const div =
      document.createElement("div");

    div.className =
      "online-user";

    div.textContent =
      `🟢 ${user.name || "User"}`;

    container.appendChild(div);

  });

}
