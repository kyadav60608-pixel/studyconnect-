/* =========================================================
   STUDYCONNECT - COMPLETE script.js
   Matching the provided index.html
   ========================================================= */


/* =========================================================
   1. BASIC SETTINGS
   ========================================================= */

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";

const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

const FIREBASE_VERSION = "12.1.0";

const firebaseConfig = {
    apiKey: "AIzaSyCquSCRIPT_EXAMPLE",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};


/* =========================================================
   2. GLOBAL VARIABLES
   ========================================================= */

let firebaseReady = false;
let db = null;

let firebaseModules = {
    initializeApp: null,
    getFirestore: null,
    collection: null,
    addDoc: null,
    setDoc: null,
    getDoc: null,
    getDocs: null,
    updateDoc: null,
    deleteDoc: null,
    doc: null,
    query: null,
    where: null,
    orderBy: null,
    limit: null,
    onSnapshot: null,
    serverTimestamp: null,
    Timestamp: null
};

let currentUser = null;

let chatUnsubscribe = null;
let groupsUnsubscribe = null;
let groupMessagesUnsubscribe = null;
let onlineUnsubscribe = null;
let allowedUsersUnsubscribe = null;

let heartbeatTimer = null;

let selectedGroup = null;
let unlockedGroups = new Set();

let firstChatLoad = true;
let firstGroupChatLoad = true;

let knownChatMessages = new Set();
let knownGroupMessages = new Set();

let currentLanguage = localStorage.getItem("studyLanguage") || "en";

let translations = {
    en: {
        home: "Home",
        chat: "Chat",
        groups: "Groups",
        homework: "Homework",
        school: "School",
        notes: "Notes",
        settings: "Settings",

        welcome: "Welcome to StudyConnect",
        welcomeText: "Connect with students, share homework and study together.",
        yourName: "Your Name",
        saveName: "Save Name",
        onlineNow: "Online Now",

        chatDescription: "Chat with other StudyConnect users.",
        groupsDescription: "Create private study groups.",

        schoolUpdate: "School Update",

        chatTitle: "Chat",
        groupsTitle: "Groups",
        createGroup: "Create Group",
        createGroupButton: "Create Group",
        addMember: "Add Member",
        addMemberButton: "Add Member",
        send: "Send",

        homeworkTitle: "Homework",
        date: "Date",
        saveHomework: "Save Homework",

        schoolUpdateTitle: "School Updates",
        schoolDescription: "Share important school updates.",
        saveUpdate: "Save Update",

        notesTitle: "Notes",
        notesDescription: "Save your study notes.",
        saveNote: "Save Note",

        settingsTitle: "Settings",
        settingsDescription: "Manage your StudyConnect settings.",
        changeName: "Change Name",
        changeNameButton: "Change Name",

        language: "Language",
        theme: "Theme",
        notifications: "Notifications",
        enableNotifications: "Enable Notifications",
        appData: "App Data",
        resetAppData: "Reset App Data",
        owner: "Owner",

        enterPassword: "Enter your password",
        next: "Next",
        enterYourDetails: "Enter Your Details",
        mobileNumber: "Mobile Number",
        enterApp: "Enter / Open",
        contactOwner: "Contact Owner",
        contactOwnerText: "You are not allowed to use this app. Please contact the owner.",
        callOwner: "Call Owner",
        whatsappOwner: "WhatsApp Owner",
        back: "Back",

        ownerName: "Owner Name",
        ownerLogin: "Owner Login",
        ownerPanel: "Owner Panel",
        ownerPassword: "Owner Password",
        loginOwner: "Login as Owner",
        allowedUserName: "Allowed User Name",
        allowedUserPhone: "Allowed User Mobile",
        allowUser: "Allow User",

        groupPassword: "Group Password",
        enterGroupPassword: "Enter Group Password",
        unlockGroup: "Unlock Group",
        memberName: "Member Name",
        memberPhone: "Member Mobile",

        profilePhoto: "Profile Photo"
    },

    hi: {
        home: "होम",
        chat: "चैट",
        groups: "ग्रुप",
        homework: "होमवर्क",
        school: "स्कूल",
        notes: "नोट्स",
        settings: "सेटिंग्स",

        welcome: "StudyConnect में आपका स्वागत है",
        welcomeText: "स्टूडेंट्स से जुड़ें, होमवर्क शेयर करें और साथ में पढ़ें।",
        yourName: "आपका नाम",
        saveName: "नाम सेव करें",
        onlineNow: "अभी ऑनलाइन",

        chatDescription: "StudyConnect यूज़र्स से चैट करें।",
        groupsDescription: "प्राइवेट स्टडी ग्रुप बनाएं।",

        schoolUpdate: "स्कूल अपडेट",

        chatTitle: "चैट",
        groupsTitle: "ग्रुप",
        createGroup: "ग्रुप बनाएं",
        createGroupButton: "ग्रुप बनाएं",
        addMember: "मेंबर जोड़ें",
        addMemberButton: "मेंबर जोड़ें",
        send: "भेजें",

        homeworkTitle: "होमवर्क",
        date: "तारीख",
        saveHomework: "होमवर्क सेव करें",

        schoolUpdateTitle: "स्कूल अपडेट",
        schoolDescription: "जरूरी स्कूल अपडेट शेयर करें।",
        saveUpdate: "अपडेट सेव करें",

        notesTitle: "नोट्स",
        notesDescription: "अपने पढ़ाई के नोट्स सेव करें।",
        saveNote: "नोट सेव करें",

        settingsTitle: "सेटिंग्स",
        settingsDescription: "StudyConnect की सेटिंग्स मैनेज करें।",
        changeName: "नाम बदलें",
        changeNameButton: "नाम बदलें",

        language: "भाषा",
        theme: "थीम",
        notifications: "नोटिफिकेशन",
        enableNotifications: "नोटिफिकेशन चालू करें",
        appData: "ऐप डेटा",
        resetAppData: "ऐप डेटा रीसेट करें",
        owner: "ओनर",

        enterPassword: "अपना पासवर्ड डालें",
        next: "आगे जाएं",
        enterYourDetails: "अपनी जानकारी डालें",
        mobileNumber: "मोबाइल नंबर",
        enterApp: "ऐप खोलें",
        contactOwner: "ओनर से संपर्क करें",
        contactOwnerText: "आपको इस ऐप को इस्तेमाल करने की अनुमति नहीं है। ओनर से संपर्क करें।",
        callOwner: "ओनर को कॉल करें",
        whatsappOwner: "ओनर को WhatsApp करें",
        back: "वापस",

        ownerName: "ओनर का नाम",
        ownerLogin: "ओनर लॉगिन",
        ownerPanel: "ओनर पैनल",
        ownerPassword: "ओनर पासवर्ड",
        loginOwner: "ओनर के रूप में लॉगिन",
        allowedUserName: "अनुमत यूज़र का नाम",
        allowedUserPhone: "अनुमत यूज़र का मोबाइल",
        allowUser: "यूज़र को अनुमति दें",

        groupPassword: "ग्रुप पासवर्ड",
        enterGroupPassword: "ग्रुप पासवर्ड डालें",
        unlockGroup: "ग्रुप खोलें",
        memberName: "मेंबर का नाम",
        memberPhone: "मेंबर का मोबाइल",

        profilePhoto: "प्रोफाइल फोटो"
    }
};


