// ======================================================
// StudyConnect - Complete JavaScript
// Firebase + Realtime Chat + Groups + Online Users
// ======================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

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
    onSnapshot,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// FIREBASE CONFIG
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


// ======================================================
// BASIC SETTINGS
// ======================================================

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";

const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

let currentUser = null;
let currentGroup = null;

let chatUnsubscribe = null;
let groupChatUnsubscribe = null;
let onlineUnsubscribe = null;

let onlineHeartbeat = null;

let selectedProfilePhoto = "";


// ======================================================
// DOM HELPER
// ======================================================

const $ = (id) => document.getElementById(id);


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(text) {
    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// DATE / TIME
// ======================================================

function formatDateTime(timestamp) {

    if (!timestamp) {
        return "";
    }

    let date;

    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }

    return date.toLocaleString(
        currentLanguage === "hi" ? "hi-IN" : "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ======================================================
// LOCAL STORAGE
// ======================================================

function saveCurrentUser() {

    if (!currentUser) {
        return;
    }

    localStorage.setItem(
        "studyCurrentUser",
        JSON.stringify(currentUser)
    );
}


function loadCurrentUser() {

    try {

        const saved = localStorage.getItem("studyCurrentUser");

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(error);
        return null;
    }
}


// ======================================================
// LANGUAGE
// ======================================================

let currentLanguage =
    localStorage.getItem("studyLanguage") || "hi";


const translations = {

    hi: {

        "app-title": "StudyConnect",
        "school-password": "स्कूल पासवर्ड डालें",
        "password-placeholder": "पासवर्ड",
        "next": "आगे बढ़ें",
        "owner-name-title": "Owner का नाम",
        "owner-name-text": "क्या आप सही Owner को पहचानते हैं?",
        "owner-name": "Krishna Yadav",
        "enter-details": "अपनी जानकारी डालें",
        "your-name": "आपका नाम",
        "mobile-number": "मोबाइल नंबर",
        "profile-photo": "प्रोफाइल फोटो",
        "choose-photo": "फोटो चुनें",
        "enter-app": "StudyConnect खोलें",

        "contact-owner": "Owner से संपर्क करें",
        "contact-owner-text":
            "आपका नाम और मोबाइल नंबर Owner की अनुमति सूची में नहीं है।",
        "call-owner": "Owner को कॉल करें",
        "whatsapp-owner": "WhatsApp करें",
        "back-login": "वापस जाएँ",

        "home": "होम",
        "chat": "चैट",
        "groups": "ग्रुप्स",
        "homework": "होमवर्क",
        "school": "स्कूल",
        "notes": "नोट्स",
        "settings": "सेटिंग्स",

        "welcome": "StudyConnect में आपका स्वागत है",
        "save-name": "नाम सेव करें",
        "online-users": "ऑनलाइन यूज़र्स",

        "send": "भेजें",

        "create-group": "ग्रुप बनाएँ",
        "group-name": "ग्रुप का नाम",
        "group-password": "ग्रुप पासवर्ड",
        "add-member": "Member जोड़ें",
        "member-name": "Member का नाम",
        "member-phone": "Member का मोबाइल",
        "unlock-group": "ग्रुप खोलें",

        "save-homework": "होमवर्क सेव करें",
        "save-school": "स्कूल अपडेट सेव करें",
        "save-note": "नोट सेव करें",

        "change-name": "नाम बदलें",
        "language": "भाषा",
        "hindi": "हिंदी",
        "english": "English",
        "dark-mode": "Dark Mode",
        "notifications": "Notifications",
        "reset": "App Data Reset",

        "owner-section": "Owner Section",
        "owner-password": "Owner Password",
        "owner-login": "Owner Login",
        "allow-user": "User को अनुमति दें",
        "allowed-users": "Allowed Users",

        "no-users": "अभी कोई User ऑनलाइन नहीं है।",
        "no-groups": "अभी कोई Group नहीं है।",
        "no-homework": "अभी कोई Homework नहीं है।",
        "no-notes": "अभी कोई Note नहीं है।"
    },

    en: {

        "app-title": "StudyConnect",
        "school-password": "Enter School Password",
        "password-placeholder": "Password",
        "next": "Next",
        "owner-name-title": "Owner Name",
        "owner-name-text": "Do you recognize the correct Owner?",
        "owner-name": "Krishna Yadav",
        "enter-details": "Enter Your Details",
        "your-name": "Your Name",
        "mobile-number": "Mobile Number",
        "profile-photo": "Profile Photo",
        "choose-photo": "Choose Photo",
        "enter-app": "Open StudyConnect",

        "contact-owner": "Contact Owner",
        "contact-owner-text":
            "Your name and mobile number are not in the Owner's allowed list.",
        "call-owner": "Call Owner",
        "whatsapp-owner": "WhatsApp Owner",
        "back-login": "Back",

        "home": "Home",
        "chat": "Chat",
        "groups": "Groups",
        "homework": "Homework",
        "school": "School",
        "notes": "Notes",
        "settings": "Settings",

        "welcome": "Welcome to StudyConnect",
        "save-name": "Save Name",
        "online-users": "Online Users",

        "send": "Send",

        "create-group": "Create Group",
        "group-name": "Group Name",
        "group-password": "Group Password",
        "add-member": "Add Member",
        "member-name": "Member Name",
        "member-phone": "Member Mobile",
        "unlock-group": "Unlock Group",

        "save-homework": "Save Homework",
        "save-school": "Save School Update",
        "save-note": "Save Note",

        "change-name": "Change Name",
        "language": "Language",
        "hindi": "Hindi",
        "english": "English",
        "dark-mode": "Dark Mode",
        "notifications": "Notifications",
        "reset": "Reset App Data",

        "owner-section": "Owner Section",
        "owner-password": "Owner Password",
        "owner-login": "Owner Login",
        "allow-user": "Allow User",
        "allowed-users": "Allowed Users",

        "no-users": "No users are online right now.",
        "no-groups": "No groups yet.",
        "no-homework": "No homework yet.",
        "no-notes": "No notes yet."
    }
};


// ======================================================
// TRANSLATION
// ======================================================

function applyLanguage() {

    document.documentElement.lang =
        currentLanguage === "hi" ? "hi" : "en";

    document.querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key = element.dataset.i18n;

            if (
                translations[currentLanguage] &&
                translations[currentLanguage][key]
            ) {
                element.textContent =
                    translations[currentLanguage][key];
            }
        });

    document.querySelectorAll("[data-i18n-placeholder]")
        .forEach(element => {

            const key =
                element.dataset.i18nPlaceholder;

            if (
                translations[currentLanguage] &&
                translations[currentLanguage][key]
            ) {
                element.placeholder =
                    translations[currentLanguage][key];
            }
        });

    updateLanguageButtons();

    localStorage.setItem(
        "studyLanguage",
        currentLanguage
    );
}


