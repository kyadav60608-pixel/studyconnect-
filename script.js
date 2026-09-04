// ======================================================
// STUDYCONNECT - COMPLETE JAVASCRIPT
// LOGIN + PERMISSION + CHAT + BLUE TICK + ONLINE USERS
// GROUPS + HOMEWORK + SCHOOL + NOTES + SETTINGS
// ======================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    where,
    onSnapshot,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// FIREBASE
// ======================================================

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyi3Wc3AUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("StudyConnect Firebase connected.");


// ======================================================
// MAIN SETTINGS
// ======================================================

const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

// App खोलने का password
const APP_PASSWORD = "1234";

// Settings में Allow User बदलने का password
const ALLOW_PASSWORD = "1234";

// शुरुआत में allowed phone
const DEFAULT_ALLOWED_PHONE = "8738084554";

let currentChatUnsubscribe = null;
let currentGroupUnsubscribe = null;
let onlineUnsubscribe = null;
let onlineHeartbeat = null;

let currentGroupId = null;


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function getUserName() {
    return localStorage.getItem("studyName") || "";
}

function getUserPhone() {
    return localStorage.getItem("studyPhone") || "";
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function formatDateTime(value) {

    if (!value) return "";

    let date;

    if (typeof value === "number") {
        date = new Date(value);
    } else if (value && typeof value.toDate === "function") {
        date = value.toDate();
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getSafeId(value) {

    return btoa(
        unescape(
            encodeURIComponent(value)
        )
    ).replace(/[^a-zA-Z0-9]/g, "");
}


// ======================================================
// NAVIGATION
// ======================================================

function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }

    const navMenu = document.getElementById("navMenu");

    if (navMenu) {
        navMenu.classList.remove("show");
    }
}

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        const page = button.getAttribute("data-page");

        if (page) {
            showPage(page);
        }
    });
});

document.querySelectorAll(".open-page").forEach(card => {

    card.addEventListener("click", () => {

        const page = card.getAttribute("data-page");

        if (page) {
            showPage(page);
        }
    });
});

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

if (menuBtn && navMenu) {

    menuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });
}


// ======================================================
// LOGIN SCREEN
// IMPORTANT:
// EXISTING HTML IDs ARE USED
// passwordScreen
// openUserName
// appPassword
// unlockBtn
// passwordError
// ======================================================

