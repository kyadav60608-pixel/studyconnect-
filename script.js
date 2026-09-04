/* =====================================================
   STUDYCONNECT
   Firebase + Login + Chat + Groups + Homework
   School + Notes + Settings + Online Users
===================================================== */

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
    arrayUnion
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyCquRX2YB59FObuIyi3SwWc3aUCdPWypag",

    authDomain:
        "studyconnect-99006.firebaseapp.com",

    projectId:
        "studyconnect-99006",

    storageBucket:
        "studyconnect-99006.firebasestorage.app",

    messagingSenderId:
        "15964627995",

    appId:
        "1:15964627995:web:0e8a8cd14c175247ed04be",

    measurementId:
        "G-SYJYMREJJL"
};

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);


/* =====================================================
   CONSTANTS
===================================================== */

const APP_PASSWORD = "123";

const OWNER_PASSWORD = "12341";

const OWNER_NAME = "Krishna Yadav";

const OWNER_PHONE = "8738084554";


let currentUser = null;

let currentGroup = null;

let chatUnsubscribe = null;

let groupUnsubscribe = null;

let presenceUnsubscribe = null;

let heartbeat = null;


/* =====================================================
   HELPERS
===================================================== */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


function getUserName() {

    return localStorage.getItem(
        "studyName"
    ) || "";
}


function getUserPhone() {

    return localStorage.getItem(
        "studyPhone"
    ) || "";
}


function saveUser(name, phone) {

    localStorage.setItem(
        "studyName",
        name
    );

    localStorage.setItem(
        "studyPhone",
        phone
    );

    currentUser = {
        name,
        phone
    };
}


function now() {

    return Date.now();
}


function formatDateTime(value) {

    if (!value) return "";

    const date =
        typeof value === "number"
            ? new Date(value)
            : value?.toDate
                ? value.toDate()
                : new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active"
            );

        });

    const page =
        document.getElementById(
            pageId
        );

    if (page) {

        page.classList.add(
            "active"
        );
    }

    const navMenu =
        document.getElementById(
            "navMenu"
        );

    if (navMenu) {

        navMenu.classList.remove(
            "show"
        );
    }

    if (pageId === "chat") {

        startRealtimeChat();

    }

    if (pageId === "groups") {

        loadGroups();

    }
}


document
    .querySelectorAll("[data-page]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    button.getAttribute(
                        "data-page"
                    )
                );

            }
        );

    });


document
    .querySelectorAll(".open-page")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                showPage(
                    card.getAttribute(
                        "data-page"
                    )
                );

            }
        );

    });


const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const navMenu =
    document.getElementById(
        "navMenu"
    );


if (menuBtn && navMenu) {

    menuBtn.addEventListener(
        "click",
        () => {

            navMenu.classList.toggle(
                "show"
            );

        }
    );
}


/* =====================================================
   LOGIN
===================================================== */

function loginStep(id) {

    document
        .querySelectorAll(
            ".login-step"
        )
        .forEach(step => {

            step.classList.remove(
                "active"
            );

        });

    const step =
        document.getElementById(id);

    if (step) {

        step.classList.add(
            "active"
        );

    }
}


/* PASSWORD */

document
    .getElementById("unlockBtn")
    .addEventListener(
        "click",
        () => {

            const password =
                document
                    .getElementById(
                        "appPassword"
                    )
                    .value
                    .trim();

            const error =
                document.getElementById(
                    "passwordError"
                );


            if (
                password !==
                APP_PASSWORD
            ) {

                error.textContent =
                    "गलत password ❌";

                return;
            }


            error.textContent = "";

            loginStep(
                "ownerStep"
            );

        }
    );


/* OWNER */

document
    .getElementById("ownerNextBtn")
    .addEventListener(
        "click",
        () => {

            loginStep(
                "userDetailsStep"
            );

            document
                .getElementById(
                    "openUserName"
                )
                .focus();

        }
    );


/* =====================================================
   ENTER APP
===================================================== */