function updateLanguageButtons() {

    if ($("hindiLanguageBtn")) {

        $("hindiLanguageBtn").classList.toggle(
            "active",
            currentLanguage === "hi"
        );
    }

    if ($("englishLanguageBtn")) {

        $("englishLanguageBtn").classList.toggle(
            "active",
            currentLanguage === "en"
        );
    }
}


// ======================================================
// NAVIGATION
// ======================================================

function showPage(pageId) {

    document.querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    const page = $(pageId);

    if (page) {
        page.classList.add("active");
    }

    document.querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.page === pageId
            ) {
                button.classList.add("active");
            }
        });

    if ($("navMenu")) {
        $("navMenu").classList.remove("show");
    }
}


function setupNavigation() {

    document.querySelectorAll(".nav-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const page =
                    button.dataset.page;

                if (page) {
                    showPage(page);
                }
            });
        });

    if ($("menuBtn")) {

        $("menuBtn").addEventListener(
            "click",
            () => {

                $("navMenu")
                    ?.classList.toggle("show");
            }
        );
    }
}


// ======================================================
// LOGIN FLOW
// ======================================================

function resetLogin() {

    $("schoolPasswordStep")
        ?.classList.remove("hidden");

    $("ownerStep")
        ?.classList.add("hidden");

    $("userDetailsStep")
        ?.classList.add("hidden");

    $("passwordError").textContent = "";

    if ($("appPassword")) {
        $("appPassword").value = "";
    }
}


function setupLogin() {

    resetLogin();

    // STEP 1
    $("unlockBtn")?.addEventListener(
        "click",
        async () => {

            const password =
                $("appPassword").value.trim();

            if (password !== SCHOOL_PASSWORD) {

                $("passwordError").textContent =
                    currentLanguage === "hi"
                        ? "गलत स्कूल पासवर्ड।"
                        : "Wrong school password.";

                return;
            }

            $("passwordError").textContent = "";

            $("schoolPasswordStep")
                .classList.add("hidden");

            $("ownerStep")
                .classList.remove("hidden");

            $("ownerNameDisplay").textContent =
                OWNER_NAME;
        }
    );


    // STEP 2
    $("ownerNextBtn")?.addEventListener(
        "click",
        () => {

            $("ownerStep")
                .classList.add("hidden");

            $("userDetailsStep")
                .classList.remove("hidden");
        }
    );


    // PROFILE PHOTO
    $("profilePhotoInput")
        ?.addEventListener(
            "change",
            handleProfilePhoto
        );


    // STEP 3
    $("enterAppBtn")?.addEventListener(
        "click",
        enterApplication
    );


    // CONTACT OWNER
    $("backToLoginBtn")?.addEventListener(
        "click",
        () => {

            $("contactOwnerScreen")
                .classList.add("hidden");

            $("passwordScreen")
                .classList.remove("hidden");

            resetLogin();
        }
    );


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
}


// ======================================================
// PROFILE PHOTO
// ======================================================

function handleProfilePhoto(event) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {

        selectedProfilePhoto =
            reader.result;

        if ($("profilePhotoPreview")) {

            $("profilePhotoPreview").src =
                selectedProfilePhoto;

            $("profilePhotoPreview")
                .classList.remove("hidden");
        }
    };

    reader.readAsDataURL(file);
}


// ======================================================
// NORMALIZE PHONE
// ======================================================

function normalizePhone(phone) {

    return String(phone || "")
        .replace(/\D/g, "")
        .slice(-10);
}


// ======================================================
// ENTER APPLICATION
// ======================================================

async function enterApplication() {

    const name =
        $("openUserName").value.trim();

    const phone =
        normalizePhone(
            $("openUserPhone").value
        );

    if (!name || !phone) {

        $("passwordError").textContent =
            currentLanguage === "hi"
                ? "नाम और मोबाइल नंबर दोनों डालें।"
                : "Enter both name and mobile number.";

        return;
    }

    if (phone.length !== 10) {

        $("passwordError").textContent =
            currentLanguage === "hi"
                ? "सही 10 अंकों का मोबाइल नंबर डालें।"
                : "Enter a valid 10-digit mobile number.";

        return;
    }

    $("passwordError").textContent =
        currentLanguage === "hi"
            ? "User की अनुमति जाँची जा रही है..."
            : "Checking user permission...";

    try {

        const allowedRef =
            doc(
                db,
                "allowedUsers",
                phone
            );

        const allowedSnap =
            await getDoc(allowedRef);

        if (!allowedSnap.exists()) {

            showContactOwner();

            return;
        }

        const userData =
            allowedSnap.data();

        const allowedName =
            String(userData.name || "")
                .trim()
                .toLowerCase();

        if (
            allowedName &&
            allowedName !== name.toLowerCase()
        ) {

            showContactOwner();

            return;
        }

        currentUser = {

            name: name,

            phone: phone,

            profilePhoto:
                selectedProfilePhoto || "",

            userId: phone
        };

        saveCurrentUser();

        await createOrUpdateUserProfile();

        await setUserOnline();

        openApplication();

    } catch (error) {

        console.error(error);

        $("passwordError").textContent =
            currentLanguage === "hi"
                ? "Firebase से कनेक्शन में समस्या है।"
                : "Firebase connection problem.";
    }
}