function setupLogin() {

    const screen = document.getElementById("passwordScreen");
    const nameInput = document.getElementById("openUserName");
    const passwordInput = document.getElementById("appPassword");
    const unlockBtn = document.getElementById("unlockBtn");
    const error = document.getElementById("passwordError");

    if (!screen || !nameInput || !passwordInput || !unlockBtn) {
        console.error("Login elements नहीं मिले।");
        return;
    }

    // --------------------------------------------------
    // Phone input dynamically add होगा
    // index.html बदलने की जरूरत नहीं
    // --------------------------------------------------

    let phoneInput = document.getElementById("openUserPhone");

    if (!phoneInput) {

        phoneInput = document.createElement("input");

        phoneInput.type = "tel";
        phoneInput.id = "openUserPhone";
        phoneInput.placeholder = "मोबाइल नंबर लिखें";
        phoneInput.maxLength = 10;
        phoneInput.inputMode = "numeric";

        passwordInput.parentNode.insertBefore(
            phoneInput,
            passwordInput
        );
    }

    // --------------------------------------------------
    // पहले से saved user
    // --------------------------------------------------

    const savedName = getUserName();
    const savedPhone = getUserPhone();

    if (savedName) {
        nameInput.value = savedName;
    }

    if (savedPhone) {
        phoneInput.value = savedPhone;
    }

    // --------------------------------------------------
    // Password field initially hidden
    // --------------------------------------------------

    passwordInput.style.display = "none";
    phoneInput.style.display = "block";

    let step = 1;

    unlockBtn.textContent = "Next →";

    // --------------------------------------------------
    // LOGIN BUTTON
    // --------------------------------------------------

    unlockBtn.onclick = async function () {

        // ==============================================
        // STEP 1 - NAME
        // ==============================================

        if (step === 1) {

            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();

            if (!name) {

                if (error) {
                    error.textContent =
                        "पहले अपना नाम लिखें।";
                }

                nameInput.focus();
                return;
            }

            if (!/^\d{10}$/.test(phone)) {

                if (error) {
                    error.textContent =
                        "सही 10 अंकों का मोबाइल नंबर डालें।";
                }

                phoneInput.focus();
                return;
            }

            localStorage.setItem("studyName", name);
            localStorage.setItem("studyPhone", phone);

            // Owner हमेशा allowed
            if (phone === OWNER_PHONE) {

                localStorage.setItem(
                    "studyPermission",
                    "allowed"
                );

                showPasswordStep();

                step = 2;

                return;
            }

            // Firebase से permission check
            try {

                const permissionRef =
                    doc(db, "allowedUsers", phone);

                const permissionSnap =
                    await getDoc(permissionRef);

                if (
                    !permissionSnap.exists() ||
                    permissionSnap.data().allowed !== true
                ) {

                    if (error) {

                        error.innerHTML =
                            "❌ इस मोबाइल नंबर को अभी अनुमति नहीं है।<br>" +
                            "Settings में Owner द्वारा Allow करना जरूरी है।";
                    }

                    return;
                }

                localStorage.setItem(
                    "studyPermission",
                    "allowed"
                );

                showPasswordStep();

                step = 2;

            } catch (firebaseError) {

                console.error(
                    "Permission check error:",
                    firebaseError
                );

                if (error) {
                    error.textContent =
                        "Permission check में समस्या आई।";
                }
            }

            return;
        }


        // ==============================================
        // STEP 2 - PASSWORD
        // ==============================================

        if (step === 2) {

            const password =
                passwordInput.value.trim();

            if (password !== APP_PASSWORD) {

                if (error) {
                    error.textContent =
                        "❌ गलत password।";
                }

                passwordInput.value = "";
                passwordInput.focus();

                return;
            }

            // Password सही
            showOwnerStep();

            step = 3;

            return;
        }


        // ==============================================
        // STEP 3 - OWNER
        // ==============================================

        if (step === 3) {

            const name = getUserName();

            if (error) {
                error.textContent = "";
            }

            const title =
                screen.querySelector("h2");

            const text =
                screen.querySelector("p");

            if (title) {
                title.textContent =
                    "💬 StudyConnect";
            }

            if (text) {

                text.innerHTML =
                    `Welcome, <strong>${escapeHTML(name)}</strong>! 👋<br>` +
                    `<small>Owner: ${escapeHTML(OWNER_NAME)}</small>`;
            }

            unlockBtn.textContent =
                "Open StudyConnect";

            step = 4;

            return;
        }


        // ==============================================
        // STEP 4 - OPEN APP
        // ==============================================

        if (step === 4) {

            screen.style.display = "none";

            showPage("home");

            startOnlineStatus();

            startOnlineUsersListener();

            startChatListener();

            loadHomework();

            loadSchool();

            loadNotes();

            loadGroups();
        }
    };


    // --------------------------------------------------
    // ENTER KEY
    // --------------------------------------------------

    nameInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            unlockBtn.click();
        }
    });

    phoneInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            unlockBtn.click();
        }
    });

    passwordInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            unlockBtn.click();
        }
    });


    function showPasswordStep() {

        nameInput.style.display = "none";

        phoneInput.style.display = "none";

        passwordInput.style.display = "block";

        passwordInput.value = "";

        passwordInput.focus();

        const title =
            screen.querySelector("h2");

        const text =
            screen.querySelector("p");

        if (title) {
            title.textContent = "🔐 Password";
        }

        if (text) {
            text.textContent =
                "StudyConnect password डालें।";
        }

        unlockBtn.textContent =
            "Next →";

        if (error) {
            error.textContent = "";
        }
    }


    function showOwnerStep() {

        passwordInput.style.display = "none";

        const title =
            screen.querySelector("h2");

        const text =
            screen.querySelector("p");

        if (title) {
            title.textContent =
                "👑 App Owner";
        }

        if (text) {

            text.innerHTML =
                `Owner: <strong>${escapeHTML(OWNER_NAME)}</strong><br>` +
                `<small>StudyConnect</small>`;
        }

        unlockBtn.textContent =
            "Next →";
    }
}


// ======================================================
// ONLINE STATUS
// ======================================================

async function setOnlineStatus(isOnline) {

    const name = getUserName();
    const phone = getUserPhone();

    if (!name || !phone) {
        return;
    }

    const userId = getSafeId(phone);

    try {

        await setDoc(
            doc(db, "onlineUsers", userId),
            {
                name: name,
                phone: phone,
                online: isOnline,
                lastSeen: Date.now()
            },
            {
                merge: true
            }
        );

    } catch (error) {

        console.error(
            "Online status error:",
            error
        );
    }
}


function startOnlineStatus() {

    if (onlineHeartbeat) {
        clearInterval(onlineHeartbeat);
    }

    setOnlineStatus(true);

    onlineHeartbeat =
        setInterval(() => {

            setOnlineStatus(true);

        }, 30000);


    // Page close होने पर offline
    window.addEventListener(
        "beforeunload",
        () => {

            setOnlineStatus(false);

        }
    );


    // Tab hidden होने पर भी status update
    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.visibilityState === "visible") {

                setOnlineStatus(true);

            } else {

                setOnlineStatus(false);
            }
        }
    );
}


// ======================================================
// ONLINE USERS LIST
// ======================================================

function startOnlineUsersListener() {

    if (onlineUnsubscribe) {
        onlineUnsubscribe();
    }

    const onlineUsersBox =
        document.getElementById("onlineUsers");

    const onlineCount =
        document.getElementById("onlineCount");

    if (!onlineUsersBox) {
        return;
    }

    const usersRef =
        collection(db, "onlineUsers");

    onlineUnsubscribe =
        onSnapshot(
            usersRef,
            snapshot => {

                const users = [];

                const currentTime =
                    Date.now();

                snapshot.forEach(item => {

                    const data = item.data();

                    const lastSeen =
                        data.lastSeen || 0;

                    // 90 seconds तक online माना जाएगा
                    const isReallyOnline =
                        data.online === true &&