/* =========================================================
   3. SHORT HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function show(element) {
    if (!element) return;
    element.style.display = "";
}

function hide(element) {
    if (!element) return;
    element.style.display = "none";
}

function setText(id, text) {
    const element = $(id);
    if (element) element.textContent = text;
}

function safeText(value) {
    return String(value ?? "");
}

function escapeHTML(value) {
    return safeText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizePhone(phone) {
    return safeText(phone).replace(/\D/g, "").slice(-10);
}

function isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(normalizePhone(phone));
}

function getNowTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getDateTime() {
    return new Date().toLocaleString();
}

function showMessage(element, message, success = false) {
    if (!element) return;

    element.textContent = message;
    element.style.display = "block";

    if (success) {
        element.dataset.type = "success";
    } else {
        element.dataset.type = "error";
    }
}

function hideMessage(element) {
    if (!element) return;
    element.textContent = "";
    element.style.display = "none";
}


/* =========================================================
   4. LOGIN SCREEN
   ========================================================= */

function resetLogin() {

    show($("schoolPasswordStep"));
    hide($("ownerStep"));
    hide($("userDetailsStep"));
    hide($("contactOwnerScreen"));
    hide($("appContainer"));

    if ($("appPassword")) {
        $("appPassword").value = "";
    }

    if ($("openUserName")) {
        $("openUserName").value = "";
    }

    if ($("openUserPhone")) {
        $("openUserPhone").value = "";
    }

    hideMessage($("passwordError"));
}

function setupLogin() {

    resetLogin();

    const unlockBtn = $("unlockBtn");
    const ownerNextBtn = $("ownerNextBtn");
    const enterAppBtn = $("enterAppBtn");
    const backBtn = $("backToLoginBtn");

    if (unlockBtn) {

        unlockBtn.addEventListener("click", function (event) {

            event.preventDefault();

            const password = $("appPassword")?.value.trim();

            if (password !== SCHOOL_PASSWORD) {

                showMessage(
                    $("passwordError"),
                    currentLanguage === "hi"
                        ? "गलत पासवर्ड!"
                        : "Wrong password!"
                );

                return;
            }

            hide($("schoolPasswordStep"));
            show($("ownerStep"));

            setText("ownerNameDisplay", OWNER_NAME);

            hideMessage($("passwordError"));
        });
    }


    if (ownerNextBtn) {

        ownerNextBtn.addEventListener("click", function (event) {

            event.preventDefault();

            hide($("ownerStep"));
            show($("userDetailsStep"));

        });
    }


    if (enterAppBtn) {

        enterAppBtn.addEventListener("click", async function (event) {

            event.preventDefault();

            await openStudyConnect();

        });
    }


    if (backBtn) {

        backBtn.addEventListener("click", function (event) {

            event.preventDefault();

            resetLogin();

        });
    }


    /* Enter key support */

    $("appPassword")?.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            event.preventDefault();
            unlockBtn?.click();
        }

    });


    $("openUserPhone")?.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            event.preventDefault();
            enterAppBtn?.click();
        }

    });
}


/* =========================================================
   5. PROFILE PHOTO
   ========================================================= */

function setupProfilePhoto() {

    const input = $("profilePhotoInput");
    const preview = $("profilePhotoPreview");

    if (!input) return;

    input.addEventListener("change", function () {

        const file = input.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            input.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {

            const result = reader.result;

            if (preview) {

                preview.src = result;
                preview.style.display = "block";

            }

            localStorage.setItem("studyProfilePhoto", result);

        };

        reader.readAsDataURL(file);
    });
}


/* =========================================================
   6. FIREBASE DYNAMIC LOADER
   ========================================================= */

async function loadFirebase() {

    if (firebaseReady && db) {
        return true;
    }

    try {

        const appModule = await import(
            `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
        );

        const firestoreModule = await import(
            `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
        );

        firebaseModules.initializeApp = appModule.initializeApp;

        firebaseModules.getFirestore =
            firestoreModule.getFirestore;

        firebaseModules.collection =
            firestoreModule.collection;

        firebaseModules.addDoc =
            firestoreModule.addDoc;

        firebaseModules.setDoc =
            firestoreModule.setDoc;

        firebaseModules.getDoc =
            firestoreModule.getDoc;

        firebaseModules.getDocs =
            firestoreModule.getDocs;

        firebaseModules.updateDoc =
            firestoreModule.updateDoc;

        firebaseModules.deleteDoc =
            firestoreModule.deleteDoc;

        firebaseModules.doc =
            firestoreModule.doc;

        firebaseModules.query =
            firestoreModule.query;

        firebaseModules.where =
            firestoreModule.where;

        firebaseModules.orderBy =
            firestoreModule.orderBy;

        firebaseModules.limit =
            firestoreModule.limit;

        firebaseModules.onSnapshot =
            firestoreModule.onSnapshot;

        firebaseModules.serverTimestamp =
            firestoreModule.serverTimestamp;

        firebaseModules.Timestamp =
            firestoreModule.Timestamp;

        const app = firebaseModules.initializeApp(firebaseConfig);

        db = firebaseModules.getFirestore(app);

        firebaseReady = true;

        console.log("Firebase connected successfully.");

        return true;

    } catch (error) {

        console.error("Firebase loading error:", error);

        firebaseReady = false;
        db = null;

        return false;
    }
}


/* =========================================================
   7. OPEN STUDYCONNECT
   ========================================================= */

