// ========================================
// STUDYCONNECT - FINAL JAVASCRIPT
// Made to match the existing index.html
// Firebase + Login + Real-Time Chat +
// Groups + Homework + School + Notes +
// Settings + Online Users
// ========================================


// ========================================
// FIREBASE IMPORT
// ========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
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


// ========================================
// FIREBASE CONFIG
// ========================================

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


// ========================================
// CONSTANTS
// ========================================

const OWNER_NAME = "Krishna Yadav";
const OWNER_SHORT_NAME = "Krishna";
const APP_PASSWORD = "123";

let selectedMessages = new Set();
let selectedItems = new Set();

let onlineHeartbeat = null;

let unsubscribeMessages = null;
let unsubscribeGroups = null;
let unsubscribeHomework = null;
let unsubscribeSchool = null;
let unsubscribeNotes = null;
let unsubscribeGroupMessages = null;


// ========================================
// HELPER FUNCTIONS
// ========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text ?? "";

    return div.innerHTML;
}


function getUserName() {

    return localStorage.getItem("studyName") || "";
}


function now() {

    return Date.now();
}


function formatDateTime(value) {

    if (!value) return "";

    let date;

    if (typeof value === "number") {

        date = new Date(value);

    } else if (value?.toDate) {

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


// ========================================
// PAGE NAVIGATION
// ========================================

function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {

        page.classList.remove("active");

    });


    const page = document.getElementById(pageId);

    if (page) {

        page.classList.add("active");

    }


    const navMenu =
        document.getElementById("navMenu");

    if (navMenu) {

        navMenu.classList.remove("show");

    }
}


document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        const page =
            button.getAttribute("data-page");

        showPage(page);

    });

});


document.querySelectorAll(".open-page").forEach(card => {

    card.addEventListener("click", () => {

        const page =
            card.getAttribute("data-page");

        showPage(page);

    });

});


// ========================================
// MENU
// ========================================

const menuBtn =
    document.getElementById("menuBtn");

const navMenu =
    document.getElementById("navMenu");


if (menuBtn && navMenu) {

    menuBtn.addEventListener("click", () => {

        navMenu.classList.toggle("show");

    });

}


// ========================================
// LOGIN
// ========================================

function createLoginFlow() {

    const screen =
        document.getElementById("passwordScreen");

    if (!screen) return;


    screen.innerHTML = `
        <div class="password-box" id="loginFlowBox">

            <h2 id="loginTitle">
                👤 User Name
            </h2>

            <p id="loginText">
                सबसे पहले अपना नाम लिखें।
            </p>

            <input
                type="text"
                id="loginUserName"
                placeholder="अपना नाम लिखें"
                autocomplete="name"
            >

            <input
                type="password"
                id="loginPassword"
                placeholder="Password"
                style="display:none;"
            >

            <button
                type="button"
                id="loginNextBtn">
                Next →
            </button>

            <p id="loginError"></p>

        </div>
    `;


    screen.style.display = "flex";


    const title =
        document.getElementById("loginTitle");

    const text =
        document.getElementById("loginText");

    const nameInput =
        document.getElementById("loginUserName");

    const passwordInput =
        document.getElementById("loginPassword");

    const nextBtn =
        document.getElementById("loginNextBtn");

    const error =
        document.getElementById("loginError");


    const savedName =
        localStorage.getItem("studyName");


    let step = savedName ? 2 : 1;


    if (savedName) {

        nameInput.value = savedName;

        nameInput.style.display = "none";

        passwordInput.style.display = "block";

        title.textContent = "🔐 Password";

        text.textContent =
            "अपना StudyConnect password डालें।";

        passwordInput.focus();

    }


    nextBtn.addEventListener("click", () => {


        // STEP 1
        if (step === 1) {

            const name =
                nameInput.value.trim();


            if (!name) {

                error.textContent =
                    "पहले अपना नाम लिखें।";

                return;
            }


            localStorage.setItem(
                "studyName",
                name
            );


            nameInput.style.display =
                "none";

            passwordInput.style.display =
                "block";


            title.textContent =
                "🔐 Password";

            text.textContent =
                "अब StudyConnect का password डालें।";

            nextBtn.textContent =
                "Next →";

            error.textContent = "";

            step = 2;

            passwordInput.focus();

            return;
        }


        // STEP 2
        if (step === 2) {

            if (
                passwordInput.value !==
                APP_PASSWORD
            ) {

                error.textContent =
                    "गलत password ❌";

                passwordInput.value = "";

                return;
            }


            passwordInput.style.display =
                "none";


            title.textContent =
                "👑 App Owner";


            text.innerHTML = `
                Owner:
                <strong>
                    ${escapeHTML(OWNER_NAME)}
                </strong>
                <br>
                <small>
                    (${escapeHTML(OWNER_SHORT_NAME)})
                </small>
            `;


            nextBtn.textContent =
                "Next →";

            error.textContent = "";

            step = 3;

            return;
        }


        // STEP 3
        if (step === 3) {

            title.textContent =
                "💬 StudyConnect";


            text.innerHTML = `
                Welcome,
                <strong>
                    ${escapeHTML(getUserName())}
                </strong>! 👋
                <br>
                <small>
                    Owner:
                    ${escapeHTML(OWNER_SHORT_NAME)}
                </small>
            `;


            nextBtn.textContent =
                "Open StudyConnect";

            step = 4;

            return;
        }


        // STEP 4
        screen.style.display = "none";


        showPage("school");


        startOnlineStatus();

    });


    [
        nameInput,
        passwordInput
    ].forEach(input => {

        input.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    nextBtn.click();

                }

            }
        );

    });
}


