/* =========================================================
   STUDYCONNECT - COMPLETE JAVASCRIPT
   Firebase + Chat + Groups + Owner Panel + Global Settings
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
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
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
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyi3SwWc3aUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};


/* =========================================================
   FIREBASE START
   ========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


/* =========================================================
   APP CONSTANTS
   ========================================================= */

const OWNER_NAME = "Krishna Yadav";
const OWNER_SHORT_NAME = "Krishna Ji";

const DEFAULT_SETTINGS = {
    appName: "StudyConnect",
    language: "en",
    theme: "system",
    welcomeAnimation: "on",

    features: {
        chat: true,
        groups: true,
        homework: true,
        notes: true,
        announcements: true,
        registration: true,
        studentSearch: true,
        maintenance: false
    }
};


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentStudent = null;

let selectedChatPerson = null;
let selectedOwnerPerson = null;

let selectedGroupMembers = [];

let currentSettings = structuredClone(DEFAULT_SETTINGS);

let unsubscribeMessages = null;
let unsubscribeStudents = null;
let unsubscribeSettings = null;

let onlineHeartbeat = null;

let isOwner = false;


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   SAFE HTML
   ========================================================= */

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   DATE / TIME
   ========================================================= */

function formatDateTime(timestamp) {

    if (!timestamp) return "";

    let date;

    if (timestamp?.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }

    if (Number.isNaN(date.getTime())) {
        return "";
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
        minute: "2-digit",
        hour12: true
    });
}


function formatDateOnly(timestamp) {

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
   TOAST
   ========================================================= */

function showToast(message, icon = "✓") {

    const toast = $("toast");
    const toastMessage = $("toastMessage");
    const toastIcon = $("toastIcon");

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    if (toastIcon) {
        toastIcon.textContent = icon;
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


/* =========================================================
   LOCAL USER HELPERS
   ========================================================= */

function getUserName() {
    return localStorage.getItem("studyName") || "";
}


function getUserPhone() {
    return localStorage.getItem("studyPhone") || "";
}


function setLocalUser(name, phone) {

    localStorage.setItem("studyName", name);
    localStorage.setItem("studyPhone", phone);
}


function getProfileId(phone = getUserPhone()) {

    const cleanPhone = String(phone).replace(/\D/g, "");

    if (!cleanPhone) return "";

    return cleanPhone;
}


/* =========================================================
   AUTH
   ========================================================= */

async function startFirebaseAuth() {

    try {

        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }

    } catch (error) {

        console.error("Firebase Auth error:", error);

        showToast(
            "Firebase Authentication शुरू नहीं हो पाया।",
            "⚠️"
        );
    }
}


onAuthStateChanged(auth, user => {

    currentUser = user || null;

});


/* =========================================================
   SETTINGS LOAD
   ========================================================= */

async function loadGlobalSettings() {

    try {

        const ref = doc(db, "appSettings", "main");
        const snap = await getDoc(ref);

        if (!snap.exists()) {

            currentSettings = structuredClone(DEFAULT_SETTINGS);

            return;
        }

        const data = snap.data();

        currentSettings = {
            ...DEFAULT_SETTINGS,
            ...data,
            features: {
                ...DEFAULT_SETTINGS.features,
                ...(data.features || {})
            }
        };

        applyGlobalSettings();

    } catch (error) {

        console.error(
            "Global settings error:",
            error
        );

        currentSettings = structuredClone(DEFAULT_SETTINGS);
        applyGlobalSettings();
    }
}


/* =========================================================
   GLOBAL SETTINGS LISTENER
   ========================================================= */

function listenToGlobalSettings() {

    if (unsubscribeSettings) {
        unsubscribeSettings();
    }

    unsubscribeSettings = onSnapshot(
        doc(db, "appSettings", "main"),
        snapshot => {

            if (!snapshot.exists()) return;

            const data = snapshot.data();

            currentSettings = {
                ...DEFAULT_SETTINGS,
                ...data,
                features: {
                    ...DEFAULT_SETTINGS.features,
                    ...(data.features || {})
                }
            };

            applyGlobalSettings();

        },
        error => {
            console.error(
                "Settings listener error:",
                error
            );
        }
    );
}


/* =========================================================
   APPLY GLOBAL SETTINGS
   ========================================================= */

function applyGlobalSettings() {

    const settings = currentSettings;

    const appTitle = $("appTitle");

    if (appTitle) {
        appTitle.textContent =
            settings.appName || "StudyConnect";
    }

    document.title =
        settings.appName || "StudyConnect";

    applyTheme(settings.theme);

    applyLanguage(settings.language);

    applyFeatureVisibility(settings.features);

    const maintenanceNotice =
        $("maintenanceNotice");

    if (maintenanceNotice) {

        maintenanceNotice.classList.toggle(
            "hidden",
            !settings.features.maintenance
        );
    }

    if (
        settings.features.maintenance &&
        !isOwner
    ) {

        document.body.classList.add(
            "maintenance-active"
        );

    } else {

        document.body.classList.remove(
            "maintenance-active"
        );
    }
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme(theme) {

    document.documentElement.dataset.theme =
        theme || "system";

    document.body.classList.remove(
        "dark-theme",
        "light-theme"
    );

    if (theme === "dark") {
        document.body.classList.add(
            "dark-theme"
        );
    }

    if (theme === "light") {
        document.body.classList.add(
            "light-theme"
        );
    }

    const themeSelect = $("themeSelect");

    if (themeSelect) {
        themeSelect.value =
            theme || "system";
    }
}


/* =========================================================
   LANGUAGE
   ========================================================= */

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

        loginTitle: "StudyConnect",
        loginSubtitle: "Student Community",

        homeDescription:
            "Welcome to your StudyConnect student community.",

        noStudents:
            "No students found.",

        noGroups:
            "No groups available.",

        noHomework:
            "No homework available.",

        noUpdates:
            "No school updates available.",

        noNotes:
            "No notes available."
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

        loginTitle: "StudyConnect",
        loginSubtitle: "Student Community",

        homeDescription:
            "आपके StudyConnect Student Community में आपका स्वागत है।",

        noStudents:
            "कोई विद्यार्थी नहीं मिला।",

        noGroups:
            "अभी कोई ग्रुप उपलब्ध नहीं है।",

        noHomework:
            "अभी कोई होमवर्क उपलब्ध नहीं है।",

        noUpdates:
            "अभी कोई स्कूल अपडेट उपलब्ध नहीं है।",

        noNotes:
            "अभी कोई नोट उपलब्ध नहीं है।"
    }
};


function applyLanguage(language = "en") {

    const lang =
        translations[language]
            ? language
            : "en";

    document.documentElement.lang =
        lang === "hi"
            ? "hi"
            : "en";

    localStorage.setItem(
        "studyLanguage",
        lang
    );

    const t = translations[lang];

    document.querySelectorAll(
        "[data-i18n]"
    ).forEach(element => {

        const key =
            element.dataset.i18n;

        if (t[key]) {
            element.textContent =
                t[key];
        }
    });

    const loginTitle = $("loginTitle");

    if (loginTitle) {
        loginTitle.textContent =
            t.loginTitle;
    }

    const loginSubtitle =
        $("loginSubtitle");

    if (loginSubtitle) {
        loginSubtitle.textContent =
            t.loginSubtitle;
    }

    const homeDescription =
        $("homeDescription");

    if (homeDescription) {
        homeDescription.textContent =
            t.homeDescription;
    }

    const languageSelect =
        $("languageSelect");

    if (languageSelect) {
        languageSelect.value = lang;
    }
}


/* =========================================================
   FEATURE CONTROL
   ========================================================= */

function applyFeatureVisibility(features = {}) {

    const mapping = {

        chat: [
            '[data-page="chat"]'
        ],

        groups: [
            '[data-page="groups"]'
        ],

        homework: [
            '[data-page="homework"]'
        ],

        notes: [
            '[data-page="notes"]'
        ],

        announcements: [
            '[data-page="school"]'
        ]
    };


    Object.entries(mapping).forEach(
        ([feature, selectors]) => {

            const enabled =
                features[feature] !== false;

            selectors.forEach(selector => {

                document.querySelectorAll(
                    selector
                ).forEach(element => {

                    element.classList.toggle(
                        "feature-disabled",
                        !enabled
                    );

                    element.style.display =
                        enabled
                            ? ""
                            : "none";
                });
            });
        }
    );
}


/* =========================================================
   OWNER CHECK
   ========================================================= */

function checkOwner(name, phone) {

    const normalizedName =
        String(name || "")
            .trim()
            .toLowerCase();

    const normalizedOwner =
        OWNER_NAME
            .trim()
            .toLowerCase();

    /*
       IMPORTANT:
       This is only a UI-level Owner recognition.
       It is NOT real security.

       Production Owner security must be enforced
       using Firebase Authentication + custom claims.
    */

    isOwner =
        normalizedName === normalizedOwner;

    return isOwner;
}


/* =========================================================
   OWNER WELCOME
   ========================================================= */

function showOwnerWelcome() {

    const welcome =
        $("ownerWelcome");

    if (!welcome) return;

    if (
        currentSettings.welcomeAnimation ===
        "off"
    ) {
        return;
    }

    welcome.classList.remove("hidden");

    createFallingStars();

    playWelcomeTone();

    setTimeout(() => {

        welcome.classList.add("hidden");

        openOwnerPanel();

    }, 2100);
}


function createFallingStars() {

    const container =
        $("fallingStars");

    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 45; i++) {

        const star =
            document.createElement("span");

        star.className =
            "falling-star";

        star.textContent =
            Math.random() > 0.5
                ? "★"
                : "✦";

        star.style.left =
            `${Math.random() * 100}%`;

        star.style.animationDelay =
            `${Math.random() * 1.2}s`;

        star.style.animationDuration =
            `${1.2 + Math.random() * 1.2}s`;

        container.appendChild(star);
    }
}