// ======================================================
// CONTACT OWNER
// ======================================================

function showContactOwner() {

    $("passwordScreen")
        .classList.add("hidden");

    $("contactOwnerScreen")
        .classList.remove("hidden");
}


// ======================================================
// OPEN APPLICATION
// ======================================================

function openApplication() {

    $("passwordScreen")
        .classList.add("hidden");

    $("contactOwnerScreen")
        .classList.add("hidden");

    $("appContainer")
        .classList.remove("hidden");

    if ($("studentName")) {
        $("studentName").value =
            currentUser.name;
    }

    if ($("changeNameInput")) {
        $("changeNameInput").value =
            currentUser.name;
    }

    updateCurrentUserProfile();

    setupRealtimeChat();

    loadGroups();

    loadHomework();

    loadSchoolUpdates();

    loadNotes();

    listenOnlineUsers();

    setupOnlineHeartbeat();

    showPage("home");
}


// ======================================================
// USER PROFILE
// ======================================================

async function createOrUpdateUserProfile() {

    if (!currentUser) {
        return;
    }

    try {

        await setDoc(
            doc(
                db,
                "users",
                currentUser.phone
            ),
            {
                name: currentUser.name,
                phone: currentUser.phone,
                profilePhoto:
                    currentUser.profilePhoto || "",
                online: false,
                lastSeen: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

    } catch (error) {

        console.error(
            "Profile error:",
            error
        );
    }
}


function updateCurrentUserProfile() {

    if (!$("currentUserProfile")) {
        return;
    }

    const photo =
        currentUser?.profilePhoto;

    if (photo) {

        $("currentUserProfile").innerHTML =
            `<img src="${photo}" alt="Profile">`;

    } else {

        $("currentUserProfile").textContent =
            currentUser?.name
                ?.charAt(0)
                ?.toUpperCase() || "?";
    }
}


// ======================================================
// CHANGE NAME
// ======================================================

function setupNameChange() {

    $("saveNameBtn")?.addEventListener(
        "click",
        saveHomeName
    );

    $("changeNameBtn")?.addEventListener(
        "click",
        changeUserName
    );
}


async function saveHomeName() {

    if (!currentUser) {
        return;
    }

    const name =
        $("studentName")
            ?.value
            ?.trim();

    if (!name) {
        return;
    }

    currentUser.name = name;

    saveCurrentUser();

    await createOrUpdateUserProfile();

    if ($("nameMessage")) {

        $("nameMessage").textContent =
            currentLanguage === "hi"
                ? "नाम सेव हो गया।"
                : "Name saved.";
    }

    updateCurrentUserProfile();
}


async function changeUserName() {

    if (!currentUser) {
        return;
    }

    const name =
        $("changeNameInput")
            ?.value
            ?.trim();

    if (!name) {
        return;
    }

    currentUser.name = name;

    saveCurrentUser();

    await createOrUpdateUserProfile();

    if ($("changeNameMessage")) {

        $("changeNameMessage").textContent =
            currentLanguage === "hi"
                ? "नाम बदल दिया गया।"
                : "Name changed.";
    }

    if ($("studentName")) {
        $("studentName").value = name;
    }

    updateCurrentUserProfile();
}


// ======================================================
// REALTIME CHAT
// ======================================================

function setupRealtimeChat() {

    if (chatUnsubscribe) {
        chatUnsubscribe();
    }

    const messagesRef =
        collection(db, "messages");

    const q =
        query(
            messagesRef,
            orderBy("createdAt", "asc")
        );

    chatUnsubscribe =
        onSnapshot(
            q,
            snapshot => {

                const messages = [];

                snapshot.forEach(
                    messageDoc => {

                        messages.push({
                            id: messageDoc.id,
                            ...messageDoc.data()
                        });
                    }
                );

                renderChatMessages(messages);
            },
            error => {

                console.error(
                    "Chat listener error:",
                    error
                );
            }
        );
}


// ======================================================
// RENDER CHAT
// ======================================================

function renderChatMessages(messages) {

    const box =
        $("chatMessages");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    messages.forEach(message => {

        const mine =
            message.senderPhone ===
            currentUser?.phone;

        const messageDiv =
            document.createElement("div");

        messageDiv.className =
            mine
                ? "message mine"
                : "message other";

        let ticks = "";

        if (mine) {

            if (message.readBy &&
                message.readBy.length > 1) {

                ticks =
                    `<span class="ticks blue">✓✓</span>`;

            } else if (
                message.deliveredTo &&
                message.deliveredTo.length > 1
            ) {

                ticks =
                    `<span class="ticks">✓✓</span>`;

            } else {

                ticks =
                    `<span class="ticks">✓</span>`;
            }
        }

        messageDiv.innerHTML = `

            <div class="message-name">
                ${escapeHTML(message.senderName || "")}
            </div>

            <div class="message-text">
                ${escapeHTML(message.text || "")}
            </div>

            <div class="message-time">
                ${formatDateTime(message.createdAt)}
                ${ticks}
            </div>
        `;

        box.appendChild(messageDiv);

        if (
            !mine &&
            currentUser &&
            !message.readBy?.includes(currentUser.phone)
        ) {

            markMessageRead(
                message.id,
                message.readBy || []
            );
        }
    });

    box.scrollTop =
        box.scrollHeight;
}


// ======================================================
// SEND CHAT MESSAGE
// ======================================================

async function sendChatMessage() {

    if (!currentUser) {
        return;
    }

    const input =
        $("messageInput");

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    try {

        await addDoc(
            collection(db, "messages"),
            {
                text: text,

                senderName:
                    currentUser.name,

                senderPhone:
                    currentUser.phone,

                createdAt:
                    serverTimestamp(),

                deliveredTo:
                    [currentUser.phone],

                readBy:
                    [currentUser.phone]
            }
        );

        input.value = "";

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );
    }
}


// ======================================================
// MARK MESSAGE READ
// ======================================================

async function markMessageRead(
    messageId,
    oldReadBy
) {

    if (!currentUser) {
        return;
    }

    if (
        oldReadBy.includes(
            currentUser.phone
        )
    ) {
        return;
    }

    try {

        const messageRef =
            doc(
                db,
                "messages",
                messageId
            );

        await updateDoc(
            messageRef,
            {
                readBy: [
                    ...oldReadBy,
                    currentUser.phone
                ],
                deliveredTo: [
                    ...new Set([
                        ...(oldReadBy || []),
                        currentUser.phone
                    ])
                ]
            }
        );

    } catch (error) {

        console.error(
            "Read receipt error:",
            error
        );
    }
}


// ======================================================
// EMOJI
// ======================================================

function setupEmoji() {

    $("emojiBtn")?.addEventListener(
        "click",
        () => {

            const input =
                $("messageInput");

            if (!input) {
                return;
            }

            input.value += " 😊";

            input.focus();
        }
    );
}


// ======================================================
// ENTER KEY CHAT
// ======================================================

function setupChatEvents() {

    $("sendMessageBtn")?.addEventListener(
        "click",
        sendChatMessage
    );

    $("messageInput")?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendChatMessage();
            }
        }
    );
}