async function openStudyConnect() {

    const name = $("openUserName")?.value.trim();
    const phone = normalizePhone($("openUserPhone")?.value);

    if (!name) {

        alert(
            currentLanguage === "hi"
                ? "कृपया अपना नाम डालें।"
                : "Please enter your name."
        );

        return;
    }

    if (!isValidPhone(phone)) {

        alert(
            currentLanguage === "hi"
                ? "कृपया सही 10 अंकों का मोबाइल नंबर डालें।"
                : "Please enter a valid 10-digit mobile number."
        );

        return;
    }


    /* Owner himself is automatically allowed */

    if (
        name.toLowerCase() === OWNER_NAME.toLowerCase() &&
        phone === normalizePhone(OWNER_PHONE)
    ) {

        currentUser = {
            name: OWNER_NAME,
            phone: phone,
            isOwner: true
        };

        finishLogin();

        return;
    }


    const firebaseLoaded = await loadFirebase();

    if (!firebaseLoaded) {

        alert(
            currentLanguage === "hi"
                ? "Firebase कनेक्ट नहीं हो पाया। इंटरनेट और Firebase सेटिंग्स चेक करें।"
                : "Firebase could not connect. Check internet and Firebase settings."
        );

        return;
    }


    try {

        const usersRef =
            firebaseModules.collection(db, "allowedUsers");

        const userQuery =
            firebaseModules.query(
                usersRef,
                firebaseModules.where("phone", "==", phone)
            );

        const result =
            await firebaseModules.getDocs(userQuery);

        let allowed = false;
        let foundUser = null;

        result.forEach(function (item) {

            const data = item.data();

            if (
                safeText(data.name).trim().toLowerCase() ===
                name.trim().toLowerCase()
            ) {

                allowed = true;

                foundUser = {
                    id: item.id,
                    name: data.name,
                    phone: data.phone,
                    photo: data.photo || "",
                    isOwner: false
                };
            }
        });


        if (!allowed) {

            showContactOwner();

            return;
        }


        currentUser = foundUser;

        finishLogin();

    } catch (error) {

        console.error("Login check error:", error);

        alert(
            currentLanguage === "hi"
                ? "यूज़र चेक करते समय Firebase error आया।"
                : "A Firebase error occurred while checking the user."
        );
    }
}


/* =========================================================
   8. CONTACT OWNER SCREEN
   ========================================================= */

function showContactOwner() {

    hide($("passwordScreen"));
    hide($("appContainer"));

    show($("contactOwnerScreen"));

    const callBtn = $("callOwnerBtn");
    const whatsappBtn = $("whatsappOwnerBtn");

    if (callBtn) {

        callBtn.onclick = function () {

            window.location.href =
                `tel:${OWNER_PHONE}`;

        };
    }


    if (whatsappBtn) {

        whatsappBtn.onclick = function () {

            const message =
                encodeURIComponent(
                    "Hello Krishna Yadav, I want permission to use StudyConnect."
                );

            window.open(
                `https://wa.me/91${OWNER_PHONE}?text=${message}`,
                "_blank"
            );

        };
    }

    setText(
        "contactOwnerTitle",
        currentLanguage === "hi"
            ? "ओनर से संपर्क करें"
            : "Contact Owner"
    );

    setText(
        "contactOwnerText",
        currentLanguage === "hi"
            ? "आपको इस ऐप को इस्तेमाल करने की अनुमति नहीं है। कृपया ओनर से संपर्क करें।"
            : "You are not allowed to use this app. Please contact the owner."
    );
}


/* =========================================================
   9. FINISH LOGIN
   ========================================================= */

function finishLogin() {

    hide($("passwordScreen"));
    hide($("contactOwnerScreen"));

    show($("appContainer"));

    localStorage.setItem(
        "studyCurrentUser",
        JSON.stringify(currentUser)
    );

    if (currentUser?.photo) {

        localStorage.setItem(
            "studyProfilePhoto",
            currentUser.photo
        );

    }

    initializeApp();
}


/* =========================================================
   10. NAVIGATION
   ========================================================= */

function setupNavigation() {

    const menuBtn = $("menuBtn");
    const navMenu = $("navMenu");

    if (menuBtn) {

        menuBtn.addEventListener("click", function () {

            if (!navMenu) return;

            if (
                navMenu.style.display === "none" ||
                !navMenu.style.display
            ) {

                navMenu.style.display = "block";

            } else {

                navMenu.style.display = "none";

            }

        });
    }


    document.querySelectorAll("[data-page]").forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            const pageName =
                button.getAttribute("data-page");

            openPage(pageName);

        });

    });


    document.querySelectorAll(".open-page").forEach(function (element) {

        element.addEventListener("click", function () {

            const pageName =
                element.dataset.page;

            if (pageName) {
                openPage(pageName);
            }

        });

    });
}


function openPage(pageName) {

    if (!pageName) return;

    document.querySelectorAll(".page").forEach(function (page) {

        page.classList.remove("active");

        if (page.id === pageName) {
            page.classList.add("active");
        }

    });


    document.querySelectorAll("[data-page]").forEach(function (button) {

        button.classList.remove("active");

        if (button.dataset.page === pageName) {
            button.classList.add("active");
        }

    });


    const navMenu = $("navMenu");

    if (navMenu) {
        navMenu.style.display = "none";
    }
}


/* =========================================================
   11. HOME / USER NAME
   ========================================================= */

function setupHome() {

    const savedName =
        localStorage.getItem("studyName");

    if (
        savedName &&
        $("studentName")
    ) {

        $("studentName").value = savedName;

    }


    if ($("saveNameBtn")) {

        $("saveNameBtn").addEventListener(
            "click",
            saveStudentName
        );

    }


    renderCurrentUser();


    if ($("onlineToggleBtn")) {

        $("onlineToggleBtn").addEventListener(
            "click",
            toggleOnlineStatus
        );

    }
}


function saveStudentName() {

    const input = $("studentName");

    if (!input) return;

    const name = input.value.trim();

    if (!name) {

        alert(
            currentLanguage === "hi"
                ? "कृपया नाम डालें।"
                : "Please enter your name."
        );

        return;
    }

    localStorage.setItem("studyName", name);

    if (currentUser) {
        currentUser.name = name;
    }

    setText(
        "nameMessage",
        currentLanguage === "hi"
            ? "नाम सेव हो गया!"
            : "Name saved!"
    );

    renderCurrentUser();

    updateOnlineUser();
}


function renderCurrentUser() {

    const container =
        $("currentUserProfile");

    if (!container || !currentUser) return;

    const photo =
        currentUser.photo ||
        localStorage.getItem("studyProfilePhoto") ||
        "";

    container.innerHTML = `
        <div class="current-profile">
            ${
                photo
                    ? `<img src="${escapeHTML(photo)}" alt="Profile">`
                    : `<div class="profile-placeholder">👤</div>`
            }
            <div>
                <strong>${escapeHTML(currentUser.name)}</strong>
                <div>${escapeHTML(currentUser.phone)}</div>
            </div>
        </div>
    `;
}