/* =========================================================
   WELCOME SOUND
   ========================================================= */

function playWelcomeTone() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) return;

        const context =
            new AudioContext();

        const oscillator =
            context.createOscillator();

        const gain =
            context.createGain();

        oscillator.type =
            "sine";

        oscillator.frequency.setValueAtTime(
            660,
            context.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            990,
            context.currentTime + 0.25
        );

        gain.gain.setValueAtTime(
            0.0001,
            context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.12,
            context.currentTime + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            context.currentTime + 0.45
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();

        oscillator.stop(
            context.currentTime + 0.5
        );

    } catch (error) {

        console.log(
            "Welcome tone unavailable."
        );
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();

    const name =
        $("loginName")?.value.trim();

    const phone =
        $("loginPhone")?.value.trim();

    const password =
        $("loginPassword")?.value;

    const message =
        $("loginMessage");

    if (!name) {

        showLoginError(
            "Please enter your name."
        );

        return;
    }

    if (!/^\d{10}$/.test(phone)) {

        showLoginError(
            "Please enter a valid 10-digit mobile number."
        );

        return;
    }

    if (!password) {

        showLoginError(
            "Please enter the app password."
        );

        return;
    }


    try {

        await startFirebaseAuth();

        const profileId =
            getProfileId(phone);

        const studentRef =
            doc(
                db,
                "students",
                profileId
            );

        const studentSnap =
            await getDoc(studentRef);

        let studentData;


        if (studentSnap.exists()) {

            studentData =
                studentSnap.data();

            /*
              Existing user.
              Password validation is performed through
              the configured application hash when available.
            */

            const passwordValid =
                await verifyStoredPassword(
                    password,
                    studentData.appPasswordHash
                );

            if (!passwordValid) {

                showLoginError(
                    "Wrong password."
                );

                return;
            }

        } else {

            /*
              New user:
              create pending student profile.

              The actual approval state is controlled
              by Owner/Firebase.
            */

            const hash =
                await sha256(password);

            studentData = {

                name,
                phone,

                status: "pending",

                permission: "normal",

                followers: [],
                following: [],

                groups: [],

                appPasswordHash: hash,

                joinedAt:
                    serverTimestamp(),

                lastSeen:
                    serverTimestamp(),

                online: true
            };


            await setDoc(
                studentRef,
                studentData,
                { merge: true }
            );

            showLoginError(
                "Registration submitted. Owner approval is required."
            );

            return;
        }


        if (studentData.status === "blocked") {

            showLoginError(
                "Your account is blocked by the Owner."
            );

            return;
        }


        setLocalUser(
            studentData.name || name,
            studentData.phone || phone
        );


        currentStudent = {
            id: profileId,
            ...studentData
        };


        checkOwner(
            studentData.name || name,
            studentData.phone || phone
        );


        await updateStudentOnline(
            true
        );


        $("loginScreen")
            ?.classList.add("hidden");

        $("app")
            ?.classList.remove("hidden");


        updateProfileUI();

        await loadGlobalSettings();

        listenToGlobalSettings();

        setupNavigation();

        await loadAllContent();

        await loadStudents();


        if (isOwner) {

            showOwnerWelcome();

        } else {

            showPage("home");
        }


        startOnlineHeartbeat();

        showToast(
            `Welcome, ${studentData.name || name}!`,
            "👋"
        );


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showLoginError(
            "Login failed. Please try again."
        );
    }
}


function showLoginError(text) {

    const box =
        $("loginMessage");

    if (!box) return;

    box.textContent = text;

    box.classList.add("error");

    setTimeout(() => {
        box.classList.remove("error");
    }, 100);
}


/* =========================================================
   PASSWORD HASH
   ========================================================= */

async function sha256(text) {

    const data =
        new TextEncoder()
            .encode(text);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );

    return hashArray
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


async function verifyStoredPassword(
    password,
    storedHash
) {

    if (!storedHash) {

        /*
          Compatibility fallback for first setup.
          Change the app password from Owner Security
          after proper Firebase Auth is configured.
        */

        return password === "123";
    }

    const hash =
        await sha256(password);

    return hash === storedHash;
}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {

    const name =
        currentStudent?.name ||
        getUserName() ||
        "Student";

    const phone =
        currentStudent?.phone ||
        getUserPhone() ||
        "";

    const initial =
        name.charAt(0)
            .toUpperCase();


    const profileName =
        $("profileName");

    if (profileName) {
        profileName.textContent =
            name;
    }


    const profilePhone =
        $("profilePhone");

    if (profilePhone) {
        profilePhone.textContent =
            phone;
    }


    const avatar =
        $("profileAvatar");

    if (avatar) {
        avatar.textContent =
            initial;
    }


    const headerInitial =
        $("headerProfileInitial");

    if (headerInitial) {
        headerInitial.textContent =
            initial;
    }


    const greeting =
        $("homeGreeting");

    if (greeting) {

        greeting.textContent =
            `Welcome ${name} 👋`;
    }


    if (isOwner) {

        $("ownerSettingsCard")
            ?.classList.remove("hidden");
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(button => {

            button.onclick = () => {

                const page =
                    button.dataset.page;

                if (!page) return;

                if (
                    page === "chat" &&
                    currentStudent?.permission ===
                    "deny"
                ) {

                    showToast(
                        "Chat permission is disabled.",
                        "🔒"
                    );

                    return;
                }


                if (
                    page === "groups" &&
                    currentStudent?.permission !==
                    "allow"
                ) {

                    showToast(
                        "Groups are available only with Allow permission.",
                        "🔒"
                    );

                    return;
                }


                showPage(page);
            };
        });


    $("mobileMenuBtn")?.addEventListener(
        "click",
        () => {

            $("sidebar")
                ?.classList.toggle(
                    "mobile-open"
                );
        }
    );


    $("logoutBtn")?.addEventListener(
        "click",
        logout
    );


    $("settingsLogoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


    $("headerProfileBtn")
        ?.addEventListener(
            "click",
            () => showPage("settings")
        );


    $("openOwnerPanelBtn")
        ?.addEventListener(
            "click",
            openOwnerPanel
        );


    $("closeOwnerPanelBtn")
        ?.addEventListener(
            "click",
            () => showPage("settings")
        );


    setupSettingsControls();

    setupOwnerControls();

    setupChatControls();

    setupGroupControls();
}


function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove(
                "active-page"
            );
        });


    const target =
        $(`page-${page}`);

    if (target) {

        target.classList.add(
            "active-page"
        );
    }


    document
        .querySelectorAll(
            ".nav-item, .bottom-nav-item, .feature-card"
        )
        .forEach(element => {

            element.classList.toggle(
                "active",
                element.dataset.page === page
            );
        });


    $("sidebar")
        ?.classList.remove(
            "mobile-open"
        );


    if (page === "chat") {

        loadStudents();
    }

    if (page === "groups") {

        loadGroups();
    }

    if (page === "homework") {

        loadHomework();
    }

    if (page === "school") {

        loadSchoolUpdates();
    }

    if (page === "notes") {

        loadNotes();
    }
}


/* =========================================================
   SETTINGS CONTROLS
   ========================================================= */

function setupSettingsControls() {

    $("languageSelect")
        ?.addEventListener(
            "change",
            async event => {

                const language =
                    event.target.value;

                applyLanguage(language);

                if (isOwner) {

                    await saveGlobalSettings({
                        language
                    });

                } else {

                    showToast(
                        "Language is controlled globally by Owner.",
                        "🌐"
                    );
                }
            }
        );


    $("themeSelect")
        ?.addEventListener(
            "change",
            async event => {

                const theme =
                    event.target.value;

                applyTheme(theme);

                if (isOwner) {

                    await saveGlobalSettings({
                        theme
                    });

                } else {

                    showToast(
                        "Theme is controlled globally by Owner.",
                        "🎨"
                    );
                }
            }
        );


    $("notificationToggle")
        ?.addEventListener(
            "change",
            event => {

                localStorage.setItem(
                    "studyNotifications",
                    event.target.checked
                );
            }
        );
}


/* =========================================================
   SAVE GLOBAL SETTINGS
   ========================================================= */

