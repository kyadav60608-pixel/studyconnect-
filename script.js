Worked for 9s

// ============================================================
// STUDYCONNECT — COMPLETE JAVASCRIPT
// Firebase + Login + Profile + Access Control + Owner Panel
// Chat + Seen + Ticks + Online + Groups + Homework + School
// Notes + Notifications + Search + Activity + Settings
// Mobile + Laptop Responsive
// ============================================================

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
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    limit
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// FIREBASE
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyi3SwWc3aUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ============================================================
// APP CONSTANTS
// ============================================================

const APP_NAME = "StudyConnect";
const APP_PASSWORD = "123";

const OWNER_NAME = "Krishna Yadav";
const OWNER_SHORT_NAME = "Krishna";
const OWNER_PHONE = "8738084554";
const OWNER_PASSWORD = "12341";

const ONLINE_INTERVAL = 45000;
const ONLINE_TIMEOUT = 90000;

let currentUser = {
    name: "",
    phone: "",
    status: "",
    role: "student",
    dp: ""
};

let onlineTimer = null;
let unsubscribeMessages = null;
let unsubscribeTyping = null;
let unsubscribeOnline = null;

let selectedItems = new Map();
let currentDeleteCollection = null;
let currentGroupId = null;

let ownerStudentsCache = [];
let ownerMessagesCache = [];
let ownerGroupsCache = [];


// ============================================================
// DOM HELPERS
// ============================================================

const $ = id => document.getElementById(id);

const qs = selector => document.querySelector(selector);

const qsa = selector => [...document.querySelectorAll(selector)];


// ============================================================
// BASIC HELPERS
// ============================================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function getUserName() {
    return localStorage.getItem("studyName") || "";
}

function getUserPhone() {
    return localStorage.getItem("studyPhone") || "";
}

function getUserDP() {
    return localStorage.getItem("studyDP") || "";
}

function now() {
    return Date.now();
}

function normalizePhone(phone) {
    return String(phone || "").replace(/\D/g, "").slice(-10);
}

function isOwner() {
    return (
        currentUser.role === "owner" ||
        normalizePhone(currentUser.phone) === OWNER_PHONE ||
        currentUser.name.toLowerCase() === OWNER_NAME.toLowerCase() ||
        currentUser.name.toLowerCase() === OWNER_SHORT_NAME.toLowerCase()
    );
}

function getUserStatus() {
    return localStorage.getItem("studyAccessStatus") || "basic";
}

function canUseFullApp() {
    return (
        isOwner() ||
        getUserStatus() === "allowed" ||
        getUserStatus() === "owner"
    );
}

function getTimestamp(value) {
    if (!value) return 0;

    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "object" && typeof value.toMillis === "function") {
        return value.toMillis();
    }

    if (typeof value === "object" && typeof value.toDate === "function") {
        return value.toDate().getTime();
    }

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value) {
    const timestamp = getTimestamp(value);

    if (!timestamp) return "Just now";

    return new Date(timestamp).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatTime(value) {
    const timestamp = getTimestamp(value);

    if (!timestamp) return "";

    return new Date(timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getSafeId(value) {
    return btoa(
        unescape(encodeURIComponent(String(value)))
    ).replace(/[^a-zA-Z0-9]/g, "");
}

function defaultAvatar(name = "Student") {
    const first = String(name).trim().charAt(0).toUpperCase() || "S";

    return `
        <div class="default-avatar" aria-label="${escapeHTML(name)}">
            ${escapeHTML(first)}
        </div>
    `;
}

function avatarHTML(name, dp = "") {
    if (dp) {
        return `
            <img
                class="user-avatar"
                src="${escapeHTML(dp)}"
                alt="${escapeHTML(name)}"
            >
        `;
    }

    return defaultAvatar(name);
}

function showToast(message, type = "info") {
    let toast = $("studyToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "studyToast";
        toast.className = "study-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("show");

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function setButtonLoading(button, loading, text = "Please wait...") {
    if (!button) return;

    if (loading) {
        button.dataset.oldText = button.textContent;
        button.disabled = true;
        button.textContent = text;
    } else {
        button.disabled = false;

        if (button.dataset.oldText) {
            button.textContent = button.dataset.oldText;
        }
    }
}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(pageId) {
    if (!pageId) return;

    if (
        !isOwner() &&
        !canUseFullApp() &&
        !["home", "homework", "school"].includes(pageId)
    ) {
        showToast(
            "अभी आपका Basic Access है। Owner से Allow करवाएँ।",
            "warning"
        );

        pageId = "home";
    }

    qsa(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = $(pageId);

    if (page) {
        page.classList.add("active");
    }

    qsa("[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.getAttribute("data-page") === pageId
        );
    });

    const navMenu = $("navMenu");

    if (navMenu) {
        navMenu.classList.remove("show");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageId === "chat") {
        loadChat();
    }

    if (pageId === "groups") {
        loadGroups();
    }

    if (pageId === "homework") {
        loadHomework();
    }

    if (pageId === "school") {
        loadSchool();
    }

    if (pageId === "notes") {
        loadNotes();
    }

    if (pageId === "notifications") {
        loadNotifications();
    }

    if (pageId === "home") {
        updateHomeUI();
    }
}


// ============================================================
// NAVIGATION EVENTS
// ============================================================

qsa("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.getAttribute("data-page"));
    });
});

qsa(".open-page").forEach(card => {
    card.addEventListener("click", () => {
        showPage(card.getAttribute("data-page"));
    });
});

const menuBtn = $("menuBtn");
const navMenu = $("navMenu");

if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });
}


// ============================================================
// LOGIN SCREEN
// ============================================================