/* =========================================================
   12. ONLINE STATUS
   ========================================================= */

async function toggleOnlineStatus() {

    if (!firebaseReady) {

        const loaded = await loadFirebase();

        if (!loaded) return;

    }

    const button = $("onlineToggleBtn");

    if (!currentUser) return;

    const phone = currentUser.phone;

    try {

        const userRef =
            firebaseModules.doc(
                db,
                "onlineUsers",
                phone
            );

        const existing =
            await firebaseModules.getDoc(userRef);

        const oldData =
            existing.exists()
                ? existing.data()
                : {};

        const isOnline =
            oldData.online === true;

        await firebaseModules.setDoc(
            userRef,
            {
                name: currentUser.name,
                phone: currentUser.phone,
                photo: currentUser.photo || "",
                online: !isOnline,
                lastSeen: firebaseModules.serverTimestamp()
            },
            { merge: true }
        );

        if (button) {

            button.textContent =
                !isOnline
                    ? (
                        currentLanguage === "hi"
                            ? "ऑफलाइन जाएं"
                            : "Go Offline"
                    )
                    : (
                        currentLanguage === "hi"
                            ? "ऑनलाइन आएं"
                            : "Go Online"
                    );

        }

    } catch (error) {

        console.error(error);

        alert("Online status update failed.");
    }
}


async function updateOnlineUser() {

    if (!firebaseReady || !currentUser) return;

    try {

        const userRef =
            firebaseModules.doc(
                db,
                "onlineUsers",
                currentUser.phone
            );

        await firebaseModules.setDoc(
            userRef,
            {
                name: currentUser.name,
                phone: currentUser.phone,
                photo: currentUser.photo || "",
                online: true,
                lastSeen: firebaseModules.serverTimestamp()
            },
            { merge: true }
        );

    } catch (error) {

        console.error("Online update:", error);

    }
}


function startOnlinePresence() {

    if (!firebaseReady || !currentUser) return;

    updateOnlineUser();

    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
    }

    heartbeatTimer = setInterval(
        updateOnlineUser,
        30000
    );


    if (onlineUnsubscribe) {
        onlineUnsubscribe();
    }


    const onlineRef =
        firebaseModules.collection(
            db,
            "onlineUsers"
        );

    onlineUnsubscribe =
        firebaseModules.onSnapshot(
            onlineRef,
            function (snapshot) {

                renderOnlineUsers(snapshot);

            },
            function (error) {

                console.error(
                    "Online listener:",
                    error
                );

            }
        );
}


function renderOnlineUsers(snapshot) {

    const list = $("onlineUsers");

    if (!list) return;

    const now = Date.now();

    const users = [];

    snapshot.forEach(function (item) {

        const data = item.data();

        if (!data.online) return;

        let lastSeenTime = now;

        if (data.lastSeen?.toMillis) {
            lastSeenTime =
                data.lastSeen.toMillis();
        }

        /* 90 seconds = online */

        if (
            now - lastSeenTime <= 90000
        ) {

            users.push(data);

        }

    });


    setText(
        "onlineCount",
        String(users.length)
    );


    list.innerHTML = "";


    users.forEach(function (user) {

        const div =
            document.createElement("div");

        div.className = "online-user";

        div.innerHTML = `
            <span class="online-dot"></span>
            <span>${escapeHTML(user.name)}</span>
        `;

        list.appendChild(div);

    });
}


/* =========================================================
   13. CHAT
   ========================================================= */