async function saveGlobalSettings(
    updates
) {

    if (!isOwner) {

        showToast(
            "Only Owner can change global settings.",
            "🔒"
        );

        return;
    }


    try {

        await setDoc(
            doc(
                db,
                "appSettings",
                "main"
            ),
            updates,
            { merge: true }
        );


        showToast(
            "Global settings saved for everyone.",
            "🌐"
        );


        await logActivity(
            "Updated global settings"
        );


    } catch (error) {

        console.error(
            "Global settings save error:",
            error
        );

        showToast(
            "Settings save नहीं हुए।",
            "❌"
        );
    }
}


/* =========================================================
   OWNER PANEL
   ========================================================= */

function openOwnerPanel() {

    if (!isOwner) {

        showToast(
            "Owner access denied.",
            "🔒"
        );

        return;
    }

    showPage("owner");

    loadOwnerDashboard();

    loadOwnerStudents();

    loadOwnerApprovals();

    loadOwnerGroups();

    loadOwnerContent();

    loadOwnerSettings();

    loadOwnerActivity();
}


/* =========================================================
   OWNER CONTROLS
   ========================================================= */

function setupOwnerControls() {

    document
        .querySelectorAll(
            ".owner-tab"
        )
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    if (!isOwner) return;

                    document
                        .querySelectorAll(
                            ".owner-tab"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    tab.classList.add(
                        "active"
                    );


                    const section =
                        tab.dataset.ownerSection;


                    document
                        .querySelectorAll(
                            ".owner-section"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );


                    const target =
                        $(
                            `ownerSection-${section}`
                        );

                    target?.classList.add(
                        "active"
                    );
                }
            );
        });


    $("saveGlobalSettingsBtn")
        ?.addEventListener(
            "click",
            saveOwnerAppearance
        );


    $("saveFeatureSettingsBtn")
        ?.addEventListener(
            "click",
            saveOwnerFeatures
        );


    $("changeOwnerPasswordBtn")
        ?.addEventListener(
            "click",
            changeAppPassword
        );


    $("ownerStudentSearch")
        ?.addEventListener(
            "input",
            filterOwnerStudents
        );


    $("ownerAddHomeworkBtn")
        ?.addEventListener(
            "click",
            openHomeworkAdminModal
        );


    $("ownerAddNoteBtn")
        ?.addEventListener(
            "click",
            openNoteAdminModal
        );


    $("ownerAddAnnouncementBtn")
        ?.addEventListener(
            "click",
            openAnnouncementAdminModal
        );
}


/* =========================================================
   OWNER APPEARANCE
   ========================================================= */

async function saveOwnerAppearance() {

    if (!isOwner) return;

    const appName =
        $("ownerAppName")?.value.trim() ||
        "StudyConnect";

    const language =
        $("ownerGlobalLanguage")?.value ||
        "en";

    const theme =
        $("ownerGlobalTheme")?.value ||
        "system";

    const welcomeAnimation =
        $("ownerWelcomeAnimation")?.value ||
        "on";


    await saveGlobalSettings({

        appName,
        language,
        theme,
        welcomeAnimation
    });
}


/* =========================================================
   OWNER FEATURES
   ========================================================= */

async function saveOwnerFeatures() {

    if (!isOwner) return;

    const features = {

        chat:
            $("featureChat")?.checked ?? true,

        groups:
            $("featureGroups")?.checked ?? true,

        homework:
            $("featureHomework")?.checked ?? true,

        notes:
            $("featureNotes")?.checked ?? true,

        announcements:
            $("featureAnnouncements")
                ?.checked ?? true,

        registration:
            $("featureRegistration")
                ?.checked ?? true,

        maintenance:
            $("featureMaintenance")
                ?.checked ?? false
    };


    await saveGlobalSettings({
        features
    });
}


/* =========================================================
   OWNER LOAD SETTINGS
   ========================================================= */

function loadOwnerSettings() {

    if (!isOwner) return;

    $("ownerAppName").value =
        currentSettings.appName ||
        "StudyConnect";

    $("ownerGlobalLanguage").value =
        currentSettings.language ||
        "en";

    $("ownerGlobalTheme").value =
        currentSettings.theme ||
        "system";

    $("ownerWelcomeAnimation").value =
        currentSettings.welcomeAnimation ||
        "on";


    const features =
        currentSettings.features || {};


    if ($("featureChat")) {
        $("featureChat").checked =
            features.chat !== false;
    }

    if ($("featureGroups")) {
        $("featureGroups").checked =
            features.groups !== false;
    }

    if ($("featureHomework")) {
        $("featureHomework").checked =
            features.homework !== false;
    }

    if ($("featureNotes")) {
        $("featureNotes").checked =
            features.notes !== false;
    }

    if ($("featureAnnouncements")) {
        $("featureAnnouncements").checked =
            features.announcements !== false;
    }

    if ($("featureRegistration")) {
        $("featureRegistration").checked =
            features.registration !== false;
    }

    if ($("featureMaintenance")) {
        $("featureMaintenance").checked =
            features.maintenance === true;
    }
}


/* =========================================================
   OWNER DASHBOARD
   ========================================================= */

async function loadOwnerDashboard() {

    if (!isOwner) return;

    try {

        const students =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );

        const messages =
            await getDocs(
                collection(
                    db,
                    "messages"
                )
            );

        const groups =
            await getDocs(
                collection(
                    db,
                    "groups"
                )
            );

        const homework =
            await getDocs(
                collection(
                    db,
                    "homework"
                )
            );


        let online = 0;
        let pending = 0;


        students.forEach(item => {

            const data =
                item.data();

            if (data.online === true) {
                online++;
            }

            if (
                data.status ===
                "pending"
            ) {
                pending++;
            }
        });


        $("ownerTotalStudents")
            .textContent =
            students.size;

        $("ownerOnlineStudents")
            .textContent =
            online;

        $("ownerPendingStudents")
            .textContent =
            pending;

        $("ownerTotalMessages")
            .textContent =
            messages.size;

        $("ownerTotalGroups")
            .textContent =
            groups.size;

        $("ownerTotalHomework")
            .textContent =
            homework.size;


    } catch (error) {

        console.error(
            "Owner dashboard error:",
            error
        );
    }
}


/* =========================================================
   LOAD STUDENTS
   ========================================================= */