function createLoginFlow() {
    const screen = $("passwordScreen");

    if (!screen) return;

    screen.innerHTML = `
        <div class="password-box login-professional-box">

            <div class="login-brand">
                <div class="login-logo">SC</div>

                <div>
                    <strong>StudyConnect</strong>
                    <small>Student Community</small>
                </div>
            </div>

            <div class="login-step-indicator">
                <span class="active"></span>
                <span></span>
                <span></span>
            </div>

            <h2 id="loginTitle">Welcome 👋</h2>

            <p id="loginText">
                अपना नाम या Owner mobile number डालें।
            </p>

            <input
                type="text"
                id="loginUserName"
                placeholder="Name / Mobile Number"
                autocomplete="name"
            >

            <input
                type="password"
                id="loginPassword"
                placeholder="StudyConnect Password"
                style="display:none;"
            >

            <button
                type="button"
                id="loginNextBtn"
                class="primary-btn"
            >
                Continue →
            </button>

            <div id="loginError" class="login-error"></div>

            <small class="login-footer">
                Secure Student Community
            </small>
        </div>
    `;

    screen.style.display = "flex";

    const title = $("loginTitle");
    const text = $("loginText");
    const nameInput = $("loginUserName");
    const passwordInput = $("loginPassword");
    const nextBtn = $("loginNextBtn");
    const error = $("loginError");

    let step = 1;
    let enteredIdentity = "";

    nameInput.focus();

    function updateSteps(active) {
        qsa(".login-step-indicator span").forEach((dot, index) => {
            dot.classList.toggle("active", index < active);
        });
    }

    async function nextStep() {

        error.textContent = "";

        if (step === 1) {

            const value = nameInput.value.trim();

            if (!value) {
                error.textContent = "नाम या mobile number डालें।";
                return;
            }

            enteredIdentity = value;

            nameInput.style.display = "none";
            passwordInput.style.display = "block";

            title.textContent = "🔐 Password";
            text.textContent =
                "StudyConnect का app password डालें।";

            nextBtn.textContent = "Verify →";

            updateSteps(2);

            step = 2;

            passwordInput.focus();

            return;
        }

        if (step === 2) {

            if (passwordInput.value !== APP_PASSWORD) {

                error.textContent = "गलत app password ❌";

                passwordInput.value = "";

                passwordInput.focus();

                return;
            }

            await completeLogin(enteredIdentity);

            return;
        }
    }

    nextBtn.addEventListener("click", nextStep);

    [nameInput, passwordInput].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                nextStep();
            }
        });
    });
}


// ============================================================
// COMPLETE LOGIN
// ============================================================

async function completeLogin(identity) {

    try {

        const cleanIdentity = identity.trim();

        const ownerByName =
            cleanIdentity.toLowerCase() === OWNER_NAME.toLowerCase() ||
            cleanIdentity.toLowerCase() === OWNER_SHORT_NAME.toLowerCase();

        const ownerByPhone =
            normalizePhone(cleanIdentity) === OWNER_PHONE;

        if (ownerByName || ownerByPhone) {

            localStorage.setItem("studyName", OWNER_NAME);
            localStorage.setItem("studyPhone", OWNER_PHONE);
            localStorage.setItem("studyAccessStatus", "owner");
            localStorage.setItem("studyRole", "owner");

            currentUser = {
                name: OWNER_NAME,
                phone: OWNER_PHONE,
                status: "owner",
                role: "owner",
                dp: getUserDP()
            };

            await saveUserProfile();

            hideLogin();

            showOwnerWelcome();

            enterMainApp();

            openOwnerPanel();

            startOnlineStatus();

            return;
        }

        let savedName = cleanIdentity;
        let savedPhone = getUserPhone();

        if (/^\d+$/.test(cleanIdentity)) {
            savedPhone = normalizePhone(cleanIdentity);

            if (!savedPhone) {
                showToast("सही mobile number डालें।", "warning");
                return;
            }

            savedName =
                localStorage.getItem("studyName") || "Student";
        }

        if (!savedPhone) {

            const phone = prompt(
                "पहली बार profile बना रहे हैं। अपना mobile number डालें:"
            );

            if (!phone) return;

            savedPhone = normalizePhone(phone);

            if (savedPhone.length !== 10) {
                showToast(
                    "10 digit mobile number डालें।",
                    "warning"
                );
                return;
            }
        }

        localStorage.setItem("studyName", savedName);
        localStorage.setItem("studyPhone", savedPhone);

        await loadCurrentUserProfile();

        hideLogin();

        enterMainApp();

        startOnlineStatus();

        showPage(
            canUseFullApp()
                ? "home"
                : "home"
        );

        if (!canUseFullApp()) {
            showToast(
                "Basic Access मिला है। Homework और School Updates उपलब्ध हैं।",
                "info"
            );
        }

    } catch (error) {

        console.error("Login error:", error);

        showToast(
            "Login के दौरान समस्या हुई।",
            "error"
        );
    }
}


// ============================================================
// HIDE LOGIN
// ============================================================

function hideLogin() {
    const screen = $("passwordScreen");

    if (!screen) return;

    screen.style.display = "none";
}


// ============================================================
// MAIN APP
// ============================================================

function enterMainApp() {

    const mainApp = $("mainApp");

    if (mainApp) {
        mainApp.style.display = "block";
    }

    updateProfileUI();
    updateHomeUI();
    applyAccessControl();

    loadHomework();
    loadSchool();

    if (canUseFullApp()) {
        loadNotes();
        loadGroups();
        loadNotifications();
        loadChat();
    }
}


// ============================================================
// OWNER WELCOME
// ============================================================

