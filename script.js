// ============================================================
// STUDYCONNECT - COMPLETE JAVASCRIPT
// ============================================================
// Login + Firebase + Realtime Chat + Groups + Online Users
// Homework + School + Notes + Settings
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
    onSnapshot,
    serverTimestamp,
    arrayUnion
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// FIREBASE
// ============================================================

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

console.log("StudyConnect Firebase connected.");


// ============================================================
// SETTINGS
// ============================================================

const APP_PASSWORD = "123";

const OWNER_NAME = "Krishna Yadav";
const OWNER_SHORT_NAME = "Krishna";

const OWNER_SETTINGS_PASSWORD = "12341";

const OWNER_PHONE = "8738084554";


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentUserName = "";

let currentGroupId = null;
let currentGroupData = null;

let chatUnsubscribe = null;
let groupUnsubscribe = null;
let groupsUnsubscribe = null;
let onlineUnsubscribe = null;

let onlineHeartbeat = null;

let loginStep = 1;


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


function getUserName() {

    return localStorage.getItem("studyName") || "";
}


function setUserName(name) {

    currentUserName = name;

    localStorage.setItem("studyName", name);
}


function getCurrentUser() {

    return currentUserName || getUserName();
}


function getNow() {

    return Date.now();
}


function formatDateTime(value) {

    if (!value) {
        return "";
    }

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


// ============================================================
// PAGE NAVIGATION
// ============================================================

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


// Navigation buttons

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        const page = button.getAttribute("data-page");

        if (page) {

            showPage(page);
        }
    });
});


// Home cards

document.querySelectorAll(".open-page").forEach(card => {

    card.addEventListener("click", () => {

        const page = card.getAttribute("data-page");

        if (page) {

            showPage(page);
        }
    });
});


// Menu

const menuBtn = document.getElementById("menuBtn");

const navMenu = document.getElementById("navMenu");

if (menuBtn && navMenu) {

    menuBtn.addEventListener("click", () => {

        navMenu.classList.toggle("show");

    });
}


// ============================================================
// LOGIN
// ============================================================
// IMPORTANT:
// Existing HTML IDs are used.
// passwordScreen
// openUserName
// appPassword
// unlockBtn
// passwordError
// ============================================================