function setupChat() {

    if ($("sendMessageBtn")) {

        $("sendMessageBtn").addEventListener(
            "click",
            sendMessage
        );

    }


    if ($("messageInput")) {

        $("messageInput").addEventListener(
            "keydown",
            function (event) {

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


    if ($("emojiBtn")) {

        $("emojiBtn").addEventListener(
            "click",
            showEmojiPicker
        );

    }
}


function showEmojiPicker() {

    const input = $("messageInput");

    if (!input) return;

    const emojis =
        "😀 😃 😄 😁 😂 😊 😎 ❤️ 👍 👎 🎉 🔥 📚 ✏️ 🤔 🙏 👋";

    const chosen =
        prompt(
            currentLanguage === "hi"
                ? `Emoji चुनें:\n${emojis}`
                : `Choose an emoji:\n${emojis}`
        );

    if (!chosen) return;

    input.value += chosen;
    input.focus();
}


async function sendMessage() {

    if (!currentUser) return;

    const input = $("messageInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;


    const loaded =
        firebaseReady
            ? true
            : await loadFirebase();

    if (!loaded) {

        alert("Firebase is not connected.");

        return;
    }


    try {

        await firebaseModules.addDoc(
            firebaseModules.collection(
                db,
                "messages"
            ),
            {
                senderName: currentUser.name,
                senderPhone: currentUser.phone,
                text: text,
                createdAt:
                    firebaseModules.serverTimestamp(),
                readBy: {
                    [currentUser.phone]: true
                }
            }
        );

        input.value = "";

    } catch (error) {

        console.error(error);

        alert(
            currentLanguage === "hi"
                ? "मैसेज भेजा नहीं जा सका।"
                : "Message could not be sent."
        );
    }
}


function startChatListener() {

    if (!firebaseReady) return;

    if (chatUnsubscribe) {
        chatUnsubscribe();
    }

    firstChatLoad = true;
    knownChatMessages.clear();


    const messagesRef =
        firebaseModules.collection(
            db,
            "messages"
        );

    const messagesQuery =
        firebaseModules.query(
            messagesRef,
            firebaseModules.orderBy(
                "createdAt",
                "asc"
            ),
            firebaseModules.limit(200)
        );


    chatUnsubscribe =
        firebaseModules.onSnapshot(
            messagesQuery,
            function (snapshot) {

                const messages = [];

                snapshot.forEach(function (item) {

                    messages.push({
                        id: item.id,
                        ...item.data()
                    });

                });


                renderMessages(messages);


                if (firstChatLoad) {

                    messages.forEach(
                        message => {
                            knownChatMessages.add(
                                message.id
                            );
                        }
                    );

                    firstChatLoad = false;

                } else {

                    messages.forEach(
                        message => {

                            if (
                                !knownChatMessages.has(
                                    message.id
                                )
                            ) {

                                knownChatMessages.add(
                                    message.id
                                );

                                if (
                                    message.senderPhone !==
                                    currentUser.phone
                                ) {

                                    showChatNotification(
                                        message
                                    );

                                }

                            }

                        }
                    );

                }

            },
            function (error) {

                console.error(
                    "Chat listener:",
                    error
                );

            }
        );
}


function renderMessages(messages) {

    const container =
        $("chatMessages");

    if (!container) return;

    container.innerHTML = "";


    messages.forEach(function (message) {

        const mine =
            message.senderPhone ===
            currentUser.phone;


        const wrapper =
            document.createElement("div");

        wrapper.className =
            mine
                ? "message mine"
                : "message other";


        let time = "";

        if (message.createdAt?.toDate) {

            time =
                message.createdAt
                    .toDate()
                    .toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );

        } else {

            time = getNowTime();

        }


        let ticks = "";

        if (mine) {

            const readBy =
                message.readBy || {};

            const someoneRead =
                Object.keys(readBy)
                    .some(
                        phone =>
                            phone !==
                            currentUser.phone
                    );

            ticks =
                someoneRead
                    ? `<span class="ticks blue">✓✓</span>`
                    : `<span class="ticks">✓✓</span>`;

        }


        wrapper.innerHTML = `
            ${
                !mine
                    ? `<div class="message-sender">${escapeHTML(message.senderName || "User")}</div>`
                    : ""
            }

            <div class="message-text">
                ${escapeHTML(message.text)}
            </div>

            <div class="message-meta">
                <span>${escapeHTML(time)}</span>
                ${ticks}
            </div>
        `;


        container.appendChild(wrapper);


        if (!mine) {

            markMessageRead(
                message.id,
                message.readBy
            );

        }

    });


    container.scrollTop =
        container.scrollHeight;
}


async function markMessageRead(
    messageId,
    oldReadBy
) {

    if (!firebaseReady || !currentUser) return;

    const readBy =
        {
            ...(oldReadBy || {}),
            [currentUser.phone]: true
        };


    try {

        const messageRef =
            firebaseModules.doc(
                db,
                "messages",
                messageId
            );

        await firebaseModules.updateDoc(
            messageRef,
            {
                readBy: readBy
            }
        );

    } catch (error) {

        console.error(
            "Read receipt error:",
            error
        );

    }
}


function showChatNotification(message) {

    if (
        typeof Notification === "undefined"
    ) {
        return;
    }


    if (
        Notification.permission !==
        "granted"
    ) {
        return;
    }


    try {

        new Notification(
            message.senderName || "StudyConnect",
            {
                body: message.text,
                icon: "icon-192.png"
            }
        );

    } catch (error) {

        console.error(error);

    }
}


/* =========================================================
   14. GROUPS
   ========================================================= */

function setupGroups() {

    $("createGroupBtn")?.addEventListener(
        "click",
        createGroup
    );

    $("unlockGroupBtn")?.addEventListener(
        "click",
        unlockSelectedGroup
    );

    $("addMemberBtn")?.addEventListener(
        "click",
        addGroupMember
    );

    $("sendGroupMessageBtn")?.addEventListener(
        "click",
        sendGroupMessage
    );


    $("groupMessageInput")?.addEventListener(
        "keydown",
        function (event) {

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


async function createGroup() {

    if (!currentUser) return;

    const name =
        $("groupInput")?.value.trim();

    const password =
        $("groupPasswordInput")?.value.trim();


    if (!name) {

        alert(
            currentLanguage === "hi"
                ? "ग्रुप का नाम डालें।"
                : "Enter a group name."
        );

        return;
    }


    if (!password) {

        alert(
            currentLanguage === "hi"
                ? "ग्रुप पासवर्ड डालें।"
                : "Enter a group password."
        );

        return;
    }


    const loaded =
        firebaseReady
            ? true
            : await loadFirebase();

    if (!loaded) return;


    try {

        const groupRef =
            await firebaseModules.addDoc(
                firebaseModules.collection(
                    db,
                    "groups"
                ),
                {
                    name: name,
                    password: password,
                    ownerName: currentUser.name,
                    ownerPhone: currentUser.phone,

                    members: [
                        {
                            name: currentUser.name,
                            phone: currentUser.phone
                        }
                    ],

                    createdAt:
                        firebaseModules.serverTimestamp()
                }
            );


        $("groupInput").value = "";
        $("groupPasswordInput").value = "";


        selectGroup({
            id: groupRef.id,
            name: name,
            password: password,
            ownerName: currentUser.name,
            ownerPhone: currentUser.phone,
            members: [
                {
                    name: currentUser.name,
                    phone: currentUser.phone
                }
            ]
        });


        alert(
            currentLanguage === "hi"
                ? "ग्रुप बन गया!"
                : "Group created!"
        );

    } catch (error) {

        console.error(error);

        alert(
            currentLanguage === "hi"
                ? "ग्रुप बनाने में समस्या हुई।"
                : "Could not create group."
        );
    }
}


function startGroupsListener() {

    if (!firebaseReady) return;

    if (groupsUnsubscribe) {
        groupsUnsubscribe();
    }


    const groupsRef =
        firebaseModules.collection(
            db,
            "groups"
        );


    groupsUnsubscribe =
        firebaseModules.onSnapshot(
            groupsRef,
            function (snapshot) {

                const groups = [];

                snapshot.forEach(function (item) {

                    const data = item.data();

                    const members =
                        Array.isArray(data.members)
                            ? data.members
                            : [];


                    const isMember =
                        members.some(
                            member =>
                                normalizePhone(
                                    member.phone
                                ) ===
                                normalizePhone(
                                    currentUser.phone
                                )
                        );


                    if (isMember) {

                        groups.push({
                            id: item.id,
                            ...data
                        });

                    }

                });


                renderGroups(groups);

            },
            function (error) {

                console.error(
                    "Groups listener:",
                    error
                );

            }
        );
}


function renderGroups(groups) {

    const list = $("groupList");

    if (!list) return;

    list.innerHTML = "";


    if (groups.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                ${
                    currentLanguage === "hi"
                        ? "अभी कोई ग्रुप नहीं है।"
                        : "No groups yet."
                }
            </div>
        `;

        return;
    }


    groups.forEach(function (group) {

        const item =
            document.createElement("div");

        item.className = "group-item";

        item.innerHTML = `
            <strong>${escapeHTML(group.name)}</strong>
            <small>
                ${escapeHTML(group.ownerName || "Owner")}
            </small>
        `;


        item.addEventListener(
            "click",
            function () {

                selectGroup(group);

            }
        );


        list.appendChild(item);

    });
}


function selectGroup(group) {

    selectedGroup = group;

    setText(
        "selectedGroupName",
        group.name
    );

    setText(
        "selectedGroupOwner",
        group.ownerName || ""
    );


    show($("groupChatSection"));

    show($("groupPasswordSection"));

    hide($("groupContent"));

    hideMessage(
        $("groupPasswordMessage")
    );


    const isOwner =
        normalizePhone(
            group.ownerPhone
        ) ===
        normalizePhone(
            currentUser.phone
        );


    if (isOwner) {

        unlockedGroups.add(group.id);

        unlockGroupUI();

    }


    startGroupMessagesListener();
}


function unlockSelectedGroup() {

    if (!selectedGroup) return;

    const input =
        $("enterGroupPasswordInput");

    const password =
        input?.value.trim();


    if (
        password !==
        selectedGroup.password
    ) {

        showMessage(
            $("groupPasswordMessage"),
            currentLanguage === "hi"
                ? "गलत ग्रुप पासवर्ड!"
                : "Wrong group password!"
        );

        return;
    }


    unlockedGroups.add(
        selectedGroup.id
    );

    unlockGroupUI();
}


function unlockGroupUI() {

    show($("groupContent"));

    hide($("groupPasswordSection"));

    renderMembers(
        selectedGroup.members || []
    );

    startGroupMessagesListener();
}


function renderMembers(members) {

    const list = $("memberList");

    if (!list) return;

    list.innerHTML = "";


    members.forEach(function (member) {

        const item =
            document.createElement("div");

        item.className = "member-item";

        item.innerHTML = `
            <strong>${escapeHTML(member.name)}</strong>
            <small>${escapeHTML(member.phone)}</small>
        `;

        list.appendChild(item);

    });
}


async function addGroupMember() {

    if (!selectedGroup) return;

    const isOwner =
        normalizePhone(
            selectedGroup.ownerPhone
        ) ===
        normalizePhone(
            currentUser.phone
        );


    if (!isOwner) {

        alert(
            currentLanguage === "hi"
                ? "सिर्फ ग्रुप बनाने वाला व्यक्ति मेंबर जोड़ सकता है।"
                : "Only the group creator can add members."
        );

        return;
    }


    const name =
        $("memberNameInput")?.value.trim();

    const phone =
        normalizePhone(
            $("memberPhoneInput")?.value
        );


    if (!name || !isValidPhone(phone)) {

        alert(
            currentLanguage === "hi"
                ? "सही नाम और 10 अंकों का मोबाइल नंबर डालें।"
                : "Enter a valid name and 10-digit mobile number."
        );

        return;
    }


    try {

        const groupRef =
            firebaseModules.doc(
                db,
                "groups",
                selectedGroup.id
            );


        const members =
            Array.isArray(selectedGroup.members)
                ? [...selectedGroup.members]
                : [];


        const alreadyMember =
            members.some(
                member =>
                    normalizePhone(
                        member.phone
                    ) === phone
            );


        if (alreadyMember) {

            alert(
                currentLanguage === "hi"
                    ? "यह व्यक्ति पहले से ग्रुप में है।"
                    : "This person is already in the group."
            );

            return;
        }


        members.push({
            name: name,
            phone: phone
        });


        await firebaseModules.updateDoc(
            groupRef,
            {
                members: members
            }
        );


        $("memberNameInput").value = "";
        $("memberPhoneInput").value = "";


        alert(
            currentLanguage === "hi"
                ? "मेंबर जोड़ दिया गया!"
                : "Member added!"
        );

    } catch (error) {

        console.error(error);

        alert(
            currentLanguage === "hi"
                ? "मेंबर जोड़ने में समस्या हुई।"
                : "Could not add member."
        );
    }
}


function startGroupMessagesListener() {

    if (
        !firebaseReady ||
        !selectedGroup
    ) return;


    if (
        !unlockedGroups.has(
            selectedGroup.id
        )
    ) return;


    if (groupMessagesUnsubscribe) {
        groupMessagesUnsubscribe();
    }


    firstGroupChatLoad = true;
    knownGroupMessages.clear();


    const messagesRef =
        firebaseModules.collection(
            db,
            "groups",
            selectedGroup.id,
            "messages"
        );


    const messagesQuery =
        firebaseModules.query(
            messagesRef,
            firebaseModules.orderBy(
                "createdAt",
                "asc"
            ),
            firebaseModules.limit(200)
        );


    groupMessagesUnsubscribe =
        firebaseModules.onSnapshot(
            messagesQuery,
            function (snapshot) {

                const messages = [];

                snapshot.forEach(function (item) {

                    messages.push({
                        id: item.id,
                        ...item.data()
                    });

                });


                renderGroupMessages(
                    messages
                );


                if (firstGroupChatLoad) {

                    messages.forEach(
                        message => {
                            knownGroupMessages.add(
                                message.id
                            );
                        }
                    );

                    firstGroupChatLoad = false;

                }

            },
            function (error) {

                console.error(
                    "Group chat listener:",
                    error
                );

            }
        );
}


async function sendGroupMessage() {

    if (
        !selectedGroup ||
        !unlockedGroups.has(
            selectedGroup.id
        )
    ) return;


    const input =
        $("groupMessageInput");

    const text =
        input?.value.trim();


    if (!text) return;


    try {

        await firebaseModules.addDoc(
            firebaseModules.collection(
                db,
                "groups",
                selectedGroup.id,
                "messages"
            ),
            {
                senderName: currentUser.name,
                senderPhone: currentUser.phone,
                text: text,
                createdAt:
                    firebaseModules.serverTimestamp(),
                readBy: {
                    [currentUser.phone]: true
                }
            }
        );


        input.value = "";

    } catch (error) {

        console.error(error);

        alert(
            currentLanguage === "hi"
                ? "मैसेज नहीं भेजा गया।"
                : "Message was not sent."
        );
    }
}


function renderGroupMessages(messages) {

    const container =
        $("groupMessages");

    if (!container) return;

    container.innerHTML = "";


    messages.forEach(function (message) {

        const mine =
            message.senderPhone ===
            currentUser.phone;


        const item =
            document.createElement("div");

        item.className =
            mine
                ? "message mine"
                : "message other";


        let time = getNowTime();

        if (message.createdAt?.toDate) {

            time =
                message.createdAt
                    .toDate()
                    .toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );

        }


        item.innerHTML = `
            ${
                !mine
                    ? `<div class="message-sender">${escapeHTML(message.senderName || "User")}</div>`
                    : ""
            }

            <div class="message-text">
                ${escapeHTML(message.text)}
            </div>

            <div class="message-meta">
                <span>${escapeHTML(time)}</span>
                ${
                    mine
                        ? `<span class="ticks">✓✓</span>`
                        : ""
                }
            </div>
        `;


        container.appendChild(item);

    });


    container.scrollTop =
        container.scrollHeight;
}


/* =========================================================
   15. HOMEWORK
   ========================================================= */

function setupHomework() {

    $("addHomeworkBtn")?.addEventListener(
        "click",
        saveHomework
    );

    renderHomework();
}


function saveHomework() {

    const date =
        $("homeworkDate")?.value ||
        new Date()
            .toISOString()
            .split("T")[0];


    const homework = {

        date: date,

        hindi: $("hindiHomework")?.value.trim() || "",
        english: $("englishHomework")?.value.trim() || "",
        math: $("mathHomework")?.value.trim() || "",
        science: $("scienceHomework")?.value.trim() || "",
        sst: $("sstHomework")?.value.trim() || "",
        computer: $("computerHomework")?.value.trim() || "",
        art: $("artHomework")?.value.trim() || "",

        createdAt: Date.now()
    };


    let all =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );


    all.push(homework);

    localStorage.setItem(
        "studyHomework",
        JSON.stringify(all)
    );


    [
        "hindiHomework",
        "englishHomework",
        "mathHomework",
        "scienceHomework",
        "sstHomework",
        "computerHomework",
        "artHomework"
    ].forEach(function (id) {

        if ($(id)) {
            $(id).value = "";
        }

    });


    renderHomework();
}


function renderHomework() {

    const list =
        $("homeworkList");

    if (!list) return;


    const all =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );


    list.innerHTML = "";


    all
        .slice()
        .reverse()
        .forEach(function (item) {

            const div =
                document.createElement("div");

            div.className = "homework-item";

            div.innerHTML = `
                <strong>${escapeHTML(item.date)}</strong>

                ${
                    item.hindi
                        ? `<p><b>Hindi:</b> ${escapeHTML(item.hindi)}</p>`
                        : ""
                }

                ${
                    item.english
                        ? `<p><b>English:</b> ${escapeHTML(item.english)}</p>`
                        : ""
                }

                ${
                    item.math
                        ? `<p><b>Math:</b> ${escapeHTML(item.math)}</p>`
                        : ""
                }

                ${
                    item.science
                        ? `<p><b>Science:</b> ${escapeHTML(item.science)}</p>`
                        : ""
                }

                ${
                    item.sst
                        ? `<p><b>SST:</b> ${escapeHTML(item.sst)}</p>`
                        : ""
                }

                ${
                    item.computer
                        ? `<p><b>Computer:</b> ${escapeHTML(item.computer)}</p>`
                        : ""
                }

                ${
                    item.art
                        ? `<p><b>Art:</b> ${escapeHTML(item.art)}</p>`
                        : ""
                }
            `;


            list.appendChild(div);

        });
}


/* =========================================================
   16. SCHOOL UPDATES
   ========================================================= */

function setupSchool() {

    $("saveSchoolBtn")?.addEventListener(
        "click",
        saveSchoolUpdate
    );

    renderSchoolUpdates();
}


function saveSchoolUpdate() {

    const input =
        $("schoolInput");

    if (!input) return;

    const text =
        input.value.trim();


    if (!text) return;


    let updates =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );


    updates.push({
        text: text,
        createdAt: Date.now()
    });


    localStorage.setItem(
        "studySchoolUpdates",
        JSON.stringify(updates)
    );


    input.value = "";

    renderSchoolUpdates();
}


function renderSchoolUpdates() {

    const list =
        $("schoolList");

    if (!list) return;


    const updates =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );


    list.innerHTML = "";


    updates
        .slice()
        .reverse()
        .forEach(function (item) {

            const div =
                document.createElement("div");

            div.className = "school-update";

            div.innerHTML = `
                <p>${escapeHTML(item.text)}</p>
                <small>${escapeHTML(
                    new Date(item.createdAt)
                        .toLocaleString()
                )}</small>
            `;

            list.appendChild(div);

        });
}


/* =========================================================
   17. NOTES
   ========================================================= */

function setupNotes() {

    $("saveNoteBtn")?.addEventListener(
        "click",
        saveNote
    );

    renderNotes();
}


function saveNote() {

    const input =
        $("noteInput");

    if (!input) return;

    const text =
        input.value.trim();


    if (!text) return;


    let notes =
        JSON.parse(
            localStorage.getItem(
                "studyNotes"
            ) || "[]"
        );


    notes.push({
        text: text,
        createdAt: Date.now()
    });


    localStorage.setItem(
        "studyNotes",
        JSON.stringify(notes)
    );


    input.value = "";

    renderNotes();
}


function renderNotes() {

    const list =
        $("notesList");

    if (!list) return;


    const notes =
        JSON.parse(
            localStorage.getItem(
                "studyNotes"
            ) || "[]"
        );


    list.innerHTML = "";


    notes
        .slice()
        .reverse()
        .forEach(function (note) {

            const div =
                document.createElement("div");

            div.className = "note-item";

            div.innerHTML = `
                <p>${escapeHTML(note.text)}</p>
                <small>${escapeHTML(
                    new Date(note.createdAt)
                        .toLocaleString()
                )}</small>
            `;


            list.appendChild(div);

        });
}


/* =========================================================
   18. SETTINGS
   ========================================================= */

function setupSettings() {

    $("changeNameBtn")?.addEventListener(
        "click",
        changeUserName
    );


    $("hindiLanguageBtn")?.addEventListener(
        "click",
        function () {

            setLanguage("hi");

        }
    );


    $("englishLanguageBtn")?.addEventListener(
        "click",
        function () {

            setLanguage("en");

        }
    );


    $("themeBtn")?.addEventListener(
        "click",
        toggleTheme
    );


    $("notificationBtn")?.addEventListener(
        "click",
        enableNotifications
    );


    $("clearDataBtn")?.addEventListener(
        "click",
        clearAppData
    );


    $("ownerLoginBtn")?.addEventListener(
        "click",
        ownerLogin
    );


    $("allowUserBtn")?.addEventListener(
        "click",
        allowUser
    );


    loadTheme();

    applyLanguage(currentLanguage);
}


function changeUserName() {

    const input =
        $("changeNameInput");

    const name =
        input?.value.trim();


    if (!name) return;


    localStorage.setItem(
        "studyName",
        name
    );


    if (currentUser) {
        currentUser.name = name;
    }


    setText(
        "changeNameMessage",
        currentLanguage === "hi"
            ? "नाम बदल गया!"
            : "Name changed!"
    );


    renderCurrentUser();

    updateOnlineUser();

    input.value = "";
}


function setLanguage(language) {

    if (
        language !== "hi" &&
        language !== "en"
    ) return;


    currentLanguage = language;

    localStorage.setItem(
        "studyLanguage",
        language
    );


    applyLanguage(language);
}


function applyLanguage(language) {

    const dict =
        translations[language];

    if (!dict) return;


    document
        .querySelectorAll("[data-i18n]")
        .forEach(function (element) {

            const key =
                element.dataset.i18n;

            if (
                dict[key] !== undefined
            ) {

                element.textContent =
                    dict[key];

            }

        });


    /* Login screen */

    setText(
        "contactOwnerTitle",
        dict.contactOwner
    );

    setText(
        "contactOwnerText",
        dict.contactOwnerText
    );

    setText(
        "callOwnerBtn",
        dict.callOwner
    );

    setText(
        "whatsappOwnerBtn",
        dict.whatsappOwner
    );

    setText(
        "backToLoginBtn",
        dict.back
    );


    /* Other static controls */

    setText(
        "ownerNameDisplay",
        OWNER_NAME
    );


    if ($("unlockBtn")) {

        $("unlockBtn").textContent =
            dict.next;

    }


    if ($("ownerNextBtn")) {

        $("ownerNextBtn").textContent =
            dict.next;

    }


    if ($("enterAppBtn")) {

        $("enterAppBtn").textContent =
            dict.enterApp;

    }


    if ($("profilePhotoInput")) {

        $("profilePhotoInput")
            .setAttribute(
                "aria-label",
                dict.profilePhoto
            );

    }
}


/* =========================================================
   19. THEME
   ========================================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );


    const dark =
        document.body.classList.contains(
            "dark-mode"
        );


    localStorage.setItem(
        "studyDarkMode",
        dark ? "1" : "0"
    );


    setText(
        "settingsMessage",
        dark
            ? (
                currentLanguage === "hi"
                    ? "Dark Mode चालू है।"
                    : "Dark Mode is ON."
            )
            : (
                currentLanguage === "hi"
                    ? "Light Mode चालू है।"
                    : "Light Mode is ON."
            )
    );
}


function loadTheme() {

    const dark =
        localStorage.getItem(
            "studyDarkMode"
        ) === "1";


    if (dark) {

        document.body.classList.add(
            "dark-mode"
        );

    } else {

        document.body.classList.remove(
            "dark-mode"
        );

    }
}


/* =========================================================
   20. NOTIFICATIONS
   ========================================================= */

async function enableNotifications() {

    const message =
        $("notificationMessage");


    if (
        typeof Notification ===
        "undefined"
    ) {

        showMessage(
            message,
            currentLanguage === "hi"
                ? "इस ब्राउज़र में notifications उपलब्ध नहीं हैं।"
                : "Notifications are not available in this browser."
        );

        return;
    }


    try {

        const permission =
            await Notification.requestPermission();


        if (
            permission === "granted"
        ) {

            showMessage(
                message,
                currentLanguage === "hi"
                    ? "Notifications चालू हो गए!"
                    : "Notifications enabled!",
                true
            );


            new Notification(
                "StudyConnect",
                {
                    body:
                        currentLanguage === "hi"
                            ? "Notifications सही काम कर रहे हैं!"
                            : "Notifications are working!"
                }
            );

        } else {

            showMessage(
                message,
                currentLanguage === "hi"
                    ? "Notifications की अनुमति नहीं मिली।"
                    : "Notification permission was not granted."
            );

        }

    } catch (error) {

        console.error(error);

        showMessage(
            message,
            "Notification error."
        );
    }
}


/* =========================================================
   21. OWNER PANEL
   ========================================================= */

function setupOwnerPanel() {

    hide($("ownerPanel"));
}


function ownerLogin() {

    const password =
        $("ownerPasswordInput")
            ?.value.trim();


    if (
        password !== OWNER_PASSWORD
    ) {

        showMessage(
            $("ownerPasswordMessage"),
            currentLanguage === "hi"
                ? "गलत Owner Password!"
                : "Wrong Owner Password!"
        );

        hide($("ownerPanel"));

        return;
    }


    show($("ownerPanel"));

    hideMessage(
        $("ownerPasswordMessage")
    );


    loadAllowedUsers();
}


async function loadAllowedUsers() {

    if (!firebaseReady) {

        const loaded =
            await loadFirebase();

        if (!loaded) return;

    }


    const list =
        $("allowedUsersList");

    if (!list) return;


    if (allowedUsersUnsubscribe) {
        allowedUsersUnsubscribe();
    }


    const usersRef =
        firebaseModules.collection(
            db,
            "allowedUsers"
        );


    allowedUsersUnsubscribe =
        firebaseModules.onSnapshot(
            usersRef,
            function (snapshot) {

                list.innerHTML = "";


                snapshot.forEach(
                    function (item) {

                        const data =
                            item.data();


                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            "allowed-user";


                        div.innerHTML = `
                            <strong>
                                ${escapeHTML(data.name || "")}
                            </strong>
                            <span>
                                ${escapeHTML(data.phone || "")}
                            </span>
                        `;


                        list.appendChild(div);

                    }
                );

            },
            function (error) {

                console.error(
                    "Allowed users:",
                    error
                );

            }
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


    if (
        !name ||
        !isValidPhone(phone)
    ) {

        showMessage(
            $("settingsMessage"),
            currentLanguage === "hi"
                ? "सही नाम और 10 अंकों का मोबाइल नंबर डालें।"
                : "Enter a valid name and 10-digit mobile number."
        );

        return;
    }


    if (!firebaseReady) {

        const loaded =
            await loadFirebase();

        if (!loaded) return;

    }


    try {

        /*
          Phone number is used as document ID.
          This prevents the same phone from
          accidentally being added many times.
        */

        const userRef =
            firebaseModules.doc(
                db,
                "allowedUsers",
                phone
            );


        await firebaseModules.setDoc(
            userRef,
            {
                name: name,
                phone: phone,
                addedBy: OWNER_NAME,
                createdAt:
                    firebaseModules.serverTimestamp()
            },
            {
                merge: true
            }
        );


        $("allowedUserNameInput").value = "";
        $("allowedUserPhoneInput").value = "";


        showMessage(
            $("settingsMessage"),
            currentLanguage === "hi"
                ? "यूज़र को अनुमति मिल गई!"
                : "User has been allowed!",
            true
        );

    } catch (error) {

        console.error(error);

        showMessage(
            $("settingsMessage"),
            currentLan
