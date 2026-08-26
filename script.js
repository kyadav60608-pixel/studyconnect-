// ==================================================
// STUDYCONNECT
// FIREBASE JAVASCRIPT
// ==================================================


// ==================================================
// FIREBASE IMPORT
// ==================================================

import {
    initializeApp
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ==================================================
// FIREBASE CONFIG
// ==================================================

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


console.log(
    "Firebase connected successfully!"
);


// ==================================================
// OPEN STUDYCONNECT
// ==================================================

const passwordScreen =
    document.getElementById(
        "passwordScreen"
    );


const openUserName =
    document.getElementById(
        "openUserName"
    );


const appPassword =
    document.getElementById(
        "appPassword"
    );


const unlockBtn =
    document.getElementById(
        "unlockBtn"
    );


const passwordError =
    document.getElementById(
        "passwordError"
    );


// PASSWORD
const APP_PASSWORD = "123";


// OPEN FUNCTION

function openStudyConnect() {

    if (
        !openUserName ||
        !appPassword
    ) {

        return;

    }


    const name =
        openUserName.value.trim();


    const password =
        appPassword.value.trim();


    if (name === "") {

        if (passwordError) {

            passwordError.textContent =
                "❌ पहले अपना नाम लिखें।";

        }

        openUserName.focus();

        return;

    }


    if (password === "") {

        if (passwordError) {

            passwordError.textContent =
                "❌ Password डालें।";

        }

        appPassword.focus();

        return;

    }


    if (password !== APP_PASSWORD) {

        if (passwordError) {

            passwordError.textContent =
                "❌ गलत password।";

        }

        appPassword.value = "";

        appPassword.focus();

        return;

    }


    // NAME SAVE

    localStorage.setItem(
        "studyName",
        name
    );


    // OPEN APP

    if (passwordScreen) {

        passwordScreen.style.display =
            "none";

    }


    if (passwordError) {

        passwordError.textContent =
            "";

    }


    loadSavedName();


    console.log(
        "StudyConnect opened."
    );

}


// BUTTON CLICK

if (unlockBtn) {

    unlockBtn.addEventListener(
        "click",
        openStudyConnect
    );

}


// ENTER KEY

if (appPassword) {

    appPassword.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                openStudyConnect();

            }

        }
    );

}


if (openUserName) {

    openUserName.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                if (appPassword) {

                    appPassword.focus();

                }

            }

        }
    );

}


// ==================================================
// HTML ESCAPE
// ==================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


// ==================================================
// DATE + TIME
// ==================================================

function formatDateTime(timestamp) {

    if (!timestamp) {

        return "";

    }


    const date =
        new Date(timestamp);


    return date.toLocaleString(
        "hi-IN",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


// ==================================================
// PAGE NAVIGATION
// ==================================================

const pages =
    document.querySelectorAll(
        ".page"
    );


const navButtons =
    document.querySelectorAll(
        "[data-page]"
    );


function showPage(pageId) {

    pages.forEach(
        function(page) {

            page.classList.remove(
                "active"
            );

        }
    );


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

}


navButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function() {

                showPage(
                    button.getAttribute(
                        "data-page"
                    )
                );

            }
        );

    }
);


// ==================================================
// HOME CARDS
// ==================================================

const openPageCards =
    document.querySelectorAll(
        ".open-page"
    );


openPageCards.forEach(
    function(card) {

        card.addEventListener(
            "click",
            function() {

                showPage(
                    card.getAttribute(
                        "data-page"
                    )
                );

            }
        );

    }
);


// ==================================================
// MENU
// ==================================================

const menuBtn =
    document.getElementById(
        "menuBtn"
    );


const navMenu =
    document.getElementById(
        "navMenu"
    );


if (
    menuBtn &&
    navMenu
) {

    menuBtn.addEventListener(
        "click",
        function() {

            navMenu.classList.toggle(
                "show"
            );

        }
    );

}


// ==================================================
// NAME
// ==================================================

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


function loadSavedName() {

    const savedName =
        localStorage.getItem(
            "studyName"
        );


    if (!savedName) {

        return;

    }


    if (studentName) {

        studentName.value =
            savedName;

        studentName.disabled =
            true;

    }


    if (saveNameBtn) {

        saveNameBtn.style.display =
            "none";

    }


    if (nameMessage) {

        nameMessage.textContent =
            "Welcome, " +
            savedName +
            "! 👋";

    }

}


