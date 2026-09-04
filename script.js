// ============================================
// STUDYCONNECT - SCRIPT.JS
// Existing index.html compatible version
// ============================================


// ============================================
// FIREBASE
// ============================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    arrayUnion
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


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


// ============================================
// APP SETTINGS
// ============================================

const APP_PASSWORD = "123";
const OWNER_NAME = "Krishna Yadav";


// ============================================
// HELPERS
// ============================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text ?? "";

    return div.innerHTML;
}


function getUserName() {

    return localStorage.getItem("studyName") || "";

}


function getTime() {

    return Date.now();

}


function formatDateTime(value) {

    if (!value) return "";

    let date;

    if (typeof value === "number") {

        date = new Date(value);

    } else if (value && value.toDate) {

        date = value.toDate();

    } else {

        date = new Date(value);

    }

    if (isNaN(date.getTime())) {

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


// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {

        page.classList.remove("active");

    });


    const page =
        document.getElementById(pageId);


    if (page) {

        page.classList.add("active");

    }


    const navMenu =
        document.getElementById("navMenu");


    if (navMenu) {

        navMenu.classList.remove("show");

    }

}


window.showPage = showPage;


// ============================================
// NAVIGATION BUTTONS
// ============================================

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        const page =
            button.getAttribute("data-page");

        showPage(page);

    });

});


document.querySelectorAll(".open-page").forEach(button => {

    button.addEventListener("click", () => {

        const page =
            button.getAttribute("data-page");

        if (page) {

            showPage(page);

        }

    });

});


// ============================================
// MENU
// ============================================

const menuBtn =
    document.getElementById("menuBtn");

const navMenu =
    document.getElementById("navMenu");


if (menuBtn && navMenu) {

    menuBtn.addEventListener("click", () => {

        navMenu.classList.toggle("show");

    });

}


// ============================================
// LOGIN
// Uses the existing HTML login elements
// ============================================

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


function openStudyConnect() {

    if (passwordScreen) {

        passwordScreen.style.display = "none";

    }

    showPage("home");

    startOnlineStatus();

}


function setupLogin() {

    if (
        !passwordScreen ||
        !unlockBtn ||
        !appPassword
    ) {

        return;

    }


    const savedName =
        localStorage.getItem("studyName");


    if (savedName && openUserName) {

        openUserName.value =
            savedName;

        openUserName.style.display =
            "none";

    }


    unlockBtn.addEventListener(
        "click",
        () => {

            const password =
                appPassword.value.trim();


            if (
                password !==
                APP_PASSWORD
            ) {

                if (passwordError) {

                    passwordError.textContent =
                        "गलत Password ❌";

                }

                return;

            }


            if (openUserName) {

                const name =
                    openUserName.value.trim();


                if (name) {

                    localStorage.setItem(
                        "studyName",
                        name
                    );

                }

            }


            if (passwordError) {

                passwordError.textContent =
                    "";

            }


            openStudyConnect();

        }
    );


    appPassword.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                unlockBtn.click();

            }

        }
    );

}


setupLogin();


// ============================================
// NAME
// ============================================

const studentName =
    document.getElementById("studentName");

const saveNameBtn =
    document.getElementById("saveNameBtn");

const nameMessage =
    document.getElementById("nameMessage");


function setupName() {

    if (!studentName) return;


    const savedName =
        getUserName();


    if (savedName) {

        studentName.value =
            savedName;

    }


    if (!saveNameBtn) return;


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


            updateOnlineUser();

        }
    );

}


setupName();


// ============================================
// CHANGE NAME
// ============================================

const changeNameInput =
    document.getElementById(
        "changeNameInput"
    );

const changeNameBtn =
    document.getElementById(
        "changeNameBtn"
    );

const changeNameMessage =
    document.getElementById(
        "changeNameMessage"
    );


if (
    changeNameBtn &&
    changeNameInput
) {

    changeNameBtn.addEventListener(
        "click",
        () => {

            const name =
                changeNameInput.value.trim();


            if (!name) {

                if (changeNameMessage) {

                    changeNameMessage.textContent =
                        "नया नाम लिखें।";

                }

                return;

            }


            localStorage.setItem(
                "studyName",
                name
            );


            if (studentName) {

                studentName.value =
                    name;

                studentName.disabled =
                    true;

            }


            if (saveNameBtn) {

                saveNameBtn.style.display =
                    "none";

            }


            changeNameInput.value =
                "";


            if (changeNameMessage) {

                changeNameMessage.textContent =
                    "नाम बदल गया ✅";

            }


            updateOnlineUser(name);

        }
    );

}


// ============================================
// CHAT
// ============================================