// ========================================
// NAME SETTINGS
// ========================================

function setupNameSettings() {

    const studentName =
        document.getElementById("studentName");

    const saveNameBtn =
        document.getElementById("saveNameBtn");

    const nameMessage =
        document.getElementById("nameMessage");


    if (!studentName || !saveNameBtn) {
        return;
    }


    const savedName =
        getUserName();


    if (savedName) {

        studentName.value =
            savedName;

        studentName.disabled =
            true;

        saveNameBtn.style.display =
            "none";


        if (nameMessage) {

            nameMessage.textContent =
                `Welcome, ${savedName}! 👋`;

        }

    }


    saveNameBtn.addEventListener(
        "click",
        () => {

            const name =
                studentName.value.trim();


            if (!name) {

                if (nameMessage) {

                    nameMessage.textContent =
                        "पहले अपना नाम लिखें।";

                }

                return;
            }


            localStorage.setItem(
                "studyName",
                name
            );


            studentName.disabled =
                true;

            saveNameBtn.style.display =
                "none";


            if (nameMessage) {

                nameMessage.textContent =
                    `Welcome, ${name}! 👋`;

            }


            updateOnlineUserName(name);

        }
    );


    const settingsBox =
        document.querySelector(
            ".settings-box"
        );


    if (
        settingsBox &&
        !document.getElementById(
            "changeNameBtn"
        )
    ) {

        const button =
            document.createElement("button");


        button.type = "button";

        button.id =
            "changeNameBtn";

        button.textContent =
            "✏️ Change Name";


        settingsBox.insertBefore(
            button,
            settingsBox.firstChild
        );


        button.addEventListener(
            "click",
            () => {

                studentName.disabled =
                    false;

                studentName.focus();

                saveNameBtn.style.display =
                    "inline-block";


                if (nameMessage) {

                    nameMessage.textContent =
                        "नया नाम लिखकर Save Name दबाएँ।";

                }

            }
        );
    }
}


// ========================================
// LONG PRESS DELETE
// ========================================

function addLongPressSelect(
    element,
    id,
    onDelete
) {

    let timer = null;


    const start = event => {

        if (
            event.target.closest("button") ||
            event.target.closest("input") ||
            event.target.closest("textarea")
        ) {

            return;

        }


        timer = setTimeout(() => {

            element.classList.toggle(
                "selected-item"
            );


            if (
                element.classList.contains(
                    "selected-item"
                )
            ) {

                selectedItems.add(id);

            } else {

                selectedItems.delete(id);

            }


            showDeleteBar(onDelete);

        }, 700);

    };


    const cancel = () => {

        if (timer) {

            clearTimeout(timer);

            timer = null;

        }

    };


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
        { passive: true }
    );

    element.addEventListener(
        "touchend",
        cancel
    );

    element.addEventListener(
        "touchmove",
        cancel
    );
}


