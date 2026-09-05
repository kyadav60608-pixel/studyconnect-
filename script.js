// ======================================================
// STUDYCONNECT - COMPLETE JAVASCRIPT
// Login + Firebase + Chat + Groups + Homework
// School + Notes + Settings + Online Users
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
    onSnapshot
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// FIREBASE
// ======================================================

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


// ======================================================
// APP SETTINGS
// ======================================================

const APP_PASSWORD = "123";

const OWNER_NAME = "Krishna Yadav";

// अपना पूरा मोबाइल नंबर यहाँ डालना
const OWNER_PHONE = "87380";

const OWNER_PASSWORD = "12341";


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentUser = {
    name: "",
    phone: ""
};

let chatUnsubscribe = null;
let onlineUnsubscribe = null;
let onlineHeartbeat = null;

let selectedItems = new Set();


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}


function normalizePhone(phone) {
    return String(phone || "")
        .replace(/\D/g, "")
        .slice(-10);
}


function getSavedName() {
    return localStorage.getItem("studyName") || "";
}


function getSavedPhone() {
    return localStorage.getItem("studyPhone") || "";
}


function setUser(name, phone) {
    currentUser.name = name;
    currentUser.phone = phone;

    localStorage.setItem("studyName", name);
    localStorage.setItem("studyPhone", phone);
}


function clearUser() {
    currentUser = {
        name: "",
        phone: ""
    };

    localStorage.removeItem("studyName");
    localStorage.removeItem("studyPhone");
}


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


// ======================================================
// NAVIGATION
// ======================================================

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        const page = button.getAttribute("data-page");

        showPage(page);

    });

});