async function loadStudents() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );


        const list =
            $("chatPeopleList");

        if (!list) return;

        list.innerHTML = "";


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty-state">
                    No students found.
                </div>`;

            return;
        }


        snapshot.forEach(item => {

            const data =
                item.data();

            if (
                item.id ===
                getProfileId()
            ) {
                return;
            }


            if (
                data.status ===
                "blocked"
            ) {
                return;
            }


            const element =
                document.createElement(
                    "button"
                );

            element.type =
                "button";

            element.className =
                "chat-person-item";


            const name =
                data.name ||
                "Student";

            const initial =
                name
                    .charAt(0)
                    .toUpperCase();


            element.innerHTML = `

                <div class="person-avatar">
                    ${escapeHTML(initial)}
                </div>

                <div class="person-info">

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <small>
                        ${data.online === true
                            ? "🟢 Online"
                            : "Offline"}
                    </small>

                </div>
            `;


            element.addEventListener(
                "click",
                () => {

                    selectedChatPerson = {

                        id: item.id,
                        ...data
                    };

                    openChatPerson();
                }
            );


            list.appendChild(
                element
            );
        });


    } catch (error) {

        console.error(
            "Students load error:",
            error
        );
    }
}


/* =========================================================
   CHAT
   ========================================================= */

function setupChatControls() {

    $("chatSearchBtn")
        ?.addEventListener(
            "click",
            () => {

                $("chatSearchBox")
                    ?.classList.toggle(
                        "hidden"
                    );
            }
        );


    $("chatSearchInput")
        ?.addEventListener(
            "input",
            filterChatPeople
        );
}


function filterChatPeople(event) {

    const search =
        event.target.value
            .trim()
            .toLowerCase();

    document
        .querySelectorAll(
            ".chat-person-item"
        )
        .forEach(item => {

            item.style.display =
                item.textContent
                    .toLowerCase()
                    .includes(search)
                        ? ""
                        : "none";
        });
}


/* =========================================================
   OPEN CHAT PERSON
   ========================================================= */

function openChatPerson() {

    if (!selectedChatPerson) return;

    const person =
        selectedChatPerson;

    const chatWindow =
        $("chatWindow");

    if (!chatWindow) return;


    const name =
        person.name ||
        "Student";

    const initial =
        name
            .charAt(0)
            .toUpperCase();


    chatWindow.innerHTML = `

        <div class="chat-header">

            <button
                id="backFromChat"
                class="icon-btn mobile-chat-back"
                type="button"
            >
                ←
            </button>

            <div class="person-avatar">
                ${escapeHTML(initial)}
            </div>

            <div class="chat-header-info">

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <small>
                    ${
                        person.online === true
                            ? "🟢 Online"
                            : "Offline"
                    }
                </small>

            </div>

            <button
                id="chatProfileBtn"
                class="icon-btn"
                type="button"
            >
                ⋮
            </button>

        </div>


        <div
            id="chatMessages"
            class="chat-messages"
        >

            <div class="empty-state">
                Loading messages...
            </div>

        </div>


        <div class="chat-input-area">

            <button
                id="emojiBtn"
                class="emoji-btn"
                type="button"
            >
                😊
            </button>

            <input
                id="messageInput"
                type="text"
                placeholder="Type a message..."
                maxlength="2000"
                autocomplete="off"
            />

            <button
                id="sendMessageBtn"
                class="send-btn"
                type="button"
            >
                ➤
            </button>

        </div>
    `;


    $("backFromChat")
        ?.addEventListener(
            "click",
            () => {

                chatWindow.innerHTML = `
                    <div class="chat-empty">
                        <div class="chat-empty-icon">
                            💬
                        </div>
                        <h2>
                            Select a person
                        </h2>
                        <p>
                            Select a student to start chatting.
                        </p>
                    </div>
                `;
            }
        );


    $("emojiBtn")
        ?.addEventListener(
            "click",
            openEmojiPicker
        );


    $("sendMessageBtn")
        ?.addEventListener(
            "click",
            sendMessage
        );


    $("messageInput")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );


    loadChatMessages();
}


/* =========================================================
   CHAT ID
   ========================================================= */

function createChatId(
    firstId,
    secondId
) {

    return [
        firstId,
        secondId
    ]
        .sort()
        .join("_");
}


/* =========================================================
   LOAD CHAT MESSAGES
   ========================================================= */

function loadChatMessages() {

    if (!selectedChatPerson) return;

    const myId =
        getProfileId();

    const otherId =
        selectedChatPerson.id;

    const chatId =
        createChatId(
            myId,
            otherId
        );


    if (unsubscribeMessages) {
        unsubscribeMessages();
    }


    const chatMessages =
        $("chatMessages");

    if (!chatMessages) return;


    const messagesQuery =
        query(
            collection(
                db,
                "messages"
            ),
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
            messagesQuery,
            snapshot => {

                chatMessages.innerHTML = "";

                let previousDate = "";


                if (snapshot.empty) {

                    chatMessages.innerHTML =
                        `<div class="chat-empty-inline">
                            <div>👋</div>
                            <p>Start your conversation.</p>
                        </div>`;

                    return;
                }


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();

                        const mine =
                            data.senderId ===
                            myId;


                        const currentDate =
                            formatDateOnly(
                                data.createdAt
                            );


                        if (
                            currentDate &&
                            currentDate !==
                            previousDate
                        ) {

                            const dateSeparator =
                                document.createElement(
                                    "div"
                                );

                            dateSeparator.className =
                                "chat-date-separator";

                            dateSeparator.textContent =
                                currentDate;

                            chatMessages.appendChild(
                                dateSeparator
                            );

                            previousDate =
                                currentDate;
                        }


                        const bubble =
                            document.createElement(
                                "div"
                            );


                        /*
                           User requested:
                           SENT = LEFT
                           RECEIVED = RIGHT
                        */

                        bubble.className =
                            mine
                                ? "message-bubble sent"
                                : "message-bubble received";


                        const ticks =
                            mine
                                ? getMessageTicks(
                                    data,
                                    myId
                                )
                                : "";


                        bubble.innerHTML = `

                            <div class="message-text">
                                ${escapeHTML(
                                    data.text || ""
                                )}
                            </div>

                            <div class="message-meta">

                                <span>
                                    ${escapeHTML(
                                        formatTime(
                                            data.createdAt
                                        )
                                    )}
                                </span>

                                ${ticks}

                            </div>
                        `;


                        chatMessages.appendChild(
                            bubble
                        );


                        if (!mine) {

                            markMessageSeen(
                                item.id,
                                data
                            );
                        }
                    }
                );


                chatMessages.scrollTop =
                    chatMessages.scrollHeight;
            },
            error => {

                console.error(
                    "Chat listener error:",
                    error
                );

                chatMessages.innerHTML =
                    `<div class="empty-state">
                        Chat load नहीं हो पाया।
                    </div>`;
            }
        );
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    const input =
        $("messageInput");

    if (!input) return;

    const text =
        input.value.trim();

    if (!text) return;


    if (!selectedChatPerson) {

        showToast(
            "पहले किसी student को select करें।",
            "💬"
        );

        return;
    }


    if (
        currentStudent?.permission ===
        "deny"
    ) {

        showToast(
            "Chat permission disabled.",
            "🔒"
        );

        return;
    }


    const senderId =
        getProfileId();

    const receiverId =
        selectedChatPerson.id;


    const chatId =
        createChatId(
            senderId,
            receiverId
        );


    try {

        await addDoc(
            collection(
                db,
                "messages"
            ),
            {

                chatId,

                senderId,

                receiverId,

                senderName:
                    currentStudent?.name ||
                    getUserName(),

                receiverName:
                    selectedChatPerson.name ||
                    "Student",

                text,

                createdAt:
                    serverTimestamp(),

                delivered:
                    false,

                seenBy: []
            }
        );


        input.value = "";

        input.focus();


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        showToast(
            "Message send नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   MESSAGE TICKS
   ========================================================= */

function getMessageTicks(
    data,
    myId
) {

    if (
        Array.isArray(
            data.seenBy
        ) &&
        data.seenBy.includes(
            data.receiverId
        )
    ) {

        return `
            <span
                class="message-ticks blue-ticks"
                title="Seen"
            >
                ✓✓
            </span>
        `;
    }


    if (
        data.delivered === true
    ) {

        return `
            <span
                class="message-ticks"
                title="Delivered"
            >
                ✓✓
            </span>
        `;
    }


    return `
        <span
            class="message-ticks"
            title="Sent"
        >
            ✓
        </span>
    `;
}


/* =========================================================
   MARK MESSAGE SEEN
   ========================================================= */

async function markMessageSeen(
    messageId,
    data
) {

    const myId =
        getProfileId();

    if (
        !data ||
        data.senderId === myId
    ) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "messages",
                messageId
            ),
            {

                delivered: true,

                seenBy:
                    arrayUnion(
                        myId
                    )
            }
        );

    } catch (error) {

        console.error(
            "Seen update error:",
            error
        );
    }
}


/* =========================================================
   EMOJI PICKER
   ========================================================= */

function openEmojiPicker() {

    const input =
        $("messageInput");

    if (!input) return;


    const emojis = [
        "😀",
        "😂",
        "😊",
        "😍",
        "🥰",
        "😎",
        "👍",
        "👏",
        "❤️",
        "🔥",
        "🎉",
        "🙏",
        "💯",
        "📚",
        "✏️",
        "🏫"
    ];


    let picker =
        $("emojiPicker");


    if (!picker) {

        picker =
            document.createElement(
                "div"
            );

        picker.id =
            "emojiPicker";

        picker.className =
            "emoji-picker";


        emojis.forEach(
            emoji => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.textContent =
                    emoji;

                button.addEventListener(
                    "click",
                    () => {

                        input.value +=
                            emoji;

                        input.focus();

                        picker.classList.add(
                            "hidden"
                        );
                    }
                );

                picker.appendChild(
                    button
                );
            }
        );


        document.body.appendChild(
            picker
        );
    }


    const rect =
        $("emojiBtn")
            ?.getBoundingClientRect();


    if (rect) {

        picker.style.position =
            "fixed";

        picker.style.left =
            `${rect.left}px`;

        picker.style.bottom =
            `${window.innerHeight - rect.top + 8}px`;
    }


    picker.classList.toggle(
        "hidden"
    );
}


/* =========================================================
   GROUP CONTROLS
   ========================================================= */

function setupGroupControls() {

    $("createGroupBtn")
        ?.addEventListener(
            "click",
            openGroupModal
        );


    $("closeGroupModalBtn")
        ?.addEventListener(
            "click",
            closeGroupModal
        );


    $("groupForm")
        ?.addEventListener(
            "submit",
            createPrivateGroup
        );


    $("groupMemberSearch")
        ?.addEventListener(
            "input",
            searchGroupMember
        );
}


/* =========================================================
   GROUP MODAL
   ========================================================= */

function openGroupModal() {

    if (
        currentStudent?.permission !==
        "allow"
    ) {

        showToast(
            "Groups require Allow permission.",
            "🔒"
        );

        return;
    }


    selectedGroupMembers = [];

    renderSelectedGroupMembers();

    $("groupModal")
        ?.classList.remove(
            "hidden"
        );
}


function closeGroupModal() {

    $("groupModal")
        ?.classList.add(
            "hidden"
        );
}


async function searchGroupMember() {

    const input =
        $("groupMemberSearch");

    const result =
        $("groupMemberResults");

    if (!input || !result) return;


    const phone =
        input.value
            .replace(/\D/g, "")
            .trim();


    result.innerHTML = "";


    if (phone.length < 10) return;


    try {

        const q =
            query(
                collection(
                    db,
                    "students"
                ),
                where(
                    "phone",
                    "==",
                    phone
                )
            );


        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            result.innerHTML =
                `<div class="empty-state">
                    Student not found.
                </div>`;

            return;
        }


        snapshot.forEach(
            item => {

                const data =
                    item.data();


                if (
                    item.id ===
                    getProfileId()
                ) {
                    return;
                }


                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "member-result";


                button.innerHTML = `
                    <strong>
                        ${escapeHTML(
                            data.name ||
                            "Student"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            data.phone ||
                            ""
                        )}
                    </small>
                `;


                button.addEventListener(
                    "click",
                    () => {

                        if (
                            !selectedGroupMembers
                                .some(
                                    member =>
                                        member.id ===
                                        item.id
                                )
                        ) {

                            selectedGroupMembers.push(
                                {
                                    id: item.id,
                                    name:
                                        data.name,
                                    phone:
                                        data.phone
                                }
                            );
                        }


                        renderSelectedGroupMembers();

                        input.value = "";

                        result.innerHTML = "";
                    }
                );


                result.appendChild(
                    button
                );
            }
        );


    } catch (error) {

        console.error(
            "Group member search error:",
            error
        );
    }
}


function renderSelectedGroupMembers() {

    const box =
        $("selectedGroupMembers");

    if (!box) return;


    box.innerHTML = "";


    if (
        selectedGroupMembers.length ===
        0
    ) {

        box.innerHTML =
            `<span class="empty-selection">
                No members selected.
            </span>`;

        return;
    }


    selectedGroupMembers.forEach(
        member => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "selected-member";


            item.innerHTML = `

                <span>
                    ${escapeHTML(
                        member.name
                    )}
                </span>

                <button
                    type="button"
                    aria-label="Remove"
                >
                    ✕
                </button>
            `;


            item
                .querySelector("button")
                .addEventListener(
                    "click",
                    () => {

                        selectedGroupMembers =
                            selectedGroupMembers
                                .filter(
                                    person =>
                                        person.id !==
                                        member.id
                                );

                        renderSelectedGroupMembers();
                    }
                );


            box.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   CREATE PRIVATE GROUP
   ========================================================= */

async function createPrivateGroup(
    event
) {

    event.preventDefault();


    const name =
        $("groupNameInput")
            ?.value.trim();

    const password =
        $("groupPasswordInput")
            ?.value;


    if (!name) {

        showToast(
            "Group name लिखें।",
            "⚠️"
        );

        return;
    }


    if (!password || password.length < 4) {

        showToast(
            "Group password कम से कम 4 characters का रखें।",
            "🔐"
        );

        return;
    }


    try {

        const creatorId =
            getProfileId();


        const memberIds = [
            creatorId,

            ...selectedGroupMembers.map(
                member =>
                    member.id
            )
        ];


        const memberDetails = [
            {
                id: creatorId,
                name:
                    currentStudent?.name ||
                    getUserName(),
                phone:
                    currentStudent?.phone ||
                    getUserPhone()
            },

            ...selectedGroupMembers
        ];


        const passwordHash =
            await sha256(password);


        const groupRef =
            await addDoc(
                collection(
                    db,
                    "groups"
                ),
                {

                    name,

                    creatorId,

                    creatorName:
                        currentStudent?.name ||
                        getUserName(),

                    members:
                        memberIds,

                    memberDetails,

                    passwordHash,

                    createdAt:
                        serverTimestamp(),

                    disabled:
                        false
                }
            );


        await updateDoc(
            doc(
                db,
                "students",
                creatorId
            ),
            {

                groups:
                    arrayUnion(
                        groupRef.id
                    )
            }
        );


        closeGroupModal();

        $("groupForm")
            ?.reset();


        showToast(
            "Private group created.",
            "👥"
        );


        await logActivity(
            `Created group: ${name}`
        );


        await loadGroups();


    } catch (error) {

        console.error(
            "Create group error:",
            error
        );

        showToast(
            "Group create नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   LOAD GROUPS
   ========================================================= */

async function loadGroups() {

    const list =
        $("groupsList");

    if (!list) return;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "groups"
                )
            );


        list.innerHTML = "";


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty-state">
                    No groups available.
                </div>`;

            return;
        }


        const myId =
            getProfileId();


        snapshot.forEach(
            item => {

                const data =
                    item.data();


                const members =
                    Array.isArray(
                        data.members
                    )
                        ? data.members
                        : [];


                if (
                    !members.includes(
                        myId
                    )
                ) {
                    return;
                }


                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "group-card";


                card.innerHTML = `

                    <div class="group-icon">
                        👥
                    </div>

                    <div class="group-card-content">

                        <h3>
                            ${escapeHTML(
                                data.name ||
                                "Group"
                            )}
                        </h3>

                        <p>
                            👤 ${members.length} members
                        </p>

                        <small>
                            Created by
                            ${escapeHTML(
                                datadata.creatorName ||
                                "Student"
                            )}
                        </small>

                    </div>
                `;

                list.appendChild(card);

            }
        );

    } catch (error) {

        console.error(
            "Groups load error:",
            error
        );

        list.innerHTML =
            `<div class="empty-state">
                Groups load नहीं हो पाए।
            </div>`;
    }
}