function showOwnerWelcome() {

    let overlay = $("ownerWelcomeOverlay");

    if (!overlay) {

        overlay = document.createElement("div");

        overlay.id = "ownerWelcomeOverlay";

        overlay.className = "owner-welcome-overlay";

        overlay.innerHTML = `
            <div class="owner-welcome-card">

                <div class="owner-crown">♛</div>

                <div class="owner-avatar">
                    ${avatarHTML(OWNER_NAME, getUserDP())}
                </div>

                <div class="owner-welcome-label">
                    APP OWNER
                </div>

                <h1>
                    Welcome Owner
                </h1>

                <h2>
                    ${escapeHTML(OWNER_SHORT_NAME)} Ji
                </h2>

                <p>
                    StudyConnect Control Center
                </p>

                <div class="owner-welcome-line"></div>

                <small>
                    Full administrative access enabled
                </small>

            </div>
        `;

        document.body.appendChild(overlay);
    }

    overlay.classList.add("show");

    setTimeout(() => {
        overlay.classList.remove("show");

        setTimeout(() => {
            overlay.remove();
        }, 500);

    }, 2400);
}


// ============================================================
// FIRESTORE USER PROFILE
// ============================================================

async function saveUserProfile() {

    const name = getUserName();
    const phone = normalizePhone(getUserPhone());

    if (!name || !phone) return;

    const userRef = doc(db, "allowedUsers", phone);

    const existing = await getDoc(userRef);

    let status = "basic";

    if (
        phone === OWNER_PHONE ||
        name.toLowerCase() === OWNER_NAME.toLowerCase() ||
        name.toLowerCase() === OWNER_SHORT_NAME.toLowerCase()
    ) {
        status = "owner";
    } else if (existing.exists()) {
        status = existing.data().status || "basic";
    }

    await setDoc(
        userRef,
        {
            name,
            phone,
            dp: getUserDP(),
            status,
            role: status === "owner" ? "owner" : "student",
            registeredAt:
                existing.exists()
                    ? existing.data().registeredAt || now()
                    : now(),
            lastSeen: now()
        },
        { merge: true }
    );

    localStorage.setItem("studyAccessStatus", status);

    currentUser = {
        name,
        phone,
        status,
        role: status === "owner" ? "owner" : "student",
        dp: getUserDP()
    };
}


async function loadCurrentUserProfile() {

    const name = getUserName();
    const phone = normalizePhone(getUserPhone());

    if (!name || !phone) return;

    try {

        const userRef = doc(db, "allowedUsers", phone);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {

            await setDoc(userRef, {
                name,
                phone,
                dp: getUserDP(),
                status: "basic",
                role: "student",
                registeredAt: now(),
                lastSeen: now()
            });

            localStorage.setItem(
                "studyAccessStatus",
                "basic"
            );

            currentUser = {
                name,
                phone,
                status: "basic",
                role: "student",
                dp: getUserDP()
            };

            await addActivity(
                "New Student Registered",
                `${name} registered in StudyConnect.`
            );

            return;
        }

        const data = snapshot.data();

        let status = data.status || "basic";

        if (
            phone === OWNER_PHONE ||
            name.toLowerCase() === OWNER_NAME.toLowerCase() ||
            name.toLowerCase() === OWNER_SHORT_NAME.toLowerCase()
        ) {
            status = "owner";
        }

        localStorage.setItem(
            "studyAccessStatus",
            status
        );

        currentUser = {
            name: data.name || name,
            phone: data.phone || phone,
            status,
            role: data.role || "student",
            dp: data.dp || getUserDP()
        };

        if (data.dp) {
            localStorage.setItem("studyDP", data.dp);
        }

    } catch (error) {

        console.error(
            "User profile load error:",
            error
        );

        currentUser = {
            name,
            phone,
            status: "basic",
            role: "student",
            dp: getUserDP()
        };
    }
}


// ============================================================
// ACCESS CONTROL
// ============================================================

function applyAccessControl() {

    const restrictedPages = [
        "chat",
        "groups",
        "notes",
        "notifications",
        "settings"
    ];

    const fullAccess = canUseFullApp();

    restrictedPages.forEach(pageId => {

        const page = $(pageId);

        if (page) {
            page.dataset.locked = fullAccess ? "false" : "true";
        }
    });

    qsa(
        '[data-page="chat"],' +
        '[data-page="groups"],' +
        '[data-page="notes"],' +
        '[data-page="notifications"],' +
        '[data-page="settings"]'
    ).forEach(button => {

        if (fullAccess) {
            button.classList.remove("access-locked");
            button.removeAttribute("title");
        } else {
            button.classList.add("access-locked");
            button.title = "Owner Allow के बाद उपलब्ध होगा";
        }
    });

    const ownerButtons = qsa(
        ".owner-only," +
        "#ownerPanelBtn," +
        '[data-owner-only="true"]'
    );

    ownerButtons.forEach(button => {

        button.style.display =
            isOwner()
                ? ""
                : "none";
    });

    updateAccessBadge();
}


function updateAccessBadge() {

    let badge = $("accessStatusBadge");

    if (!badge) {

        const header =
            qs(".topbar") ||
            qs("header") ||
            document.body;

        badge = document.createElement("div");

        badge.id = "accessStatusBadge";

        badge.className = "access-status-badge";

        header.appendChild(badge);
    }

    let label = "Basic Access";

    if (isOwner()) {
        label = "Owner";
    } else if (getUserStatus() === "allowed") {
        label = "Full Access";
    } else if (getUserStatus() === "blocked") {
        label = "Blocked";
    }

    badge.textContent = label;
}


// ============================================================
// HOME UI
// ============================================================

function updateHomeUI() {

    const name = getUserName();

    const nameElements = [
        $("welcomeName"),
        $("currentUserName"),
        $("homeUserName"),
        $("profileName")
    ];

    nameElements.forEach(element => {

        if (element) {
            element.textContent =
                name || "Student";
        }
    });

    const phoneElement = $("currentUserPhone");

    if (phoneElement) {
        phoneElement.textContent =
            getUserPhone() || "Not added";
    }

    applyAccessControl();
}