document
    .getElementById("enterAppBtn")
    .addEventListener(
        "click",
        async () => {

            const name =
                document
                    .getElementById(
                        "openUserName"
                    )
                    .value
                    .trim();

            const phone =
                document
                    .getElementById(
                        "openUserPhone"
                    )
                    .value
                    .trim();

            const message =
                document.getElementById(
                    "loginMessage"
                );


            message.textContent = "";


            if (name.length < 2) {

                message.textContent =
                    "अपना सही नाम लिखें।";

                return;
            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                message.textContent =
                    "10 अंकों का मोबाइल नंबर डालें।";

                return;
            }


            /* OWNER */

            if (
                name.toLowerCase() ===
                    OWNER_NAME.toLowerCase()
                &&
                phone === OWNER_PHONE
            ) {

                saveUser(
                    OWNER_NAME,
                    OWNER_PHONE
                );

                openMainApp();

                return;
            }


            const button =
                document.getElementById(
                    "enterAppBtn"
                );

            button.disabled = true;

            button.textContent =
                "Checking...";


            try {

                const userRef =
                    doc(
                        db,
                        "allowedUsers",
                        phone
                    );

                const snapshot =
                    await getDoc(
                        userRef
                    );


                if (
                    !snapshot.exists()
                ) {

                    showContactOwner();

                    return;
                }


                const data =
                    snapshot.data();


                const allowedName =
                    String(
                        data.name || ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    allowedName !==
                    name.toLowerCase()
                ) {

                    showContactOwner();

                    return;
                }


                saveUser(
                    name,
                    phone
                );

                openMainApp();


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                message.textContent =
                    "Firebase connection में समस्या है।";

            } finally {

                button.disabled = false;

                button.textContent =
                    "Open StudyConnect →";

            }

        }
    );


/* =====================================================
   CONTACT OWNER
===================================================== */

function showContactOwner() {

    document
        .getElementById(
            "passwordScreen"
        )
        .style.display = "none";

    document
        .getElementById(
            "appContainer"
        )
        .style.display = "none";

    document
        .getElementById(
            "contactOwnerScreen"
        )
        .classList.remove(
            "hidden"
        );
}


document
    .getElementById(
        "backToLoginBtn"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "contactOwnerScreen"
                )
                .classList.add(
                    "hidden"
                );

            document
                .getElementById(
                    "passwordScreen"
                )
                .style.display = "flex";

            document
                .getElementById(
                    "appPassword"
                )
                .value = "";

            document
                .getElementById(
                    "openUserName"
                )
                .value = "";

            document
                .getElementById(
                    "openUserPhone"
                )
                .value = "";

            loginStep(
                "schoolPasswordStep"
            );

        }
    );


/* =====================================================
   OPEN APP
===================================================== */

function openMainApp() {

    document
        .getElementById(
            "passwordScreen"
        )
        .style.display = "none";

    document
        .getElementById(
            "contactOwnerScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "appContainer"
        )
        .style.display = "block";


    updateHomeProfile();

    startPresence();

    startRealtimeChat();

    loadGroups();

    loadHomework();

    loadSchool();

    loadNotes();

    loadOnlineUsers();

}


/* =====================================================
   HOME PROFILE
===================================================== */

const studentName =
    document.getElementById(
        "studentName"
    );

const saveNameBtn =
    document.getElementById(
        "saveNameBtn"
    );

const nameMessage =
    document.getElementById(
        "nameMessage"
    );


function updateHomeProfile() {

    const name =
        getUserName();

    const phone =
        getUserPhone();


    if (studentName) {

        studentName.value =
            name;

    }


    const welcome =
        document.getElementById(
            "homeWelcome"
        );

    if (welcome) {

        welcome.textContent =
            name
                ? `Welcome, ${name}! 👋`
                : "आपकी student community एक जगह।";

    }


    const profile =
        document.getElementById(
            "currentUserProfile"
        );

    if (profile) {

        profile.innerHTML =
            name
                ? `
                    <strong>${escapeHTML(name)}</strong>
                    <br>
                    <small>${escapeHTML(phone)}</small>
                  `
                : "";

    }

}


if (saveNameBtn) {

    saveNameBtn.addEventListener(
        "click",
        () => {

            const name =
                studentName
                    .value
                    .trim();

            if (!name) {

                nameMessage.textContent =
                    "पहले नाम लिखें।";

                return;
            }


            localStorage.setItem(
                "studyName",
                name
            );

            currentUser = {

                name,

                phone:
                    getUserPhone()

            };


            nameMessage.textContent =
                "Name saved ✅";

            updateHomeProfile();

            updatePresence();

        }
    );
}


/* =====================================================
   REALTIME CHAT
===================================================== */

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