const chatMessages =
    document.getElementById(
        "chatMessages"
    );

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendMessageBtn =
    document.getElementById(
        "sendMessageBtn"
    );

const emojiBtn =
    document.getElementById(
        "emojiBtn"
    );


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


// ============================================
// CHAT TICKS
// ============================================

function getTick(data, mine) {

    if (!mine) {

        return "";

    }


    if (
        Array.isArray(data.seenBy) &&
        data.seenBy.length > 0
    ) {

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


// ============================================
// REAL-TIME CHAT
// ============================================

let stopChatListener = null;


function startChat() {

    if (!chatMessages) return;


    if (stopChatListener) {

        stopChatListener();

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


    stopChatListener =
        onSnapshot(
            messagesQuery,
            snapshot => {

                chatMessages.innerHTML =
                    "";


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
                    getUserName();


                snapshot.forEach(
                    messageDoc => {

                        const data =
                            messageDoc.data();


                        const name =
                            data.name ||
                            "Student";


                        const message =
                            data.message ||
                            "";


                        const mine =
                            name === myName;


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
                                ${escapeHTML(name)}
                            </strong>

                            <p>
                                ${escapeHTML(message)}

                                ${getTick(
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

                        `;


                        chatMessages.appendChild(
                            box
                        );


                        if (
                            !mine &&
                            !Array.isArray(
                                data.seenBy
                            )
                        ) {

                            markSeen(
                                messageDoc.id
                            );

                        }

                    }
                );


                chatMessages.scrollTop =
                    chatMessages.scrollHeight;

            },

            error => {

                console.error(
                    "Chat error:",
                    error
                );

            }
        );

}


async function markSeen(id) {

    try {

        await updateDoc(
            doc(
                db,
                "messages",
                id
            ),
            {
                delivered: true,

                seenBy:
                    arrayUnion(
                        getUserName()
                    )
            }
        );

    } catch (error) {

        console.error(
            "Seen error:",
            error
        );

    }

}


// ============================================
// SEND CHAT MESSAGE
// ============================================

async function sendMessage() {

    if (!messageInput) return;


    const text =
        messageInput.value.trim();


    const name =
        getUserName();


    if (!name) {

        alert(
            "पहले अपना नाम Save करें।"
        );

        return;

    }


    if (!text) {

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

                createdAt: getTime(),

                delivered: false,

                seenBy: []

            }
        );


        messageInput.value =
            "";

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


// ============================================
// GROUPS
// ============================================

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


let stopGroupsListener = null;


function startGroups() {

    if (!groupList) return;


    if (stopGroupsListener) {

        stopGroupsListener();

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


    stopGroupsListener =
        onSnapshot(
            groupsQuery,
            snapshot => {

                groupList.innerHTML =
                    "";


                snapshot.forEach(
                    groupDoc => {

                        const data =
                            groupDoc.data();


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
                                👤
                                ${members.length}
                                Members
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
                                    groupDoc.id,
                                    data
                                );

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
                    "Groups error:",
                    error
                );

            }
        );

}


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

                        name: name,

                        owner: owner,

                        members: [
                            owner
                        ],

                        createdAt:
                            getTime()

                    }
                );


                groupInput.value =
                    "";


                alert(
                    "Group create हो गया ✅"
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


// ============================================
// OPEN GROUP
// ============================================

function openGroup(
    groupId,
    groupData
) {

    const section =
        document.getElementById(
            "groupChatSection"
        );


    const groupName =
        document.getElementById(
            "selectedGroupName"
        );


    if (section) {

        section.style.display =
            "block";

    }


    if (groupName) {

        groupName.textContent =
            groupData.name ||
            "Group";

    }


    const members =
        Array.isArray(
            groupData.members
        )
            ? groupData.members
            : [];


    const memberList =
        document.getElementById(
            "memberList"
        );


    if (memberList) {

        memberList.innerHTML =
            members.map(
                member => `
                    <div>
                        👤
                        ${escapeHTML(member)}
                    </div>
                `
            ).join("");

    }


    loadGroupMessages(
        groupId
    );

}


// ============================================
// GROUP MEMBER ADD
// ============================================

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


let currentGroupId =
    null;


async function addMember() {

    if (!memberNameInput) return;


    const name =
        memberNameInput.value.trim();


    if (!name) {

        alert(
            "Member का नाम लिखें।"
        );

        return;

    }


    alert(
        "पहले Group खोलकर member add करना होगा।"
    );

}


if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        addMember
    );

}


// ============================================
// GROUP CHAT
// ============================================

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


function loadGroupMessages(
    groupId
) {

    currentGroupId =
        groupId;


    if (!groupMessages) return;


    if (stopGroupMessagesListener) {

        stopGroupMessagesListener();

    }


    const messagesQuery =
        query(
            collection(
                db,
                "groupMessages"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    stopGroupMessagesListener =
        onSnapshot(
            messagesQuery,
            snapshot => {

                groupMessages.innerHTML =
                    "";


                snapshot.forEach(
                    messageDoc => {

                        const data =
                            messageDoc.data();


                        if (
                            data.groupId !==
                            groupId
                        ) {

                            return;

                        }


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
                                : "message other";


                        box.innerHTML = `

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

                            <small>
                                ${escapeHTML(
                                    formatDateTime(
                                        data.createdAt
                                    )
                                )}
                            </small>

                        `;


                        groupMessages.appendChild(
                            box
                        );

                    }
                );


                groupMessages.scrollTop =
                    groupMessages.scrollHeight;

            }
        );

}


let stopGroupMessagesListener =
    null;


async function sendGroupMessage() {

    if (
        !groupMessageInput ||
        !currentGroupId
    ) {

        return;

    }


    const message =
        groupMessageInput.value.trim();


    if (!message) {

        return;

    }


    const name =
        getUserName();


    try {

        await addDoc(
            collection(
                db,
                "groupMessages"
            ),
            {

                groupId:
                    currentGroupId,

                name: name,

                message: message,

                createdAt:
                    getTime()

            }
        );


        groupMessageInput.value =
            "";

    } catch (error) {

        console.error(
            "Group message error:",
            error
        );


        alert(
            "Group message send नहीं हुआ।"
        );

    }

}


if (sendGroupMessageBtn) {

    sendGroupMessageBtn.addEventListener(
        "click",
        sendGroupMessage
    );

}


if (groupMessageInput) {

    groupMessageInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendGroupMessage();

            }

        }
    );

}


// ============================================
// HOMEWORK
// ============================================

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


let stopHomeworkListener =
    null;


function startHomework() {

    if (!homeworkList) return;


    if (stopHomeworkListener) {

        stopHomeworkListener();

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


    stopHomeworkListener =
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
                                📖 Hindi:
                                ${escapeHTML(
                                    data.hindi ||
                                    ""
                                )}
                            </p>

                            <p>
                                🔤 English:
                                ${escapeHTML(
                                    data.english ||
                                    ""
                                )}
                            </p>

                            <p>
                                ➗ Maths:
                                ${escapeHTML(
                                    data.maths ||
                                    ""
                                )}
                            </p>

                            <p>
                                🔬 Science:
                                ${escapeHTML(
                                    data.science ||
                                    ""
                                )}
                            </p>

                            <p>
                                🌍 SST:
                                ${escapeHTML(
                                    data.sst ||
                                    ""
                                )}
                            </p>

                            <p>
                                💻 Computer:
                                ${escapeHTML(
                                    data.computer ||
                                    ""
                                )}
                            </p>

                            <p>
                                🎨 Art:
                                ${escapeHTML(
                                    data.art ||
                                    ""
                                )}
                            </p>

                            <small>
                                👤
                                ${escapeHTML(
                                    data.name ||
                                    ""
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


                        homeworkList.appendChild(
                            box
                        );

                    }
                );

            }
        );

}


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


            try {

                await addDoc(
                    collection(
                        db,
                        "homework"
                    ),
                    {

                        date: date,

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

                        name: name,

                        createdAt:
                            getTime()

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
                ].forEach(
                    input => {

                        if (input) {

                            input.value =
                                "";

                        }

                    }
                );


                alert(
                    "Homework Save हो गया ✅"
                );

            } catch (error) {

                console.error(
                    "Homework error:",
                    error
                );


                alert(
                    "Homework save नहीं हुआ।"
                );

            }

        }
    );

}


// ============================================
// SCHOOL
// ============================================

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


let stopSchoolListener =
    null;


function startSchool() {

    if (!schoolList) return;


    if (stopSchoolListener) {

        stopSchoolListener();

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


    stopSchoolListener =
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


                        schoolList.appendChild(
                            box
                        );

                    }
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


            try {

                await addDoc(
                    collection(
                        db,
                        "school"
                    ),
                    {

                        name: name,

                        update: update,

                        createdAt:
                            getTime(),

                        seenBy: []

                    }
                );


                schoolInput.value =
                    "";


                alert(
                    "School update save हो गया ✅"
                );

            } catch (error) {

                console.error(
                    "School error:",
                    error
                );


                alert(
                    "School update save नहीं हुआ।"
                );

            }

        }
    );

}


// ============================================
// NOTES
// ============================================

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


let stopNotesListener =
    null;


function startNotes() {

    if (!notesList) return;


    if (stopNotesListener) {

        stopNotesListener();

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


    stopNotesListener =
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


                        notesList.appendChild(
                            box
                        );

                    }
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


            try {

                await addDoc(
                    collection(
                        db,
                        "notes"
                    ),
                    {

                        name: name,

                        note: note,

                        createdAt:
                            getTime(),

                        seenBy: []

                    }
                );


                noteInput.value =
                    "";


                alert(
                    "Note save हो गया ✅"
                );

            } catch (error) {

                console.error(
                    "Notes error:",
                    error
                );


                alert(
                    "Note save नहीं हुआ।"
                );

            }

        }
    );

}


// ============================================
// DARK MODE
// ============================================

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


// ============================================
// NOTIFICATIONS
// ============================================

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

            if (
                !("Notification" in window)
            ) {

                if (notificationMessage) {

                    notificationMessage.textContent =
                        "इस browser में notification support नहीं है।";

                }

                return;

            }


            const permission =
                await Notification.requestPermission();


            if (notificationMessage) {

                if (
                    permission ===
                    "granted"
                ) {

                    notificationMessage.textContent =
                        "Notifications ON ✅";

                } else {

                    notificationMessage.textContent =
                        "Notifications allow नहीं हुई।";

                }

            }

        }
    );

}


// ============================================
// LANGUAGE BUTTONS
// ============================================

const hindiLanguageBtn =
    document.getElementById(
        "hindiLanguageBtn"
    );

const englishLanguageBtn =
    document.getElementById(
        "englishLanguageBtn"
    );

const languageMessage =
    document.getElementById(
        "languageMessage"
    );


if (hindiLanguageBtn) {

    hindiLanguageBtn.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "studyLanguage",
                "hi"
            );


            if (languageMessage) {

                languageMessage.textContent =
                    "भाषा हिंदी कर दी गई। 🇮🇳";

            }

        }
    );

}


if (englishLanguageBtn) {

    englishLanguageBtn.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "studyLanguage",
                "en"
            );


            if (languageMessage) {

                languageMessage.textContent =
                    "Language changed to English. 🇬🇧";

            }

        }
    );

}


// ============================================
// RESET APP DATA
// ============================================

const clearDataBtn =
    document.getElementById(
        "clearDataBtn"
    );

const settingsMessage =
    document.getElementById(
        "settingsMessage"
    );


if (clearDataBtn) {

    clearDataBtn.addEventListener(
        "click",
        () => {

            const yes =
                confirm(
                    "क्या आप इस device का saved StudyConnect data हटाना चाहते हैं?"
                );


            if (!yes) return;


            localStorage.clear();

            sessionStorage.clear();


            if (settingsMessage) {

                settingsMessage.textContent =
                    "Data reset हो गया।";

            }


            location.reload();

        }
    );

}


// ============================================
// ONLINE USERS
// ============================================

const onlineCount =
    document.getElementById(
        "onlineCount"
    );

const onlineUsers =
    document.getElementById(
        "onlineUsers"
    );


function getSafeUserId(name) {

    return encodeURIComponent(
        name
    )
    .replace(
        /%/g,
        "_"
    )
    .replace(
        /[^a-zA-Z0-9_-]/g,
        ""
    )
    .slice(
        0,
        100
    );

}


async function updateOnlineUser(
    name = getUserName()
) {

    if (!name) return;


    try {

        await addDoc(
            collection(
                db,
                "onlineUsers"
            ),
            {

                name: name,

                online: true,

                lastSeen:
                    getTime()

            }
        );

    } catch (error) {

        console.error(
            "Online user error:",
            error
        );

    }

}


function startOnlineStatus() {

    if (!getUserName()) {

        return;

    }


    updateOnlineUser();

}


if (onlineCount) {

    onSnapshot(
        collection(
            db,
            "onlineUsers"
        ),
        snapshot => {

            const users = [];

            const currentTime =
                Date.now();


            snapshot.forEach(
                item => {

                    const data =
                        item.data();


                    const lastSeen =
                        Number(
                            data.lastSeen ||
                            0
                        );


                    if (
                        data.online === true &&
                        (
                            currentTime -
                            lastSeen
                        ) < 70000
                    ) {

                        users.push(
                            data.name ||
                            "Student"
                        );

                    }

                }
            );


            onlineCount.textContent =
                users.length;


            if (onlineUsers) {

                onlineUsers.innerHTML =
                    users.map(
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


// ============================================
// START APP DATA
// ============================================

startChat();

startGroups();

startHomework();

startSchool();

startNotes();


// ============================================
// FINISHED
// ============================================

console.log(
    "StudyConnect loaded successfully ✅"
);