// ======================================================
// GROUPS
// ======================================================

async function loadGroups() {

    const list =
        $("groupList");

    if (!list) {
        return;
    }

    try {

        const snapshot =
            await getDocs(
                collection(db, "groups")
            );

        list.innerHTML = "";

        let found = 0;

        snapshot.forEach(groupDoc => {

            const group =
                groupDoc.data();

            const members =
                group.members || [];

            const isMember =
                members.some(
                    member =>
                        normalizePhone(member.phone) ===
                        currentUser?.phone
                );

            const isOwner =
                normalizePhone(group.ownerPhone) ===
                currentUser?.phone;

            if (!isMember && !isOwner) {
                return;
            }

            found++;

            const button =
                document.createElement("button");

            button.className =
                "group-item";

            button.textContent =
                group.name;

            button.addEventListener(
                "click",
                () => openGroup(
                    groupDoc.id,
                    group
                )
            );

            list.appendChild(button);
        });

        if (!found) {

            list.innerHTML =
                `<p>${translations[currentLanguage]["no-groups"]}</p>`;
        }

    } catch (error) {

        console.error(
            "Groups error:",
            error
        );
    }
}


// ======================================================
// SHA-256 GROUP PASSWORD
// ======================================================

async function hashPassword(password) {

    const data =
        new TextEncoder()
            .encode(password);

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
                byte.toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


// ======================================================
// CREATE GROUP
// ======================================================

async function createGroup() {

    if (!currentUser) {
        return;
    }

    const name =
        $("groupInput")
            ?.value
            ?.trim();

    const password =
        $("groupPasswordInput")
            ?.value
            ?.trim();

    if (!name || !password) {

        alert(
            currentLanguage === "hi"
                ? "Group का नाम और password डालें।"
                : "Enter group name and password."
        );

        return;
    }

    try {

        const passwordHash =
            await hashPassword(password);

        await addDoc(
            collection(db, "groups"),
            {
                name: name,

                ownerName:
                    currentUser.name,

                ownerPhone:
                    currentUser.phone,

                passwordHash:
                    passwordHash,

                members: [
                    {
                        name:
                            currentUser.name,
                        phone:
                            currentUser.phone
                    }
                ],

                createdAt:
                    serverTimestamp()
            }
        );

        $("groupInput").value = "";
        $("groupPasswordInput").value = "";

        await loadGroups();

    } catch (error) {

        console.error(
            "Create group error:",
            error
        );
    }
}


// ======================================================
// OPEN GROUP
// ======================================================

function openGroup(groupId, group) {

    currentGroup = {

        id: groupId,

        ...group,

        unlocked: false
    };

    $("groupChatSection")
        ?.classList.remove("hidden");

    $("selectedGroupName").textContent =
        group.name;

    $("selectedGroupOwner").textContent =
        `${group.ownerName || ""}`;

    $("groupPasswordSection")
        ?.classList.remove("hidden");

    $("groupContent")
        ?.classList.add("hidden");

    $("enterGroupPasswordInput").value = "";

    $("groupPasswordMessage").textContent = "";

    renderMembers(
        group.members || []
    );

    if (groupChatUnsubscribe) {
        groupChatUnsubscribe();
        groupChatUnsubscribe = null;
    }
}


// ======================================================
// UNLOCK GROUP
// ======================================================

async function unlockGroup() {

    if (!currentGroup) {
        return;
    }

    const password =
        $("enterGroupPasswordInput")
            ?.value
            ?.trim();

    if (!password) {
        return;
    }

    const hash =
        await hashPassword(password);

    if (
        hash !==
        currentGroup.passwordHash
    ) {

        $("groupPasswordMessage")
            .textContent =
                currentLanguage === "hi"
                    ? "गलत Group Password।"
                    : "Wrong group password.";

        return;
    }

    currentGroup.unlocked = true;

    $("groupPasswordSection")
        ?.classList.add("hidden");

    $("groupContent")
        ?.classList.remove("hidden");

    listenGroupMessages(
        currentGroup.id
    );
}


// ======================================================
// GROUP MEMBERS
// ======================================================

function renderMembers(members) {

    const list =
        $("memberList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    members.forEach(member => {

        const div =
            document.createElement("div");

        div.className =
            "member-item";

        div.innerHTML = `
            <strong>
                ${escapeHTML(member.name || "")}
            </strong>
            <span>
                ${escapeHTML(member.phone || "")}
            </span>
        `;

        list.appendChild(div);
    });
}