if (emojiBtn) {

    emojiBtn.addEventListener(
        "click",
        () => {

            messageInput.value +=
                " 😊";

            messageInput.focus();

        }
    );
}


function startRealtimeChat() {

    if (!chatMessages) return;

    if (chatUnsubscribe) {

        chatUnsubscribe();

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


    chatUnsubscribe =
        onSnapshot(
            messagesQuery,
            snapshot => {

                chatMessages.innerHTML =
                    "";


                if (snapshot.empty) {

                    chatMessages.innerHTML = `
                        <div class="message other">
                            <strong>StudyConnect</strong>
                            <p>अभी कोई message नहीं है। 👋</p>
                        </div>
                    `;

                    return;
                }


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();

                        renderMessage(
                            item.id,
                            data
                        );

                    }
                );


                chatMessages.scrollTop =
                    chatMessages.scrollHeight;

            },

            error => {

                console.error(
                    "Realtime chat error:",
                    error
                );

                chatMessages.innerHTML =
                    "<p>Chat load नहीं हो पाया।</p>";

            }
        );
}


function renderMessage(
    id,
    data
) {

    const myPhone =
        getUserPhone();

    const myName =
        getUserName();


    const senderPhone =
        data.phone ||
        data.senderPhone ||
        "";


    const senderName =
        data.name ||
        data.senderName ||
        "Student";


    const mine =
        senderPhone
            ? senderPhone === myPhone
            : senderName === myName;


    const box =
        document.createElement(
            "div"
        );


    box.className =
        mine
            ? "message mine"
            : "message other";


    const readBy =
        Array.isArray(
            data.readBy
        )
            ? data.readBy
            : [];


    let ticks = "";


    if (mine) {

        if (
            readBy.some(
                item =>
                    item !== myPhone
            )
        ) {

            ticks =
                `<span class="message-tick blue-ticks">✓✓</span>`;

        } else {

            ticks =
                `<span class="message-tick">✓✓</span>`;

        }

    }


    box.innerHTML = `

        <strong>
            ${escapeHTML(senderName)}
        </strong>

        <p>
            ${escapeHTML(
                data.message || ""
            )}

            ${ticks}
        </p>

        <small class="message-time">
            ${escapeHTML(
                formatDateTime(
                    data.createdAt
                )
            )}
        </small>

    `;


    if (!mine) {

        markMessageRead(
            id,
            data
        );

    }


    chatMessages.appendChild(
        box
    );
}


async function markMessageRead(
    id,
    data
) {

    const phone =
        getUserPhone();

    if (!phone) return;


    const readBy =
        Array.isArray(
            data.readBy
        )
            ? data.readBy
            : [];


    if (
        readBy.includes(phone)
    ) {

        return;

    }


    try {

        await updateDoc(
            doc(
                db,
                "messages",
                id
            ),
            {
                readBy:
                    arrayUnion(
                        phone
                    )
            }
        );

    } catch (error) {

        console.error(
            "Read receipt error:",
            error
        );

    }
}


async function sendMessage() {

    const text =
        messageInput
            .value
            .trim();

    const name =
        getUserName();

    const phone =
        getUserPhone();


    if (!text) return;


    if (!name || !phone) {

        alert(
            "पहले login करें।"
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

                name,

                phone,

                message: text,

                createdAt:
                    now(),

                readBy: [
                    phone
                ]

            }
        );


        messageInput.value = "";

    } catch (error) {

        console.error(
            "Message error:",
            error
        );

        alert(
            "Message send नहीं हुआ।"
        );

    }
}


sendMessageBtn.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
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


/* =====================================================
   ONLINE PRESENCE
===================================================== */

async function updatePresence() {

    const name =
        getUserName();

    const phone =
        getUserPhone();


    if (!name || !phone) return;


    try {

        await setDoc(
            doc(
                db,
                "presence",
                phone
            ),
            {

                name,

                phone,

                online: true,

                lastSeen:
                    now()

            },

            {
                merge: true
            }
        );

    } catch (error) {

        console.error(
            "Presence error:",
            error
        );

    }
}


function startPresence() {

    if (heartbeat) {

        clearInterval(
            heartbeat
        );

    }


    updatePresence();


    heartbeat =
        setInterval(
            updatePresence,
            30000
        );

}