function showDeleteBar(deleteCallback) {

    let bar =
        document.getElementById(
            "multiDeleteBar"
        );


    if (!bar) {

        bar =
            document.createElement("div");

        bar.id =
            "multiDeleteBar";


        bar.style.cssText = `
            position:fixed;
            left:10px;
            right:10px;
            bottom:15px;
            z-index:9999;
            padding:12px;
            border-radius:14px;
            background:#222;
            color:white;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
        `;


        document.body.appendChild(bar);
    }


    bar.innerHTML = `
        <span>
            ${selectedItems.size} selected
        </span>

        <button
            id="deleteSelectedBtn"
            type="button">
            🗑️ Delete
        </button>

        <button
            id="cancelSelectedBtn"
            type="button">
            Cancel
        </button>
    `;


    bar.querySelector(
        "#deleteSelectedBtn"
    ).onclick = async () => {

        if (!selectedItems.size) {
            return;
        }


        const yes =
            confirm(
                `क्या ${selectedItems.size} items delete करने हैं?`
            );


        if (!yes) return;


        await deleteCallback(
            [...selectedItems]
        );


        selectedItems.clear();

        bar.remove();

    };


    bar.querySelector(
        "#cancelSelectedBtn"
    ).onclick = () => {

        selectedItems.clear();


        document
            .querySelectorAll(
                ".selected-item"
            )
            .forEach(el =>
                el.classList.remove(
                    "selected-item"
                )
            );


        bar.remove();

    };
}


// ========================================
// CHAT ELEMENTS
// ========================================

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendMessageBtn =
    document.getElementById(
        "sendMessageBtn"
    );

const chatMessages =
    document.getElementById(
        "chatMessages"
    );

const emojiBtn =
    document.getElementById(
        "emojiBtn"
    );


// ========================================
// EMOJI
// ========================================

if (emojiBtn && messageInput) {

    emojiBtn.addEventListener(
        "click",
        () => {

            messageInput.value +=
                " 😊";

            messageInput.focus();

        }
    );
}


// ========================================
// MESSAGE TICKS
// ========================================

function getTickHTML(
    data,
    isMine
) {

    if (!isMine) {
        return "";
    }


    const seen =
        Array.isArray(data.seenBy) &&
        data.seenBy.length > 0;


    const delivered =
        data.delivered === true;


    if (seen) {

        return `
            <span
                class="message-tick blue-ticks"
                title="Seen">
                ✓✓
            </span>
        `;

    }


    if (delivered) {

        return `
            <span
                class="message-tick"
                title="Delivered">
                ✓✓
            </span>
        `;

    }


    return `
        <span
            class="message-tick"
            title="Sent">
            ✓
        </span>
    `;
}


// ========================================
// MARK MESSAGE SEEN
// ========================================