// ======================================================
// ADD MEMBER
// ======================================================

async function addMember() {

    if (!currentGroup || !currentUser) {
        return;
    }

    if (
        normalizePhone(
            currentGroup.ownerPhone
        ) !== currentUser.phone
    ) {

        alert(
            currentLanguage === "hi"
                ? "सिर्फ Group Creator member जोड़ सकता है।"
                : "Only the group creator can add members."
        );

        return;
    }

    const name =
        $("memberNameInput")
            ?.value
            ?.trim();

    const phone =
        normalizePhone(
            $("memberPhoneInput")
                ?.value
        );

    if (!name || phone.length !== 10) {

        alert(
            currentLanguage === "hi"
                ? "Member का सही नाम और मोबाइल डालें।"
                : "Enter a valid member name and mobile."
        );

        return;
    }

    const existing =
        currentGroup.members || [];

    if (
        existing.some(
            member =>
                normalizePhone(member.phone) ===
                phone
        )
    ) {

        alert(
            currentLanguage === "hi"
                ? "यह Member पहले से मौजूद है।"
                : "This member already exists."
        );

        return;
    }

    try {

        const updatedMembers = [

            ...existing,

            {
                name: name,
                phone: phone
            }
        ];

        await updateDoc(
            doc(
                db,
                "groups",
                currentGroup.id
            ),
            {
                members:
                    updatedMembers
            }
        );

        currentGroup.members =
            updatedMembers;

        renderMembers(
            updatedMembers
        );

        $("memberNameInput").value = "";
        $("memberPhoneInput").value = "";

    } catch (error) {

        console.error(
            "Add member error:",
            error
        );
    }
}


// ======================================================
// GROUP REALTIME CHAT
// ======================================================

function listenGroupMessages(groupId) {

    if (groupChatUnsubscribe) {
        groupChatUnsubscribe();
    }

    const messagesRef =
        collection(
            db,
            "groups",
            groupId,
            "messages"
        );

    const q =
        query(
            messagesRef,
            orderBy("createdAt", "asc")
        );

    groupChatUnsubscribe =
        onSnapshot(
            q,
            snapshot => {

                const messages = [];

                snapshot.forEach(
                    messageDoc => {

                        messages.push({
                            id: messageDoc.id,
                            ...messageDoc.data()
                        });
                    }
                );

                renderGroupMessages(
                    messages
                );
            },
            error => {

                console.error(
                    "Group chat error:",
                    error
                );
            }
        );
}


// ======================================================
// RENDER GROUP CHAT
// ======================================================

function renderGroupMessages(messages) {

    const box =
        $("groupMessages");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    messages.forEach(message => {

        const mine =
            message.senderPhone ===
            currentUser?.phone;

        const div =
            document.createElement("div");

        div.className =
            mine
                ? "message mine"
                : "message other";

        let ticks = "";

        if (mine) {

            if (
                message.readBy &&
                message.readBy.length > 1
            ) {

                ticks =
                    `<span class="ticks blue">✓✓</span>`;

            } else {

                ticks =
                    `<span class="ticks">✓✓</span>`;
            }
        }

        div.innerHTML = `

            <div class="message-name">
                ${escapeHTML(message.senderName || "")}
            </div>

            <div class="message-text">
                ${escapeHTML(message.text || "")}
            </div>

            <div class="message-time">
                ${formatDateTime(message.createdAt)}
                ${ticks}
            </div>
        `;

        box.appendChild(div);

        if (
            !mine &&
            !message.readBy?.includes(
                currentUser.phone
            )
        ) {

            markGroupMessageRead(
                currentGroup.id,
                message.id,
                message.readBy || []
            );
        }
    });

    box.scrollTop =
        box.scrollHeight;
}


// ======================================================
// SEND GROUP MESSAGE
// ======================================================

async function sendGroupMessage() {

    if (
        !currentGroup ||
        !currentGroup.unlocked ||
        !currentUser
    ) {
        return;
    }

    const input =
        $("groupMessageInput");

    const text =
        input?.value?.trim();

    if (!text) {
        return;
    }

    try {

        await addDoc(
            collection(
                db,
                "groups",
                currentGroup.id,
                "messages"
            ),
            {
                text: text,

                senderName:
                    currentUser.name,

                senderPhone:
                    currentUser.phone,

                createdAt:
                    serverTimestamp(),

                readBy:
                    [currentUser.phone]
            }
        );

        input.value = "";

    } catch (error) {

        console.error(
            "Group message error:",
            error
        );
    }
}


// ======================================================
// GROUP READ RECEIPT
// ======================================================

async function markGroupMessageRead(
    groupId,
    messageId,
    oldReadBy
) {

    if (!currentUser) {
        return;
    }

    if (
        oldReadBy.includes(
            currentUser.phone
        )
    ) {
        return;
    }

    try {

        await updateDoc(
            doc(
                db,
                "groups",
                groupId,
                "messages",
                messageId
            ),
            {
                readBy: [
                    ...oldReadBy,
                    currentUser.phone
                ]
            }
        );

    } catch (error) {

        console.error(error);
    }
}


// ======================================================
// HOMEWORK
// ======================================================

