/* =========================================================
   STUDYCONNECT - FINAL SCRIPT
   Firebase + Realtime Chat + Groups + Online Users
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyi3SwWc3AUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================================================
   APP SETTINGS
   ========================================================= */

const APP_PASSWORD = "123";

const OWNER_NAME = "Krishna Yadav";

const OWNER_SETTINGS_PASSWORD = "12341";

const OWNER_CONTACT_NUMBER = "8738084554";

const ONLINE_TIMEOUT = 70000;


/* =========================================================
   COMMON HELPERS
   ========================================================= */

function now() {
    return Date.now();
}


function getUserName() {
    return localStorage.getItem("studyName") || "";
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDateTime(timestamp) {
    if (!timestamp) return "";

    try {
        return new Date(timestamp).toLocaleString("hi-IN", {
            dateStyle: "short",
            timeStyle: "short"
        });
    } catch (error) {
        return "";
    }
}


function safeId(text) {
    return btoa(
        unescape(
            encodeURIComponent(String(text))
        )
    ).replace(/[^a-zA-Z0-9]/g, "");
}


/* =========================================================
   ALLOWED USERS
   ========================================================= */

function getAllowedUsers() {

    const saved = localStorage.getItem("studyAllowedUsers");

    if (!saved) {
        return [OWNER_NAME];
    }

    try {

        const users = JSON.parse(saved);

        if (!Array.isArray(users)) {
            return [OWNER_NAME];
        }

        if (!users.includes(OWNER_NAME)) {
            users.unshift(OWNER_NAME);
        }

        return users;

    } catch (error) {

        return [OWNER_NAME];
    }
}


function saveAllowedUsers(users) {

    const cleaned = [];

    users.forEach(name => {

        const value = String(name).trim();

        if (!value) return;

        if (!cleaned.includes(value)) {
            cleaned.push(value);
        }
    });

    if (!cleaned.includes(OWNER_NAME)) {
        cleaned.unshift(OWNER_NAME);
    }

    localStorage.setItem(
        "studyAllowedUsers",
        JSON.stringify(cleaned)
    );
}


function isAllowedUser(name) {

    const allowed = getAllowedUsers();

    return allowed.some(
        user =>
            user.toLowerCase() ===
            String(name).trim().toLowerCase()
    );
}


/* =========================================================
   LOGIN / OPEN SCREEN
   ========================================================= */

const passwordScreen =
    document.getElementById("passwordScreen");

const openUserName =
    document.getElementById("openUserName");

const appPassword =
    document.getElementById("appPassword");

const unlockBtn =
    document.getElementById("unlockBtn");

const passwordError =
    document.getElementById("passwordError");


function showApp() {

    if (passwordScreen) {
        passwordScreen.style.display = "none";
    }

    document.body.classList.add("study-app-open");

    startOnlineStatus();

    startRealtimeData();

    updateOnlineArrow();

    applyLanguage(
        localStorage.getItem("studyLanguage") || "hi"
    );
}


function showPasswordError(message) {

    if (passwordError) {
        passwordError.textContent = message;
        passwordError.style.display = "block";
    }
}


function setupLogin() {

    if (!unlockBtn) return;

    const savedName = getUserName();

    if (savedName && openUserName) {
        openUserName.value = savedName;
    }

    unlockBtn.addEventListener("click", () => {

        const name =
            openUserName?.value.trim() || savedName;

        const password =
            appPassword?.value || "";

        if (!name) {

            showPasswordError(
                "पहले अपना नाम लिखें।"
            );

            return;
        }

        if (!password) {

            showPasswordError(
                "Password लिखें।"
            );

            return;
        }

        if (password !== APP_PASSWORD) {

            showPasswordError(
                "गलत Password!"
            );

            return;
        }

        if (!isAllowedUser(name)) {

            showPasswordError(
                "यह नाम StudyConnect में allowed नहीं है।\n\n" +
                "कृपया App Owner से संपर्क करें।\n" +
                "Owner: " +
                OWNER_NAME +
                "\n" +
                "Contact: " +
                OWNER_CONTACT_NUMBER
            );

            return;
        }

        localStorage.setItem(
            "studyName",
            name
        );

        sessionStorage.setItem(
            "studyUnlocked",
            "true"
        );

        if (passwordError) {
            passwordError.style.display = "none";
        }

        showApp();
    });
}


setupLogin();


/* =========================================================
   NAVIGATION
   ========================================================= */

function showPage(pageName) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(page => {

        const pageId =
            page.id ||
            page.getAttribute("data-page");

        const pageNameAttribute =
            page.getAttribute("data-page");

        if (
            pageId === pageName ||
            pageNameAttribute === pageName ||
            page.id === pageName + "Page"
        ) {
            page.style.display = "";
            page.classList.add("active");
        } else {
            page.style.display = "none";
            page.classList.remove("active");
        }
    });

    const navMenu =
        document.getElementById("navMenu");

    if (navMenu) {
        navMenu.classList.remove("open");
    }
}