function setupLogin() {

    const screen = document.getElementById("passwordScreen");

    const nameInput = document.getElementById("openUserName");

    const passwordInput = document.getElementById("appPassword");

    const unlockBtn = document.getElementById("unlockBtn");

    const errorBox = document.getElementById("passwordError");


    if (
        !screen ||
        !nameInput ||
        !passwordInput ||
        !unlockBtn
    ) {

        console.error(
            "StudyConnect login elements नहीं मिले।"
        );

        return;
    }


    const savedName = getUserName();


    // --------------------------------------------------------
    // FIRST OPEN
    // --------------------------------------------------------

    if (!savedName) {

        nameInput.style.display = "block";

        passwordInput.style.display = "none";

        unlockBtn.textContent = "Next →";

        if (errorBox) {

            errorBox.textContent = "";
        }

        loginStep = 1;

    } else {

        // ----------------------------------------------------
        // RETURNING USER
        // ----------------------------------------------------

        nameInput.value = savedName;

        nameInput.style.display = "none";

        passwordInput.style.display = "block";

        unlockBtn.textContent = "Next →";

        loginStep = 2;

    }


    unlockBtn.addEventListener("click", async () => {

        // ====================================================
        // STEP 1 - NAME
        // ====================================================

        if (loginStep === 1) {

            const name = nameInput.value.trim();


            if (!name) {

                if (errorBox) {

                    errorBox.textContent =
                        "पहले अपना नाम लिखें।";
                }

                return;
            }


            setUserName(name);


            nameInput.style.display = "none";

            passwordInput.style.display = "block";

            passwordInput.value = "";

            passwordInput.focus();

            unlockBtn.textContent = "Next →";

            if (errorBox) {

                errorBox.textContent = "";
            }

            loginStep = 2;

            return;
        }


        // ====================================================
        // STEP 2 - PASSWORD
        // ====================================================

        if (loginStep === 2) {

            const password = passwordInput.value;


            if (password !== APP_PASSWORD) {

                if (errorBox) {

                    errorBox.textContent =
                        "गलत password ❌";
                }

                passwordInput.value = "";

                passwordInput.focus();

                return;
            }


            passwordInput.style.display = "none";


            if (errorBox) {

                errorBox.textContent = "";
            }


            unlockBtn.textContent = "Next →";


            // Owner screen

            const parent = unlockBtn.parentElement;

            if (parent) {

                const oldOwnerText =
                    parent.querySelector(".study-owner-login");

                if (oldOwnerText) {

                    oldOwnerText.remove();
                }


                const ownerText =
                    document.createElement("div");

                ownerText.className =
                    "study-owner-login";

                ownerText.style.margin = "12px 0";

                ownerText.innerHTML =
                    `
                    <h3>👑 App Owner</h3>
                    <p>
                        Owner:
                        <strong>
                            ${escapeHTML(OWNER_NAME)}
                        </strong>
                    </p>
                    <p>
                        StudyConnect खोलने के लिए
                        Next दबाएँ।
                    </p>
                    `;

                parent.insertBefore(
                    ownerText,
                    unlockBtn
                );
            }


            loginStep = 3;

            return;
        }


        // ====================================================
        // STEP 3 - OWNER NAME / NEXT
        // ====================================================

        if (loginStep === 3) {

            if (errorBox) {

                errorBox.textContent = "";
            }


            unlockBtn.textContent =
                "Open StudyConnect";

            loginStep = 4;

            return;
        }


        // ====================================================
        // STEP 4 - OPEN STUDYCONNECT
        // ====================================================

        if (loginStep === 4) {

            screen.style.display = "none";


            currentUserName = getUserName();


            const studentName =
                document.getElementById("studentName");

            if (studentName) {

                studentName.value =
                    currentUserName;
            }


            // Home खोलो

            showPage("home");


            // Realtime systems शुरू करो

            startRealtimeSystems();


            console.log(
                "StudyConnect successfully opened."
            );
        }

    });


    // Enter key

    nameInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            unlockBtn.click();
        }
    });


    passwordInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            unlockBtn.click();
        }
    });
}


// ============================================================
// REALTIME SYSTEMS
// ============================================================

function startRealtimeSystems() {

    const name = getCurrentUser();

    if (!name) {

        return;
    }


    currentUserName = name;


    startOnlineSystem();

    startRealtimeChat();

    startRealtimeGroups();

    startRealtimeHomework();

    startRealtimeSchool();

    startRealtimeNotes();
}


// ============================================================
// ONLINE USERS
// ============================================================

function makeSafeId(name) {

    return encodeURIComponent(name)
        .replace(/\./g, "%2E");
}