async function addHomework() {

    if (!currentUser) {
        return;
    }

    const homework = {

        date:
            $("homeworkDate")?.value || "",

        hindi:
            $("hindiHomework")?.value || "",

        english:
            $("englishHomework")?.value || "",

        math:
            $("mathHomework")?.value || "",

        science:
            $("scienceHomework")?.value || "",

        sst:
            $("sstHomework")?.value || "",

        computer:
            $("computerHomework")?.value || "",

        art:
            $("artHomework")?.value || "",

        createdAt:
            serverTimestamp(),

        createdBy:
            currentUser.name
    };

    try {

        await addDoc(
            collection(db, "homework"),
            homework
        );

        document
            .querySelectorAll(
                "#homework input, #homework textarea"
            )
            .forEach(
                input => {
                    input.value = "";
                }
            );

        loadHomework();

    } catch (error) {

        console.error(
            "Homework error:",
            error
        );
    }
}


// ======================================================
// LOAD HOMEWORK
// ======================================================

async function loadHomework() {

    const list =
        $("homeworkList");

    if (!list) {
        return;
    }

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(db, "homework"),
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                )
            );

        list.innerHTML = "";

        if (snapshot.empty) {

            list.innerHTML =
                `<p>${translations[currentLanguage]["no-homework"]}</p>`;

            return;
        }

        snapshot.forEach(homeworkDoc => {

            const h =
                homeworkDoc.data();

            const div =
                document.createElement("div");

            div.className =
                "homework-card";

            div.innerHTML = `

                <h3>
                    ${escapeHTML(
                        h.date || "Homework"
                    )}
                </h3>

                <p>
                    <strong>Hindi:</strong>
                    ${escapeHTML(h.hindi || "")}
                </p>

                <p>
                    <strong>English:</strong>
                    ${escapeHTML(h.english || "")}
                </p>

                <p>
                    <strong>Math:</strong>
                    ${escapeHTML(h.math || "")}
                </p>

                <p>
                    <strong>Science:</strong>
                    ${escapeHTML(h.science || "")}
                </p>

                <p>
                    <strong>SST:</strong>
                    ${escapeHTML(h.sst || "")}
                </p>

                <p>
                    <strong>Computer:</strong>
                    ${escapeHTML(h.computer || "")}
                </p>

                <p>
                    <strong>Art:</strong>
                    ${escapeHTML(h.art || "")}
                </p>

            `;

            list.appendChild(div);
        });

    } catch (error) {

        console.error(
            "Load homework error:",
            error
        );
    }
}


// ======================================================
// SCHOOL UPDATES
// ======================================================

async function saveSchoolUpdate() {

    if (!currentUser) {
        return;
    }

    const text =
        $("schoolInput")
            ?.value
            ?.trim();

    if (!text) {
        return;
    }

    try {

        await addDoc(
            collection(db, "schoolUpdates"),
            {
                text: text,

                createdBy:
                    currentUser.name,

                createdAt:
                    serverTimestamp()
            }
        );

        $("schoolInput").value = "";

        loadSchoolUpdates();

    } catch (error) {

        console.error(
            "School update error:",
            error
        );
    }
}


// ======================================================
// LOAD SCHOOL UPDATES
// ======================================================

async function loadSchoolUpdates() {

    const list =
        $("schoolList");

    if (!list) {
        return;
    }

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "schoolUpdates"
                    ),
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                )
            );

        list.innerHTML = "";

        snapshot.forEach(updateDoc => {

            const update =
                updateDoc.data();

            const div =
                document.createElement("div");

            div.className =
                "school-card";

            div.innerHTML = `

                <p>
                    ${escapeHTML(
                        update.text || ""
                    )}
                </p>

                <small>
                    ${escapeHTML(
                        update.createdBy || ""
                    )}
                    ·
                    ${formatDateTime(
                        update.createdAt
                    )}
                </small>

            `;

            list.appendChild(div);
        });

    } catch (error) {

        console.error(
            "School load error:",
            error
        );
    }
}


// ======================================================
// NOTES
// ======================================================

async function saveNote() {

    if (!currentUser) {
        return;
    }

    const text =
        $("noteInput")
            ?.value
            ?.trim();

    if (!text) {
        return;
    }

    try {

        await addDoc(
            collection(db, "notes"),
            {
                text: text,

                createdBy:
                    currentUser.name,

                createdAt:
                    serverTimestamp()
            }
        );

        $("noteInput").value = "";

        loadNotes();

    } catch (error) {

        console.error(
            "Save note error:",
            error
        );
    }
}


// ======================================================
// LOAD NOTES
// ======================================================

async function loadNotes() {

    const list =
        $("notesList");

    if (!list) {
        return;
    }

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(db, "notes"),
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                )
            );

        list.innerHTML = "";

        if (snapshot.empty) {

            list.innerHTML =
                `<p>${translations[currentLanguage]["no-notes"]}</p>`;

            return;
        }

        snapshot.forEach(noteDoc => {

            const note =
                noteDoc.data();

            const div =
                document.createElement("div");

            div.className =
                "note-card";

            div.innerHTML = `

                <p>
                    ${escapeHTML(
                        note.text || ""
                    )}
                </p>

                <small>
                    ${escapeHTML(
                        note.createdBy || ""
                    )}
                    ·
                    ${formatDateTime(
                        note.createdAt
                    )}
                </small>

            `;

            list.appendChild(div);
        });

    } catch (error) {

        console.error(
            "Notes error:",
            error
        );
    }
}


// ======================================================
// ONLINE USERS
// ======================================================