if (
    saveNameBtn &&
    studentName
) {

    saveNameBtn.addEventListener(
        "click",
        function() {

            const name =
                studentName.value.trim();


            if (name === "") {

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
                    "Welcome, " +
                    name +
                    "! 👋";

            }

        }
    );

}


loadSavedName();


// ==================================================
// LONG PRESS DELETE
// ==================================================

function addLongPressDelete(
    element,
    deleteFunction
) {

    let timer = null;


    function startPress(event) {

        if (
            event.target.closest(
                "button"
            )
        ) {

            return;

        }


        timer =
            setTimeout(
                async function() {

                    const answer =
                        confirm(
                            "🗑️ इस item को delete करना है?"
                        );


                    if (answer) {

                        await deleteFunction();

                    }

                },
                700
            );

    }


    function cancelPress() {

        if (timer) {

            clearTimeout(timer);

            timer = null;

        }

    }


    element.addEventListener(
        "mousedown",
        startPress
    );


    element.addEventListener(
        "mouseup",
        cancelPress
    );


    element.addEventListener(
        "mouseleave",
        cancelPress
    );


    element.addEventListener(
        "touchstart",
        startPress,
        {
            passive: true
        }
    );


    element.addEventListener(
        "touchend",
        cancelPress
    );


    element.addEventListener(
        "touchmove",
        cancelPress
    );

}


// ==================================================
// CHAT
// ==================================================

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


// ==================================================
// EMOJI
// ==================================================

if (
    emojiBtn &&
    messageInput
) {

    emojiBtn.addEventListener(
        "click",
        function() {

            messageInput.value +=
                " 😊";

            messageInput.focus();

        }
    );

}


// ==================================================
// LOAD CHAT
// ==================================================

async function displayMessages() {

    if (!chatMessages) {

        return;

    }


    try {

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


        const snapshot =
            await getDocs(
                messagesQuery
            );


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


        const currentName =
            localStorage.getItem(
                "studyName"
            ) ||
            "Student";


        snapshot.forEach(
            function(item) {

                const data =
                    item.data();


                const name =
                    data.name ||
                    "Student";


                const message =
                    data.message ||
                    "";


                const isMine =
                    name === currentName;


                const messageBox =
                    document.createElement(
                        "div"
                    );


                messageBox.className =
                    isMine
                        ? "message mine"
                        : "message other";


                const tick =
                    isMine
                        ? "✓✓"
                        : "";


                messageBox.innerHTML = `

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <p>
                        ${escapeHTML(message)}
                    </p>

                    <small>

                        ${formatDateTime(
                            data.createdAt
                        )}

                        ${tick}

                    </small>

                `;


                addLongPressDelete(
                    messageBox,
                    async function() {

                        try {

                            await deleteDoc(
                                doc(
                                    db,
                                    "messages",
                                    item.id
                                )
                            );


                            await displayMessages();


                        } catch (error) {

                            console.error(
                                error
                            );

                            alert(
                                "Message delete नहीं हुआ।"
                            );

                        }

                    }
                );


                chatMessages.appendChild(
                    messageBox
                );

            }
        );


        chatMessages.scrollTop =
            chatMessages.scrollHeight;


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        chatMessages.innerHTML = `
            <p>
                Chat load नहीं हो पाया।
            </p>
        `;

    }

}


// ==================================================
// SEND MESSAGE
// ==================================================