async function markMessageSeen(
    messageId,
    data
) {

    const name =
        getUserName();


    if (!name) return;


    if (data.name === name) {
        return;
    }


    const seenBy =
        Array.isArray(data.seenBy)
            ? data.seenBy
            : [];


    if (seenBy.includes(name)) {
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
                seenBy:
                    arrayUnion(name),

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


// ========================================
// REAL-TIME CHAT
// ========================================

function startRealtimeChat() {

    if (!chatMessages) {
        return;
    }


    if (unsubscribeMessages) {

        unsubscribeMessages();

    }


    const messagesQuery =
        query(
            collection(
                db,
                "messages"
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


                const currentName =
                    getUserName();


                snapshot.forEach(
                    messageDoc => {

                        const data =
                            messageDoc.data();


                        const name =
                            data.name ||
                            "Student";


                        const text =
                            data.message ||
                            "";


                        const isMine =
                            name ===
                            currentName;


                        const box =
                            document.createElement(
                                "div"
                            );


                        box.className =
                            isMine
                                ? "message mine"
                                : "message other";


                        box.innerHTML = `
                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <p>
                                ${escapeHTML(text)}
                                ${getTickHTML(
                                    data,
                                    isMine
                                )}
                            </p>

                            <small
                                class="message-time">
                                ${escapeHTML(
                                    formatDateTime(
                                        data.createdAt
                                    )
                                )}
                            </small>

                            ${
                                isMine &&
                                Array.isArray(
                                    data.seenBy
                                ) &&
                                data.seenBy.length
                                    ? `
                                    <small>
                                        👀 Seen by:
                                        ${escapeHTML(
                                            data.seenBy.join(
                                                ", "
                                            )
                                        )}
                                    </small>
                                    `
                                    : ""
                            }
                        `;


                        if (!isMine) {

                            markMessageSeen(
                                messageDoc.id,
                                data
                            );

                        }


                        addLongPressSelect(
                            box,
                            messageDoc.id,
                            async ids => {

                                for (
                                    const id of ids
                                ) {

                                    await deleteDoc(
                                        doc(
                                            db,
                                            "messages",
                                            id
                                        )
                                    );

                                }

                            }
                        );


                        chatMessages.appendChild(
                            box
                        );

                    }
                );


                chatMessages.scrollTop =
                    chatMessages.scrollHeight;

            },

            error => {

                console.error(
                    "Real-time chat error:",
                    error
                );

                chatMessages.innerHTML =
                    "<p>Chat load नहीं हो पाया।</p>";

            }
        );
}


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    if (!messageInput) {
        return;
    }


    const text =
        messageInput.value.trim();


    const name =
        getUserName();


    if (!text) {
        return;
    }


    if (!name) {

        alert(
            "पहले अपना नाम Save करें।"
        );

        showPage("home");

        return;
    }


    try {

        await addDoc(
            collection(
                db,
                "messages"
            ),
            {
                name,
                message: text,
                createdAt: now(),
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

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ========================================
// SCHOOL
// ========================================

const schoolInput =
    document.getElementById(
        "schoolInput"
    );

const saveSchoolBtn =
    document.getElementById(
        "saveSchoolBtn"
    );

const schoolList =
    document.getElementById(
        "schoolList"
    );


function startRealtimeSchool() {

    if (!schoolList) {
        return;
    }


    if (unsubscribeSchool) {

        unsubscribeSchool();

    }


    const schoolQuery =
        query(
            collection(
                db,
                "school"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    unsubscribeSchool =
        onSnapshot(
            schoolQuery,
            snapshot => {

                schoolList.innerHTML =
                    "";


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();


                        const box =
                            document.createElement(
                                "div"
                            );


                        box.className =
                            "school-item";


                        const seenBy =
                            Array.isArray(
                                data.seenBy
                            )
                                ? data.seenBy
                                : [];


                        box.innerHTML = `
                            <strong>
                                🏫
                                ${escapeHTML(
                                    data.name ||
                                    "Student"
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    data.update ||
                                    ""
                                )}
                            </p>

                            <small>
                                ${escapeHTML(
                                    formatDateTime(
                                        data.createdAt
                                    )
                                )}
                            </small>

                            ${
                                seenBy.length
                                    ? `
                                    <br>
                                    <small>
                                        👀 Seen by:
                                        ${escapeHTML(
                                            seenBy.join(
                                                ", "
                                            )
                                        )}
                                    </small>
                                    `
                                    : ""
                            }
                        `;


                        addLongPressSelect(
                            box,
                            item.id,
                            async ids => {

                                for (
                                    const id of ids
                                ) {

                                    await deleteDoc(
                                        doc(
                                            db,
                                            "school",
                                            id
                                        )
                                    );

                                }

                            }
                        );


                        schoolList.appendChild(
                            box
                        );

                    }
                );

            },

            error => {

                console.error(
                    "School realtime error:",
                    error
                );

            }
        );
}


if (
    saveSchoolBtn &&
    schoolInput
) {

    saveSchoolBtn.addEventListener(
        "click",
        async () => {

            const update =
                schoolInput.value.trim();


            const name =
                getUserName();


            if (!update) {

                alert(
                    "School update लिखें।"
                );

                return;
            }


            if (!name) {

                alert(
                    "पहले अपना नाम Save करें।"
                );

                return;
            }


            try {

                await addDoc(
                    collection(
                        db,
                        "school"
                    ),
                    {
                        name,
                        update,
                        createdAt: now(),
                        seenBy: [name]
                    }
                );


                schoolInput.value = "";


                alert(
                    "School update save हो गया।"
                );


            } catch (error) {

                console.error(
                    "School save error:",
                    error
                );

                alert(
                    "School update save नहीं हुआ।"
                );

            }

        }
    );

}


// ========================================
// NOTES
// ========================================

const noteInput =
    document.getElementById(
        "noteInput"
    );

const saveNoteBtn =
    document.getElementById(
        "saveNoteBtn"
    );

const notesList =
    document.getElementById(
        "notesList"
    );


function startRealtimeNotes() {

    if (!notesList) {
        return;
    }


    if (unsubscribeNotes) {

        unsubscribeNotes();

    }


    const notesQuery =
        query(
            collection(
                db,
                "notes"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    unsubscribeNotes =
        onSnapshot(
            notesQuery,
            snapshot => {

                notesList.innerHTML =
                    "";


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();


                        const box =
                            document.createElement(
                                "div"
                            );


                        box.className =
                            "note-item";


                        const seenBy =
                            Array.isArray(
                                data.seenBy
                            )
                                ? data.seenBy
                                : [];


                        box.innerHTML = `
                            <strong>
                                📝
                                ${escapeHTML(
                                    data.name ||
                                    "Student"
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    data.note ||
                                    ""
                                )}
                            </p>

                            <small>
                                ${escapeHTML(
                                    formatDateTime(
                                        data.createdAt
                                    )
                                )}
                            </small>

                            ${
                                seenBy.length
                                    ? `
                                    <br>
                                    <small>
                                        👀 Seen by:
                                        ${escapeHTML(
                                            seenBy.join(
                                                ", "
                                            )
                                        )}
                                    </small>
                                    `
                                    : ""
                            }
                        `;


                        addLongPressSelect(
                            box,
                            item.id,
                            async ids => {

                                for (
                                    const id of ids
                                ) {

                                    await deleteDoc(
                                        doc(
                                            db,
                                            "notes",
                                            id
                                        )
                                    );

                                }

                            }
                        );


                        notesList.appendChild(
                            box
                        );

                    }
                );

            },

            error => {

                console.error(
                    "Notes realtime error:",
                    error
                );

            }
        );
}


if (
    saveNoteBtn &&
    noteInput
) {

    saveNoteBtn.addEventListener(
        "click",
        async () => {

            const note =
                noteInput.value.trim();


            const name =
                getUserName();


            if (!note) {

                alert(
                    "Note लिखें।"
                );

                return;
            }


            if (!name) {

                alert(
                    "पहले अपना नाम Save करें।"
                );

                return;
            }


            try {

                await addDoc(
                    collection(
                        db,
                        "notes"
                    ),
                    {
                        name,
                        note,
                        createdAt: now(),
                        seenBy: [name]
                    }
                );


                noteInput.value = "";


                alert(
                    "Note save हो गया।"
                );


            } catch (error) {

                console.error(
                    "Note save error:",
                    error
                );

                alert(
                    "Note save नहीं हुआ।"
                );

            }

        }
    );

}


// ========================================
// HOMEWORK
// ========================================

const homeworkDate =
    document.getElementById(
        "homeworkDate"
    );

const hindiHomework =
    document.getElementById(
        "hindiHomework"
    );

const englishHomework =
    document.getElementById(
        "englishHomework"
    );

const mathHomework =
    document.getElementById(
        "mathHomework"
    );

const scienceHomework =
    document.getElementById(
        "scienceHomework"
    );

const sstHomework =
    document.getElementById(
        "sstHomework"
    );

const computerHomework =
    document.getElementById(
        "computerHomework"
    );

const artHomework =
    document.getElementById(
        "artHomework"
    );

const addHomeworkBtn =
    document.getElementById(
        "addHomeworkBtn"
    );

const homeworkList =
    document.getElementById(
        "homeworkList"
    );


// ========================================
// REAL-TIME HOMEWORK
// ========================================

function startRealtimeHomework() {

    if (!homeworkList) {
        return;
    }


    if (unsubscribeHomework) {

        unsubscribeHomework();

    }


    const homeworkQuery =
        query(
            collection(
                db,
                "homework"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    unsubscribeHomework =
        onSnapshot(
            homeworkQuery,
            snapshot => {

                homeworkList.innerHTML =
                    "";


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();


                        const box =
                            document.createElement(
                                "div"
                            );


                        box.className =
                            "homework-item";


                        box.innerHTML = `
                            <h3>
                                📅
                                ${escapeHTML(
                                    data.date ||
                                    ""
                                )}
                            </h3>

                            <p>
                                <strong>
                                    📖 Hindi:
                                </strong>
                                ${escapeHTML(
                                    data.hindi ||
                                    ""
                                )}
                            </p>

                            <p>
                                <strong>
                                    🔤 English:
                                </strong>
                                ${escapeHTML(
                                    data.english ||
                                    ""
                                )}
                            </p>

                            <p>
                                <strong>
                                    ➗ Maths:
                                </strong>
                                ${escapeHTML(
                                    data.maths ||
                                    ""
                                )}
                            </p>

                            <p>
                                <strong>
                                    🔬 Science:
                                </strong>
                                ${escapeHTML(
                                    data.science ||
                                    ""
                                )}
                            </p>

                            <p>
                                <strong>
                                    🌍 SST:
                                </strong>
                                ${escapeHTML(
                                    data.sst ||
                                    ""
                                )}
                            </p>

                            <p>
                                <strong>
                                    💻 Computer:
                                </strong>
                                ${escapeHTML(
                                    data.computer ||
                                    ""
                                )}
                            </p>

                            <p>
                                <strong>
                                    🎨 Art:
                                </strong>
                                ${escapeHTML(
                                    data.art ||
                                    ""
                                )}
                            </p>

                            <small>
                                👤
                                ${escapeHTML(
                                    data.name ||
                                    "Student"
                                )}
                            </small>

                            <br>

                            <small>
                                ${escapeHTML(
                                    formatDateTime(
                                        data.createdAt
                                    )
                                )}
                            </small>
                        `;


                        addLongPressSelect(
                            box,
                            item.id,
                            async ids => {

                                for (
                                    const id of ids
                                ) {

                                    await deleteDoc(
                                        doc(
                                            db,
                                            "homework",
                                            id
                                        )
                                    );

                                }

                            }
                        );


                        homeworkList.appendChild(
                            box
                        );

                    }
                );

            },

            error => {

                console.error(
                    "Homework realtime error:",
                    error
                );

            }
        );
}


// ========================================
// SAVE HOMEWORK
// ========================================

if (addHomeworkBtn) {

    addHomeworkBtn.addEventListener(
        "click",
        async () => {

            const date =
                homeworkDate?.value ||
                "";


            const name =
                getUserName();


            if (!date) {

                alert(
                    "पहले Date चुनें।"
                );

                return;
            }


            if (!name) {

                alert(
                    "पहले अपना नाम Save करें।"
                );

                return;
            }


            try {

                addHomeworkBtn.disabled =
                    true;


                addHomeworkBtn.textContent =
                    "⏳ Saving...";


                await addDoc(
                    collection(
                        db,
                        "homework"
                    ),
                    {
                        date,

                        hindi:
                            hindiHomework?.value.trim() ||
                            "",

                        english:
                            englishHomework?.value.trim() ||
                            "",

                        maths:
                            mathHomework?.value.trim() ||
                            "",

                        science:
                            scienceHomework?.value.trim() ||
                            "",

                        sst:
                            sstHomework?.value.trim() ||
                            "",

                        computer:
                            computerHomework?.value.trim() ||
                            "",

                        art:
                            artHomework?.value.trim() ||
                            "",

                        name,

                        createdAt: now()
                    }
                );


                [
                    homeworkDate,
                    hindiHomework,
                    englishHomework,
                    mathHomework,
                    scienceHomework,
                    sstHomework,
                    computerHomework,
                    artHomework
                ].forEach(input => {

                    if (input) {
                        input.value = "";
                    }

                });


                alert(
                    "✅ Homework Save हो गया!"
                );


            } catch (error) {

                console.error(
                    "Homework save error:",
                    error
                );

                alert(
                    "Homework save नहीं हुआ।"
                );


            } finally {

                addHomeworkBtn.disabled =
                    false;

                addHomeworkBtn.textContent =
                    "💾 Save Homework";

            }

        }
    );

}


// ========================================
// GROUPS
// ========================================

const groupInput =
    document.getElementById(
        "groupInput"
    );

const createGroupBtn =
    document.getElementById(
        "createGroupBtn"
    );

const groupList =
    document.getElementById(
        "groupList"
    );


// ========================================
// REAL-TIME GROUPS
// ========================================

function startRealtimeGroups() {

    if (!groupList) {
        return;
    }


    if (unsubscribeGroups) {

        unsubscribeGroups();

    }


    const groupsQuery =
        query(
            collection(
                db,
                "groups"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    unsubscribeGroups =
        onSnapshot(
            groupsQuery,
            snapshot => {

                groupList.innerHTML =
                    "";


                snapshot.forEach(
                    item => {

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


                        addLongPressSelect(
                            box,
                            item.id,
                            async ids => {

                                for (
                                    const id of ids
                                ) {

                                    await deleteDoc(
                                        doc(
                                            db,
                                            "groups",
                                            id
                                        )
                                    );

                                }

                            }
                        );


                        groupList.appendChild(
                            box
                        );

                    }
                );

            },

            error => {

                console.error(
                    "Groups realtime error:",
                    error
                );

            }
        );
}


// ========================================
// CREATE GROUP
// ========================================

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


            try {

                await addDoc(
                    collection(
                        db,
                        "groups"
                    ),
                    {
                        name,

                        owner,

                        members: [
                            owner
                        ],

                        createdAt: now()
                    }
                );


                groupInput.value = "";


                alert(
                    "👥 Group create हो गया!"
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


// ========================================
// OPEN GROUP
// ========================================

function openGroup(
    groupId,
    groupData
) {

    const memberText =
        Array.isArray(
            groupData.members
        )
            ? groupData.members.join(
                ", "
            )
            : "";


    alert(
        `👥 ${groupData.name}\n\n` +

        `Members:\n${memberText}\n\n` +

        `Group ID: ${groupId}\n\n` +

        `Group real-time data Firebase में मौजूद है।`
    );

}


// ========================================
// ONLINE USERS
// ========================================

async function updateOnlineUserName(
    name = getUserName()
) {

    if (!name) {
        return;
    }


    const safeId =
        btoa(
            unescape(
                encodeURIComponent(name)
            )
        ).replace(
            /[^a-zA-Z0-9]/g,
            ""
        );


    try {

        await setDoc(
            doc(
                db,
                "onlineUsers",
                safeId
            ),
            {
                name,

                online: true,

                lastSeen: now()
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


// ========================================
// REAL-TIME ONLINE LIST
// ========================================

function startOnlineRealtime() {

    const onlineCount =
        document.getElementById(
            "onlineCount"
        );

    const onlineUsers =
        document.getElementById(
            "onlineUsers"
        );


    if (!onlineCount) {
        return;
    }


    onSnapshot(
        collection(
            db,
            "onlineUsers"
        ),
        snapshot => {

            let count = 0;

            const names = [];


            snapshot.forEach(
                item => {

                    const data =
                        item.data();


                    const lastSeen =
                        Number(
                            data.lastSeen || 0
                        );


                    const isRecentlyOnline =
                        data.online === true &&
                        (
                            !lastSeen ||
                            Date.now() -
                            lastSeen <
                            70000
                        );


                    if (
                        isRecentlyOnline
                    ) {

                        count++;

                        names.push(
                            data.name ||
                            "Student"
                        );

                    }

                }
            );


            onlineCount.textContent =
                count;


            if (onlineUsers) {

                onlineUsers.innerHTML =
                    names.map(
                        name => `
                            <div>
                                🟢
                                ${escapeHTML(name)}
                            </div>
                        `
                    ).join("");

            }

        }
    );
}


// ========================================
// ONLINE HEARTBEAT
// ========================================

function startOnlineStatus() {

    if (onlineHeartbeat) {

        clearInterval(
            onlineHeartbeat
        );

    }


    updateOnlineUserName();


    startOnlineRealtime();


    onlineHeartbeat =
        setInterval(
            () => {

                updateOnlineUserName();

            },
            30000
        );


    window.addEventListener(
        "beforeunload",
        async () => {

            const name =
                getUserName();


            if (!name) {
                return;
            }


            const safeId =
                btoa(
                    unescape(
                        encodeURIComponent(name)
                    )
                ).replace(
                    /[^a-zA-Z0-9]/g,
                    ""
                );


            try {

                await updateDoc(
                    doc(
                        db,
                        "onlineUsers",
                        safeId
                    ),
                    {
                        online: false,
                        lastSeen: now()
                    }
                );

            } catch (_) {}

        }
    );
}


// ========================================
// LANGUAGE
// ========================================

const translations = {

    hi: {

        home: "🏠 Home",
        chat: "💬 Chat",
        groups: "👥 Groups",
        homework: "📚 Homework",
        school: "🏫 School",
        notes: "📝 Notes",
        settings: "⚙️ Settings",

        saveName: "Save Name",
        saveSchool: "Save Update",
        saveNote: "Save Note",
        send: "Send"

    },


    en: {

        home: "🏠 Home",
        chat: "💬 Chat",
        groups: "👥 Groups",
        homework: "📚 Homework",
        school: "🏫 School",
        notes: "📝 Notes",
        settings: "⚙️ Settings",

        saveName: "Save Name",
        saveSchool: "Save Update",
        saveNote: "Save Note",
        send: "Send"

    }

};


function applyLanguage(
    language
) {

    localStorage.setItem(
        "studyLanguage",
        language
    );


    const t =
        translations[language] ||
        translations.hi;


    document.querySelectorAll(
        "[data-page]"
    ).forEach(button => {

        const page =
            button.getAttribute(
                "data-page"
            );


        if (t[page]) {

            button.textContent =
                t[page];

        }

    });


    const send =
        document.getElementById(
            "sendMessageBtn"
        );


    if (send) {
        send.textContent =
            t.send;
    }


    const saveName =
        document.getElementById(
            "saveNameBtn"
        );


    if (saveName) {

        saveName.textContent =
            t.saveName;

    }


    const saveSchool =
        document.getElementById(
            "saveSchoolBtn"
        );


    if (saveSchool) {

        saveSchool.textContent =
            t.saveSchool;

    }


    const saveNote =
        document.getElementById(
            "saveNoteBtn"
        );


    if (saveNote) {

        saveNote.textContent =
            t.saveNote;

    }

}


// ========================================
// LANGUAGE SETTING
// ========================================

function setupLanguageSetting() {

    const settingsBox =
        document.querySelector(
            ".settings-box"
        );


    if (!settingsBox) {
        return;
    }


    if (
        document.getElementById(
            "languageSelect"
        )
    ) {

        return;
    }


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        "🌐 Language";


    const select =
        document.createElement(
            "select"
        );


    select.id =
        "languageSelect";


    select.innerHTML = `
        <option value="hi">
            🇮🇳 हिंदी
        </option>

        <option value="en">
            🇬🇧 English
        </option>
    `;


    const savedLanguage =
        localStorage.getItem(
            "studyLanguage"
        ) || "hi";


    select.value =
        savedLanguage;


    select.addEventListener(
        "change",
        () => {

            applyLanguage(
                select.value
            );

        }
    );


    settingsBox.appendChild(
        label
    );

    settingsBox.appendChild(
        select
    );


    applyLanguage(
        savedLanguage
    );

}


// ========================================
// DARK MODE
// ========================================

const themeBtn =
    document.getElementById(
        "themeBtn"
    );


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            localStorage.setItem(
                "darkMode",
                document.body.classList.contains(
                    "dark"
                )
            );

        }
    );

}


if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

}


// ========================================
// OWNER INFO
// ========================================

function setupOwnerInfo() {

    const settingsBox =
        document.querySelector(
            ".settings-box"
        );


    if (!settingsBox) {
        return;
    }


    if (
        document.getElementById(
            "ownerInfo"
        )
    ) {

        return;
    }


    const info =
        document.createElement(
            "div"
        );


    info.id =
        "ownerInfo";


    info.innerHTML = `
        <hr>

        <p>
            👑
            <strong>
                App Owner:
            </strong>
            ${escapeHTML(
                OWNER_NAME
            )}
        </p>

        <p>
            💬
            <strong>
                App:
            </strong>
            StudyConnect
        </p>
    `;


    settingsBox.appendChild(
        info
    );

}


// ========================================
// RESET LOCAL DATA
// ========================================

const clearDataBtn =
    document.getElementById(
        "clearDataBtn"
    );


if (clearDataBtn) {

    clearDataBtn.addEventListener(
        "click",
        () => {

            const yes =
                confirm(
                    "क्या आप इस device का local StudyConnect data reset करना चाहते हैं?"
                );


            if (!yes) {
                return;
            }


            localStorage.removeItem(
                "studyName"
            );

            localStorage.removeItem(
                "studyLanguage"
            );

            localStorage.removeItem(
                "darkMode"
            );


            sessionStorage.clear();


            location.reload();

        }
    );

}


// ========================================
// START EVERYTHING
// ========================================

setupNameSettings();

setupLanguageSetting();

setupOwnerInfo();

createLoginFlow();

startRealtimeChat();

startRealtimeHomework();

startRealtimeSchool();

startRealtimeNotes();

startRealtimeGroups();

console.log(
    "StudyConnect FINAL JavaScript loaded successfully."
);