function setupNavigation() {

    const menuBtn =
        document.getElementById("menuBtn");

    const navMenu =
        document.getElementById("navMenu");

    if (menuBtn && navMenu) {

        menuBtn.addEventListener("click", () => {

            navMenu.classList.toggle("open");

        });
    }


    document.querySelectorAll("[data-page]").forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.getAttribute("data-page");

            if (page) {
                showPage(page);
            }
        });
    });


    document.querySelectorAll(".open-page").forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.getAttribute("data-page");

            if (page) {
                showPage(page);
            }
        });
    });
}


setupNavigation();


/* =========================================================
   HOME NAME
   ========================================================= */

const studentName =
    document.getElementById("studentName");

const saveNameBtn =
    document.getElementById("saveNameBtn");

const nameMessage =
    document.getElementById("nameMessage");

const changeNameInput =
    document.getElementById("changeNameInput");

const changeNameBtn =
    document.getElementById("changeNameBtn");

const changeNameMessage =
    document.getElementById("changeNameMessage");


function loadSavedName() {

    const name = getUserName();

    if (!name) return;

    if (studentName) {
        studentName.value = name;
        studentName.disabled = true;
    }

    if (saveNameBtn) {
        saveNameBtn.style.display = "none";
    }

    if (nameMessage) {
        nameMessage.textContent =
            "आपका नाम: " + name;
    }

    if (changeNameInput) {
        changeNameInput.value = name;
    }
}


if (saveNameBtn && studentName) {

    saveNameBtn.addEventListener(
        "click",
        () => {

            const name =
                studentName.value.trim();

            if (!name) {
                if (nameMessage) {
                    nameMessage.textContent =
                        "पहले नाम लिखें।";
                }
                return;
            }

            if (!isAllowedUser(name)) {

                if (nameMessage) {
                    nameMessage.textContent =
                        "यह नाम allowed नहीं है। App Owner से संपर्क करें: " +
                        OWNER_CONTACT_NUMBER;
                }

                return;
            }

            localStorage.setItem(
                "studyName",
                name
            );

            studentName.disabled = true;

            saveNameBtn.style.display = "none";

            if (nameMessage) {
                nameMessage.textContent =
                    "नाम Save हो गया।";
            }

            startOnlineStatus();
        }
    );
}


if (changeNameBtn && changeNameInput) {

    changeNameBtn.addEventListener(
        "click",
        () => {

            const newName =
                changeNameInput.value.trim();

            if (!newName) {

                if (changeNameMessage) {
                    changeNameMessage.textContent =
                        "नाम लिखें।";
                }

                return;
            }

            if (!isAllowedUser(newName)) {

                if (changeNameMessage) {
                    changeNameMessage.textContent =
                        "यह नाम allowed नहीं है।";
                }

                return;
            }

            localStorage.setItem(
                "studyName",
                newName
            );

            loadSavedName();

            if (changeNameMessage) {
                changeNameMessage.textContent =
                    "नाम बदल दिया गया।";
            }

            startOnlineStatus();
        }
    );
}


loadSavedName();


/* =========================================================
   ONLINE USERS
   ========================================================= */

const onlineCount =
    document.getElementById("onlineCount");

const onlineUsers =
    document.getElementById("onlineUsers");

let onlineHeartbeat = null;

let onlineUnsubscribe = null;


function createOnlineArrow() {

    if (!onlineCount) return;

    if (
        document.getElementById(
            "onlineArrowButton"
        )
    ) {
        return;
    }

    const parent =
        onlineCount.parentElement;

    if (!parent) return;

    const arrow =
        document.createElement("button");

    arrow.id = "onlineArrowButton";

    arrow.type = "button";

    arrow.textContent = "▼";

    arrow.title = "Online students देखें";

    arrow.style.border = "none";
    arrow.style.background = "transparent";
    arrow.style.cursor = "pointer";
    arrow.style.fontSize = "14px";
    arrow.style.marginLeft = "6px";

    arrow.addEventListener(
        "click",
        () => {

            if (!onlineUsers) return;

            if (
                onlineUsers.style.display === "none" ||
                !onlineUsers.style.display
            ) {

                onlineUsers.style.display =
                    "block";

                arrow.textContent = "▲";

            } else {

                onlineUsers.style.display =
                    "none";

                arrow.textContent = "▼";
            }
        }
    );

    parent.appendChild(arrow);

    if (onlineUsers) {
        onlineUsers.style.display =
            "none";
    }
}