async function updateOnlineStatus() {

    const name = getCurrentUser();

    if (!name) {

        return;
    }


    const safeId = makeSafeId(name);


    try {

        await setDoc(

            doc(db, "onlineUsers", safeId),

            {

                name: name,

                online: true,

                lastSeen: getNow()

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


function startOnlineSystem() {

    updateOnlineStatus();


    if (onlineHeartbeat) {

        clearInterval(onlineHeartbeat);
    }


    onlineHeartbeat = setInterval(() => {

        updateOnlineStatus();

    }, 30000);


    window.addEventListener(
        "beforeunload",
        () => {

            const name = getCurrentUser();

            if (!name) {

                return;
            }


            const safeId =
                makeSafeId(name);


            updateDoc(

                doc(
                    db,
                    "onlineUsers",
                    safeId
                ),

                {

                    online: false,

                    lastSeen: getNow()

                }

            ).catch(() => {});

        }
    );


    startOnlineListener();
}


// ------------------------------------------------------------
// ONLINE LISTENER
// ------------------------------------------------------------

function startOnlineListener() {

    const countBox =
        document.getElementById("onlineCount");

    const usersBox =
        document.getElementById("onlineUsers");


    if (!countBox || !usersBox) {

        return;
    }


    // Arrow बनाओ

    let arrow = document.getElementById(
        "onlineArrowButton"
    );


    if (!arrow) {

        arrow =
            document.createElement("button");

        arrow.type = "button";

        arrow.id = "onlineArrowButton";

        arrow.textContent = "▾";

        arrow.style.border = "none";

        arrow.style.background =
            "transparent";

        arrow.style.cursor = "pointer";

        arrow.style.fontSize = "16px";

        arrow.style.marginLeft = "5px";


        countBox.parentNode.insertBefore(

            arrow,

            countBox.nextSibling
        );


        arrow.addEventListener(
            "click",
            () => {

                const hidden =
                    usersBox.style.display ===
                    "none";


                usersBox.style.display =
                    hidden ? "block" : "none";


                arrow.textContent =
                    hidden ? "▴" : "▾";
            }
        );
    }


    usersBox.style.display = "none";


    if (onlineUnsubscribe) {

        onlineUnsubscribe();
    }


    onlineUnsubscribe = onSnapshot(

        collection(db, "onlineUsers"),

        snapshot => {

            const now = getNow();

            const users = [];


            snapshot.forEach(item => {

                const data = item.data();


                if (
                    data.online === true &&
                    data.lastSeen &&
                    now - data.lastSeen < 70000
                ) {

                    users.push(data.name);
                }
            });


            users.sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        "hi"
                    )
            );


            countBox.textContent =
                `🟢 Online: ${users.length}`;


            // Arrow दोबारा बनाना पड़ सकता है

            if (!document.getElementById(
                "onlineArrowButton"
            )) {

                startOnlineListener();

                return;
            }


            usersBox.innerHTML = "";


            if (users.length === 0) {

                usersBox.innerHTML =
                    "<p>कोई user online नहीं है।</p>";

                return;
            }


            users.forEach(name => {

                const user =
                    document.createElement("div");

                user.style.padding = "6px 0";

                user.innerHTML =
                    `
                    <span>🟢</span>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>
                    `;

                usersBox.appendChild(user);
            });

        },

        error => {

            console.error(
                "Online users listener error:",
                error
            );
        }
    );
}


// ============================================================
// MAIN CHAT
// ============================================================

const messageInput =
    document.getElementById("messageInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

const chatMessages =
    document.getElementById("chatMessages");

const emojiBtn =
    document.getElementById("emojiBtn");


// Emoji

if (emojiBtn && messageInput) {

    emojiBtn.addEventListener(
        "click",
        () => {

            messageInput.value += " 😊";

            messageInput.focus();

        }
    );
}


// ============================================================
// MESSAGE TICKS
// ============================================================

function getTickHTML(data, mine) {

    if (!mine) {

        return "";
    }


    const seenBy =
        Array.isArray(data.seenBy)
            ? data.seenBy
            : [];


    if (seenBy.length > 0) {

        return `
            <span
                class="message-tick blue-ticks"
                style="color:#2196f3;"
                title="Seen"
            >
                ✓✓
            </span>
        `;
    }


    if (data.delivered === true) {

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
// MARK MESSAGE SEEN
// ============================================================

async function markMessageSeen(
    messageId,
    data
) {

    const myName = getCurrentUser();

    if (!myName) {

        return;
    }


    if (data.name === myName) {

        return;
    }


    const seenBy =
        Array.isArray(data.seenBy)
            ? data.seenBy
            : [];


    if (seenBy.includes(myName)) {

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

                seenBy: arrayUnion(myName)

            }
        );

    } catch (error) {

        console.error(
            "Seen update error:",
            error
        );
    }
}


// ============================================================
// REALTIME CHAT
// ============================================================

function startRealtimeChat() {

    if (!chatMessages) {

        return;
    }


    if (chatUnsubscribe) {

        chatUnsubscribe();
    }


    const q = query(

        collection(db, "messages"),

        orderBy("createdAt", "asc")
    );


    chatUnsubscribe = onSnapshot(

        q,

        snapshot => {

            chatMessages.innerHTML = "";


            if (snapshot.empty) {

                chatMessages.innerHTML = `
                    <div class="message other">
                        <strong>
                            StudyConnect
                        </strong>

                        <p>
                            अभी कोई message नहीं है। 👋
                        </p>
                    </div>
                `;

                return;
            }


            const myName =
                getCurrentUser();


            snapshot.forEach(item => {

                const data = item.data();


                const sender =
                    data.name || "Student";


                const text =
                    data.message || "";


                const mine =
                    sender === myName;


                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    mine
                        ? "message mine"
                        : "message other";


                box.innerHTML = `

                    <strong>
                        ${escapeHTML(sender)}
                    </strong>

                    <p>

                        ${escapeHTML(text)}

                        ${getTickHTML(
                            data,
                            mine
                        )}

                    </p>

                    <small
                        class="message-time"
                    >
                        ${escapeHTML(
                            formatDateTime(
                                data.createdAt
                            )
                        )}
                    </small>

                    ${
                        mine &&
                        Array.isArray(
                            data.seenBy
                        ) &&
                        data.seenBy.length > 0

                        ?

                        `
                        <small>
                            👀 Seen by:
                            ${escapeHTML(
                                data.seenBy.join(
                                    ", "
                                )
                            )}
                        </small>
                        `

                        :

                        ""
                    }

                `;


                if (!mine) {

                    markMessageSeen(
                        item.id,
                        data
                    );
                }


                chatMessages.appendChild(
                    box
                );

            });


            chatMessages.scrollTop =
                chatMessages.scrollHeight;
        },

        error => {

            console.error(
                "Realtime chat error:",
                error
            );
        }
    );
}


// ============================================================
// SEND MAIN CHAT MESSAGE
// ============================================================

async function sendMessage() {

    if (!messageInput) {

        return;
    }


    const text =
        messageInput.value.trim();


    const name =
        getCurrentUser();


    if (!text) {

        return;
    }


    if (!name) {

        alert(
            "पहले StudyConnect खोलें।"
        );

        return;
    }


    try {

        await addDoc(

            collection(
                db,
                "messages"
            ),

            {

                name: name,

                message: text,

                createdAt: getNow(),

                delivered: false,

                seenBy: []

            }
        );


        messageInput.value = "";


    } catch (error) {

        console.error(
            "Message sending error:",
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
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


// ============================================================
// GROUPS
// ============================================================

const groupInput =
    document.getElementById("groupInput");

const createGroupBtn =
    document.getElementById(
        "createGroupBtn"
    );

const groupList =
    document.getElementById("groupList");


// ============================================================
// GROUP REALTIME LISTENER
// ============================================================

function startRealtimeGroups() {

    if (!groupList) {

        return;
    }


    if (groupsUnsubscribe) {

        groupsUnsubscribe();
    }


    const q = query(

        collection(db, "groups"),

        orderBy("createdAt", "asc")
    );


    groupsUnsubscribe = onSnapshot(

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
                        👥
                        ${escapeHTML(
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


// ============================================================
// CREATE GROUP
// ============================================================

if (
    createGroupBtn &&
    groupInput
) {

    createGroupBtn.addEventListener(
        "click",
        async () => {

            const name =
                groupInput.value.trim();


            const owner =
                getCurrentUser();


            if (!name) {

                alert(
                    "Group का नाम लिखें।"
                );

                return;
            }


            if (!owner) {

                alert(
                    "पहले StudyConnect खोलें।"
                );

                return;
            }


            // Group password

            const groupPassword =
                prompt(
                    "इस Group के लिए password बनाइए:"
                );


            if (
                groupPassword === null
            ) {

                return;
            }


            if (
                groupPassword.trim()
                    .length < 1
            ) {

                alert(
                    "Group password खाली नहीं हो सकता।"
                );

                return;
            }


            try {

                await addDoc(

                    collection(
                        db,
                        "groups"
                    ),

                    {

                        name: name,

                        owner