document.querySelectorAll(".open-page").forEach(card => {

    card.addEventListener("click", () => {

        const page = card.getAttribute("data-page");

        showPage(page);

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
// LOGIN SYSTEM
//
// Password
//    ↓
// Owner
//    ↓
// Name + Mobile
//    ↓
// Firebase Permission
//    ↓
// StudyConnect
// ======================================================

const passwordScreen =
    document.getElementById("passwordScreen");

const schoolPasswordStep =
    document.getElementById("schoolPasswordStep");

const appPassword =
    document.getElementById("appPassword");

const unlockBtn =
    document.getElementById("unlockBtn");

const ownerStep =
    document.getElementById("ownerStep");

const ownerNameDisplay =
    document.getElementById("ownerNameDisplay");

const ownerNextBtn =
    document.getElementById("ownerNextBtn");

const userDetailsStep =
    document.getElementById("userDetailsStep");

const openUserName =
    document.getElementById("openUserName");

const openUserPhone =
    document.getElementById("openUserPhone");

const enterAppBtn =
    document.getElementById("enterAppBtn");

const passwordError =
    document.getElementById("passwordError");


// ======================================================
// CONTACT OWNER
// ======================================================

const contactOwnerScreen =
    document.getElementById("contactOwnerScreen");

const callOwnerBtn =
    document.getElementById("callOwnerBtn");

const whatsappOwnerBtn =
    document.getElementById("whatsappOwnerBtn");

const backToLoginBtn =
    document.getElementById("backToLoginBtn");


function showContactOwner() {

    if (passwordScreen) {
        passwordScreen.style.display = "none";
    }

    if (contactOwnerScreen) {
        contactOwnerScreen.style.display = "flex";
    }

}


function showPasswordScreen() {

    if (contactOwnerScreen) {
        contactOwnerScreen.style.display = "none";
    }

    if (passwordScreen) {
        passwordScreen.style.display = "flex";
    }

    resetLoginSteps();

}


function resetLoginSteps() {

    if (schoolPasswordStep) {
        schoolPasswordStep.style.display = "block";
    }

    if (ownerStep) {
        ownerStep.style.display = "none";
    }

    if (userDetailsStep) {
        userDetailsStep.style.display = "none";
    }

    if (appPassword) {
        appPassword.value = "";
    }

    if (openUserName) {
        openUserName.value = "";
    }

    if (openUserPhone) {
        openUserPhone.value = "";
    }

    if (passwordError) {
        passwordError.textContent = "";
    }

}


if (backToLoginBtn) {

    backToLoginBtn.addEventListener("click", () => {

        showPasswordScreen();

    });

}


// ======================================================
// PASSWORD
// ======================================================

if (unlockBtn) {

    unlockBtn.addEventListener("click", () => {

        const password =
            appPassword?.value.trim() || "";

        if (password !== APP_PASSWORD) {

            if (passwordError) {
                passwordError.textContent =
                    "गलत Password ❌";
            }

            if (appPassword) {
                appPassword.value = "";
                appPassword.focus();
            }

            return;
        }


        if (schoolPasswordStep) {
            schoolPasswordStep.style.display = "none";
        }

        if (ownerStep) {
            ownerStep.style.display = "block";
        }

        if (ownerNameDisplay) {
            ownerNameDisplay.textContent = OWNER_NAME;
        }

        if (passwordError) {
            passwordError.textContent = "";
        }

    });

}


// ======================================================
// OWNER NEXT
// ======================================================

if (ownerNextBtn) {

    ownerNextBtn.addEventListener("click", () => {

        if (ownerStep) {
            ownerStep.style.display = "none";
        }

        if (userDetailsStep) {
            userDetailsStep.style.display = "block";
        }

        if (openUserName) {
            openUserName.focus();
        }

    });

}


// ======================================================
// CHECK USER PERMISSION
// ======================================================

async function checkUserPermission(name, phone) {

    const cleanName =
        name.trim().toLowerCase();

    const cleanPhone =
        normalizePhone(phone);


    // --------------------------------------------------
    // OWNER BYPASS
    // --------------------------------------------------

    const ownerNameMatch =
        cleanName === OWNER_NAME.toLowerCase();

    const ownerPhoneMatch =
        cleanPhone === normalizePhone(OWNER_PHONE);


    if (ownerNameMatch && ownerPhoneMatch) {

        return true;

    }


    // --------------------------------------------------
    // FIREBASE ALLOWED USERS
    // --------------------------------------------------

    try {

        const usersRef =
            collection(db, "allowedUsers");

        const q =
            query(
                usersRef,
                where("phone", "==", cleanPhone)
            );

        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {
            return false;
        }


        let allowed = false;


        snapshot.forEach(item => {

            const data = item.data();

            const allowedName =
                String(data.name || "")
                    .trim()
                    .toLowerCase();

            const allowedPhone =
                normalizePhone(data.phone);

            if (
                allowedName === cleanName &&
                allowedPhone === cleanPhone
            ) {

                allowed = true;

            }

        });


        return allowed;

    } catch (error) {

        console.error(
            "Permission check error:",
            error
        );

        return false;

    }

}


// ======================================================
// ENTER APP
// ======================================================

if (enterAppBtn) {

    enterAppBtn.addEventListener("click", async () => {

        const name =
            openUserName?.value.trim() || "";

        const phone =
            normalizePhone(
                openUserPhone?.value || ""
            );


        if (!name) {

            alert("अपना नाम लिखें।");

            return;

        }


        if (phone.length !== 10) {

            alert("सही 10 अंकों का मोबाइल नंबर डालें।");

            return;

        }


        enterAppBtn.disabled = true;

        enterAppBtn.textContent =
            "Checking...";


        try {

            const allowed =
                await checkUserPermission(
                    name,
                    phone
                );


            if (!allowed) {

                showContactOwner();

                return;

            }


            // ------------------------------------------
            // USER ALLOWED
            // ------------------------------------------

            setUser(name, phone);


            if (passwordScreen) {
                passwordScreen.style.display = "none";
            }

            if (contactOwnerScreen) {
                contactOwnerScreen.style.display = "none";
            }

            const appContainer =
                document.getElementById("appContainer");

            if (appContainer) {
                appContainer.style.display = "block";
            }


            updateHomeUser();

            setupNameSettings();

            startOnlineStatus();

            showPage("home");


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                "Login में समस्या आई। Firebase connection check करें।"
            );

        } finally {

            enterAppBtn.disabled = false;

            enterAppBtn.textContent =
                "Open StudyConnect";

        }

    });

}


// ======================================================
// AUTO LOGIN
// ======================================================

function checkExistingLogin() {

    const name = getSavedName();
    const phone = getSavedPhone();

    if (!name || !phone) {

        return;

    }


    checkUserPermission(name, phone)
        .then(allowed => {

            if (!allowed) {

                clearUser();

                return;

            }


            setUser(name, phone);


            if (passwordScreen) {
                passwordScreen.style.display = "none";
            }

            if (contactOwnerScreen) {
                contactOwnerScreen.style.display = "none";
            }

            const appContainer =
                document.getElementById("appContainer");

            if (appContainer) {
                appContainer.style.display = "block";
            }

            updateHomeUser();

            startOnlineStatus();

        })
        .catch(error => {

            console.error(
                "Auto login error:",
                error
            );

        });

}


// ======================================================
// HOME USER
// ======================================================

function updateHomeUser() {

    const studentName =
        document.getElementById("studentName");

    const homeUserName =
        document.getElementById("homeUserName");

    const currentUserProfile =
        document.getElementById("currentUserProfile");


    const name = getSavedName();


    if (studentName) {

        studentName.value = name;

        studentName.disabled = true;

    }


    if (homeUserName) {

        homeUserName.textContent =
            name || "Student";

    }


    if (currentUserProfile) {

        currentUserProfile.textContent =
            name || "Student";

    }

}


// ======================================================
// NAME SETTINGS
// Save Name button disappears after saving
// ======================================================

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
        getSavedName();


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

        return;

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


            // SAVE BUTTON HIDE
            saveNameBtn.style.display =
                "none";


            if (nameMessage) {

                nameMessage.textContent =
                    `Welcome, ${name}! 👋`;

            }


            updateHomeUser();

            updateOnlineUserName(name);

        }
    );

}