// ============================================================
// PROFILE / SETTINGS
// ============================================================

function setupNameSettings() {

    const studentName = $("studentName");
    const saveNameBtn = $("saveNameBtn");
    const nameMessage = $("nameMessage");

    if (!studentName || !saveNameBtn) return;

    const savedName = getUserName();

    studentName.value = savedName;

    function enableEditing() {
        studentName.disabled = false;
        saveNameBtn.style.display = "";
        studentName.focus();

        if (nameMessage) {
            nameMessage.textContent =
                "नया नाम लिखकर Save Name दबाएँ।";
        }
    }

    function saveName() {

        const name = studentName.value.trim();

        if (!name) {

            if (nameMessage) {
                nameMessage.textContent =
                    "नाम खाली नहीं हो सकता।";
            }

            return;
        }

        localStorage.setItem(
            "studyName",
            name
        );

        studentName.disabled = true;
        saveNameBtn.style.display = "none";

        currentUser.name = name;

        if (nameMessage) {
            nameMessage.textContent =
                `Welcome, ${name}! 👋`;
        }

        updateHomeUI();

        updateOnlineProfile();

        saveUserProfile();

        showToast(
            "नाम successfully update हो गया।",
            "success"
        );
    }

    saveNameBtn.addEventListener(
        "click",
        saveName
    );

    let changeNameBtn = $("changeNameBtn");

    if (!changeNameBtn) {

        const settingsBox =
            qs(".settings-box");

        if (settingsBox) {

            changeNameBtn =
                document.createElement("button");

            changeNameBtn.id =
                "changeNameBtn";

            changeNameBtn.type = "button";

            changeNameBtn.className =
                "secondary-btn";

            changeNameBtn.textContent =
                "✏️ Change Name";

            settingsBox.insertBefore(
                changeNameBtn,
                settingsBox.firstChild
            );
        }
    }

    if (changeNameBtn) {
        changeNameBtn.addEventListener(
            "click",
            enableEditing
        );
    }

    if (savedName) {
        studentName.disabled = true;
        saveNameBtn.style.display = "none";

        if (nameMessage) {
            nameMessage.textContent =
                `Welcome, ${savedName}! 👋`;
        }
    }
}


// ============================================================
// PHONE SETTINGS
// ============================================================

function setupPhoneSettings() {

    let phoneInput = $("studentPhone");

    if (!phoneInput) {

        const settingsBox =
            qs(".settings-box");

        if (!settingsBox) return;

        phoneInput =
            document.createElement("input");

        phoneInput.id = "studentPhone";

        phoneInput.type = "tel";

        phoneInput.placeholder =
            "Mobile number";

        phoneInput.value =
            getUserPhone();

        settingsBox.appendChild(
            phoneInput
        );
    }

    phoneInput.value =
        getUserPhone();

    phoneInput.disabled = true;

    let changePhoneBtn =
        $("changePhoneBtn");

    if (!changePhoneBtn) {

        changePhoneBtn =
            document.createElement("button");

        changePhoneBtn.id =
            "changePhoneBtn";

        changePhoneBtn.type =
            "button";

        changePhoneBtn.className =
            "secondary-btn";

        changePhoneBtn.textContent =
            "📱 Change Mobile";

        phoneInput.parentElement?.appendChild(
            changePhoneBtn
        );
    }

    changePhoneBtn.addEventListener(
        "click",
        async () => {

            phoneInput.disabled = false;

            phoneInput.focus();

            let saveBtn =
                $("savePhoneBtn");

            if (!saveBtn) {

                saveBtn =
                    document.createElement("button");

                saveBtn.id =
                    "savePhoneBtn";

                saveBtn.type =
                    "button";

                saveBtn.className =
                    "primary-btn";

                saveBtn.textContent =
                    "Save Mobile";

                phoneInput.parentElement?.appendChild(
                    saveBtn
                );

                saveBtn.addEventListener(
                    "click",
                    async () => {

                        const phone =
                            normalizePhone(
                                phoneInput.value
                            );

                        if (phone.length !== 10) {

                            showToast(
                                "10 digit mobile number डालें।",
                                "warning"
                            );

                            return;
                        }

                        localStorage.setItem(
                            "studyPhone",
                            phone
                        );

                        currentUser.phone =
                            phone;

                        await saveUserProfile();

                        phoneInput.disabled = true;

                        showToast(
                            "Mobile number update हो गया।",
                            "success"
                        );
                    }
                );
            }

            saveBtn.style.display = "";
        }
    );
}


// ============================================================
// DP / PROFILE PHOTO
// ============================================================

