// ============================================================
// StudyConnect - Real-Time Script
// ============================================================

// Firebase
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    arrayUnion,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ============================================================
// FIREBASE CONFIG
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


// ============================================================
// FIREBASE START
// ============================================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);


// ============================================================
// APP SETTINGS
// ============================================================

const APP_PASSWORD = "123";

let currentUser = null;
let currentGroup = null;
let unsubscribeChat = null;
let unsubscribeGroups = null;
let unsubscribeGroupMessages = null;
let unsubscribeHomework = null;
let unsubscribeSchool = null;
let unsubscribeNotes = null;


// ============================================================
// BASIC HELPERS
// ============================================================

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function getUserName() {
    return localStorage.getItem("studyName") || "Student";
}

function showMessage(element, text, type = "") {
    if (!element) return;

    element.textContent = text;
    element.className = type;

    setTimeout(() => {
        element.textContent = "";
    }, 3000);
}

function formatDateTime(timestamp) {
    if (!timestamp) return "";

    let date;

    if (timestamp?.toDate) {
        date = timestamp.toDate();
    } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("hi-IN", {
        dateStyle: "short",
        timeStyle: "short"
    });
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function startAuthentication() {

    try {

        await signInAnonymously(auth);

        currentUser = auth.currentUser;

        console.log(
            "StudyConnect Firebase Auth:",
            currentUser?.uid
        );

    } catch (error) {

        console.error("Authentication Error:", error);

        alert(
            "Firebase Authentication शुरू नहीं हो पाया।\n\n" +
            "Firebase Console में Anonymous Authentication ON करना होगा।"
        );
    }
}


// ============================================================
// LOGIN SCREEN
// ============================================================

function setupLogin() {

    const passwordScreen = $("passwordScreen");
    const nameInput = $("openUserName");
    const passwordInput = $("appPassword");
    const unlockBtn = $("unlockBtn");
    const error = $("passwordError");

    if (!passwordScreen || !unlockBtn) return;


    const savedName = localStorage.getItem("studyName");

    if (savedName && nameInput) {

        nameInput.value = savedName;

        nameInput.style.display = "none";
    }


    unlockBtn.addEventListener("click", async () => {

        const password = passwordInput?.value || "";

        if (password !== APP_PASSWORD) {

            if (error) {
                error.textContent = "गलत पासवर्ड!";
            }

            return;
        }


        if (!savedName) {

            const name = nameInput?.value.trim();

            if (!name) {

                if (error) {
                    error.textContent =
                        "पहले अपना नाम लिखो।";
                }

                return;
            }

            localStorage.setItem("studyName", name);
        }


        await startAuthentication();

        passwordScreen.style.display = "none";

        initializeAppData();
    });
}


// ============================================================
// NAVIGATION
// ============================================================

function showPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {
        page.style.display = "none";
    });


    const page = $(pageName);

    if (page) {
        page.style.display = "block";
    }


    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.remove("active");

        if (link.dataset.page === pageName) {
            link.classList.add("active");
        }

    });


    const menu = $("menu");

    if (menu) {
        menu.classList.remove("show");
    }
}


document.addEventListener("click", event => {

    const link = event.target.closest("[data-page]");

    if (!link) return;

    event.preventDefault();

    showPage(link.dataset.page);
});


// ============================================================
// MOBILE MENU
// ============================================================

function setupMenu() {

    const menuBtn = $("menuBtn");
    const menu = $("menu");

    if (!menuBtn || !menu) return;

    menuBtn.addEventListener("click", () => {

        menu.classList.toggle("show");

    });
}


// ============================================================
// HOME NAME
// ============================================================

function loadName() {

    const savedName = localStorage.getItem("studyName");

    const studentName = $("studentName");
    const saveNameBtn = $("saveNameBtn");

    if (!studentName) return;


    if (savedName) {

        studentName.value = savedName;

        studentName.disabled = true;

        if (saveNameBtn) {
            saveNameBtn.style.display = "none";
        }

    } else {

        studentName.disabled = false;

        if (saveNameBtn) {
            saveNameBtn.style.display = "inline-block";
        }
    }
}


function saveName() {

    const input = $("studentName");

    if (!input) return;

    const name = input.value.trim();

    if (!name) {
        alert("अपना नाम लिखो।");
        return;
    }


    localStorage.setItem("studyName", name);

    loadName();

    alert("नाम सेव हो गया।");
}


if ($("saveNameBtn")) {
    $("saveNameBtn").addEventListener("click", saveName);
}


// ============================================================
// CHANGE / REMOVE NAME
// ============================================================

function setupChangeName() {

    const changeBtn = $("changeNameBtn");
    const input = $("changeNameInput");
    const message = $("changeNameMessage");

    if (!changeBtn) return;


    changeBtn.addEventListener("click", () => {

        const name = input?.value.trim();

        if (!name) {

            showMessage(
                message,
                "नाम लिखो।"
            );

            return;
        }


        localStorage.setItem("studyName", name);

        loadName();

        if (input) {
            input.value = "";
        }


        showMessage(
            message,
            "नाम बदल दिया गया।"
        );
    });
}


// ============================================================
// REAL-TIME GENERAL CHAT
// ============================================================