async function sendMessage() {

    if (!messageInput) {

        return;

    }


    const text =
        messageInput.value.trim();


    if (text === "") {

        return;

    }


    const name =
        localStorage.getItem(
            "studyName"
        );


    if (!name) {

        alert(
            "पहले अपना नाम Save करें।"
        );

        showPage("home");

        return;

    }


    try {

        sendMessageBtn.disabled =
            true;


        await addDoc(
            collection(
                db,
                "messages"
            ),
            {

                name:
                    name,

                message:
                    text,

                createdAt:
                    Date.now()

            }
        );


        messageInput.value =
            "";


        await displayMessages();


    } catch (error) {

        console.error(
            "Send error:",
            error
        );


        alert(
            "Message send नहीं हुआ।"
        );


    } finally {

        sendMessageBtn.disabled =
            false;

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
        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ==================================================
// GROUPS
// ==================================================

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


const groupMessageInput =
    document.getElementById(
        "groupMessageInput"
    );


const sendGroupMessageBtn =
    document.getElementById(
        "sendGroupMessageBtn"
    );


const groupMessages =
    document.getElementById(
        "groupMessages"
    );


let selectedGroupId =
    null;


let selectedGroupData =
    null;


// ==================================================
// LOAD GROUPS
// ==================================================

async function loadGroups() {

    if (!groupList) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "groups"
                )
            );


        groupList.innerHTML =
            "";


        snapshot.forEach(
            function(item) {

                const data =
                    item.data();


                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    "group-item";


                box.innerHTML = `

                    <strong>
                        👥 ${escapeHTML(
                            data.name || "Group"
                        )}
                    </strong>

                    <small>
                        ${formatDateTime(
                            data.createdAt
                        )}
                    </small>

                `;


                box.addEventListener(
                    "click",
                    function() {

                        openGroup(
                            item.id,
                            data
                        );

                    }
                );


                addLongPressDelete(
                    box,
                    async function() {

                        await deleteDoc(
                            doc(
                                db,
                                "groups",
                                item.id
                            )
                        );


                        if (
                            selectedGroupId ===
                            item.id
                        ) {

                            selectedGroupId =
                                null;

                            selectedGroupData =
                                null;


                            if (
                                groupChatSection
                            ) {

                                groupChatSection.style.display =
                                    "none";

                            }

                        }


                        await loadGroups();

                    }
                );


                groupList.appendChild(
                    box
                );

            }
        );


    } catch (error) {

        console.error(
            "Groups error:",
            error
        );

    }

}


// ==================================================
// CREATE GROUP
// ==================================================

if (
    createGroupBtn &&
    groupInput
) {

    createGroupBtn.addEventListener(
        "click",
        async function() {

            const name =
                groupInput.value.trim();


            if (name === "") {

                alert(
                    "Group का नाम लिखें।"
                );

                return;

            }


            const owner =
                localStorage.getItem(
                    "studyName"
                ) ||
                "Student";


            try {

                await addDoc(
                    collection(
                        db,
                        "groups"
                    ),
                    {

                        name:
                            name,

                        owner:
                            owner,

                        members:
                            [
                                {
                                    name:
                                        owner,
                                    phone:
                                        ""
                                }
                            ],

                        createdAt:
                            Date.now()

                    }
                );


                groupInput.value =
                    "";


                await loadGroups();


                alert(
                    "✅ Group बन गया।"
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

}


// ==================================================
// OPEN GROUP
// ==================================================

async function openGroup(
    groupId,
    data
) {

    selectedGroupId =
        groupId;


    selectedGroupData =
        data;


    if (selectedGroupName) {

        selectedGroupName.textContent =
            "👥 " +
            (data.name || "Group");

    }


    if (groupChatSection) {

        groupChatSection.style.display =
            "block";

    }


    displayGroupMembers(
        data.members || []
    );


    await loadGroupMessages();

}


// ==================================================
// DISPLAY MEMBERS
// ==================================================

function displayGroupMembers(
    members
) {

    if (!memberList) {

        return;

    }


    memberList.innerHTML =
        "";


    members.forEach(
        function(member) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "member-item";


            box.innerHTML = `

                👤
                <strong>
                    ${escapeHTML(
                        member.name || "Member"
                    )}
                </strong>

                ${
                    member.phone
                        ? `<small>
                            📱 ${escapeHTML(
                                member.phone
                            )}
                           </small>`
                        : ""
                }

            `;


            memberList.appendChild(
                box
            );

        }
    );

}


// ==================================================
// ADD MEMBER
// ==================================================

if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        async function() {

            if (!selectedGroupId) {

                alert(
                    "पहले कोई Group खोलें।"
                );

                return;

            }


            const name =
                memberNameInput.value.trim();


            const phone =
                memberPhoneInput.value.trim();


            if (name === "") {

                alert(
                    "Member का नाम लिखें।"
                );

                return;

            }


            try {

                const groupRef =
                    doc(
                        db,
                        "groups",
                        selectedGroupId
                    );


                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "groups"
                        )
                    );


                let members = [];


                snapshot.forEach(
                    function(item) {

                        if (
                            item.id ===
                            selectedGroupId
                        ) {

                            members =
                                item.data()
                                    .members ||
                                [];

                        }

                    }
                );


                members.push(
                    {
                        name:
                            name,

                        phone:
                            phone
                    }
                );


                // Firebase document update के लिए
                // updateDoc चाहिए।
                // इस version में member save करने के लिए
                // पूरा group document फिर से नहीं लिखा जा रहा।
                //
                // इसलिए नीचे सुरक्षित तरीका:
                //
                // नया member collection में रखा जाएगा।

                await addDoc(
                    collection(
                        db,
                        "groupMembers"
                    ),
                    {

                        groupId:
                            selectedGroupId,

                        name:
                            name,

                        phone:
                            phone,

                        createdAt:
                            Date.now()

                    }
                );


                memberNameInput.value =
                    "";

                memberPhoneInput.value =
                    "";


                await loadGroupMembers();


            } catch (error) {

                console.error(
                    "Member error:",
                    error
                );


                alert(
                    "Member add नहीं हुआ।"
                );

            }

        }
    );

}