function setupDPSettings() {

    let wrapper = $("profilePhotoSettings");

    if (!wrapper) {

        const settingsBox =
            qs(".settings-box");

        if (!settingsBox) return;

        wrapper =
            document.createElement("div");

        wrapper.id =
            "profilePhotoSettings";

        wrapper.className =
            "profile-photo-settings";

        wrapper.innerHTML = `
            <div class="settings-section-title">
                Profile Photo
            </div>

            <div id="settingsDPPreview"></div>

            <input
                type="file"
                id="dpInput"
                accept="image/*"
                hidden
            >

            <button
                type="button"
                id="chooseDPBtn"
                class="secondary-btn"
            >
                📷 Change Photo
            </button>

            <button
                type="button"
                id="removeDPBtn"
                class="danger-btn"
            >
                Remove Photo
            </button>
        `;

        settingsBox.appendChild(wrapper);
    }

    const preview =
        $("settingsDPPreview");

    const input =
        $("dpInput");

    const choose =
        $("chooseDPBtn");

    const remove =
        $("removeDPBtn");

    function renderPreview() {

        if (!preview) return;

        preview.innerHTML =
            avatarHTML(
                getUserName() || "Student",
                getUserDP()
            );
    }

    renderPreview();

    choose?.addEventListener(
        "click",
        () => input?.click()
    );

    input?.addEventListener(
        "change",
        async () => {

            const file =
                input.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                showToast(
                    "सिर्फ image file चुनें।",
                    "warning"
                );

                return;
            }

            const reader =
                new FileReader();

            reader.onload = async event => {

                const dataURL =
                    String(event.target.result);

                const compressed =
                    await compressImage(
                        dataURL,
                        360,
                        0.78
                    );

                localStorage.setItem(
                    "studyDP",
                    compressed
                );

                currentUser.dp =
                    compressed;

                await saveUserProfile();

                renderPreview();

                updateProfileUI();

                updateOnlineProfile();

                showToast(
                    "Profile photo update हो गई।",
                    "success"
                );
            };

            reader.readAsDataURL(file);
        }
    );

    remove?.addEventListener(
        "click",
        async () => {

            localStorage.removeItem(
                "studyDP"
            );

            currentUser.dp = "";

            await saveUserProfile();

            renderPreview();

            updateProfileUI();

            showToast(
                "Profile photo remove हो गई।",
                "success"
            );
        }
    );
}


function compressImage(
    dataURL,
    maxSize = 360,
    quality = 0.78
) {

    return new Promise(resolve => {

        const image =
            new Image();

        image.onload = () => {

            let width =
                image.width;

            let height =
                image.height;

            const scale =
                Math.min(
                    1,
                    maxSize /
                    Math.max(
                        width,
                        height
                    )
                );

            width *= scale;
            height *= scale;

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                width;

            canvas.height =
                height;

            const context =
                canvas.getContext(
                    "2d"
                );

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
                    quality
                )
            );
        };

        image.src =
            dataURL;
    });
}


// ============================================================
// PROFILE UI
// ============================================================

function updateProfileUI() {

    const name =
        getUserName() || "Student";

    const phone =
        getUserPhone() || "";

    const dp =
        getUserDP();

    const nameElements = [
        $("profileName"),
        $("currentUserName"),
        $("homeUserName")
    ];

    nameElements.forEach(
        element => {
            if (element) {
                element.textContent =
                    name;
            }
        }
    );

    const phoneElement =
        $("currentUserPhone");

    if (phoneElement) {
        phoneElement.textContent =
            phone;
    }

    qsa(
        ".profile-avatar," +
        ".current-user-avatar," +
        ".home-avatar"
    ).forEach(
        element => {
            element.innerHTML =
                avatarHTML(
                    name,
                    dp
                );
        }
    );
}


// ============================================================
// ONLINE STATUS
// ============================================================

async function updateOnlineProfile() {

    const name =
        getUserName();

    const phone =
        normalizePhone(
            getUserPhone()
        );

    if (!name || !phone) return;

    try {

        await setDoc(
            doc(
                db,
                "onlineUsers",
                phone
            ),
            {
                name,
                phone,
                dp: getUserDP(),
                online: true,
                lastSeen: now()
            },
            {
                merge: true
            }
        );

    } catch (error) {

        console.error(
            "Online update error:",
            error
        );
    }
}


async function startOnlineStatus() {

    if (onlineTimer) {
        clearInterval(onlineTimer);
    }

    await updateOnlineProfile();

    onlineTimer =
        setInterval(
            updateOnlineProfile,
            ONLINE_INTERVAL
        );
}


async function markOffline() {

    const phone =
        normalizePhone(
            getUserPhone()
        );

    if (!phone) return;

    try {

        await updateDoc(
            doc(
                db,
                "onlineUsers",
                phone
            ),
            {
                online: false,
                lastSeen: now()
            }
        );

    } catch (_) {}
}


window.addEventListener(
    "beforeunload",
    () => {
        markOffline();
    }
);


// ============================================================
// ONLINE LIST
// ============================================================

async function loadOnlineUsers() {

    const onlineList =
        $("onlineList");

    if (!onlineList) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "onlineUsers"
                )
            );

        const currentTime =
            now();

        const users = [];

        snapshot.forEach(item => {

            const data =
                item.data();

            const lastSeen =
                getTimestamp(
                    data.lastSeen
                );

            const online =
                data.online === true &&
                currentTime - lastSeen <
                ONLINE_TIMEOUT;

            if (online) {
                users.push(data);
            }
        });

        users.sort(
            (a, b) =>
                String(a.name || "")
                    .localeCompare(
                        String(b.name || "")
                    )
        );

        onlineList.innerHTML = "";

        if (!users.length) {

            onlineList.innerHTML = `
                <div class="empty-state">
                    <div>👥</div>
                    <strong>No students online</strong>
                    <p>जब कोई student online आएगा तो यहाँ दिखेगा।</p>
                </div>
            `;

            return;
        }

        users.forEach(user => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "online-user-card";

            card.innerHTML = `
                <div class="online-user-avatar">
                    ${avatarHTML(
                        user.name,
                        user.dp || ""
                    )}
                    <span class="online-dot"></span>
                </div>

                <div class="online-user-info">
                    <strong>
                        ${escapeHTML(
                            user.name
                        )}
                    </strong>

                    <small>
                        ● Online
                    </small>
                </div>
            `;

            onlineList.appendChild(
                card
            );
        });

        const count =
            $("onlineCount");

        if (count) {
            count.textContent =
                users.length;
        }

    } catch (error) {

        console.error(
            "Online list error:",
            error
        );
    }
}


// ============================================================
// ONLINE BUTTON
// ============================================================

const onlineBtn =
    $("onlineBtn");

const onlinePanel =
    $("onlinePanel");

const closeOnlineBtn =
    $("closeOnlineBtn");