/* =========================================================
   HOMEWORK
   ========================================================= */

async function loadHomework() {

    const list =
        $("homeworkList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "homework"
                )
            );

        list.innerHTML = "";

        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty-state">
                    No homework available.
                </div>`;

            return;
        }

        snapshot.forEach(item => {

            const data =
                item.data();

            if (data.published === false) {
                return;
            }

            const card =
                document.createElement("article");

            card.className =
                "content-card";

            card.innerHTML = `

                <div class="content-card-icon">
                    📚
                </div>

                <div class="content-card-body">

                    <h3>
                        ${escapeHTML(
                            data.title ||
                            "Homework"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            data.description ||
                            ""
                        )}
                    </p>

                    <div class="content-meta">

                        <span>
                            ${escapeHTML(
                                data.subject ||
                                ""
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                data.chapter ||
                                ""
                            )}
                        </span>

                        <span>
                            ${formatDateTime(
                                data.createdAt
                            )}
                        </span>

                    </div>

                </div>
            `;

            list.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Homework load error:",
            error
        );

        list.innerHTML =
            `<div class="empty-state">
                Homework load नहीं हो पाया।
            </div>`;
    }
}


/* =========================================================
   SCHOOL UPDATES
   ========================================================= */

async function loadSchoolUpdates() {

    const list =
        $("schoolUpdatesList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "school"
                )
            );

        list.innerHTML = "";

        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty-state">
                    No school updates available.
                </div>`;

            return;
        }

        snapshot.forEach(item => {

            const data =
                item.data();

            if (data.published === false) {
                return;
            }

            const card =
                document.createElement("article");

            card.className =
                "content-card announcement-card";

            card.innerHTML = `

                <div class="content-card-icon">
                    📢
                </div>

                <div class="content-card-body">

                    <h3>
                        ${escapeHTML(
                            data.title ||
                            "School Update"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            data.description ||
                            data.text ||
                            ""
                        )}
                    </p>

                    <div class="content-meta">

                        <span>
                            ${formatDateTime(
                                data.createdAt
                            )}
                        </span>

                    </div>

                </div>
            `;

            list.appendChild(card);
        });

    } catch (error) {

        console.error(
            "School updates error:",
            error
        );

        list.innerHTML =
            `<div class="empty-state">
                School updates load नहीं हो पाए।
            </div>`;
    }
}


/* =========================================================
   NOTES
   ========================================================= */