// ==================================================
// LOAD GROUP MEMBERS
// ==================================================

async function loadGroupMembers() {

    if (
        !selectedGroupId ||
        !memberList
    ) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "groupMembers"
                )
            );


        memberList.innerHTML =
            "";


        snapshot.forEach(
            function(item) {

                const data =
                    item.data();


                if (
                    data.groupId !==
                    selectedGroupId
                ) {

                    return;

                }


                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    "member-item";


                box.innerHTML = `

                    👤
                    <strong>
                        ${escapeHTML(
                            data.name || "Member"
                        )}
                    </strong>

                    <small>
                        📱 ${escapeHTML(
                            data.phone || ""
                        )}
                    </small>

                `;


                addLongPressDelete(
                    box,
                    async function() {

                        await deleteDoc(
                            doc(
                                db,
                                "groupMembers",
                                item.id
                            )
                        );


                        await loadGroupMembers();

                    }
                );


                memberList.appendChild(
                    box
                );

            }
        );


    } catch (error) {

        console.error(
            "Member loading error:",
            error
        );

    }

}


// ==================================================
// GROUP CHAT
// ==================================================

async function loadGroupMessages() {

    if (
        !selectedGroupId ||
        !groupMessages
    ) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "groupMessages"
                )
            );


        groupMessages.innerHTML =
            "";


        const currentName =
            localStorage.getItem(
                "studyName"
            ) ||
            "Student";


        snapshot.forEach(
            function(item) {

                const data =
                    item.data();


                if (
                    data.groupId !==
                    selectedGroupId
                ) {

                    return;

                }


                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    data.name === currentName
                        ? "message mine"
                        : "message other";


                box.innerHTML = `

                    <strong>
                        ${escapeHTML(
                            data.name || "Student"
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            data.message || ""
                        )}
                    </p>

                    <small>
                        ${formatDateTime(
                            data.createdAt
                        )}

                        ${
                            data.name ===
                            currentName
                                ? " ✓✓"
                                : ""
                        }

                    </small>

                `;


                addLongPressDelete(
                    box,
                    async function() {

                        await deleteDoc(
                            doc(
                                db,
                                "groupMessages",
                                item.id
                            )
                        );


                        await loadGroupMessages();

                    }
                );


                groupMessages.appendChild(
                    box
                );

            }
        );


    } catch (error) {

        console.error(
            "Group chat error:",
            error
        );

    }

}


// ==================================================
// SEND GROUP MESSAGE
// ==================================================

async function sendGroupMessage() {

    if (
        !selectedGroupId ||
        !groupMessageInput
    ) {

        alert(
            "पहले कोई Group खोलें।"
        );

        return;

    }


    const message =
        groupMessageInput.value.trim();


    if (message === "") {

        return;

    }


    const name =
        localStorage.getItem(
            "studyName"
        ) ||
        "Student";


    try {

        await addDoc(
            collection(
                db,
                "groupMessages"
            ),
            {

                groupId:
                    selectedGroupId,

                name:
                    name,

                message:
                    message,

                createdAt:
                    Date.now()

            }
        );


        groupMessageInput.value =
            "";


        await loadGroupMessages();


    } catch (error) {

        console.error(
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
        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendGroupMessage();

            }

        }
    );

}


// ==================================================
// HOMEWORK
// ==================================================

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