window.addEventListener(
    "beforeunload",
    () => {

        const phone =
            getUserPhone();

        if (!phone) return;


        updateDoc(
            doc(
                db,
                "presence",
                phone
            ),
            {
                online: false,
                lastSeen: now()
            }
        ).catch(() => {});

    }
);


/* =====================================================
   ONLINE USERS LIST
===================================================== */

function loadOnlineUsers() {

    const list =
        document.getElementById(
            "onlineUsers"
        );

    if (!list) return;


    if (presenceUnsubscribe) {

        presenceUnsubscribe();

    }


    presenceUnsubscribe =
        onSnapshot(
            collection(
                db,
                "presence"
            ),

            snapshot => {

                list.innerHTML = "";

                let count = 0;


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();

                        if (
                            data.online !== true
                        ) {

                            return;

                        }


                        const lastSeen =
                            Number(
                                data.lastSeen ||
                                0
                            );


                        if (
                            now() -
                            lastSeen >
                            90000
                        ) {

                            return;

                        }


                        count++;


                        const div =
                            document.createElement(
                                "div"
                            );

                        div.className =
                            "online-user";

                        div.innerHTML = `
                            🟢
                            <strong>
                                ${escapeHTML(
                                    data.name ||
                                    "Student"
                                )}
                            </strong>
                        `;


                        list.appendChild(
                            div
                        );

                    }
                );


                document
                    .getElementById(
                        "onlineCount"
                    )
                    .textContent =
                    count;


                if (!count) {

                    list.innerHTML =
                        "<p>अभी कोई दूसरा user online नहीं है।</p>";

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


const onlineToggleBtn =
    document.getElementById(
        "onlineToggleBtn"
    );

const onlineArrow =
    document.getElementById(
        "onlineArrow"
    );

const onlineUsers =
    document.getElementById(
        "onlineUsers"
    );


function toggleOnlineList() {

    onlineUsers.classList.toggle(
        "show"
    );

    const visible =
        onlineUsers.classList.contains(
            "show"
        );

    onlineToggleBtn.textContent =
        visible
            ? "Hide"
            : "Show";

    onlineArrow.textContent =
        visible
            ? "▲"
            : "▼";

}


onlineToggleBtn.addEventListener(
    "click",
    toggleOnlineList
);

onlineArrow.addEventListener(
    "click",
    toggleOnlineList
);


/* =====================================================
   GROUPS
===================================================== */

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

    if (!groupList) return;


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


                const phone =
                    getUserPhone();


                const isMember =
                    members.some(
                        member =>
                            typeof member ===
                            "object"
                                ? member.phone ===
                                  phone
                                : member ===
                                  getUserName()
                    );


                if (
                    !isMember
                ) {

                    return;

                }


                const box =
                    document.createElement(
                        "div"
                    );

                box.className =
                    "group-item";


                box.innerHTML = `

                    <strong>
                        👥
                        ${escapeHTML(
                            data.name ||
                            "Group"
                        )}
                    </strong>

                    <p>
                        👤
                        ${members.length}
                        members
                    </p>

                    <small>
                        Created by:
                        ${escapeHTML(
                            data.ownerName ||
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

            }
        );


        if (
            !groupList.children.length
        ) {

            groupList.innerHTML =
                "<p>अभी आपका कोई group नहीं है।</p>";

        }


    } catch (error) {

        console.error(
            "Groups error:",
            error
        );

        groupList.innerHTML =
            "<p>Groups load नहीं हुए।</p>";

    }

}


createGroupBtn.addEventListener(
    "click",
    async () => {

        const name =
            groupInput
                .value
                .trim();

        const password =
            groupPasswordInput
                .value
                .trim();


        if (!name) {

            alert(
                "Group का नाम लिखें।"
            );

            return;
        }


        if (!password) {

            alert(
                "Group password रखें।"
            );

            return;
        }


        const ownerName =
            getUserName();

        const ownerPhone =
            getUserPhone();


        try {

            await addDoc(
                collection(
                    db,
                    "groups"
                ),
                {

                    name,

                    password,

                    ownerName,

                    ownerPhone,

                    members: [

                        {
                            name:
                                ownerName,

                            phone:
                                ownerPhone
                        }

                    ],

                    createdAt:
                        now()

                }
            );


            groupInput.value = "";

            groupPasswordInput.value = "";

            await loadGroups();


            alert(
                "Group बन गया ✅"
            );


        } catch (error) {

            console.error(
                error
            );

            alert(
                "Group create नहीं हुआ।"
            );

        }

    }
);


/* =====================================================
   OPEN GROUP
===================================================== */

function openGroup(
    groupId,
    groupData
) {

    currentGroup = {

        id: groupId,

        data: groupData

    };


    document
        .getElementById(
            "groupChatSection"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "selectedGroupName"
        )
        .textContent =
        "👥 " +
        groupData.name;


    document
        .getElementById(
            "selectedGroupOwner"
        )
        .textContent =
        "Owner: " +
        (
            groupData.ownerName ||
            ""
        );


    document
        .getElementById(
            "groupPasswordSection"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "groupContent"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "enterGroupPasswordInput"
        )
        .value = "";

}


/* =====================================================
   UNLOCK GROUP
===================================================== */

document
    .getElementById(
        "unlockGroupBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (!currentGroup) return;


            const entered =
                document
                    .getElementById(
                        "enterGroupPasswordInput"
                    )
                    .value;


            const actual =
                currentGroup.data.password;


            const message =
                document
                    .getElementById(
                        "groupPasswordMessage"
                    );


            if (
                entered !== actual
            ) {

                message.textContent =
                    "गलत group password ❌";

                return;
            }


            message.textContent =
                "Group unlocked ✅";


            document
                .getElementById(
                    "groupPasswordSection"
                )
                .classList.add(
                    "hidden"
                );


            document
                .getElementById(
                    "groupContent"
                )
                .classList.remove(
                    "hidden"
                );


            renderMembers(
                currentGroup.data
            );


            startGroupChat(
                currentGroup.id
            );

        }
    );


/* =====================================================
   MEMBERS
===================================================== */

function renderMembers(
    data
) {

    const list =
        document.getElementById(
            "memberList"
        );


    list.innerHTML = "";


    const members =
        Array.isArray(
            data.members
        )
            ? data.members
            : [];


    members.forEach(
        member => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "member-item";


            if (
                typeof member ===
                "object"
            ) {

                div.textContent =
                    `👤 ${member.name} — ${member.phone}`;

            } else {

                div.textContent =
                    `👤 ${member}`;

            }


            list.appendChild(
                div
            );

        }
    );

}


document
    .getElementById(
        "addMemberBtn"
    )
    .addEventListener(
        "click",
        async () => {

            if (!currentGroup) return;


            const name =
                document
                    .getElementById(
                        "memberNameInput"
                    )
                    .value
                    .trim();

            const phone =
                document
                    .getElementById(
                        "memberPhoneInput"
                    )
                    .value
                    .trim();


            if (
                name.length < 2
            ) {

                alert(
                    "Member का नाम लिखें।"
                );

                return;
            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                alert(
                    "सही 10 अंकों का mobile डालें।"
                );

                return;
            }


            try {

                const allowedRef =
                    doc(
                        db,
                        "allowedUsers",
                        phone
                    );


                const allowed =
                    await getDoc(
                        allowedRef
                    );


                if (
                    !allowed.exists()
                    &&
                    phone !==
                    OWNER_PHONE
                ) {

                    alert(
                        "यह user अभी allowed नहीं है।"
                    );

                    return;
                }


                const groupRef =
                    doc(
                        db,
                        "groups",
                        currentGroup.id
                    );


                await updateDoc(
                    groupRef,
                    {

                        members:
                            arrayUnion(
                                {
                                    name,
                                    phone
                                }
                            )

                    }
                );


                currentGroup.data.members =
                    [
                        ...(currentGroup.data.members || []),
                        {
                            name,
                            phone
                        }
                    ];


                renderMembers(
                    currentGroup.data
                );


                document
                    .getElementById(
                        "memberNameInput"
                    )
                    .value = "";

                document
                    .getElementById(
                        "memberPhoneInput"
                    )
                    .value = "";


                alert(
                    "Member add हो गया ✅"
                );


            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "Member add नहीं हुआ।"
                );

            }

        }
    );


/* =====================================================
   GROUP CHAT
===================================================== */

function startGroupChat(
    groupId
) {

    const messages =
        document.getElementById(
            "groupMessages"
        );


    if (groupUnsubscribe) {

        groupUnsubscribe();

    }


    const q =
        query(
            collection(
                db,
                "groups",
                groupId,
                "messages"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    groupUnsubscribe =
        onSnapshot(
            q,
            snapshot => {

                messages.innerHTML =
                    "";


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();


                        const mine =
                            data.phone ===
                            getUserPhone();


                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            mine
                                ? "message mine"
                                : "message other";


                        div.innerHTML = `

                            <strong>
                                ${escapeHTML(
                                    data.name ||
                                    "Student"
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    data.message ||
                                    ""
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

                        `;


                        messages.appendChild(
                            div
                        );

                    }
                );


                messages.scrollTop =
                    messages.scrollHeight;

            }
        );

}


document
    .getElementById(
        "sendGroupMessageBtn"
    )
    .addEventListener(
        "click",
        sendGroupMessage
    );


document
    .getElementById(
        "groupMessageInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendGroupMessage();

            }

        }
    );


async function sendGroupMessage() {

    if (!currentGroup) return;


    const input =
        document
            .getElementById(
                "groupMessageInput"
            );


    const text =
        input.value.trim();


    if (!text) return;


    try {

        await addDoc(
            collection(
                db,
                "groups",
                currentGroup.id,
                "messages"
            ),
            {

                name:
                    getUserName(),

                phone:
                    getUserPhone(),

                message:
                    text,

                createdAt:
                    now()

            }
        );


        input.value = "";

    } catch (error) {

        console.error(
            error
        );

        alert(
            "Group message send नहीं हुआ।"
        );

    }

}


/* =====================================================
   HOMEWORK
===================================================== */

const homeworkDate =
    document.getElementById(
        "homeworkDate"
    );

const homeworkInputs = {

    hindi:
        document.getElementById(
            "hindiHomework"
        ),

    english:
        document.getElementById(
            "englishHomework"
        ),

    maths:
        document.getElementById(
            "mathHomework"
        ),

    science:
        document.getElementById(
            "scienceHomework"
        ),

    sst:
        document.getElementById(
            "sstHomework"
        ),

    computer:
        document.getElementById(
            "computerHomework"
        ),

    art:
        document.getElementById(
            "artHomework"
        )

};


async function loadHomework() {

    const list =
        document.getElementById(
            "homeworkList"
        );

    if (!list) return;


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


        list.innerHTML = "";


        snapshot.forEach(
            item => {

                const data =
                    item.data();


                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "homework-item";


                div.innerHTML = `

                    <h3>
                        📅
                        ${escapeHTML(
                            data.date ||
                            ""
                        )}
                    </h3>

                    <p>
                        <strong>Hindi:</strong>
                        ${escapeHTML(
                            data.hindi ||
                            ""
                        )}
                    </p>

                    <p>
                        <strong>English:</strong>
                        ${escapeHTML(
                            data.english ||
                            ""
                        )}
                    </p>

                    <p>
                        <strong>Maths:</strong>
                        ${escapeHTML(
                            data.maths ||
                            ""
                        )}
                    </p>

                    <p>
                        <strong>Science:</strong>
                        ${escapeHTML(
                            data.science ||
                            ""
                        )}
                    </p>

                    <p>
                        <strong>SST:</strong>
                        ${escapeHTML(
                            data.sst ||
                            ""
                        )}
                    </p>

                    <p>
                        <strong>Computer:</strong>
                        ${escapeHTML(
                            data.computer ||
                            ""
                        )}
                    </p>

                    <p>
                        <strong>Art:</strong>
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

                `;


                list.appendChild(
                    div
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


document
    .getElementById(
        "addHomeworkBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const date =
                homeworkDate.value;


            if (!date) {

                alert(
                    "Date चुनें।"
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
                            homeworkInputs
                                .hindi
                                .value
                                .trim(),

                        english:
                            homeworkInputs
                                .english
                                .value
                                .trim(),

                        maths:
                            homeworkInputs
                                .maths
                                .value
                                .trim(),

                        science:
                            homeworkInputs
                                .science
                                .value
                                .trim(),

                        sst:
                            homeworkInputs
                                .sst
                                .value
                                .trim(),

                        computer:
                            homeworkInputs
                                .computer
                                .value
                                .trim(),

                        art:
                            homeworkInputs
                                .art
                                .value
                                .trim(),

                        name:
                            getUserName(),

                        createdAt:
                            now()

                    }
                );


                Object.values(
                    homeworkInputs
                ).forEach(
                    input => {

                        input.value = "";

                    }
                );


                homeworkDate.value = "";


                await loadHomework();


                alert(
                    "Homework Save हो गया ✅"
                );


            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "Homework save नहीं हुआ।"
                );

            }

        }
    );


/* =====================================================
   SCHOOL
===================================================== */

async function loadSchool() {

    const list =
        document.getElementById(
            "schoolList"
        );


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


        list.innerHTML = "";


        snapshot.forEach(
            item => {

                const data =
                    item.data();


                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "school-item";


                div.innerHTML = `

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


                list.appendChild(
                    div
                );

            }
        );

    } catch (error) {

        console.error(
            error
        );

    }

}