// ======================================================
// CHAT
// ======================================================

const messageInput =
    document.getElementById("messageInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

const chatMessages =
    document.getElementById("chatMessages");

const emojiBtn =
    document.getElementById("emojiBtn");


function formatDateTime(value) {

    if (!value) {
        return "";
    }

    const date =
        typeof value === "number"
            ? new Date(value)
            : value?.toDate
                ? value.toDate()
                : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function getTickHTML(data, mine) {

    if (!mine) {
        return "";
    }


    const seen =
        Array.isArray(data.seenBy) &&
        data.seenBy.length > 0;


    if (seen) {

        return `
            <span class="message-tick blue-ticks">
                ✓✓
            </span>
        `;

    }


    if (data.delivered === true) {

        return `
            <span class="message-tick">
                ✓✓
            </span>
        `;

    }


    return `
        <span class="message-tick">
            ✓
        </span>
    `;

}


async function markMessageSeen(
    messageId,
    data
) {

    const name =
        getSavedName();

    if (!name) {
        return;
    }

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
                delivered: true,
                seenBy: [
                    ...seenBy,
                    name
                ]
            }
        );

    } catch (error) {

        console.error(
            "Seen error:",
            error
        );

    }

}


function renderChat(snapshot) {

    if (!chatMessages) {
        return;
    }


    chatMessages.innerHTML = "";


    if (snapshot.empty) {

        chatMessages.innerHTML = `
            <div class="message other">
                <strong>StudyConnect</strong>
                <p>अभी कोई message नहीं है। 👋</p>
            </div>
        `;

        return;

    }


    const myName =
        getSavedName();


    snapshot.forEach(item => {

        const data =
            item.data();

        const name =
            data.name || "Student";

        const text =
            data.message || "";

        const mine =
            name === myName;


        const box =
            document.createElement("div");


        box.className =
            mine
                ? "message mine"
                : "message other";


        const seenBy =
            Array.isArray(data.seenBy)
                ? data.seenBy
                : [];


        box.innerHTML = `
            <strong>
                ${escapeHTML(name)}
            </strong>

            <p>
                ${escapeHTML(text)}

                ${getTickHTML(
                    data,
                    mine
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
                mine && seenBy.length
                    ? `
                        <br>
                        <small>
                            👀 Seen by:
                            ${escapeHTML(
                                seenBy.join(", ")
                            )}
                        </small>
                    `
                    : ""
            }
        `;


        if (!mine) {

            markMessageSeen(
                item.id,
                data
            );

        }


        chatMessages.appendChild(box);

    });


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


function startChatListener() {

    if (!chatMessages) {
        return;
    }


    if (chatUnsubscribe) {

        chatUnsubscribe();

    }


    try {

        const q =
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


        chatUnsubscribe =
            onSnapshot(
                q,
                snapshot => {

                    renderChat(snapshot);

                },
                error => {

                    console.error(
                        "Chat listener error:",
                        error
                    );

                }
            );

    } catch (error) {

        console.error(
            "Chat start error:",
            error
        );

    }

}


async function sendMessage() {

    if (!messageInput) {
        return;
    }


    const text =
        messageInput.value.trim();

    const name =
        getSavedName();


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
                createdAt: Date.now(),
                delivered: false,
                seenBy: []
            }
        );


        messageInput.value = "";

    } catch (error) {

        console.error(
            "Send message error:",
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


if (emojiBtn) {

    emojiBtn.addEventListener(
        "click",
        () => {

            if (messageInput) {

                messageInput.value += " 😊";

                messageInput.focus();

            }

        }
    );

}


// ======================================================
// ONLINE USERS
// ======================================================

function makeSafeId(name) {

    return btoa(
        unescape(
            encodeURIComponent(name)
        )
    ).replace(
        /[^a-zA-Z0-9]/g,
        ""
    );

}


async function updateOnlineUserName(
    name = getSavedName()
) {

    if (!name) {
        return;
    }


    const id =
        makeSafeId(name);


    try {

        await setDoc(
            doc(
                db,
                "onlineUsers",
                id
            ),
            {
                name,
                online: true,
                lastSeen: Date.now()
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


function startOnlineStatus() {

    if (onlineHeartbeat) {

        clearInterval(
            onlineHeartbeat
        );

    }


    updateOnlineUserName();


    onlineHeartbeat =
        setInterval(
            () => {

                updateOnlineUserName();

            },
            30000
        );


    startOnlineListener();

}


function startOnlineListener() {

    const onlineUsers =
        document.getElementById(
            "onlineUsers"
        );

    const onlineCount =
        document.getElementById(
            "onlineCount"
        );


    if (!onlineUsers) {
        return;
    }


    if (onlineUnsubscribe) {

        onlineUnsubscribe();

    }


    const q =
        query(
            collection(
                db,
                "onlineUsers"
            )
        );


    onlineUnsubscribe =
        onSnapshot(
            q,
            snapshot => {

                onlineUsers.innerHTML = "";

                let count = 0;

                const now =
                    Date.now();


                snapshot.forEach(item => {

                    const data =
                        item.data();


                    const lastSeen =
                        Number(
                            data.lastSeen || 0
                        );


                    const isOnline =
                        data.online === true &&
                        now - lastSeen <
                            90000;


                    if (!isOnline) {
                        return;
                    }


                    count++;


                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "online-user-item";


                    div.textContent =
                        "🟢 " +
                        (
                            data.name ||
                            "Student"
                        );


                    onlineUsers.appendChild(
                        div
                    );

                });


                if (onlineCount) {

                    onlineCount.textContent =
                        count;

                }

            }
        );

}


// ======================================================
// ONLINE BUTTON
// ======================================================

const onlineToggleBtn =
    document.getElementById(
        "onlineToggleBtn"
    );

const onlineUsers =
    document.getElementById(
        "onlineUsers"
    );

const onlineArrow =
    document.getElementById(
        "onlineArrow"
    );


if (onlineToggleBtn) {

    onlineToggleBtn.addEventListener(
        "click",
        () => {

            if (!onlineUsers) {
                return;
            }


            const hidden =
                onlineUsers.style.display ===
                "none";


            onlineUsers.style.display =
                hidden
                    ? "block"
                    : "none";


            if (onlineArrow) {

                onlineArrow.textContent =
                    hidden
                        ? "▲"
                        : "▼";

            }

        }
    );

}


// ======================================================
// SCHOOL
// ======================================================

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


async function loadSchool() {

    if (!schoolList) {
        return;
    }


    try {

        const q =
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


        const snapshot =
            await getDocs(q);


        schoolList.innerHTML = "";


        snapshot.forEach(item => {

            const data =
                item.data();


            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "school-item";


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
            `;


            schoolList.appendChild(box);

        });

    } catch (error) {

        console.error(
            "School load error:",
            error
        );

    }

}


if (saveSchoolBtn) {

    saveSchoolBtn.addEventListener(
        "click",
        async () => {

            const update =
                schoolInput?.value.trim() ||
                "";

            const name =
                getSavedName();


            if (!update) {

                alert(
                    "School update लिखें।"
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
                        createdAt:
                            Date.now()
                    }
                );


                if (schoolInput) {

                    schoolInput.value = "";

                }


                await loadSchool();

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


// ======================================================
// NOTES
// ======================================================

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


async function loadNotes() {

    if (!notesList) {
        return;
    }


    try {

        const q =
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


        const snapshot =
            await getDocs(q);


        notesList.innerHTML = "";


        snapshot.forEach(item => {

            const data =
                item.data();


            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "note-item";


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
            `;


            notesList.appendChild(box);

        });

    } catch (error) {

        console.error(
            "Notes load error:",
            error
        );

    }

}


if (saveNoteBtn) {

    saveNoteBtn.addEventListener(
        "click",
        async () => {

            const note =
                noteInput?.value.trim() ||
                "";

            const name =
                getSavedName();


            if (!note) {

                alert(
                    "Note लिखें।"
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
                        createdAt:
                            Date.now()
                    }
                );


                if (noteInput) {

                    noteInput.value = "";

                }


                await loadNotes();

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


// ======================================================
// HOMEWORK
// ======================================================

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


async function loadHomework() {

    if (!homeworkList) {
        return;
    }


    try {

        const q =
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


        const snapshot =
            await getDocs(q);


        homeworkList.innerHTML = "";


        snapshot.forEach(item => {

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
                        data.date || ""
                    )}
                </h3>

                <p>
                    <strong>📖 Hindi:</strong>
                    ${escapeHTML(
                        data.hindi || ""
                    )}
                </p>

                <p>
                    <strong>🔤 English:</strong>
                    ${escapeHTML(
                        data.english || ""
                    )}
                </p>

                <p>
                    <strong>➗ Maths:</strong>
                    ${escapeHTML(
                        data.maths || ""
                    )}
                </p>

                <p>
                    <strong>🔬 Science:</strong>
                    ${escapeHTML(
                        data.science || ""
                    )}
                </p>

                <p>
                    <strong>🌍 SST:</strong>
                    ${escapeHTML(
                        data.sst || ""
                    )}
                </p>

                <p>
                    <strong>💻 Computer:</strong>
                    ${escapeHTML(
                        data.computer || ""
                    )}
                </p>

                <p>
                    <strong>🎨 Art:</strong>
                    ${escapeHTML(
                        data.art || ""
                    )}
                </p>

                <small>
                    👤
                    ${escapeHTML(
                        data.name ||
                        "Student"
                    )}
                </small>
            `;


            homeworkList.appendChild(box);

        });

    } catch (error) {

        console.error(
            "Homework load error:",
            error
        );

    }

}


if (addHomeworkBtn) {

    addHomeworkBtn.addEventListener(
        "click",
        async () => {

            const date =
                homeworkDate?.value || "";

            const name =
                getSavedName();


            if (!date) {

                alert(
                    "पहले Date चुनें।"
                );

                return;

            }


            try {

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

                        createdAt:
                            Date.now()
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


                await loadHomework();


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

            }

        }
    );

}


// ======================================================
// GROUPS
// ======================================================

const groupInput =
    document.getElementById(
        "groupInput"
    );

const groupPasswordInput =
    document.getElementById(
        "groupPasswordInput"
    );

const createGroupBtn =
    document.getElementById(
        "createGroupBtn"
    );

const groupList =
    document.getElementById(
        "groupList"
    );


async function loadGroups() {

    if (!groupList) {
        return;
    }


    try {

        const q =
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


        const snapshot =
            await getDocs(q);


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


            groupList.appendChild(box);

        });

    } catch (error) {

        console.error(
            "Groups load error:",
            error
        );

    }

}


if (createGroupBtn) {

    createGroupBtn.addEventListener(
        "click",
        async () => {

            const name =
                groupInput?.value.trim() ||
                "";

            const password =
                groupPasswordInput?.value.trim() ||
                "";

            const owner =
                getSavedName();


            if (!name) {

                alert(
                    "Group का नाम लिखें।"
                );

                return;

            }


            if (!password) {

                alert(
                    "Group password बनाएं।"
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
                        password,
                        members: [
                            owner
                        ],
                        createdAt:
                            Date.now()
                    }
                );


                groupInput.value = "";

                groupPasswordInput.value = "";


                await loadGroups();


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


function openGroup(
    groupId,
    groupData
) {

    const members =
        Array.isArray(
            groupData.members
        )
            ? groupData.members.join(
                ", "
            )
            : "";


    alert(
        `👥 ${groupData.name}\n\n` +
        `Members:\n${members}\n\n` +
        `Group ID: ${groupId}`
    );

}


// ======================================================
// LANGUAGE
// ======================================================

const translations = {

    hi: {

        home: "🏠 Home",
        chat: "💬 Chat",
        groups: "👥 Groups",
        homework: "📚 Homework",
        school: "🏫 School",
        notes: "📝 Notes",
        settings: "⚙️ Settings"

    },


    en: {

        home: "🏠 Home",
        chat: "💬 Chat",
        groups: "👥 Groups",
        homework: "📚 Homework",
        school: "🏫 School",
        notes: "📝 Notes",
        settings: "⚙️ Settings"

    }

};


function applyLanguage(language) {

    localStorage.setItem(
        "studyLanguage",
        language
    );


    const t =
        translations[language] ||
        translations.hi;


    document
        .querySelectorAll("[data-page]")
        .forEach(button => {

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
        send.textContent = "Send";
    }

}


function setupLanguage() {

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


    select.value =
        localStorage.getItem(
            "studyLanguage"
        ) || "hi";


    select.addEventListener(
        "change",
        () => {

            applyLanguage(
                select.value
            );

        }
    );


    settingsBox.appendChild(label);
    settingsBox.appendChild(select);


    applyLanguage(
        select.value
    );

}


// ======================================================
// DARK MODE
// ======================================================

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


// ======================================================
// NOTIFICATIONS
// ======================================================

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );

const notificationMessage =
    document.getElementById(
        "notificationMessage"
    );


if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        async () => {

            if (!("Notification" in window)) {

                if (notificationMessage) {

                    notificationMessage.textContent =
                        "इस browser में notifications उपलब्ध नहीं हैं।";

                }

                return;

            }


            try {

                const permission =
                    await Notification.requestPermission();


                if (notificationMessage) {

                    notificationMessage.textContent =
                        permission === "granted"
                            ? "✅ Notifications allowed."
                            : "Notifications अनुमति नहीं मिली।";

                }


                if (
                    permission === "granted"
                ) {

                    new Notification(
                        "StudyConnect",
                        {
                            body:
                                "Notifications चालू हो गए हैं।"
                        }
                    );

                }

            } catch (error) {

                console.error(
                    "Notification error:",
                    error
                );

            }

        }
    );

}


// ======================================================
// OWNER PANEL
// ======================================================

const ownerPasswordInput =
    document.getElementById(
        "ownerPasswordInput"
    );

const ownerLoginBtn =
    document.getElementById(
        "ownerLoginBtn"
    );

const ownerPasswordMessage =
    document.getElementById(
        "ownerPasswordMessage"
    );

const ownerPanel =
    document.getElementById(
        "ownerPanel"
    );

const allowedUserNameInput =
    document.getElementById(
        "allowedUserNameInput"
    );

const allowedUserPhoneInput =
    document.getElementById(
        "allowedUserPhoneInput"
    );

const allowUserBtn =
    document.getElementById(
        "allowUserBtn"
    );

const allowedUsersList =
    document.getElementById(
        "allowedUsersList"
    );


if (ownerLoginBtn) {

    ownerLoginBtn.addEventListener(
        "click",
        () => {

            const password =
                ownerPasswordInput?.value ||
                "";


            if (
                password !==
                OWNER_PASSWORD
            ) {

                if (ownerPasswordMessage) {

                    ownerPasswordMessage.textContent =
                        "गलत Owner Password ❌";

                }

                return;

            }


            if (ownerPanel) {

                ownerPanel.style.display =
                    "block";

            }


            if (ownerPasswordMessage) {

                ownerPasswordMessage.textContent =
                    "✅ Owner Panel खुल गया।";

            }


            loadAllowedUsers();

        }
    );

}


// ======================================================
// ADD ALLOWED USER
// ======================================================

if (allowUserBtn) {

    allowUserBtn.addEventListener(
        "click",
        async () => {

            const name =
                allowedUserNameInput?.value.trim() ||
                "";

            const phone =
                normalizePhone(
                    allowedUserPhoneInput?.value ||
                    ""
                );


            if (!name) {

                alert(
                    "User का नाम लिखें।"
                );

                return;

            }


            if (phone.length !== 10) {

                alert(
                    "सही 10 अंकों का मोबाइल नंबर डालें।"
                );

                return;

            }


            try {

                await addDoc(
                    collection(
                        db,
                        "allowedUsers"
                    ),
                    {
                        name,
                        phone,
                        createdAt:
                            Date.now(),
                        addedBy:
                            OWNER_NAME
                    }
                );


                allowedUserNameInput.value = "";
                allowedUserPhoneInput.value = "";


                await loadAllowedUsers();


                alert(
                    "✅ User allow हो गया!"
                );

            } catch (error) {

                console.error(
                    "Allow user error:",
                    error
                );

                alert(
                    "User allow नहीं हुआ।"
                );

            }

        }
    );

}


// ======================================================
// LOAD ALLOWED USERS
// ======================================================

async function loadAllowedUsers() {

    if (!allowedUsersList) {
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


        allowedUsersList.innerHTML = "";


        snapshot.forEach(item => {

            const data =
                item.data();


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "allowed-user-item";


            div.innerHTML = `
                <strong>
                    ${escapeHTML(
                        data.name ||
                        ""
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        data.phone ||
                        ""
                    )}
                </span>
            `;


            allowedUsersList.appendChild(
                div
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
// RESET APP DATA
// ======================================================

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
                    "क्या इस device का StudyConnect data reset करना है?"
                );


            if (!yes) {
                return;
            }


            clearUser();


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


// ======================================================
// SERVICE WORKER / PWA
// ======================================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "service-worker.js"
                )
                .then(
                    registration => {

                        console.log(
                            "Service Worker registered:",
                            registration.scope
                        );

                    }
                )
                .catch(error => {

                    console.error(
                        "Service Worker error:",
                        error
                    );

                });

        }
    );

}


// ======================================================
// START APP
// ======================================================

setupNameSettings();

setupLanguage();

startChatListener();

loadHomework();

loadSchool();

loadNotes();

loadGroups();

checkExistingLogin();


console.log(
    "StudyConnect complete JavaScript loaded successfully."
);