function updateOnlineUser() {

    const name = getUserName();

    if (!name) return;

    const id = safeId(name);

    setDoc(
        doc(db, "onlineUsers", id),
        {
            name: name,
            online: true,
            lastSeen: now()
        },
        {
            merge: true
        }
    ).catch(error => {

        console.error(
            "Online status error:",
            error
        );

    });
}


function startOnlineStatus() {

    if (onlineHeartbeat) {
        clearInterval(
            onlineHeartbeat
        );
    }

    updateOnlineUser();

    onlineHeartbeat =
        setInterval(
            updateOnlineUser,
            30000
        );
}


function loadRealtimeOnlineUsers() {

    if (!onlineCount) return;

    if (onlineUnsubscribe) {
        onlineUnsubscribe();
    }

    onlineUnsubscribe =
        onSnapshot(
            collection(db, "onlineUsers"),
            snapshot => {

                const currentTime =
                    now();

                const users = [];

                snapshot.forEach(item => {

                    const data =
                        item.data();

                    if (
                        data.online === true &&
                        currentTime -
                        Number(data.lastSeen || 0) <
                        ONLINE_TIMEOUT
                    ) {
                        users.push(data.name);
                    }
                });

                users.sort(
                    (a, b) =>
                        String(a).localeCompare(
                            String(b)
                        )
                );

                onlineCount.textContent =
                    "🟢 Online: " +
                    users.length;

                createOnlineArrow();

                if (onlineUsers) {

                    onlineUsers.innerHTML = "";

                    if (users.length === 0) {

                        onlineUsers.innerHTML =
                            "<div>कोई online नहीं है।</div>";

                    } else {

                        users.forEach(name => {

                            const row =
                                document.createElement(
                                    "div"
                                );

                            row.style.padding =
                                "5px 0";

                            row.textContent =
                                "🟢 " + name;

                            onlineUsers.appendChild(
                                row
                            );
                        });
                    }
                }
            },
            error => {

                console.error(
                    "Online users error:",
                    error
                );
            }
        );
}


function updateOnlineArrow() {

    createOnlineArrow();

    loadRealtimeOnlineUsers();
}


/* =========================================================
   MAIN CHAT
   ========================================================= */

const chatMessages =
    document.getElementById("chatMessages");