document
    .getElementById(
        "saveSchoolBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const input =
                document.getElementById(
                    "schoolInput"
                );


            const text =
                input.value.trim();


            if (!text) {

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

                        name:
                            getUserName(),

                        update:
                            text,

                        createdAt:
                            now()

                    }
                );


                input.value = "";

                await loadSchool();

            } catch (error) {

                console.error(
                    error
                );

            }

        }
    );


/* =====================================================
   NOTES
===================================================== */

async function loadNotes() {

    const list =
        document.getElementById(
            "notesList"
        );


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


        list.innerHTML = "";


        snapshot.forEach(
            item => {

                const data =
                    item.data();


                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "note-item";


                div.innerHTML = `

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


                list.appendChild(
                    div
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


document
    .getElementById(
        "saveNoteBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const input =
                document.getElementById(
                    "noteInput"
                );


            const text =
                input.value.trim();


            if (!text) {

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

                        name:
                            getUserName(),

                        note:
                            text,

                        createdAt:
                            now()

                    }
                );


                input.value = "";

                await loadNotes();

            } catch (error) {

                console.error(
                    error
                );

            }

        }
    );


/* =====================================================
   SETTINGS — NAME
===================================================== */

document
    .getElementById(
        "changeNameBtn"
    )
    .addEventListener(
        "click",
        () => {

            const input =
                document.getElementById(
                    "changeNameInput"
                );


            const message =
                document.getElementById(
                    "changeNameMessage"
                );


            const name =
                input.value.trim();


            if (!name) {

                message.textContent =
                    "नया नाम लिखें।";

                return;
            }


            localStorage.setItem(
                "studyName",
                name
            );


            currentUser = {

                name,

                phone:
                    getUserPhone()

            };


            message.textContent =
                "Name changed ✅";


            input.value = "";


            updateHomeProfile();

            updatePresence();

        }
    );


/* =====================================================
   LANGUAGE
===================================================== */

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


function applyLanguage(
    language
) {

    localStorage.setItem(
        "studyLanguage",
        language
    );


    const t =
        translations[language];


    document
        .querySelectorAll(
            "[data-page]"
        )
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


    document
        .getElementById(
            "languageMessage"
        )
        .textContent =
        language === "hi"
            ? "भाषा हिंदी कर दी गई।"
            : "Language changed to English.";

}


document
    .getElementById(
        "hindiLanguageBtn"
    )
    .addEventListener(
        "click",
        () => {

            applyLanguage(
                "hi"
            );

        }
    );


document
    .getElementById(
        "englishLanguageBtn"
    )
    .addEventListener(
        "click",
        () => {

            applyLanguage(
                "en"
            );

        }
    );


/* =====================================================
   DARK MODE
===================================================== */

document
    .getElementById(
        "themeBtn"
    )
    .addEventListener(
        "click",
        () => {

            document.body
                .classList
                .toggle(
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


if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body
        .classList
        .add("dark");

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

document
    .getElementById(
        "notificationBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const message =
                document.getElementById(
                    "notificationMessage"
                );


            if (
                !("Notification" in window)
            ) {

                message.textContent =
                    "इस browser में notifications supported नहीं हैं।";

                return;
            }


            const permission =
                await Notification.requestPermission();


            if (
                permission ===
                "granted"
            ) {

                message.textContent =
                    "Notifications enabled ✅";


                new Notification(
                    "StudyConnect",
                    {
                        body:
                            "Notifications अब चालू हैं।"
                    }
                );

            } else {

                message.textContent =
                    "Notification permission नहीं मिली।";

            }

        }
    );


/* =====================================================
   OWNER PANEL
===================================================== */

document
    .getElementById(
        "ownerLoginBtn"
    )
    .addEventListener(
        "click",
        () => {

            const password =
                document
                    .getElementById(
                        "ownerPasswordInput"
                    )
                    .value;


            const message =
                document
                    .getElementById(
                        "ownerPasswordMessage"
                    );


            if (
                password !==
                OWNER_PASSWORD
            ) {

                message.textContent =
                    "गलत Owner password ❌";

                return;
            }


            if (
                getUserPhone() !==
                OWNER_PHONE
            ) {

                message.textContent =
                    "Owner panel सिर्फ Owner के लिए है।";

                return;
            }


            message.textContent =
                "Owner Panel opened ✅";


            document
                .getElementById(
                    "ownerPanel"
                )
                .classList
                .remove(
                    "hidden"
                );


            loadAllowedUsers();

        }
    );


/* =====================================================
   ALLOW USER
===================================================== */

document
    .getElementById(
        "allowUserBtn"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                getUserPhone() !==
                OWNER_PHONE
            ) {

                alert(
                    "Owner only."
                );

                return;
            }


            const name =
                document
                    .getElementById(
                        "allowedUserNameInput"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "allowedUserPhoneInput"
                    )
                    .value
                    .trim();


            if (
                name.length < 2
            ) {

                alert(
                    "User name लिखें।"
                );

                return;
            }


            if (
                !/^[0-9]{10}$/.test(
                    phone
                )
            ) {

                alert(
                    "सही mobile number डालें।"
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

                        name,

                        phone,

                        allowed: true,

                        addedBy:
                            OWNER_NAME,

                        createdAt:
                            now()

                    }
                );


                document
                    .getElementById(
                        "allowedUserNameInput"
                    )
                    .value = "";

                document
                    .getElementById(
                        "allowedUserPhoneInput"
                    )
                    .value = "";


                await loadAllowedUsers();


                alert(
                    "User allowed ✅"
                );


            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "User allow नहीं हुआ।"
                );

            }

        }
    );


/* =====================================================
   LOAD ALLOWED USERS
===================================================== */

async function loadAllowedUsers() {

    const list =
        document.getElementById(
            "allowedUsersList"
        );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "allowedUsers"
                )
            );


        list.innerHTML = "";


        snapshot.forEach(
            item => {

                const data =
                    item.data();


                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "member-item";


                div.innerHTML = `

                    👤
                    <strong>
                        ${escapeHTML(
                            data.name ||
                            ""
                        )}
                    </strong>

                    <br>

                    📱
                    ${escapeHTML(
                        data.phone ||
                        item.id
                    )}

                `;


                list.appendChild(
                    div
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


/* =====================================================
   RESET LOCAL DATA
===================================================== */

document
    .getElementById(
        "clearDataBtn"
    )
    .addEventListener(
        "click",
        () => {

            const yes =
                confirm(
                    "क्या इस device का StudyConnect login data reset करना है?"
                );


            if (!yes) return;


            localStorage.removeItem(
                "studyName"
            );

            localStorage.removeItem(
                "studyPhone"
            );

            localStorage.removeItem(
                "studyLanguage"
            );

            localStorage.removeItem(
                "darkMode"
            );


            location.reload();

        }
    );


/* =====================================================
   LOGOUT BY DOUBLE CLICK ON BRAND
   (simple local logout)
===================================================== */

document
    .querySelector(".brand")
    .addEventListener(
        "dblclick",
        () => {

            localStorage.removeItem(
                "studyName"
            );

            localStorage.removeItem(
                "studyPhone"
            );

            location.reload();

        }
    );


/* =====================================================
   INITIAL START
===================================================== */

document
    .getElementById(
        "appContainer"
    )
    .style.display = "none";


document
    .getElementById(
        "contactOwnerScreen"
    )
    .classList.add(
        "hidden"
    );


loginStep(
    "schoolPasswordStep"
);


/* Saved user information */

const savedName =
    getUserName();

const savedPhone =
    getUserPhone();


if (
    savedName &&
    savedPhone
) {

    currentUser = {

        name:
            savedName,

        phone:
            savedPhone

    };

}


/* Language */

applyLanguage(
    localStorage.getItem(
        "studyLanguage"
    ) || "hi"
);


console.log(
    "StudyConnect is ready ✅"
);