onlineBtn?.addEventListener(
    "click",
    async () => {

        await loadOnlineUsers();

        onlinePanel?.classList.add(
            "show"
        );
    }
);

closeOnlineBtn?.addEventListener(
    "click",
    () => {
        onlinePanel?.classList.remove(
            "show"
        );
    }
);


// ============================================================
// ADD ONLINE
// ============================================================

const addOnlineBtn =
    $("addOnlineBtn");

addOnlineBtn?.addEventListener(
    "click",
    async () => {

        if (!getUserName() || !getUserPhone()) {

            showToast(
                "पहले profile complete करें।",
                "warning"
            );

            showPage("settings");

            return;
        }

        await updateOnlineProfile();

        await loadOnlineUsers();

        showToast(
            "आप Online list में add हो गए।",
            "success"
        );
    }
);


// ============================================================
// CHAT
// ============================================================

const messageInput =
    $("messageInput");

const sendMessageBtn =
    $("sendMessageBtn");

const chatMessages =
    $("chatMessages");

const emojiBtn =
    $("emojiBtn");


// Emoji button
emojiBtn?.addEventListener(
    "click",
    () => {

        if (!messageInput) return;

        messageInput.value +=
            messageInput.value
                ? " 😊"
                : "😊";

        messageInput.focus();

        showTyping();
    }
);


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    if (!canUseFullApp()) {

        showToast(
            "Chat Owner Allow के बाद मिलेगा।",
            "warning"
        );

        return;
    }

    const text =
        messageInput?.value.trim();

    const name =
        getUserName();

    const phone =
        normalizePhone(
            getUserPhone()
        );

    if (!text) return;

    if (!name || !phone) {

        showToast(
            "पहले profile complete करें।",
            "warning"
        );

        return;
    }

    try {

        setButtonLoading(
            sendMessageBtn,
            true,
            "Sending..."
        );

        await addDoc(
            collection(
                db,
                "messages"
            ),
            {
                name,
                phone,
                dp: getUserDP(),
                message: text,
                createdAt: now(),
                delivered: false,
                seenBy: [],
                type: "text"
            }
        );

        if (messageInput) {
            messageInput.value = "";
        }

        await addActivity(
            "New Message",
            `${name} sent a new message.`
        );

    } catch (error) {

        console.error(
            "Message sending error:",
            error
        );

        showToast(
            "Message send नहीं हुआ।",
            "error"
        );

    } finally {

        setButtonLoading(
            sendMessageBtn,
            false
        );
    }
}


sendMessageBtn?.addEventListener(
    "click",
    sendMessage
);

messageInput?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();
        }
    }
);


// ============================================================
// CHAT LOAD — ALL HISTORY
// ============================================================

async function loadChat() {

    if (!chatMessages) return;

    if (!canUseFullApp()) {

        chatMessages.innerHTML = `
            <div class="locked-state">
                <div class="lock-icon">🔒</div>
                <h3>Chat Locked</h3>
                <p>Owner के Allow करने के बाद Chat उपलब्ध होगा।</p>
            </div>
        `;

        return;
    }

    try {

        if (unsubscribeMessages) {
            unsubscribeMessages();
        }

        const messagesRef =
            collection(
                db,
                "messages"
            );

        unsubscribeMessages =
            onSnapshot(
                messagesRef,
                async snapshot => {

                    const messages =
                        [];

                    snapshot.forEach(
                        item => {

                            const data =
                                item.data();

                            messages.push({
                                id: item.id,
                                ...data,
                                sortTime:
                                    getTimestamp(
                                        data.createdAt ||
                                        data.timestamp
                                    )
                            });
                        }
                    );

                    messages.sort(
                        (a, b) =>
                            a.sortTime -
                            b.sortTime
                    );

                    renderMessages(
                        messages
                    );

                    await markVisibleMessagesSeen(
                        messages
                    );
                },
                error => {

                    console.error(
                        "Chat listener error:",
                        error
                    );

                    chatMessages.innerHTML = `
                        <div class="empty-state">
                            <strong>Chat load नहीं हो पाया।</strong>
                            <p>Firebase connection check करें।</p>
                        </div>
                    `;
                }
            );

    } catch (error) {

        console.error(
            "Chat load error:",
            error
        );
    }
}


// ============================================================
// RENDER CHAT
// ============================================================