// ==================================================
// LOAD HOMEWORK
// ==================================================

async function loadHomework() {

    if (!homeworkList) {

        return;

    }


    try {

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


        const snapshot =
            await getDocs(
                homeworkQuery
            );


        homeworkList.innerHTML =
            "";


        snapshot.forEach(
            function(item) {

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
                        📅 ${escapeHTML(
                            data.date || ""
                        )}
                    </h3>

                    <p>
                        📖 Hindi:
                        ${escapeHTML(
                            data.hindi || ""
                        )}
                    </p>

                    <p>
                        🔤 English:
                        ${escapeHTML(
                            data.english || ""
                        )}
                    </p>

                    <p>
                        ➗ Maths:
                        ${escapeHTML(
                            data.maths || ""
                        )}
                    </p>

                    <p>
                        🔬 Science:
                        ${escapeHTML(
                            data.science || ""
                        )}
                    </p>

                    <p>
                        🌍 SST:
                        ${escapeHTML(
                            data.sst || ""
                        )}
                    </p>

                    <p>
                        💻 Computer:
                        ${escapeHTML(
                            data.computer || ""
                        )}
                    </p>

                    <p>
                        🎨 Art:
                        ${escapeHTML(
                            data.art || ""
                        )}
                    </p>

                    <small>
                        ${formatDateTime(
                            data.createdAt
                        )}
                    </small>

                `;


                addLongPressDelete(
                    box,
                    async function() {

                        await deleteDoc(
                            doc(
                                db,
                                "homework",
                                item.id
                            )
                        );


                        await loadHomework();

                    }
                );


                homeworkList.appendChild(
                    box
                );

            }
        );


    } catch (error) {

        console.error(
            "Homework error:",
            error
        );

    }

}


// ==================================================
// SAVE HOMEWORK
// ==================================================

if (addHomeworkBtn) {

    addHomeworkBtn.addEventListener(
        "click",
        async function() {

            const date =
                homeworkDate?.value || "";


            if (date === "") {

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

                        date:
                            date,

                        hindi:
                            hindiHomework?.value.trim() || "",

                        english:
                            englishHomework?.value.trim() || "",

                        maths:
                            mathHomework?.value.trim() || "",

                        science:
                            scienceHomework?.value.trim() || "",

                        sst:
                            sstHomework?.value.trim() || "",

                        computer:
                            computerHomework?.value.trim() || "",

                        art:
                            artHomework?.value.trim() || "",

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
                ].forEach(
                    function(input) {

                        if (input) {

                            input.value =
                                "";

                        }

                    }
                );


                await loadHomework();


                alert(
                    "✅ Homework saved!"
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

}


// ==================================================
// SCHOOL UPDATE
// ==================================================

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


// ==================================================
// LOAD SCHOOL
// ==================================================

async function loadSchool() {

    if (!schoolList) {

        return;

    }


    try {

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


        const snapshot =
            await getDocs(
                schoolQuery
            );


        schoolList.innerHTML =
            "";


        snapshot.forEach(
            function(item) {

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
                        👤 ${escapeHTML(
                            data.name || "Student"
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            data.update || ""
                        )}
                    </p>

                    <small>
                        ${formatDateTime(
                            data.createdAt
                        )}
                    </small>

                `;


                addLongPressDelete(
                    box,
                    async function() {

                        await deleteDoc(
                            doc(
                                db,
                                "school",
                                item.id
                            )
                        );


                        await loadSchool();

                    }
                );


                schoolList.appendChild(
                    box
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


// ==================================================
// SAVE SCHOOL
// ==================================================

if (
    saveSchoolBtn &&
    schoolInput
) {

    saveSchoolBtn.addEventListener(
        "click",
        async function() {

            const update =
                schoolInput.value.trim();


            if (update === "") {

                alert(
                    "School update लिखें।"
                );

                return;

            }


            const name =
                localStorage.getItem(
                    "studyName"
                ) ||
                "Student";


            try {

                await addDoc(
                    collection(
                        db,
                        "school"
                    ),
                    {

                        name:
                            name,

                        update:
                            update,

                        createdAt:
                            Date.now()

                    }
                );


                schoolInput.value =
                    "";


                await loadSchool();


            } catch (error) {

                console.error(
                    error
                );


                alert(
                    "School update save नहीं हुआ।"
                );

            }

        }
    );

}


// ==================================================
// NOTES
// ==================================================

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


// ==================================================
// LOAD NOTES
// ==================================================

async function loadNotes() {

    if (!notesList) {

        return;

    }


    try {

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


        const snapshot =
            await getDocs(
                notesQuery
            );


        notesList.innerHTML =
            "";


        snapshot.forEach(
            function(item) {

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
                        👤 ${escapeHTML(
                            data.name || "Student"
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            data.note || ""
                        )}
                    </p>

                    <small>
                        ${formatDateTime(
                            data.createdAt
                        )}
                    </small>

                `;


                addLongPressDelete(
                    box,
                    async function() {

                        await deleteDoc(
                            doc(
                                db,
                                "notes",
                                item.id
                            )
                        );


                        await loadNotes();

                    }
                );


                notesList.appendChild(
                    box
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


// ==================================================
// SAVE NOTE
// ==================================================

if (
    saveNoteBtn &&
    noteInput
) {

    saveNoteBtn.addEventListener(
        "click",
        async function() {

            const note =
                noteInput.value.trim();


            if (note === "") {

                alert(
                    "Note लिखें।"
                );

                return;

            }


            const name =
                localStorage.getItem(
                    "studyName"
                ) ||
                "Student";


            try {

                await addDoc(
                    collection(
                        db,
                        "notes"
                    ),
                    {

                        name:
                            name,

                        note:
                            note,

                        createdAt:
                            Date.now()

                    }
                );


                noteInput.value =
                    "";


                await loadNotes();


            } catch (error) {

                console.error(
                    error
                );


                alert(
                    "Note save नहीं हुआ।"
                );

            }

        }
    );

}


// ==================================================
// CHANGE NAME
// ==================================================

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


if (changeNameBtn) {

    changeNameBtn.addEventListener(
        "click",
        function() {

            const newName =
                changeNameInput.value.trim();


            if (newName === "") {

                if (changeNameMessage) {

                    changeNameMessage.textContent =
                        "पहले नया नाम लिखें।";

                }

                return;

            }


            localStorage.setItem(
                "studyName",
                newName
            );


            if (changeNameMessage) {

                changeNameMessage.textContent =
                    "✅ नाम बदल गया।";

            }


            loadSavedName();

        }
    );

}


// ==================================================
// LANGUAGE
// ==================================================

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
        function() {

            localStorage.setItem(
                "studyLanguage",
                "hi"
            );


            if (languageMessage) {

                languageMessage.textContent =
                    "🇮🇳 हिंदी चुनी गई।";

            }

        }
    );

}


if (englishLanguageBtn) {

    englishLanguageBtn.addEventListener(
        "click",
        function() {

            localStorage.setItem(
                "studyLanguage",
                "en"
            );


            if (languageMessage) {

                languageMessage.textContent =
                    "🇬🇧 English selected.";

            }

        }
    );

}


// ==================================================
// DARK MODE
// ==================================================

const themeBtn =
    document.getElementById(
        "themeBtn"
    );


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        function() {

            document.body.classList.toggle(
                "dark"
            );


            const dark =
                document.body.classList.contains(
                    "dark"
                );


            localStorage.setItem(
                "darkMode",
                dark
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


// ==================================================
// NOTIFICATIONS
// ==================================================

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
        async function() {

            if (
                !("Notification" in window)
            ) {

                if (notificationMessage) {

                    notificationMessage.textContent =
                        "इस browser में notifications उपलब्ध नहीं हैं।";

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
                        "🔔 Notifications enabled.";

                } else {

                    notificationMessage.textContent =
                        "Notifications allow नहीं किए गए।";

                }

            }

        }
    );

}


// ==================================================
// RESET
// ==================================================

const clearDataBtn =
    document.getElementById(
        "clearDataBtn"
    );


if (clearDataBtn) {

    clearDataBtn.addEventListener(
        "click",
        function() {

            const answer =
                confirm(
                    "क्या local app data reset करना है?"
                );


            if (!answer) {

                return;

            }


            localStorage.clear();

            sessionStorage.clear();

            location.reload();

        }
    );

}


// ==================================================
// START
// ==================================================

displayMessages();

loadGroups();

loadHomework();

loadSchool();

loadNotes();


console.log(
    "StudyConnect loaded successfully."
);