function startRealtimeChat() {

    const messagesBox = $("chatMessages");

    if (!messagesBox) return;


    if (unsubscribeChat) {
        unsubscribeChat();
    }


    const messagesQuery = query(
        collection(db, "messages"),
        orderBy("createdAt", "asc")
    );


    unsubscribeChat = onSnapshot(
        messagesQuery,
        snapshot => {

            messagesBox.innerHTML = "";


            snapshot.forEach(messageDoc => {

                const data = messageDoc.data();

                const mine =
                    data.senderUid === currentUser?.uid ||
                    data.name === getUserName();


                const message = document.createElement("div");

                message.className =
                    mine
                        ? "message mine"
                        : "message other";


                let ticks = "";

                if (mine) {

                    const delivered =
                        Array.isArray(data.deliveredTo) &&
                        data.deliveredTo.length > 0;

                    const seen =
                        Array.isArray(data.seenBy) &&
                        data.seenBy.length > 0;


                    if (seen) {
                        ticks = " <span class='seen'>✓✓</span>";
                    }
                    else if (delivered) {
                        ticks = " <span>✓✓</span>";
                    }
                    else {
                        ticks = " <span>✓</span>";
                    }
                }


                message.innerHTML = `
                    <div class="message-name">
                        ${escapeHTML(data.name || "Student")}
                    </div>

                    <div class="message-text">
                        ${escapeHTML(data.message || "")}
                    </div>

                    <div class="message-time">
                        ${formatDateTime(data.createdAt)}
                        ${ticks}
                    </div>
                `;


                messagesBox.appendChild(message);


                // Incoming message को delivered mark करो
                if (
                    !mine &&
                    currentUser &&
                    !data.deliveredTo?.includes(currentUser.uid)
                ) {

                    updateDoc(
                        doc(db, "messages", messageDoc.id),
                        {
                            deliveredTo:
                                arrayUnion(currentUser.uid)
                        }
                    ).catch(() => {});
                }


                // Chat open होने पर seen
                if (
                    !mine &&
                    currentUser &&
                    document.visibilityState === "visible"
                ) {

                    updateDoc(
                        doc(db, "messages", messageDoc.id),
                        {
                            seenBy:
                                arrayUnion(currentUser.uid)
                        }
                    ).catch(() => {});
                }

            });


            messagesBox.scrollTop =
                messagesBox.scrollHeight;
        },

        error => {

            console.error(
                "Realtime Chat Error:",
                error
            );
        }
    );
}


// ============================================================
// SEND GENERAL CHAT MESSAGE
// ============================================================

async function sendMessage() {

    const input = $("messageInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    if (!currentUser) {

        alert("Firebase login अभी तैयार नहीं है।");
        return;
    }


    try {

        await addDoc(
            collection(db, "messages"),
            {
                name: getUserName(),
                senderUid: currentUser.uid,
                message: text,
                createdAt: serverTimestamp(),
                deliveredTo: [],
                seenBy: []
            }
        );


        input.value = "";

    } catch (error) {

        console.error(
            "Send Message Error:",
            error
        );

        alert("Message भेजा नहीं जा सका।");
    }
}


if ($("sendMessageBtn")) {

    $("sendMessageBtn")
        .addEventListener("click", sendMessage);
}


if ($("messageInput")) {

    $("messageInput")
        .addEventListener("keydown", event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }

        });
}


// ============================================================
// GROUPS - REAL TIME
// ============================================================

function startRealtimeGroups() {

    const groupList = $("groupList");

    if (!groupList) return;


    if (unsubscribeGroups) {
        unsubscribeGroups();
    }


    const groupsQuery = query(
        collection(db, "groups"),
        orderBy("createdAt", "asc")
    );


    unsubscribeGroups = onSnapshot(
        groupsQuery,
        snapshot => {

            groupList.innerHTML = "";


            snapshot.forEach(groupDoc => {

                const group = groupDoc.data();


                const item =
                    document.createElement("div");

                item.className = "group-item";


                const memberCount =
                    Array.isArray(group.memberUids)
                        ? group.memberUids.length
                        : Array.isArray(group.members)
                            ? group.members.length
                            : 0;


                item.innerHTML = `
                    <div>
                        <strong>
                            ${escapeHTML(group.name || "Group")}
                        </strong>

                        <small>
                            ${memberCount} members
                        </small>
                    </div>

                    <button
                        class="open-group-btn"
                        data-group-id="${groupDoc.id}">
                        Open
                    </button>
                `;


                groupList.appendChild(item);
            });


            document
                .querySelectorAll(".open-group-btn")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openGroup(
                                button.dataset.groupId
                            );

                        }
                    );

                });

        },

        error => {

            console.error(
                "Realtime Groups Error:",
                error
            );
        }
    );
}


// ============================================================
// CREATE GROUP
// ============================================================

async function createGroup() {

    const input = $("groupInput");

    if (!input) return;

    const groupName = input.value.trim();

    if (!groupName) {

        alert("Group का नाम लिखो।");
        return;
    }


    if (!currentUser) {

        alert("Firebase login तैयार नहीं है।");
        return;
    }


    try {

        await addDoc(
            collection(db, "groups"),
            {
                name: groupName,

                ownerUid:
                    currentUser.uid,

                owner:
                    getUserName(),

                memberUids: [
                    currentUser.uid
                ],

                members: [
                    {
                        name: getUserName(),
                        uid: currentUser.uid
                    }