function renderMessages(messages) {

    if (!chatMessages) return;

    chatMessages.innerHTML = "";

    if (!messages.length) {

        chatMessages.innerHTML = `
            <div class="empty-state">
                <div>💬</div>
                <strong>Start a conversation</strong>
                <p>पहला message भेजें।</p>
            </div>
        `;

        return;
    }

    const currentPhone =
        normalizePhone(
            getUserPhone()
        );

    messages.forEach(
        message => {

            const senderPhone =
                normalizePhone(
                    message.phone
                );

            const isMine =
                senderPhone &&
                currentPhone &&
                senderPhone ===
                currentPhone;

            const box =
                document.createElement(
                    "div"
                );

            box.className =
                isMine
                    ? "message mine"
                    : "message other";

            const seenBy =
                Array.isArray(
                    message.seenBy
                )
                    ? message.seenBy
                    : [];

            const seenCount =
                seenBy.length;

            box.innerHTML = `
                <div class="message-avatar">
                    ${avatarHTML(
                        message.name ||
                        "Student",
                        message.dp || ""
                    )}
                </div>

                <div class="message-content">

                    ${
                        !isMine
                            ? `
                                <strong class="message-sender">
                                    ${escapeHTML(
                                        message.name ||
                                        "Student"
                                    )}
                                </strong>
                              `
                            : ""
                    }

                    <div class="message-bubble">

                        <div class="message-text">
                            ${escapeHTML(
                                message.message ||
                                ""
                            )}
                        </div>

                        <div class="message-meta">

                            <span>
                                ${escapeHTML(
                                    formatTime(
                                        message.createdAt ||
                                        message.timestamp
                                    )
                                )}
                            </span>

                            ${
                                isMine
                                    ? getTickHTML(
                                        message
                                    )
                                    : ""
                            }

                        </div>
                    </div>

                    ${
                        isMine && seenCount
                            ? `
                                <button
                                    type="button"
                                    class="seen-info-btn"
                                    data-message-id="${escapeHTML(
                                        message.id
                                    )}"
                                >
                                    👁 ${seenCount} seen
                                </button>
                              `
                            : ""
                    }

                </div>
            `;

            const seenButton =
                box.querySelector(
                    ".seen-info-btn"
                );

            seenButton?.addEventListener(
                "click",
                () => {

                    showSeenPopup(
                        message
                    );
                }
            );

            addLongPressSelect(
                box,
                message.id,
                "messages",
                async ids => {

                    for (
                        const id of ids
                    ) {

                        const messageRef =
                            doc(
                                db,
                                "messages",
                                id
                            );

                        const snap =
                            await getDoc(
                                messageRef
                            );

                        if (!snap.exists())
                            continue;

                        const data =
                            snap.data();

                        if (
                            isOwner() ||
                            normalizePhone(
                                data.phone
                            ) ===
                            normalizePhone(
                                getUserPhone()
                            )
                        ) {

                            await deleteDoc(
                                messageRef
                            );
                        }
                    }

                    selectedItems.clear();

                    hideDeleteBar();
                }
            );

            chatMessages.appendChild(
                box
            );
        }
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ============================================================
// MESSAGE TICKS
// ============================================================

function getTickHTML(message) {

    const seen =
        Array.isArray(
            message.seenBy
        ) &&
        message.seenBy.some(
            phone =>
                normalizePhone(phone) !==
                normalizePhone(
                    getUserPhone()
                )
        );

    const delivered =
        message.delivered === true;

    if (seen) {

        return `
            <span
                class="message-tick blue-ticks"
                title="Seen"
            >
                ✓✓
            </span>
        `;
    }

    if (delivered) {

        return `
            <span
                class="message-tick"
                title="Delivered"
            >
                ✓✓
            </span>
        `;
    }

    return `
        <span
            class="message-tick"
            title="Sent"
        >
            ✓
        </span>
    `;
}


// ============================================================
// MARK MESSAGES SEEN
// ============================================================