async function setUserOnline() {

    if (!currentUser) {
        return;
    }

    try {

        await setDoc(
            doc(
                db,
                "onlineUsers",
                currentUser.phone
            ),
            {
                name:
                    currentUser.name,

                phone:
                    currentUser.phone,

                online:
                    true,

                lastSeen:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        await setDoc(
            doc(
                db,
                "users",
                currentUser.phone
            ),
            {
                online: true,
                lastSeen:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

    } catch (error) {

        console.error(
            "Online error:",
            error
        );
    }
}


// ======================================================
// HEARTBEAT
// ======================================================

function setupOnlineHeartbeat() {

    if (onlineHeartbeat) {
        clearInterval(
            onlineHeartbeat
        );
    }

    setUserOnline();

    onlineHeartbeat =
        setInterval(
            setUserOnline,
            30000
        );

    window.addEventListener(
        "beforeunload",
        () => {

            if (currentUser) {

                setDoc(
                    doc(
                        db,
                        "onlineUsers",
                        currentUser.phone
                    ),
                    {
                        online: false,
                        lastSeen:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );
            }
        }
    );
}


// ======================================================
// LISTEN ONLINE USERS
// ======================================================

function listenOnlineUsers() {

    if (onlineUnsubscribe) {
        onlineUnsubscribe();
    }

    onlineUnsubscribe =
        onSnapshot(
            collection(
                db,
                "onlineUsers"
            ),
            snapshot => {

                const users = [];

                snapshot.forEach(
                    userDoc => {

                        const user =
                            userDoc.data();

                        if (
                            user.online === true
                        ) {
                            users.push(user);
                        }
                    }
                );

                renderOnlineUsers(users);
            },
            error => {

                console.error(
                    "Online listener error:",
                    error
                );
            }
        );
}


// ======================================================
// RENDER ONLINE USERS
// ======================================================

function renderOnlineUsers(users) {

    if ($("onlineCount")) {

        $("onlineCount").textContent =
            users.length;
    }

    const list =
        $("onlineUsers");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (!users.length) {

        list.innerHTML =
            `<p>${translations[currentLanguage]["no-users"]}</p>`;

        return;
    }

    users.forEach(user => {

        const div =
            document.createElement("div");

        div.className =
            "online-user";

        div.innerHTML = `

            <span class="online-dot"></span>

            <span>
                ${escapeHTML(
                    user.name || ""
                )}
            </span>

        `;

        list.appendChild(div);
    });
}


// ======================================================
// ONLINE DROPDOWN
// ======================================================

function setupOnlineButton() {

    $("onlineToggleBtn")
        ?.addEventListener(
            "click",
            () => {

                $("onlineUsers")
                    ?.classList.toggle(
                        "show"
                    );
            }
        );
}


// ======================================================
// SETTINGS - LANGUAGE
// ======================================================

function setupLanguage() {

    $("hindiLanguageBtn")
        ?.addEventListener(
            "click",
            () => {

                currentLanguage = "hi";

                applyLanguage();

                refreshDynamicContent();
            }
        );


    $("englishLanguageBtn")
        ?.addEventListener(
            "click",
            () => {

                currentLanguage = "en";

                applyLanguage();

                refreshDynamicContent();
            }
        );
}


function refreshDynamicContent() {

    loadHomework();

    loadNotes();

    renderOnlineUsers([]);
}


// ======================================================
// THEME
// ======================================================

function setupTheme() {

    const savedTheme =
        localStorage.getItem(
            "studyTheme"
        );

    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );
    }

    $("themeBtn")?.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark-mode"
            );

            const dark =
                document.body.classList.contains(
                    "dark-mode"
                );

            localStorage.setItem(
                "studyTheme",
                dark ? "dark" : "light"
            );
        }
    );
}


// ======================================================
// NOTIFICATIONS
// ======================================================

async function enableNotifications() {

    if (
        !("Notification" in window)
    ) {

        if ($("notificationMessage")) {

            $("notificationMessage")
                .textContent =
                    currentLanguage === "hi"
                        ? "इस browser में notification उपलब्ध नहीं है।"
                        : "Notifications are not supported here.";
        }

        return;
    }

    try {

        const permission =
            await Notification.requestPermission();

        if ($("notificationMessage")) {

            if (permission === "granted") {

                $("notificationMessage")
                    .textContent =
                        currentLanguage === "hi"
                            ? "Notifications चालू हैं।"
                            : "Notifications are enabled.";

                new Notification(
                    "StudyConnect",
                    {
                        body:
                            currentLanguage === "hi"
                                ? "Notifications चालू हो गई हैं।"
                                : "Notifications are enabled."
                    }
                );

            } else {

                $("notificationMessage")
                    .textContent =
                        currentLanguage === "hi"
                            ? "Notification permission नहीं मिली।"
                            : "Notification permission was not granted.";
            }
        }

    } catch (error) {

        console.error(
            "Notification error:",
            error
        );
    }
}


function setupNotifications() {

    $("notificationBtn")
        ?.addEventListener(
            "click",
            enableNotifications
        );
}


// ======================================================
// OWNER SECTION
// ======================================================

function setupOwnerPanel() {

    $("ownerLoginBtn")
        ?.addEventListener(
            "click",
            ownerLogin
        );

    $("allowUserBtn")
        ?.addEventListener(
            "click",
            allowUser
        );
}


function ownerLogin() {

    const password =
        $("ownerPasswordInput")
            ?.value
            ?.trim();

    if (password !== OWNER_PASSWORD) {

        $("ownerPasswordMessage")
            .textContent =
                currentLanguage === "hi"
                    ? "गलत Owner Password।"
                    : "Wrong Owner Password.";

        $("ownerPanel")
            ?.classList.add("hidden");

        return;
    }

    $("ownerPasswordMessage")
        .textContent =
            currentLanguage === "hi"
                ? "Owner Login सफल।"
                : "Owner login successful.";

    $("ownerPanel")
        ?.classList.remove("hidden");

    loadAllowedUsers();
}