async function loadNotes() {

    const list =
        $("notesList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "notes"
                )
            );

        list.innerHTML = "";

        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty-state">
                    No notes available.
                </div>`;

            return;
        }

        snapshot.forEach(item => {

            const data =
                item.data();

            if (data.published === false) {
                return;
            }

            const card =
                document.createElement("article");

            card.className =
                "content-card";

            card.innerHTML = `

                <div class="content-card-icon">
                    📝
                </div>

                <div class="content-card-body">

                    <h3>
                        ${escapeHTML(
                            data.title ||
                            "Note"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            data.description ||
                            data.text ||
                            ""
                        )}
                    </p>

                    <div class="content-meta">

                        <span>
                            ${escapeHTML(
                                data.subject ||
                                ""
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                data.chapter ||
                                ""
                            )}
                        </span>

                    </div>

                </div>
            `;

            list.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Notes load error:",
            error
        );

        list.innerHTML =
            `<div class="empty-state">
                Notes load नहीं हो पाए।
            </div>`;
    }
}


/* =========================================================
   LOAD ALL CONTENT
   ========================================================= */

async function loadAllContent() {

    await Promise.allSettled([
        loadHomework(),
        loadSchoolUpdates(),
        loadNotes(),
        loadGroups()
    ]);
}


/* =========================================================
   OWNER STUDENTS
   ========================================================= */

let ownerStudentsCache = [];


async function loadOwnerStudents() {

    if (!isOwner) return;

    const list =
        $("ownerStudentsList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );

        ownerStudentsCache = [];

        snapshot.forEach(item => {

            ownerStudentsCache.push({
                id: item.id,
                ...item.data()
            });

        });

        renderOwnerStudents(
            ownerStudentsCache
        );

    } catch (error) {

        console.error(
            "Owner students error:",
            error
        );
    }
}


/* =========================================================
   RENDER OWNER STUDENTS
   ========================================================= */

function renderOwnerStudents(students) {

    const list =
        $("ownerStudentsList");

    if (!list) return;

    list.innerHTML = "";

    if (!students.length) {

        list.innerHTML =
            `<div class="empty-state">
                No students found.
            </div>`;

        return;
    }

    students.forEach(student => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "owner-student-item";

        const name =
            student.name ||
            "Student";

        const initial =
            name
                .charAt(0)
                .toUpperCase();

        button.innerHTML = `

            <div class="person-avatar">
                ${escapeHTML(initial)}
            </div>

            <div class="person-info">

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <small>
                    ${escapeHTML(
                        student.phone ||
                        ""
                    )}
                </small>

            </div>

            <span class="status-dot ${
                student.online
                    ? "online"
                    : ""
            }"></span>
        `;

        button.addEventListener(
            "click",
            () => {

                selectedOwnerPerson =
                    student;

                renderOwnerStudentDetails(
                    student
                );
            }
        );

        list.appendChild(button);
    });
}


/* =========================================================
   OWNER STUDENT SEARCH
   ========================================================= */

function filterOwnerStudents(event) {

    const search =
        event.target.value
            .trim()
            .toLowerCase();

    const filtered =
        ownerStudentsCache.filter(
            student => {

                return (
                    String(
                        student.name || ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        student.phone || ""
                    )
                    .includes(search)
                );
            }
        );

    renderOwnerStudents(filtered);
}


/* =========================================================
   OWNER STUDENT DETAILS
   ========================================================= */

function renderOwnerStudentDetails(student) {

    const box =
        $("ownerStudentDetails");

    if (!box) return;

    const name =
        student.name ||
        "Student";

    const permission =
        student.permission ||
        "normal";

    const followers =
        Array.isArray(
            student.followers
        )
            ? student.followers.length
            : 0;

    const following =
        Array.isArray(
            student.following
        )
            ? student.following.length
            : 0;

    const groups =
        Array.isArray(
            student.groups
        )
            ? student.groups.length
            : 0;

    box.innerHTML = `

        <div class="owner-profile-header">

            <div class="large-avatar">
                ${escapeHTML(
                    name.charAt(0).toUpperCase()
                )}
            </div>

            <div>

                <h2>
                    ${escapeHTML(name)}
                </h2>

                <p>
                    ${escapeHTML(
                        student.phone || ""
                    )}
                </p>

            </div>

        </div>

        <div class="owner-follow-stats">

            <div class="follow-stat">
                <strong>
                    ${followers}
                </strong>
                <span>
                    Followers
                </span>
            </div>

            <div class="follow-stat">
                <strong>
                    ${following}
                </strong>
                <span>
                    Following
                </span>
            </div>

            <div class="follow-stat">
                <strong>
                    ${groups}
                </strong>
                <span>
                    Groups
                </span>
            </div>

        </div>

        <div class="owner-detail-grid">

            <div>
                <small>Status</small>
                <strong>
                    ${escapeHTML(
                        student.status ||
                        "pending"
                    )}
                </strong>
            </div>

            <div>
                <small>Permission</small>
                <strong>
                    ${escapeHTML(permission)}
                </strong>
            </div>

            <div>
                <small>Joined</small>
                <strong>
                    ${escapeHTML(
                        formatDateTime(
                            student.joinedAt
                        )
                    )}
                </strong>
            </div>

            <div>
                <small>Last Seen</small>
                <strong>
                    ${escapeHTML(
                        formatDateTime(
                            student.lastSeen
                        )
                    )}
                </strong>
            </div>

        </div>

        <div class="owner-actions">

            <button
                type="button"
                class="owner-action-btn"
                id="approveStudentBtn"
            >
                ✓ Approve
            </button>

            <button
                type="button"
                class="owner-action-btn"
                id="blockStudentBtn"
            >
                🔒 Block
            </button>

            <button
                type="button"
                class="owner-action-btn"
                id="removeStudentBtn"
            >
                🗑 Remove
            </button>

        </div>

        <div class="permission-box">

            <h3>
                Student Permission
            </h3>

            <p>
                Choose what this student can use.
            </p>

            <select id="studentPermissionSelect">

                <option value="deny">
                    Don't Allow
                </option>

                <option value="normal">
                    Normal
                </option>

                <option value="allow">
                    Allow
                </option>

            </select>

            <button
                type="button"
                id="saveStudentPermissionBtn"
                class="primary-btn"
            >
                Save Permission
            </button>

        </div>
    `;

    $("studentPermissionSelect")
        .value = permission;

    $("approveStudentBtn")
        ?.addEventListener(
            "click",
            () =>
                updateStudentStatus(
                    student.id,
                    "approved"
                )
        );

    $("blockStudentBtn")
        ?.addEventListener(
            "click",
            () =>
                updateStudentStatus(
                    student.id,
                    "blocked"
                )
        );

    $("removeStudentBtn")
        ?.addEventListener(
            "click",
            () =>
                removeStudent(
                    student.id
                )
        );

    $("saveStudentPermissionBtn")
        ?.addEventListener(
            "click",
            () =>
                saveStudentPermission(
                    student.id
                )
        );
}


/* =========================================================
   UPDATE STUDENT STATUS
   ========================================================= */

async function updateStudentStatus(
    studentId,
    status
) {

    if (!isOwner) return;

    try {

        await updateDoc(
            doc(
                db,
                "students",
                studentId
            ),
            {
                status
            }
        );

        showToast(
            `Student status: ${status}`,
            "✓"
        );

        await logActivity(
            `Changed student ${studentId} status to ${status}`
        );

        await loadOwnerStudents();

        await loadOwnerApprovals();

        await loadOwnerDashboard();

    } catch (error) {

        console.error(
            "Student status error:",
            error
        );

        showToast(
            "Student status update नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   SAVE STUDENT PERMISSION
   ========================================================= */

async function saveStudentPermission(
    studentId
) {

    if (!isOwner) return;

    const permission =
        $("studentPermissionSelect")
            ?.value;

    if (!permission) return;

    try {

        await updateDoc(
            doc(
                db,
                "students",
                studentId
            ),
            {
                permission
            }
        );

        showToast(
            "Permission updated.",
            "✓"
        );

        await logActivity(
            `Changed permission for ${studentId} to ${permission}`
        );

        await loadOwnerStudents();

    } catch (error) {

        console.error(
            "Permission error:",
            error
        );

        showToast(
            "Permission save नहीं हुई।",
            "❌"
        );
    }
}


/* =========================================================
   REMOVE STUDENT
   ========================================================= */

async function removeStudent(studentId) {

    if (!isOwner) return;

    const confirmed =
        window.confirm(
            "क्या आप इस student को remove करना चाहते हैं?"
        );

    if (!confirmed) return;

    try {

        await deleteDoc(
            doc(
                db,
                "students",
                studentId
            )
        );

        showToast(
            "Student removed.",
            "🗑"
        );

        await logActivity(
            `Removed student ${studentId}`
        );

        await loadOwnerStudents();

        await loadOwnerDashboard();

    } catch (error) {

        console.error(
            "Remove student error:",
            error
        );

        showToast(
            "Student remove नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   OWNER APPROVALS
   ========================================================= */

async function loadOwnerApprovals() {

    if (!isOwner) return;

    const list =
        $("ownerApprovalsList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );

        list.innerHTML = "";

        let count = 0;

        snapshot.forEach(item => {

            const data =
                item.data();

            if (
                data.status !==
                "pending"
            ) {
                return;
            }

            count++;

            const card =
                document.createElement("div");

            card.className =
                "approval-card";

            card.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            data.name ||
                            "Student"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            data.phone ||
                            ""
                        )}
                    </small>

                </div>

                <div class="approval-actions">

                    <button
                        type="button"
                        class="approve-btn"
                    >
                        ✓ Approve
                    </button>

                    <button
                        type="button"
                        class="reject-btn"
                    >
                        ✕ Reject
                    </button>

                </div>
            `;

            card
                .querySelector(".approve-btn")
                ?.addEventListener(
                    "click",
                    () =>
                        updateStudentStatus(
                            item.id,
                            "approved"
                        )
                );

            card
                .querySelector(".reject-btn")
                ?.addEventListener(
                    "click",
                    () =>
                        updateStudentStatus(
                            item.id,
                            "rejected"
                        )
                );

            list.appendChild(card);
        });

        if (count === 0) {

            list.innerHTML =
                `<div class="empty-state">
                    No pending approvals.
                </div>`;
        }

    } catch (error) {

        console.error(
            "Approvals load error:",
            error
        );
    }
}


/* =========================================================
   OWNER GROUPS
   ========================================================= */