async function markVisibleMessagesSeen(
    messages
) {

    const currentPhone =
        normalizePhone(
            getUserPhone()
        );

    const currentName =
        getUserName();

    if (!currentPhone || !currentName)
        return;

    for (const message of messages) {

        const senderPhone =
            normalizePhone(
                message.phone
            );

        if (
            senderPhone === currentPhone
        ) {
            continue;
        }

        const seenBy =
            Array.isArray(
                message.seenBy
            )
                ? message.seenBy
                : [];

        const alreadySeen =
            seenBy.some(
                value =>
                    normalizePhone(value) ===
                    currentPhone
            );

        if (alreadySeen) continue;

        try {

            await updateDoc(
                doc(
                    db,
                    "messages",
                    message.id
                ),
                {
                    seenBy:
                        arrayUnion(
                            currentPhone
                        ),
                    seenNames:
                        arrayUnion(
                            currentName
                        ),
                    delivered: true
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


// ============================================================
// SEEN POPUP
// ============================================================

function showSeenPopup(message) {

    let popup =
        $("seenPopup");

    if (!popup) {

        popup =
            document.createElement(
                "div"
            );

        popup.id =
            "seenPopup";

        popup.className =
            "seen-popup";

        document.body.appendChild(
            popup
        );
    }

    const names =
        Array.isArray(
            message.seenNames
        )
            ? message.seenNames
            : [];

    popup.innerHTML = `
        <div class="seen-popup-card">

            <div class="seen-popup-header">
                <strong>Message Info</strong>

                <button
                    type="button"
                    id="closeSeenPopup"
                >
                    ×
                </button>
            </div>

            <div class="seen-popup-message">
                ${escapeHTML(
                    message.message ||
                    ""
                )}
            </div>

            <div class="seen-popup-time">
                ${escapeHTML(
                    formatDateTime(
                        message.createdAt
                    )
                )}
            </div>

            <hr>

            <strong>
                Seen by
            </strong>

            <div class="seen-names">
                ${
                    names.length
                        ? names.map(
                            name => `
                                <div>
                                    ✓ ${escapeHTML(
                                        name
                                    )}
                                </div>
                            `
                        ).join("")
                        : `
                            <small>
                                अभी किसी ने नहीं देखा।
                            </small>
                          `
                }
            </div>

        </div>
    `;

    popup.classList.add("show");

    $("closeSeenPopup")?.addEventListener(
        "click",
        () => {
            popup.classList.remove(
                "show"
            );
        }
    );
}


// ============================================================
// TYPING INDICATOR
// ============================================================

async function showTyping() {

    const phone =
        normalizePhone(
            getUserPhone()
        );

    const name =
        getUserName();

    if (!phone || !name) return;

    try {

        await setDoc(
            doc(
                db,
                "typingUsers",
                phone
            ),
            {
                name,
                phone,
                typing: true,
                updatedAt: now()
            }
        );

        setTimeout(
            async () => {

                try {

                    await updateDoc(
                        doc(
                            db,
                            "typingUsers",
                            phone
                        ),
                        {
                            typing: false,
                            updatedAt: now()
                        }
                    );

                } catch (_) {}

            },
            1800
        );

    } catch (_) {}
}


messageInput?.addEventListener(
    "input",
    () => {

        if (
            messageInput.value.trim()
        ) {
            showTyping();
        }
    }
);


function startTypingListener() {

    if (!canUseFullApp()) return;

    if (unsubscribeTyping) {
        unsubscribeTyping();
    }

    unsubscribeTyping =
        onSnapshot(
            collection(
                db,
                "typingUsers"
            ),
            snapshot => {

                const currentPhone =
                    normalizePhone(
                        getUserPhone()
                    );

                const typingUsers =
                    [];

                snapshot.forEach(
                    item => {

                        const data =
                            item.data();

                        if (
                            normalizePhone(
                                data.phone
                            ) ===
                            currentPhone
                        ) {
                            return;
                        }

                        if (
                            data.typing === true &&
                            now() -
                            getTimestamp(
                                data.updatedAt
                            ) <
                            5000
                        ) {
                            typingUsers.push(
                                data.name
                            );
                        }
                    }
                );

                renderTypingIndicator(
                    typingUsers
                );
            }
        );
}


function renderTypingIndicator(
    users
) {

    let indicator =
        $("typingIndicator");

    if (!indicator) {

        indicator =
            document.createElement(
                "div"
            );

        indicator.id =
            "typingIndicator";

        indicator.className =
            "typing-indicator";

        chatMessages?.parentElement?.appendChild(
            indicator
        );
    }

    if (!users.length) {

        indicator.textContent = "";

        indicator.classList.remove(
            "show"
        );

        return;
    }

    indicator.textContent =
        users.length === 1
            ? `${users[0]} is typing...`
            : `${users.join(", ")} are typing...`;

    indicator.classList.add(
        "show"
    );
}


// ============================================================
// LONG PRESS MULTI SELECT
// ============================================================

function addLongPressSelect(
    element,
    id,
    collectionName,
    callback
) {

    let timer = null;

    function start(event) {

        if (
            event.target.closest("button") ||
            event.target.closest("input") ||
            event.target.closest("textarea")
        ) {
            return;
        }

        timer = setTimeout(
            () => {

                selectedItems.set(
                    id,
                    {
                        collectionName,
                        callback,
                        element
                    }
                );

                element.classList.add(
                    "selected-item"
                );

                currentDeleteCollection =
                    collectionName;

                showDeleteBar();

            },
            650
        );
    }

    function cancel() {

        if (timer) {

            clearTimeout(timer);

            timer = null;
        }
    }

    element.addEventListener(
        "mousedown",
        start
    );

    element.addEventListener(
        "mouseup",
        cancel
    );

    element.addEventListener(
        "mouseleave",
        cancel
    );

    element.addEventListener(
        "touchstart",
        start,
        {
            passive: true
        }
    );

    element.addEventListener(
        "touchend",
        cancel
    );

    element.addEventListener(
        "touchmove",
        cancel
    );

    element.addEventListener(
        "click",
        () => {

            if (
                selectedItems.size &&
                selectedItems.has(id)
            ) {

                selectedItems.delete(
                    id
                );

                element.classList.remove(
                    "selected-item"
                );

                showDeleteBar();
            }
        }
    );
}


// ============================================================
// DELETE BAR
// ============================================================

function showDeleteBar() {

    let bar =
        $("multiDeleteBar");

    if (!bar) {

        bar =
            document.createElement(
                "div"
            );

        bar.id =
            "multiDeleteBar";

        bar.className =
            "multi-delete-bar";

        document.body.appendChild(
            bar
        );
    }

    if (!selectedItems.size) {

        hideDeleteBar();

        return;
    }

    bar.innerHTML = `
        <div>
            <strong>
                ${selectedItems.size}
            </strong>
            selected
        </div>

        <div class="delete-actions">

            <button
                type="button"
                id="cancelSelectedBtn"
                class="secondary-btn"
            >
                Cancel
            </button>

            <button
                type="button"
                id="deleteSelectedBtn"
                class="danger-btn"
            >
                🗑 Delete
            </button>

        </div>
    `;

    bar.classList.add("show");

    $("cancelSelectedBtn")?.addEventListener(
        "click",
        () => {

            selectedItems.forEach(
                item => {
                    item.element?.classList.remove(
                        "selected-item"
                    );
                }
            );

            selectedItems.clear();

            hideDeleteBar();
        }
    );

    $("deleteSelectedBtn")?.addEventListener(
        "click",
        deleteSelectedItems
    );
}


function hideDeleteBar() {

    const bar =
        $("multiDeleteBar");

    if (bar) {
        bar.classList.remove(
            "show"
        );
    }
}


async function deleteSelectedItems() {

    if (!selectedItems.size) return;

    const yes =
        confirm(
            `क्या ${selectedItems.size} selected items delete करने हैं?`
        );

    if (!yes) return;

    const groups =
        {};

    selectedItems.forEach(
        (item, id) => {

            const collectionName =
                item.collectionName;

            if (!groups[collectionName]) {
                groups[collectionName] =
                    [];
            }

            groups[collectionName].push(
                id
            );
        }
    );

    try {

        for (
            const collectionName
            of Object.keys(groups)
        ) {

            for (
                const id
                of groups[collectionName]
            ) {

                const reference =
                    doc(
                        db,
                        collectionName,
                        id
                    );

                const snap =
                    await getDoc(
                        reference
                    );

                if (!snap.exists())
                    continue;

                const data =
                    snap.data();

                const ownerOfContent =
                    normalizePhone(
                        data.phone ||
                        data.senderPhone ||
                        ""
                    );

                const mine =
                    ownerOfContent &&
                    ownerOfContent ===
                    normalizePhone(
                        getUserPhone()
                    );

                if (
                    isOwner() ||
                    mine
                ) {

                    await deleteDoc(
                        reference
                    );
                }
            }
        }

        await addActivity(
            "Content Deleted",
            `${getUserName()} deleted selected content.`
        );

        showToast(
            "Selected items delete हो गए।",
            "success"
        );

    } catch (error) {

        console.error(
         