const messageInput =
    document.getElementById("messageInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

const emojiBtn =
    document.getElementById("emojiBtn");


let chatUnsubscribe = null;


function displayMessagesRealtime() {

    if (!chatMessages) return;

    if (chatUnsubscribe) {
        chatUnsubscribe();
    }

    const q =
        query(
            collection(db, "messages"),
            orderBy("createdAt", "asc")
        );

    chatUnsubscribe =
        onSnapshot(
            q,
            snapshot => {

                chatMessages.innerHTML = "";

                snapshot.forEach(item => {

                    const data =
                        item.data();

                    const box =
                        document.createElement(
                            "div"
                        );

                    const mine =
                        data.name ===
                        getUserName();

                    box.className =
                        mine
                            ? "message mine"
                            : "message";

                    const ticks =
                        mine
                            ? "✓✓"
                            : "";

                    box.innerHTML = `
                        <strong>
                            ${escapeHTML(data.name || "Student")}
                        </strong>

                        <div>
                            ${escapeHTML(data.message || "")}
                        </div>

                        <small>
                            ${escapeHTML(
                                formatDateTime(
                                    data.createdAt
                                )
                            )}
                            ${mine
                                ? `<span class="message-ticks">${ticks}</span>`
                                : ""}
                        </small>
                    `;

                    chatMessages.appendChild(
                        box
                    );
                });

                chatMessages.scrollTop =
                    chatMessages.scrollHeight;
            },
            error => {

                console.error(
                    "Chat realtime error:",
                    error
                );
            }
        );
}


async function sendMessage() {

    if (!messageInput) return;

    const message =
        messageInput.value.trim();

    const name =
        getUserName();

    if (!name) {

        alert(
            "पहले अपना नाम Save करें।"
        );

        return;
    }

    if (!message) return;

    try {

        await addDoc(
            collection(db, "messages"),
            {
                name: name,
                message: message,
                createdAt: now(),
                deliveredTo: [],
                seenBy: [name]
            }
        );

        messageInput.value = "";

    } catch (error) {

        console.error(
            "Message send error:",
            error
        );

        alert(
            "Message send नहीं हुआ।"
        );
    }
}


if (sendMessageBtn) {

    sendMessageBtn.addEventListener(
        "click",
        sendMessage
    );
}


if (messageInput) {

    messageInput.addEventListener(
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
}


if (emojiBtn && messageInput) {

    emojiBtn.addEventListener(
        "click",
        () => {

            const emojis =
                ["😀", "😂", "👍", "❤️", "🔥", "😊", "🎉"];

            const emoji =
                emojis[
                    Math.floor(
                        Math.random() *
                        emojis.length
                    )
                ];

            messageInput.value += emoji;

            messageInput.focus();
        }
    );
}


/* =========================================================
   GROUP VARIABLES
   ========================================================= */

const groupInput =
    document.getElementById("groupInput");

const createGroupBtn =
    document.getElementById("createGroupBtn");

const groupList =
    document.getElementById("groupList");

const groupChatSection =
    document.getElementById(
        "groupChatSection"
    );

const selectedGroupName =
    document.getElementById(
        "selectedGroupName"
    );

const memberNameInput =
    document.getElementById(
        "memberNameInput"
    );

const memberPhoneInput =
    document.getElementById(
        "memberPhoneInput"
    );

const addMemberBtn =
    document.getElementById(
        "addMemberBtn"
    );

const memberList =
    document.getElementById(
        "memberList"
    );

const groupMessages =
    document.getElementById(
        "groupMessages"
    );

const groupMessageInput =
    document.getElementById(
        "groupMessageInput"
    );

const sendGroupMessageBtn =
    document.getElementById(
        "sendGroupMessageBtn"
    );


let currentGroupId = null;

let currentGroupData = null;

let groupMessageUnsubscribe = null;


/* =========================================================
   GROUP PASSWORD HASH
   ========================================================= */

async function hashText(text) {

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(text);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
        .map(
            byte =>
                byte.toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


/* =========================================================
   LOAD GROUPS
   ========================================================= */

let groupsUnsubscribe = null;


function loadGroupsRealtime() {

    if (!groupList) return;

    if (groupsUnsubscribe) {
        groupsUnsubscribe();
    }

    const q =
        query(
            collection(db, "groups"),
            orderBy("createdAt", "asc")
        );

    groupsUnsubscribe =
        onSnapshot(
            q,
            snapshot => {

                groupList.innerHTML = "";

                snapshot.forEach(item => {

                    const data =
                        item.data();

                    const box =
                        document.createElement(
                            "div"
                        );

                    box.className =
                        "group-item";

                    const members =
                        Array.isArray(
                            data.members
                        )
                            ? data.members
                            : [];

                    box.innerHTML = `
                        <strong>
                            👥 ${escapeHTML(
                                data.name ||
                                "Group"
                            )}
                        </strong>

                        <p>
                            👤 Members:
                            ${members.length}
                        </p>

                        <small>
                            Created by:
                            ${escapeHTML(
                                data.owner ||
                                ""
                            )}
                        </small>
                    `;

                    box.addEventListener(
                        "click",
                        () => {

                            openGroup(
                                item.id,
                                data
                            );
                        }
                    );

                    groupList.appendChild(
                        box
                    );
                });
            },
            error => {

                console.error(
                    "Groups realtime error:",
                    error
                );
            }
        );
}


/* =========================================================
   CREATE GROUP
   ========================================================= */

if (createGroupBtn && groupInput) {

    createGroupBtn.addEventListener(
        "click",
        async () => {

            const name =
                groupInput.value.trim();

            const owner =
                getUserName();

            if (!name) {

                alert(
                    "Group का नाम लिखें।"
                );

                return;
            }

            if (!owner) {

                alert(
                    "पहले अपना नाम Save करें।"
                );

                return;
            }

            const groupPassword =
                prompt(
                    "इस Group का Password बनाइए:"
                );

            if (
                groupPassword === null ||
                groupPassword.trim() === ""
            ) {

                alert(
                    "Group Password जरूरी है।"
                );

                return;
            }

            try {

                const passwordHash =
                    await hashText(
                        groupPassword.trim()
                    );

                await addDoc(
                    collection(db, "groups"),
                    {
                        name: name,
                        owner: owner,

                        members: [
                            {
                                name: owner,
                                phone: ""
                            }
                        ],

                        passwordHash:
                            passwordHash,

                        createdAt: now()
                    }
                );

                groupInput.value = "";

                alert(
                    "✅ Group बन गया!"
                );

            } catch (error) {

                console.error(
                    "Group create error:",
                    error
                );

                alert(
                    "Group create नहीं हुआ।"
                );
            }
        }
    );
}


/* =========================================================
   OPEN GROUP
   ========================================================= */

async function openGroup(
    groupId,
    groupData
) {

    if (!groupId || !groupData) {
        return;
    }

    const currentUser =
        getUserName();

    const members =
        Array.isArray(
            groupData.members
        )
            ? groupData.members
            : [];

    const isMember =
        members.some(member => {

            if (
                typeof member ===
                "string"
            ) {
                return (
                    member.toLowerCase() ===
                    currentUser.toLowerCase()
                );
            }

            return (
                String(
                    member.name || ""
                ).toLowerCase() ===
                currentUser.toLowerCase()
            );
        });


    if (!isMember) {

        const password =
            prompt(
                "यह private Group है।\nGroup Password डालें:"
            );

        if (password === null) {
            return;
        }

        try {

            const passwordHash =
                await hashText(
                    password.trim()
                );

            if (
                passwordHash !==
                groupData.passwordHash
            ) {

                alert(
                    "❌ गलत Group Password!"
                );

                return;
            }

            await addMemberToCurrentGroup(
                groupId,
                groupData,
                currentUser,
                ""
            );

            groupData.members =
                Array.isArray(
                    groupData.members
                )
                    ? [
                        ...groupData.members,
                        {
                            name: currentUser,
                            phone: ""
                        }
                    ]
                    : [
                        {
                            name: currentUser,
                            phone: ""
                        }
                    ];

        } catch (error) {

            console.error(
                "Group open error:",
                error
            );

            alert(
                "Group खोलने में समस्या हुई।"
            );

            return;
        }
    }


    currentGroupId =
        groupId;

    currentGroupData =
        groupData;


    if (groupChatSection) {

        groupChatSection.style.display =
            "block";

        groupChatSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    if (selectedGroupName) {

        selectedGroupName.textContent =
            "👥 " +
            (
                groupData.name ||
                "Group"
            );
    }


    displayGroupMembers();

    displayGroupMessagesRealtime();

    createPersonalChatArea();
}


/* =========================================================
   ADD MEMBER TO FIRESTORE
   ========================================================= */

async function addMemberToCurrentGroup(
    groupId,
    groupData,
    name,
    phone
) {

    const ref =
        doc(
            db,
            "groups",
            groupId
        );

    const members =
        Array.isArray(
            groupData.members
        )
            ? groupData.members
            : [];

    const exists =
        members.some(member => {

            const memberName =
                typeof member === "string"
                    ? member
                    : member.name;

            return (
                String(
                    memberName || ""
                ).toLowerCase() ===
                String(name).toLowerCase()
            );
        });

    if (exists) {
        return;
    }

    await updateDoc(
        ref,
        {
            members: arrayUnion({
                name: name,
                phone: phone || ""
            })
        }
    );
}


/* =========================================================
   ADD MEMBER BUTTON
   ========================================================= */

if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        async () => {

            if (!currentGroupId) {

                alert(
                    "पहले कोई Group खोलें।"
                );

                return;
            }

            const name =
                memberNameInput?.value.trim();

            const phone =
                memberPhoneInput?.value.trim() ||
                "";

            if (!name) {

                alert(
                    "Member का नाम लिखें।"
                );

                return;
            }

            try {

                await addMemberToCurrentGroup(
                    currentGroupId,
                    currentGroupData,
                    name,
                    phone
                );

                currentGroupData.members =
                    Array.isArray(
                        currentGroupData.members
                    )
                        ? [
                            ...currentGroupData.members,
                            {
                                name: name,
                                phone: phone
                            }
                        ]
                        : [
                            {
                                name: name,
                                phone: phone
                            }
                        ];

                if (memberNameInput) {
                    memberNameInput.value = "";
                }

                if (memberPhoneInput) {
                    memberPhoneInput.value = "";
                }

                displayGroupMembers();

                alert(
                    "✅ Member add हो गया!"
                );

            } catch (error) {

                console.error(
                    "Add member error:",
                    error
                );

                alert(
                    "Member add नहीं हुआ।"
                );
            }
        }
    );
}


/* =========================================================
   DISPLAY GROUP MEMBERS
   ========================================================= */

function displayGroupMembers() {

    if (!memberList) return;

    memberList.innerHTML = "";

    if (!currentGroupData) return;

    const members =