async function loadOwnerGroups() {

    if (!isOwner) return;

    const list =
        $("ownerGroupsList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "groups"
                )
            );

        list.innerHTML = "";

        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty-state">
                    No groups found.
                </div>`;

            return;
        }

        snapshot.forEach(item => {

            const data =
                item.data();

            const members =
                Array.isArray(
                    data.memberDetails
                )
                    ? data.memberDetails
                    : [];

            const card =
                document.createElement("div");

            card.className =
                "owner-group-card";

            card.innerHTML = `

                <div class="owner-group-header">

                    <div class="group-icon">
                        👥
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                data.name ||
                                "Group"
                            )}
                        </h3>

                        <small>
                            Creator:
                            ${escapeHTML(
                                data.creatorName ||
                                ""
                            )}
                        </small>

                    </div>

                </div>

                <p>
                    ${members.length} members
                </p>

                <div class="group-members-list">

                    ${members.map(member => `
                        <div class="group-member-line">

                            <span>
                                ${escapeHTML(
                                    member.name ||
                                    "Student"
                                )}
                            </span>

                            <small>
                                ${escapeHTML(
                                    member.phone ||
                                    ""
                                )}
                            </small>

                        </div>
                    `).join("")}

                </div>

                <button
                    type="button"
                    class="danger-btn disable-group-btn"
                >
                    ${data.disabled
                        ? "Enable Group"
                        : "Disable Group"}
                </button>
            `;

            card
                .querySelector(
                    ".disable-group-btn"
                )
                ?.addEventListener(
                    "click",
                    () =>
                        toggleGroupDisabled(
                            item.id,
                            data.disabled === true
                        )
                );

            list.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Owner groups error:",
            error
        );
    }
}


/* =========================================================
   DISABLE / ENABLE GROUP
   ========================================================= */

async function toggleGroupDisabled(
    groupId,
    currentlyDisabled
) {

    if (!isOwner) return;

    try {

        await updateDoc(
            doc(
                db,
                "groups",
                groupId
            ),
            {
                disabled:
                    !currentlyDisabled
            }
        );

        showToast(
            currentlyDisabled
                ? "Group enabled."
                : "Group disabled.",
            "👥"
        );

        await loadOwnerGroups();

    } catch (error) {

        console.error(
            "Group control error:",
            error
        );

        showToast(
            "Group update नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   OWNER CONTENT
   ========================================================= */

async function loadOwnerContent() {

    if (!isOwner) return;

    await Promise.allSettled([
        loadOwnerHomework(),
        loadOwnerNotes(),
        loadOwnerAnnouncements()
    ]);
}


/* =========================================================
   OWNER HOMEWORK
   ========================================================= */

async function loadOwnerHomework() {

    const list =
        $("ownerHomeworkList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "homework"
                )
            );

        list.innerHTML = "";

        snapshot.forEach(item => {

            const data =
                item.data();

            const card =
                document.createElement("div");

            card.className =
                "admin-content-item";

            card.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            data.title ||
                            "Homework"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            data.subject ||
                            ""
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="delete-content-btn"
                >
                    🗑
                </button>
            `;

            card
                .querySelector(
                    ".delete-content-btn"
                )
                ?.addEventListener(
                    "click",
                    () =>
                        deleteContent(
                            "homework",
                            item.id
                        )
                );

            list.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Owner homework error:",
            error
        );
    }
}


/* =========================================================
   OWNER NOTES
   ========================================================= */

async function loadOwnerNotes() {

    const list =
        $("ownerNotesList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "notes"
                )
            );

        list.innerHTML = "";

        snapshot.forEach(item => {

            const data =
                item.data();

            const card =
                document.createElement("div");

            card.className =
                "admin-content-item";

            card.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            data.title ||
                            "Note"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            data.subject ||
                            ""
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="delete-content-btn"
                >
                    🗑
                </button>
            `;

            card
                .querySelector(
                    ".delete-content-btn"
                )
                ?.addEventListener(
                    "click",
                    () =>
                        deleteContent(
                            "notes",
                            item.id
                        )
                );

            list.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Owner notes error:",
            error
        );
    }
}


/* =========================================================
   OWNER ANNOUNCEMENTS
   ========================================================= */

async function loadOwnerAnnouncements() {

    const list =
        $("ownerAnnouncementsList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "school"
                )
            );

        list.innerHTML = "";

        snapshot.forEach(item => {

            const data =
                item.data();

            const card =
                document.createElement("div");

            card.className =
                "admin-content-item";

            card.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            data.title ||
                            "Announcement"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            data.description ||
                            ""
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="delete-content-btn"
                >
                    🗑
                </button>
            `;

            card
                .querySelector(
                    ".delete-content-btn"
                )
                ?.addEventListener(
                    "click",
                    () =>
                        deleteContent(
                            "school",
                            item.id
                        )
                );

            list.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Owner announcements error:",
            error
        );
    }
}


/* =========================================================
   DELETE CONTENT
   ========================================================= */