// ======================================================
// ALLOW USER
// ======================================================

async function allowUser() {

    const name =
        $("allowedUserNameInput")
            ?.value
            ?.trim();

    const phone =
        normalizePhone(
            $("allowedUserPhoneInput")
                ?.value
        );

    if (!name || phone.length !== 10) {

        alert(
            currentLanguage === "hi"
                ? "सही नाम और 10 अंकों का मोबाइल नंबर डालें।"
                : "Enter a valid name and 10-digit mobile number."
        );

        return;
    }

    try {

        await setDoc(
            doc(
                db,
                "allowedUsers",
                phone
            ),
            {
                name: name,
                phone: phone,

                allowed: true,

                addedBy:
                    OWNER_NAME,

                createdAt:
                    serverTimestamp()
            }
        );

        $("allowedUserNameInput").value = "";
        $("allowedUserPhoneInput").value = "";

        loadAllowedUsers();

    } catch (error) {

        console.error(
            "Allow user error:",
            error
        );
    }
}


// ======================================================
// LOAD ALLOWED USERS
// ======================================================

async function loadAllowedUsers() {

    const list =
        $("allowedUsersList");

    if (!list) {
        return;
    }

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "allowedUsers"
                )
            );

        list.innerHTML = "";

        snapshot.forEach(userDoc => {

            const user =
                userDoc.data();

            const div =
                document.createElement("div");

            div.className =
                "allowed-user";

            div.innerHTML = `

                <div>
                    <strong>
                        ${escapeHTML(
                            user.name || ""
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            user.phone || ""
                        )}
                    </span>
                </div>

                <button
                    class="remove-user-btn"
                    data-phone="${escapeHTML(
                        user.phone || ""
                    )}"
                >
                    ${currentLanguage === "hi"
                        ? "Remove"
                        : "Remove"}
                </button>

            `;

            list.appendChild(div);
        });


        document
            .querySelectorAll(
                ".remove-user-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeAllowedUser(
                            button.dataset.phone
                        );
                    }
                );
            });

    } catch (error) {

        console.error(
            "Allowed users error:",
            error
        );
    }
}


// ======================================================
// REMOVE USER
// ======================================================

async function removeAllowedUser(phone) {

    if (!phone) {
        return;
    }

    const confirmText =
        currentLanguage === "hi"
            ? "क्या इस User को Remove करना है?"
            : "Remove this user?";

    if (!confirm(confirmText)) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                "allowedUsers",
                phone
            )
        );

        loadAllowedUsers();

    } catch (error) {

        console.error(
            "Remove user error:",
            error
        );
    }
}


// ======================================================
// RESET APP DATA
// ======================================================

function setupReset() {

    $("clearDataBtn")
        ?.addEventListener(
            "click",
            () => {

                const ok =
                    confirm(
                        currentLanguage === "hi"
                            ? "क्या आप इस डिवाइस का Login Data हटाना चाहते हैं?"
                            : "Remove this device's login data?"
                    );

                if (!ok) {
                    return;
                }

                localStorage.removeItem(
                    "studyCurrentUser"
                );

                localStorage.removeItem(
                    "studyName"
                );

                location.reload();
            }
        );
}


// ======================================================
// GROUP EVENTS
// ======================================================

function setupGroupEvents() {

    $("createGroupBtn")
        ?.addEventListener(
            "click",
            createGroup
        );

    $("unlockGroupBtn")
        ?.addEventListener(
            "click",
            unlockGroup
        );

    $("addMemberBtn")
        ?.addEventListener(
            "click",
            addMember
        );

    $("sendGroupMessageBtn")
        ?.addEventListener(
            "click",
            sendGroupMessage
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


// ======================================================
// HOMEWORK EVENTS
// ======================================================

function setupHomeworkEvents() {

    $("addHomeworkBtn")
        ?.addEventListener(
            "click",
            addHomework
        );
}


// ======================================================
// SCHOOL EVENTS
// ======================================================

function setupSchoolEvents() {

    $("saveSchoolBtn")
        ?.addEventListener(
            "click",
            saveSchoolUpdate
        );
}


// ======================================================
// NOTES EVENTS
// ======================================================

function setupNotesEvents() {

    $("saveNoteBtn")
        ?.addEventListener(
            "click",
            saveNote
        );
}


// ======================================================
// PAGE LOAD
// ======================================================

async function init() {

    console.log(
        "StudyConnect JavaScript started."
    );

    applyLanguage();

    setupNavigation();

    setupLogin();

    setupNameChange();

    setupChatEvents();

    setupEmoji();

    setupGroupEvents();

    setupHomeworkEvents();

    setupSchoolEvents();

    setupNotesEvents();

    setupOnlineButton();

    setupLanguage();

    setupTheme();

    setupNotifications();

    setupOwnerPanel();

    setupReset();


    // पुराने login को तुरंत भरोसा नहीं करेंगे।
    // User की Firebase allow-list दोबारा check होगी।

    const savedUser =
        loadCurrentUser();

    if (savedUser?.name &&
        savedUser?.phone) {

        try {

            const allowedSnap =
                await getDoc(
                    doc(
                        db,
                        "allowedUsers",
                        savedUser.phone
                    )
                );

            if (allowedSnap.exists()) {

                const data =
                    allowedSnap.data();

                const storedName =
                    String(
                        data.name || ""
                    )
                    .trim()
                    .toLowerCase();

                if (
                    !storedName ||
                    storedName ===
                    String(
                        savedUser.name
                    )
                    .trim()
                    .toLowerCase()
                ) {

                    currentUser =
                        savedUser;

                    openApplication();

                    return;
                }
            }

        } catch (error) {

            console.error(
                "Saved login check error:",
                error
            );
        }
    }

    resetLogin();
}


// ======================================================
// START
// ===