async function deleteContent(
    collectionName,
    documentId
) {

    if (!isOwner) return;

    const confirmed =
        window.confirm(
            "क्या आप इसे delete करना चाहते हैं?"
        );

    if (!confirmed) return;

    try {

        await deleteDoc(
            doc(
                db,
                collectionName,
                documentId
            )
        );

        showToast(
            "Content deleted.",
            "🗑"
        );

        await logActivity(
            `Deleted ${collectionName}/${documentId}`
        );

        await loadOwnerContent();

        await loadAllContent();

    } catch (error) {

        console.error(
            "Delete content error:",
            error
        );

        showToast(
            "Delete नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   ADMIN MODALS
   ========================================================= */

function openHomeworkAdminModal() {

    const modal =
        $("homeworkAdminModal");

    if (!modal) return;

    modal.classList.remove("hidden");
}


function openNoteAdminModal() {

    const modal =
        $("noteAdminModal");

    if (!modal) return;

    modal.classList.remove("hidden");
}


function openAnnouncementAdminModal() {

    const modal =
        $("announcementAdminModal");

    if (!modal) return;

    modal.classList.remove("hidden");
}


/* =========================================================
   ADD CONTENT HELPERS
   ========================================================= */

async function addHomeworkFromForm(event) {

    event.preventDefault();

    if (!isOwner) return;

    const title =
        $("adminHomeworkTitle")
            ?.value.trim();

    const description =
        $("adminHomeworkDescription")
            ?.value.trim();

    const subject =
        $("adminHomeworkSubject")
            ?.value.trim();

    const chapter =
        $("adminHomeworkChapter")
            ?.value.trim();

    if (!title) return;

    try {

        await addDoc(
            collection(
                db,
                "homework"
            ),
            {
                title,
                description,
                subject,
                chapter,
                published: true,
                createdAt:
                    serverTimestamp()
            }
        );

        showToast(
            "Homework published.",
            "📚"
        );

        $("homeworkAdminForm")
            ?.reset();

        $("homeworkAdminModal")
            ?.classList.add(
                "hidden"
            );

        await loadOwnerHomework();
        await loadHomework();

    } catch (error) {

        console.error(
            "Add homework error:",
            error
        );

        showToast(
            "Homework save नहीं हुआ।",
            "❌"
        );
    }
}


async function addNoteFromForm(event) {

    event.preventDefault();

    if (!isOwner) return;

    const title =
        $("adminNoteTitle")
            ?.value.trim();

    const description =
        $("adminNoteDescription")
            ?.value.trim();

    const subject =
        $("adminNoteSubject")
            ?.value.trim();

    const chapter =
        $("adminNoteChapter")
            ?.value.trim();

    if (!title) return;

    try {

        await addDoc(
            collection(
                db,
                "notes"
            ),
            {
                title,
                description,
                subject,
                chapter,
                published: true,
                createdAt:
                    serverTimestamp()
            }
        );

        showToast(
            "Note published.",
            "📝"
        );

        $("noteAdminForm")
            ?.reset();

        $("noteAdminModal")
            ?.classList.add(
                "hidden"
            );

        await loadOwnerNotes();
        await loadNotes();

    } catch (error) {

        console.error(
            "Add note error:",
            error
        );

        showToast(
            "Note save नहीं हुआ।",
            "❌"
        );
    }
}


async function addAnnouncementFromForm(event) {

    event.preventDefault();

    if (!isOwner) return;

    const title =
        $("adminAnnouncementTitle")
            ?.value.trim();

    const description =
        $("adminAnnouncementDescription")
            ?.value.trim();

    if (!title) return;

    try {

        await addDoc(
            collection(
                db,
                "school"
            ),
            {
                title,
                description,
                published: true,
                createdAt:
                    serverTimestamp()
            }
        );

        showToast(
            "Announcement published.",
            "📢"
        );

        $("announcementAdminForm")
            ?.reset();

        $("announcementAdminModal")
            ?.classList.add(
                "hidden"
            );

        await loadOwnerAnnouncements();
        await loadSchoolUpdates();

    } catch (error) {

        console.error(
            "Announcement error:",
            error
        );

        showToast(
            "Announcement save नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   PASSWORD CHANGE
   ========================================================= */

async function changeAppPassword() {

    if (!isOwner) return;

    const newPassword =
        $("newOwnerPassword")
            ?.value || "";

    if (newPassword.length < 6) {

        showToast(
            "Password कम से कम 6 characters का रखें।",
            "🔐"
        );

        return;
    }

    try {

        const hash =
            await sha256(
                newPassword
            );

        await setDoc(
            doc(
                db,
                "appSettings",
                "main"
            ),
            {
                appPasswordHash: hash
            },
            {
                merge: true
            }
        );

        showToast(
            "App password updated.",
            "🔐"
        );

        if ($("newOwnerPassword")) {
            $("newOwnerPassword").value = "";
        }

        await logActivity(
            "Changed app password"
        );

    } catch (error) {

        console.error(
            "Password change error:",
            error
        );

        showToast(
            "Password change नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   ACTIVITY LOG
   ========================================================= */

async function logActivity(action) {

    try {

        await addDoc(
            collection(
                db,
                "activityLogs"
            ),
            {

                action,

                actorId:
                    getProfileId(),

                actorName:
                    currentStudent?.name ||
                    getUserName(),

                createdAt:
                    serverTimestamp()
            }
        );

    } catch (error) {

        console.error(
            "Activity log error:",
            error
        );
    }
}


/* =========================================================
   OWNER ACTIVITY
   ========================================================= */

async function loadOwnerActivity() {

    if (!isOwner) return;

    const list =
        $("ownerActivityList");

    if (!list) return;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "activityLogs"
                )
            );

        list.innerHTML = "";

        const logs =
            [];

        snapshot.forEach(item => {

            logs.push({
                id: item.id,
                ...item.data()
            });

        });

        logs.sort(
            (a, b) => {

                const aTime =
                    a.createdAt?.toMillis
                        ? a.createdAt.toMillis()
                        : 0;

                const bTime =
                    b.createdAt?.toMillis
                        ? b.createdAt.toMillis()
                        : 0;

                return bTime - aTime;
            }
        );

        logs.slice(0, 100)
            .forEach(log => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "activity-row";

                row.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHTML(
                                log.action ||
                                "Activity"
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                log.actorName ||
                                ""
                            )}
                        </small>

                    </div>

                    <time>
                        ${escapeHTML(
                            formatDateTime(
                                log.createdAt
                            )
                        )}
                    </time>
                `;

                list.appendChild(row);
            });

        if (!list.children.length) {

            list.innerHTML =
                `<div class="empty-state">
                    No activity yet.
                </div>`;
        }

    } catch (error) {

        console.error(
            "Activity load error:",
            error
        );
    }
}


/* =========================================================
   ONLINE STATUS
   ========================================================= */

async function updateStudentOnline(
    online
) {

    const id =
        getProfileId();

    if (!id) return;

    try {

        await updateDoc(
            doc(
                db,
                "students",
                id
            ),
            {

                online,

                lastSeen:
                    serverTimestamp()
            }
        );

    } catch (error) {

        console.error(
            "Online status error:",
            error
        );
    }
}


function startOnlineHeartbeat() {

    if (onlineHeartbeat) {
        clearInterval(
            onlineHeartbeat
        );
    }

    updateStudentOnline(true);

    onlineHeartbeat =
        setInterval(
            () => {

                updateStudentOnline(
                    true
                );

            },
            30000
        );
}


function stopOnlineHeartbeat() {

    if (onlineHeartbeat) {

        clearInterval(
            onlineHeartbeat
        );

        onlineHeartbeat = null;
    }

    updateStudentOnline(false);
}


/* =========================================================
   FOLLOW SYSTEM
   ========================================================= */

async function toggleFollow(
    targetStudentId
) {

    const myId =
        getProfileId();

    if (!myId || !targetStudentId) {
        return;
    }

    if (myId === targetStudentId) {
        return;
    }

    try {

        const myRef =
            doc(
                db,
                "students",
                myId
            );

        const targetRef =
            doc(
                db,
                "students",
                targetStudentId
            );

        const mySnap =
            await getDoc(myRef);

        const targetSnap =
            await getDoc(targetRef);

        if (
            !mySnap.exists() ||
            !targetSnap.exists()
        ) {
            return;
        }

        const myData =
            mySnap.data();

        const following =
            Array.isArray(
                myData.following
            )
                ? myData.following
                : [];

        const alreadyFollowing =
            following.includes(
                targetStudentId
            );

        if (alreadyFollowing) {

            await updateDoc(
                myRef,
                {
                    following:
                        arrayRemove(
                            targetStudentId
                        )
                }
            );

            await updateDoc(
                targetRef,
                {
                    followers:
                        arrayRemove(
                            myId
                        )
                }
            );

            showToast(
                "Unfollowed.",
                "👤"
            );

        } else {

            await updateDoc(
                myRef,
                {
                    following:
                        arrayUnion(
                            targetStudentId
                        )
                }
            );

            await updateDoc(
                targetRef,
                {
                    followers:
                        arrayUnion(
                            myId
                        )
                }
            );

            showToast(
                "Following.",
                "💙"
            );
        }

        await logActivity(
            alreadyFollowing
                ? `Unfollowed ${targetStudentId}`
                : `Followed ${targetStudentId}`
        );

    } catch (error) {

        console.error(
            "Follow error:",
            error
        );

        showToast(
            "Follow action नहीं हुआ।",
            "❌"
        );
    }
}


/* =========================================================
   PROFILE FOLLOW BUTTON
   ========================================================= */

function renderFollowButton(
    targetStudent
) {

    const box =
        $("profileFollowBox");

    if (!box) return;

    const myId =
        getProfileId();

    if (
        !targetStudent ||
        targetStudent.id === myId
    ) {

        box.innerHTML = "";

        return;
    }

    const following =
        Array.isArray(
            currentStudent?.following
        )
            ? currentStudent.following
            : [];

    const isFollowing =
        following.includes(
            targetStudent.id
        );

    box.innerHTML = `

        <button
            type="button"
            id="followTargetBtn"
            class="follow-btn"
        >
            ${isFollowing
                ? "Following"
                : "Follow"}
        </button>
    `;

    $("followTargetBtn")
        ?.addEventListener(
            "click",
            async () => {

                await toggleFollow(
                    targetStudent.id
                );

                const updated =
                    await getDoc(
                        doc(
                            db,
                            "students",
                            myId
                        )
                    );

                if (updated.exists()) {

                    currentStudent = {
                        id: myId,
                        ...updated.data()
                    };

                    renderFollowButton(
                        targetStudent
                    );
                }
            }
        );
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {

        stopOnlineHeartbeat();

        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        if (unsubscribeStudents) {
            unsubscribeStudents();
            unsubscribeStudents = null;
        }

        if (unsubscribeSettings) {
            unsubscribeSettings();
            unsubscribeSettings = null;
        }

    } catch (error) {

        console.error(
            "Logout cleanup error:",
            error
        );
    }

    currentUser = null;
    currentStudent = null;

    selectedChatPerson = null;
    selectedOwnerPerson = null;

    isOwner = false;

    $("app")
        ?.classList.add("hidden");

    $("loginScreen")
        ?.classList.remove("hidden");

    $("loginForm")
        ?.reset();

    showToast(
        "Logged out.",
        "👋"
    );
}


/* =========================================================
   WINDOW EVENTS
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (getProfileId()) {
            updateStudentOnline(false);
        }
    }
);


document.addEventListener(
    "visibilitychange",
    () => {

        if (!getProfileId()) return;

        if (
            document.visibilityState ===
            "visible"
        ) {

            updateStudentOnline(true);

        } else {

            updateStudentOnline(false);
        }
    }
);


/* =========================================================
   FORM EVENT SETUP
   ========================================================= */

function setupFormEvents() {

    $("loginForm")
        ?.addEventListener(
            "submit",
            handleLogin
        );

    $("homeworkAdminForm")
        ?.addEventListener(
            "submit",
            addHomeworkFromForm
        );

    $("noteAdminForm")
        ?.addEventListener(
            "submit",
            addNoteFromForm
        );

    $("announcementAdminForm")
        ?.addEventListener(
            "submit",
            addAnnouncementFromForm
        );


    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const modalId =
                        button.dataset.closeModal;

                    $(modalId)
                        ?.classList.add(
                            "hidden"
                        );
                }
            );
        });
}


/* =========================================================
   INITIAL APP START
   ========================================================= */

async function initApp() {

    try {

        setupFormEvents();

        await loadGlobalSettings();

        listenToGlobalSettings();

        const savedName =
            getUserName();

        const savedPhone =
            getUserPhone();

        if (
            savedName &&
            savedPhone
        ) {

            const profileId =
                getProfileId(
                    savedPhone
                );

            const studentSnap =
                await getDoc(
                    doc(
                        db,
                        "students",
                        profileId
                    )
                );

            if (studentSnap.exists()) {

                const data =
                    studentSnap.data();

                if (
                    data.status !==
                    "blocked"
                ) {

                    currentStudent = {
                        id: profileId,
                        ...data
                    };

                    checkOwner(
                        data.name,
                        data.phone
                    );

                    /*
                       Password is still required
                       for actual login.
                       Do not auto-login only
                       because localStorage exists.
                    */
                }
            }
        }

    } catch (error) {

        console.error(
            "App initialization error:",
            error
        );
    }
}


/* =========================================================
   START
   ========================================================= */

initApp();


/* =========================================================
   GLOBAL DEBUG HELPERS
   ========================================================= */

window.StudyConnect = {

    getCurrentStudent: () =>
        currentStudent,

    getSettings: () =>
        currentSettings,

    isOwner: () =>
        isOwner,

    showPage,

    loadStudents,

    loadGroups,

    loadHomework,

    loadSchoolUpdates,

    loadNotes
};
