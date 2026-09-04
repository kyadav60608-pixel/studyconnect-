/* =========================================================
   STUDYCONNECT - COMPLETE script.js
   ========================================================= */

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";

const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

const FIREBASE_VERSION = "12.1.0";

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyi3Wc3AUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let db = null;
let firebaseReady = false;
let firebaseModules = {};

let currentUser = null;

let chatUnsubscribe = null;
let groupsUnsubscribe = null;
let groupMessagesUnsubscribe = null;
let onlineUnsubscribe = null;
let allowedUsersUnsubscribe = null;

let heartbeatTimer = null;
let selectedGroup = null;

let currentLanguage =
    localStorage.getItem("studyLanguage") || "en";

let navigationReady = false;
let homeReady = false;
let chatReady = false;
let groupsReady = false;
let homeworkReady = false;
let schoolReady = false;
let notesReady = false;
let settingsReady = false;

let unlockedGroups = new Set();


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function show(element) {
    if (element) {
        element.style.display = "";
    }
}


function hide(element) {
    if (element) {
        element.style.display = "none";
    }
}


function setText(id, text) {
    const element = $(id);

    if (element) {
        element.textContent = text;
    }
}


function normalizePhone(phone) {
    return String(phone || "")
        .replace(/\D/g, "")
        .slice(-10);
}


function validPhone(phone) {
    return /^[6-9][0-9]{9}$/.test(
        normalizePhone(phone)
    );
}


function escapeHTML(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showError(element, text) {
    if (!element) return;

    element.textContent = text;
    element.style.display = "block";
}


function hideError(element) {
    if (!element) return;

    element.textContent = "";
    element.style.display = "none";
}


/* =========================================================
   FIREBASE
   ========================================================= */

async function loadFirebase() {

    if (firebaseReady && db) {
        return true;
    }

    try {

        const appModule = await import(
            `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
        );

        const firestoreModule = await import(
            `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
        );

        const app =
            appModule.initializeApp(firebaseConfig);

        db =
            firestoreModule.getFirestore(app);

        firebaseModules = {
            collection: firestoreModule.collection,
            addDoc: firestoreModule.addDoc,
            setDoc: firestoreModule.setDoc,
            getDoc: firestoreModule.getDoc,
            getDocs: firestoreModule.getDocs,
            updateDoc: firestoreModule.updateDoc,
            deleteDoc: firestoreModule.deleteDoc,
            doc: firestoreModule.doc,
            query: firestoreModule.query,
            where: firestoreModule.where,
            orderBy: firestoreModule.orderBy,
            limit: firestoreModule.limit,
            onSnapshot: firestoreModule.onSnapshot,
            serverTimestamp:
                firestoreModule.serverTimestamp,
            Timestamp:
                firestoreModule.Timestamp
        };

        firebaseReady = true;

        console.log("Firebase connected successfully.");

        return true;

    } catch (error) {

        console.error(
            "Firebase loading error:",
            error
        );

        firebaseReady = false;

        return false;
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {

    const unlockBtn = $("unlockBtn");
    const ownerNextBtn = $("ownerNextBtn");
    const enterAppBtn = $("enterAppBtn");
    const backBtn = $("backToLoginBtn");


    show($("passwordScreen"));
    show($("schoolPasswordStep"));

    hide($("ownerStep"));
    hide($("userDetailsStep"));
    hide($("contactOwnerScreen"));
    hide($("appContainer"));


    if (unlockBtn) {

        unlockBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                const password =
                    $("appPassword")?.value.trim();

                if (password !== SCHOOL_PASSWORD) {

                    showError(
                        $("passwordError"),
                        currentLanguage === "hi"
                            ? "गलत पासवर्ड!"
                            : "Wrong password!"
                    );

                    return;
                }

                hide($("schoolPasswordStep"));
                show($("ownerStep"));

                setText(
                    "ownerNameDisplay",
                    OWNER_NAME
                );

                hideError(
                    $("passwordError")
                );
            }
        );
    }


    if (ownerNextBtn) {

        ownerNextBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                hide($("ownerStep"));
                show($("userDetailsStep"));
            }
        );
    }


    if (enterAppBtn) {

        enterAppBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                await loginUser();
            }
        );
    }


    if (backBtn) {

        backBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                resetLogin();
            }
        );
    }


    $("appPassword")?.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                unlockBtn?.click();
            }
        }
    );


    $("openUserPhone")?.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                enterAppBtn?.click();
            }
        }
    );
}


/* =========================================================
   RESET LOGIN
   ========================================================= */

function resetLogin() {

    hide($("contactOwnerScreen"));
    hide($("appContainer"));

    show($("passwordScreen"));
    show($("schoolPasswordStep"));

    hide($("ownerStep"));
    hide($("userDetailsStep"));

    if ($("appPassword")) {
        $("appPassword").value = "";
    }

    if ($("openUserName")) {
        $("openUserName").value = "";
    }

    if ($("openUserPhone")) {
        $("openUserPhone").value = "";
    }

    hideError($("passwordError"));
}


/* =========================================================
   LOGIN USER
   ========================================================= */

async function loginUser() {

    const name =
        $("openUserName")?.value.trim();

    const phone =
        normalizePhone(
            $("openUserPhone")?.value
        );


    if (!name) {

        alert(
            currentLanguage === "hi"
                ? "कृपया अपना नाम डालें।"
                : "Please enter your name."
        );

        return;
    }


    if (!validPhone(phone)) {

        alert(
            currentLanguage === "hi"
                ? "कृपया सही 10 अंकों का मोबाइल नंबर डालें।"
                : "Please enter a valid 10-digit mobile number."
        );

        return;
    }


    if (
        name.toLowerCase() ===
        OWNER_NAME.toLowerCase() &&
        phone === normalizePhone(OWNER_PHONE)
    ) {

        currentUser = {
            name: OWNER_NAME,
            phone: phone,
            photo: "",
            isOwner: true
        };

        finishLogin();

        return;
    }


    const firebaseLoaded =
        await loadFirebase();


    if (!firebaseLoaded) {

        alert(
            currentLanguage === "hi"
                ? "Firebase कनेक्ट नहीं हुआ। इंटरनेट चेक करें।"
                : "Firebase could not connect. Check your internet."
        );

        return;
    }


    try {

        const usersRef =
            firebaseModules.collection(
                db,
                "allowedUsers"
            );


        const q =
            firebaseModules.query(
                usersRef,
                firebaseModules.where(
                    "phone",
                    "==",
                    phone
                )
            );


        const snapshot =
            await firebaseModules.getDocs(q);


        let found = null;


        snapshot.forEach(
            function (documentSnapshot) {

                const data =
                    documentSnapshot.data();

                const savedName =
                    String(
                        data.name || ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    savedName ===
                    name.toLowerCase()
                ) {

                    found = {
                        name:
                            data.name,

                        phone:
                            data.phone,

                        photo:
                            data.photo || "",

                        isOwner: false
                    };
                }
            }
        );


        if (!found) {

            showContactOwner();

            return;
        }


        currentUser = found;

        finishLogin();

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        alert(
            currentLanguage === "hi"
                ? "यूज़र चेक करते समय Firebase error आया।"
                : "Firebase error while checking user."
        );
    }
}


/* =========================================================
   CONTACT OWNER
   ========================================================= */

function showContactOwner() {

    hide($("passwordScreen"));
    hide($("appContainer"));

    show($("contactOwnerScreen"));

    setText(
        "contactOwnerTitle",
        currentLanguage === "hi"
            ? "Owner से संपर्क करें"
            : "Contact Owner"
    );

    setText(
        "contactOwnerText",
        currentLanguage === "hi"
            ? "आपका नाम और मोबाइल नंबर अभी Owner की अनुमति सूची में नहीं है।"
            : "Your name and mobile number are not approved by the Owner yet."
    );
}


/* =========================================================
   FINISH LOGIN
   ========================================================= */

function finishLogin() {

    hide($("passwordScreen"));
    hide($("contactOwnerScreen"));

    show($("appContainer"));


    if ($("studentName")) {

        $("studentName").value =
            currentUser.name;
    }


    if ($("currentUserProfile")) {

        $("currentUserProfile").textContent =
            currentUser.name;
    }


    localStorage.setItem(
        "studyCurrentUser",
        JSON.stringify(currentUser)
    );


    setupNavigation();
    setupHome();
    setupChat();
    setupGroups();
    setupHomework();
    setupSchool();
    setupNotes();
    setupSettings();


    updateOnlineStatus(true);
    startHeartbeat();
    updateOnlineUsers();


    openPage("home");
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    if (navigationReady) return;

    navigationReady = true;


    const menuBtn =
        $("menuBtn");

    const navMenu =
        $("navMenu");


    if (menuBtn) {

        menuBtn.addEventListener(
            "click",
            function () {

                navMenu?.classList.toggle(
                    "show"
                );
            }
        );
    }


    document
        .querySelectorAll("[data-page]")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openPage(
                            button.dataset.page
                        );

                        navMenu?.classList.remove(
                            "show"
                        );
                    }
                );
            }
        );
}


function openPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(
            function (page) {

                page.style.display = "none";
            }
        );


    const target =
        $(pageName);


    if (target) {

        target.style.display = "";
    }


    if (pageName === "chat") {

        startChatRealtime();
    }


    if (pageName === "groups") {

        startGroupsRealtime();
    }
}


/* =========================================================
   HOME
   ========================================================= */

function setupHome() {

    if (homeReady) return;

    homeReady = true;


    $("saveNameBtn")?.addEventListener(
        "click",
        function () {

            const name =
                $("studentName")
                    ?.value.trim();


            if (!name) {

                setText(
                    "nameMessage",
                    currentLanguage === "hi"
                        ? "कृपया नाम डालें।"
                        : "Please enter your name."
                );

                return;
            }


            if (currentUser) {

                currentUser.name =
                    name;

                localStorage.setItem(
                    "studyCurrentUser",
                    JSON.stringify(
                        currentUser
                    )
                );
            }


            setText(
                "nameMessage",
                currentLanguage === "hi"
                    ? "नाम सेव हो गया।"
                    : "Name saved successfully."
            );
        }
    );


    $("onlineToggleBtn")?.addEventListener(
        "click",
        function () {

            const list =
                $("onlineUsers");


            if (!list) return;


            if (
                list.style.display ===
                "none"
            ) {

                list.style.display = "";

                updateOnlineUsers();

            } else {

                list.style.display =
                    "none";
            }
        }
    );
}


/* =========================================================
   ONLINE STATUS
   ========================================================= */

async function updateOnlineStatus(isOnline) {

    if (!firebaseReady || !currentUser) {
        return;
    }


    try {

        const phone =
            normalizePhone(
                currentUser.phone
            );


        const onlineRef =
            firebaseModules.doc(
                db,
                "onlineUsers",
                phone
            );


        await firebaseModules.setDoc(
            onlineRef,
            {
                name:
                    currentUser.name,

                phone:
                    currentUser.phone,

                online:
                    isOnline,

                lastSeen:
                    firebaseModules.serverTimestamp()
            },
            {
                merge: true
            }
        );

    } catch (error) {

        console.error(
            "ONLINE STATUS ERROR:",
            error
        );
    }
}


function startHeartbeat() {

    if (heartbeatTimer) {

        clearInterval(
            heartbeatTimer
        );
    }


    heartbeatTimer =
        setInterval(
            function () {

                updateOnlineStatus(true);
                updateOnlineUsers();

            },
            30000
        );
}


async function updateOnlineUsers() {

    if (!firebaseReady) {

        await loadFirebase();
    }


    if (!firebaseReady) return;


    if (onlineUnsubscribe) {

        onlineUnsubscribe();
    }


    try {

        const onlineRef =
            firebaseModules.collection(
                db,
                "onlineUsers"
            );


        onlineUnsubscribe =
            firebaseModules.onSnapshot(
                onlineRef,
                function (snapshot) {

                    const container =
                        $("onlineUsers");

                    const count =
                        $("onlineCount");


                    if (!container) return;


                    container.innerHTML = "";


                    const now =
                        Date.now();

                    let total = 0;


                    snapshot.forEach(
                        function (docSnap) {

                            const data =
                                docSnap.data();


                            let lastSeen =
                                0;


                            if (
                                data.lastSeen &&
                                typeof data.lastSeen.toMillis ===
                                "function"
                            ) {

                                lastSeen =
                                    data.lastSeen.toMillis();
                            }


                            const online =
                                data.online === true &&
                                (
                                    !lastSeen ||
                                    now - lastSeen <
                                    90000
                                );


                            if (!online) return;


                            total++;


                            const item =
                                document.createElement(
                                    "div"
                                );


                            item.className =
                                "online-user";


                            item.textContent =
                                "🟢 " +
                                (
                                    data.name ||
                                    "User"
                                );


                            container.appendChild(
                                item
                            );
                        }
                    );


                    if (count) {

                        count.textContent =
                            total;
                    }
                }
            );

    } catch (error) {

        console.error(
            "ONLINE USERS ERROR:",
            error
        );
    }
}


/* =========================================================
   CHAT
   ========================================================= */

function setupChat() {

    if (chatReady) return;

    chatReady = true;


    $("sendMessageBtn")?.addEventListener(
        "click",
        sendChatMessage
    );


    $("messageInput")?.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendChatMessage();
            }
        }
    );


    $("emojiBtn")?.addEventListener(
        "click",
        function () {

            const input =
                $("messageInput");


            if (!input) return;


            input.value += " 😊";

            input.focus();
        }
    );
}


async function sendChatMessage() {

    if (!currentUser) return;


    const input =
        $("messageInput");


    if (!input) return;


    const text =
        input.value.trim();


    if (!text) return;


    const loaded =
        await loadFirebase();


    if (!loaded) {

        alert(
            currentLanguage === "hi"
                ? "Firebase कनेक्ट नहीं है।"
                : "Firebase is not connected."
        );

        return;
    }


    try {

        await firebaseModules.addDoc(
            firebaseModules.collection(
                db,
                "messages"
            ),
            {
                senderName:
                    currentUser.name,

                senderPhone:
                    currentUser.phone,

                text:
                    text,

                createdAt:
                    firebaseModules.serverTimestamp(),

                status:
                    "sent",

                readBy: []
            }
        );


        input.value = "";

    } catch (error) {

        console.error(
            "SEND MESSAGE ERROR:",
            error
        );

        alert(
            currentLanguage === "hi"
                ? "Message भेजा नहीं जा सका।"
                : "Message could not be sent."
        );
    }
}


function startChatRealtime() {

    if (!firebaseReady) {

        loadFirebase().then(
            function () {

                startChatRealtime();
            }
        );

        return;
    }


    if (chatUnsubscribe) {

        chatUnsubscribe();
    }


    try {

        const messagesRef =
            firebaseModules.collection(
                db,
                "messages"
            );


        const q =
            firebaseModules.query(
                messagesRef,
                firebaseModules.orderBy(
                    "createdAt",
                    "asc"
                ),
                firebaseModules.limit(100)
            );


        chatUnsubscribe =
            firebaseModules.onSnapshot(
                q,
                function (snapshot) {

                    renderChatMessages(
                        snapshot
                    );
                },
                function (error) {

                    console.error(
                        "CHAT SNAPSHOT ERROR:",
                        error
                    );
                }
            );

    } catch (error) {

        console.error(
            "CHAT REALTIME ERROR:",
            error
        );
    }
}


function renderChatMessages(snapshot) {

    const container =
        $("chatMessages");


    if (!container) return;


    container.innerHTML = "";


    snapshot.forEach(
        function (docSnap) {

            const data =
                docSnap.data();


            const isMine =
                currentUser &&
                normalizePhone(
                    currentUser.phone
                ) ===
                normalizePhone(
                    data.senderPhone
                );


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                isMine
                    ? "message my-message"
                    : "message other-message";


            if (!isMine) {

                const sender =
                    document.createElement(
                        "strong"
                    );


                sender.textContent =
                    data.senderName ||
                    "User";


                wrapper.appendChild(
                    sender
                );
            }


            const text =
                document.createElement(
                    "div"
                );


            text.className =
                "message-text";


            text.textContent =
                data.text || "";


            wrapper.appendChild(
                text
            );


            const meta =
                document.createElement(
                    "small"
                );


            meta.className =
                "message-meta";


            meta.textContent =
                getMessageTime(
                    data.createdAt
                );


            if (isMine) {

                const ticks =
                    document.createElement(
                        "span"
                    );


                ticks.className =
                    "message-ticks";


                const readBy =
                    Array.isArray(
                        data.readBy
                    )
                        ? data.readBy
                        : [];


                if (
                    readBy.length > 0
                ) {

                    ticks.textContent =
                        " ✓✓";

                    ticks.style.color =
                        "#2196f3";

                } else {

                    ticks.textContent =
                        " ✓✓";
                }


                meta.appendChild(
                    ticks
                );
            }


            wrapper.appendChild(
                meta
            );


            container.appendChild(
                wrapper
            );


            if (!isMine) {

                markChatMessageRead(
                    docSnap.id,
                    data
                );
            }
        }
    );


    container.scrollTop =
        container.scrollHeight;
}


function getMessageTime(timestamp) {

    if (
        timestamp &&
        typeof timestamp.toDate ===
        "function"
    ) {

        return timestamp
            .toDate()
            .toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    }


    return "";
}


async function markChatMessageRead(
    messageId,
    data
) {

    if (!firebaseReady || !currentUser) {
        return;
    }


    const alreadyRead =
        Array.isArray(data.readBy) &&
        data.readBy.includes(
            currentUser.phone
        );


    if (alreadyRead) return;


    try {

        const messageRef =
            firebaseModules.doc(
                db,
                "messages",
                messageId
            );


        const readBy =
            Array.isArray(data.readBy)
                ? [...data.readBy]
                : [];


        if (
            !readBy.includes(
                currentUser.phone
            )
        ) {

            readBy.push(
                currentUser.phone
            );
        }


        await firebaseModules.updateDoc(
            messageRef,
            {
                readBy:
                    readBy
            }
        );

    } catch (error) {

        console.log(
            "Read receipt update:",
            error
        );
    }
}


/* =========================================================
   GROUPS
   ========================================================= */

function setupGroups() {

    if (groupsReady) return;

    groupsReady = true;


    $("createGroupBtn")?.addEventListener(
        "click",
        createGroup
    );


    $("unlockGroupBtn")?.addEventListener(
        "click",
        unlockSelectedGroup
    );


    $("addMemberBtn")?.addEventListener(
        "click",
        addGroupMember
    );


    $("sendGroupMessageBtn")?.addEventListener(
        "click",
        sendGroupMessage
    );


    $("groupMessageInput")?.addEventListener(
        "keydown",
        function (event) {

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


async function createGroup() {

    if (!currentUser) return;


    const name =
        $("groupInput")
            ?.value.trim();


    const password =
        $("groupPasswordInput")
            ?.value.trim();


    if (!name) {

        alert(
            currentLanguage === "hi"
                ? "Group का नाम डालें।"
                : "Enter a group name."
        );

        return;
    }


    if (!password) {

        alert(
            currentLanguage === "hi"
                ? "Group password डालें।"
                : "Enter a group password."
        );

        return;
    }


    const loaded =
        await loadFirebase();


    if (!loaded) return;


    try {

        const group =
            await firebaseModules.addDoc(
                firebaseModules.collection(
                    db,
                    "groups"
                ),
                {
                    name:
                        name,

                    ownerName:
                        currentUser.name,

                    ownerPhone:
                        currentUser.phone,

                    password:
                        password,

                    members: [
                        {
                            name:
                                currentUser.name,

                            phone:
                                currentUser.phone
                        }
                    ],

                    createdAt:
                        firebaseModules.serverTimestamp()
                }
            );


        $("groupInput").value = "";

        $("groupPasswordInput").value = "";


        alert(
            currentLanguage === "hi"
                ? "Group बन गया।"
                : "Group created."
        );


        selectedGroup = {

            id:
                group.id,

            name:
                name,

            ownerName:
                currentUser.name,

            ownerPhone:
                currentUser.phone,

            password:
                password,

            members: [
                {
                    name:
                        currentUser.name,

                    phone:
                        currentUser.phone
                }
            ]
        };


        unlockedGroups.add(
            group.id
        );


        showGroupChat();

    } catch (error) {

        console.error(
            "CREATE GROUP ERROR:",
            error
        );
    }
}


function startGroupsRealtime() {

    if (!firebaseReady) {

        loadFirebase().then(
            function () {

                startGroupsRealtime();
            }
        );

        return;
    }


    if (groupsUnsubscribe) {

        groupsUnsubscribe();
    }


    try {

        const groupsRef =
            firebaseModules.collection(
                db,
                "groups"
            );


        groupsUnsubscribe =
            firebaseModules.onSnapshot(
                groupsRef,
                function (snapshot) {

                    renderGroups(
                        snapshot
                    );
                }
            );

    } catch (error) {

        console.error(
            "GROUP REALTIME ERROR:",
            error
        );
    }
}


function renderGroups(snapshot) {

    const list =
        $("groupList");


    if (!list) return;


    list.innerHTML = "";


    snapshot.forEach(
        function (docSnap) {

            const data =
                docSnap.data();


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "group-item";


            button.textContent =
                "👥 " +
                (
                    data.name ||
                    "Group"
                );


            button.addEventListener(
                "click",
                function () {

                    selectedGroup = {

                        id:
                            docSnap.id,

                        ...data
                    };


                    showGroupChat();
                }
            );


            list.appendChild(
                button
            );
        }
    );
}


function showGroupChat() {

    if (!selectedGroup) return;


    show(
        $("groupChatSection")
    );


    setText(
        "selectedGroupName",
        selectedGroup.name || ""
    );


    setText(
        "selectedGroupOwner",
        selectedGroup.ownerName || ""
    );


    renderMemberList(
        selectedGroup.members || []
    );


    if (
        unlockedGroups.has(
            selectedGroup.id
        )
    ) {

        showGroupContent();

    } else {

        hide(
            $("groupContent")
        );

        show(
            $("groupPasswordSection")
        );
    }


    startGroupMessages();
}


function unlockSelectedGroup() {

    if (!selectedGroup) return;


    const entered =
        $("enterGroupPasswordInput")
            ?.value.trim();


    if (
        entered !==
        String(
            selectedGroup.password || ""
        )
    ) {

        setText(
            "groupPasswordMessage",
            currentLanguage === "hi"
                ? "गलत Group password!"
                : "Wrong group password!"
        );

        return;
    }


    unlockedGroups.add(
        selectedGroup.id
    );


    setText(
        "groupPasswordMessage",
        currentLanguage === "hi"
            ? "Group खुल गया।"
            : "Group unlocked."
    );


    showGroupContent();
}


function showGroupContent() {

    show(
        $("groupContent")
    );

    hide(
        $("groupPasswordSection")
    );


    renderMemberList(
        selectedGroup?.members || []
    );
}


function renderMemberList(members) {

    const list =
        $("memberList");


    if (!list) return;


    list.innerHTML = "";


    members.forEach(
        function (member) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "group-member";


            item.textContent =
                "👤 " +
                member.name +
                " - " +
                member.phone;


            list.appendChild(
                item
            );
        }
    );
}


async function addGroupMember() {

    if (!selectedGroup) return;


    if (
        normalizePhone(
            currentUser.phone
        ) !==
        normalizePhone(
            selectedGroup.ownerPhone
        )
    ) {

        alert(
            currentLanguage === "hi"
                ? "सिर्फ Group creator member जोड़ सकता है।"
                : "Only the group creator can add members."
        );

        return;
    }


    const name =
        $("memberNameInput")
            ?.value.trim();


    const phone =
        normalizePhone(
            $("memberPhoneInput")
                ?.value
        );


    if (!name) {

        alert(
            currentLanguage === "hi"
                ? "Member का नाम डालें।"
                : "Enter member name."
        );

        return;
    }


    if (!validPhone(phone)) {

        alert(
            currentLanguage === "hi"
                ? "सही mobile number डालें।"
                : "Enter a valid mobile number."
        );

        return;
    }


    try {

        const groupRef =
            firebaseModules.doc(
                db,
                "groups",
                selectedGroup.id
            );


        const members =
            Array.isArray(
                selectedGroup.members
            )
                ? [
                    ...selectedGroup.members
                ]
                : [];


        const exists =
            members.some(
                function (member) {

                    return (
                        normalizePhone(
                            member.phone
                        ) === phone
                    );
                }
            );


        if (exists) {

            alert(
                currentLanguage === "hi"
                    ? "यह member पहले से group में है।"
                    : "This member is already in the group."
            );

            return;
        }


        members.push({
            name:
                name,

            phone:
                phone
        });


        await firebaseModules.updateDoc(
            groupRef,
            {
                members:
                    members
            }
        );


        selectedGroup.members =
            members;


        $("memberNameInput").value = "";

        $("memberPhoneInput").value = "";


        renderMemberList(
            members
        );

    } catch (error) {

        console.error(
            "ADD MEMBER ERROR:",
            error
        );
    }
}


async function sendGroupMessage() {

    if (
        !selectedGroup ||
        !currentUser
    ) {
        return;
    }


    if (
        !unlockedGroups.has(
            selectedGroup.id
        )
    ) {
        return;
    }


    const input =
        $("groupMessageInput");


    const text =
        input?.value.trim();


    if (!text) return;


    try {

        await firebaseModules.addDoc(
            firebaseModules.collection(
                db,
                "groups",
                selectedGroup.id,
                "messages"
            ),
            {
                senderName:
                    currentUser.name,

                senderPhone:
                    currentUser.phone,

                text:
                    text,

                createdAt:
                    firebaseModules.serverTimestamp()
            }
        );


        input.value = "";

    } catch (error) {

        console.error(
            "GROUP MESSAGE ERROR:",
            error
        );
    }
}


function startGroupMessages() {

    if (!selectedGroup) return;


    if (groupMessagesUnsubscribe) {

        groupMessagesUnsubscribe();
    }


    try {

        const messagesRef =
            firebaseModules.collection(
                db,
                "groups",
                selectedGroup.id,
                "messages"
            );


        const q =
            firebaseModules.query(
                messagesRef,
                firebaseModules.orderBy(
                    "createdAt",
                    "asc"
                ),
                firebaseModules.limit(100)
            );


        groupMessagesUnsubscribe =
            firebaseModules.onSnapshot(
                q,
                function (snapshot) {

                    renderGroupMessages(
                        snapshot
                    );
                }
            );

    } catch (error) {

        console.error(
            "GROUP MESSAGES ERROR:",
            error
        );
    }
}


function renderGroupMessages(snapshot) {

    const container =
        $("groupMessages");


    if (!container) return;


    container.innerHTML = "";


    snapshot.forEach(
        function (docSnap) {

            const data =
                docSnap.data();


            const item =
                document.createElement(
                    "div"
                );


            const mine =
                currentUser &&
                normalizePhone(
                    currentUser.phone
                ) ===
                normalizePhone(
                    data.senderPhone
                );


            item.className =
                mine
                    ? "message my-message"
                    : "message other-message";


            if (!mine) {

                const sender =
                    document.createElement(
                        "strong"
                    );


                sender.textContent =
                    data.senderName ||
                    "User";


                item.appendChild(
                    sender
                );
            }


            const text =
                document.createElement(
                    "div"
                );


            text.textContent =
                data.text || "";


            item.appendChild(
                text
            );


            const time =
                document.createElement(
                    "small"
                );


            time.textContent =
                getMessageTime(
                    data.createdAt
                );


            item.appendChild(
                time
            );


            container.appendChild(
                item
            );
        }
    );


    container.scrollTop =
        container.scrollHeight;
}


/* =========================================================
   HOMEWORK
   ========================================================= */

function setupHomework() {

    if (homeworkReady) return;

    homeworkReady = true;


    $("addHomeworkBtn")?.addEventListener(
        "click",
        saveHomework
    );


    renderHomework();
}


function saveHomework() {

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
            $("artHomework")?.value || ""
    };


    const list =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );


    list.push(homework);


    localStorage.setItem(
        "studyHomework",
        JSON.stringify(list)
    );


    renderHomework();


    alert(
        currentLanguage === "hi"
            ? "Homework सेव हो गया।"
            : "Homework saved."
    );
}


function renderHomework() {

    const container =
        $("homeworkList");


    if (!container) return;


    const list =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );


    container.innerHTML = "";


    list.forEach(
        function (item) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "homework-item";


            box.innerHTML =
                `
                <strong>
                    ${escapeHTML(item.date)}
                </strong>

                <p>Hindi:
                    ${escapeHTML(item.hindi)}
                </p>

                <p>English:
                    ${escapeHTML(item.english)}
                </p>

                <p>Math:
                    ${escapeHTML(item.math)}
                </p>

                <p>Science:
                    ${escapeHTML(item.science)}
                </p>

                <p>SST:
                    ${escapeHTML(item.sst)}
                </p>

                <p>Computer:
                    ${escapeHTML(item.computer)}
                </p>

                <p>Art:
                    ${escapeHTML(item.art)}
                </p>
                `;


            container.appendChild(
                box
            );
        }
    );
}


/* =========================================================
   SCHOOL
   ========================================================= */

function setupSchool() {

    if (schoolReady) return;

    schoolReady = true;


    $("saveSchoolBtn")?.addEventListener(
        "click",
        saveSchoolUpdate
    );


    renderSchoolUpdates();
}


function saveSchoolUpdate() {

    const text =
        $("schoolInput")
            ?.value.trim();


    if (!text) return;


    const list =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );


    list.push({

        text:
            text,

        date:
            new Date().toLocaleString()
    });


    localStorage.setItem(
        "studySchoolUpdates",
        JSON.stringify(list)
    );


    $("schoolInput").value = "";


    renderSchoolUpdates();
}


function renderSchoolUpdates() {

    const container =
        $("schoolList");


    if (!container) return;


    const list =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );


    container.innerHTML = "";


    list.forEach(
        function (item) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "school-update";


            box.innerHTML =
                `
                <p>
                    ${escapeHTML(item.text)}
                </p>

                <small>
                    ${escapeHTML(item.date)}
                </small>
                `;


            container.appendChild(
                box
            );
        }
    );
}


/* =========================================================
   NOTES
   ========================================================= */

function setupNotes() {

    if (notesReady) return;

    notesReady = true;


    $("saveNoteBtn")?.addEventListener(
        "click",
        saveNote
    );


    renderNotes();
}


function saveNote() {

    const text =
        $("noteInput")
            ?.value.trim();


    if (!text) return;


    const notes =
        JSON.parse(
            localStorage.getItem(
                "studyNotes"
            ) || "[]"
        );


    notes.push({

        text:
            text,

        date:
            new Date().toLocaleString()
    });


    localStorage.setItem(
        "studyNotes",
        JSON.stringify(notes)
    );


    $("noteInput").value = "";


    renderNotes();
}


function renderNotes() {

    const container =
        $("notesList");


    if (!container) return;


    const notes =
        JSON.parse(
            localStorage.getItem(
                "studyNotes"
            ) || "[]"
        );


    container.innerHTML = "";


    notes.forEach(
        function (note) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "note-item";


            box.innerHTML =
                `
                <p>
                    ${escapeHTML(note.text)}
                </p>

                <small>
                    ${escapeHTML(note.date)}
                </small>
                `;


            container.appendChild(
                box
            );
        }
    );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    if (settingsReady) return;

    settingsReady = true;


    $("changeNameBtn")?.addEventListener(
        "click",
        changeUserName
    );


    $("hindiLanguageBtn")?.addEventListener(
        "click",
        function () {

            setLanguage("hi");
        }
    );


    $("englishLanguageBtn")?.addEventListener(
        "click",
        function () {

            setLanguage("en");
        }
    );


    $("themeBtn")?.addEventListener(
        "click",
        toggleTheme
    );


    $("notificationBtn")?.addEventListener(
        "click",
        enableNotifications
    );


    $("ownerLoginBtn")?.addEventListener(
        "click",
        ownerLogin
    );


    $("allowUserBtn")?.addEventListener(
        "click",
        allowUser
    );


    $("clearDataBtn")?.addEventListener(
        "click",
        clearAppData
    );


    applyLanguage();
    applyTheme();
}


function changeUserName() {

    const name =
        $("changeNameInput")
            ?.value.trim();


    if (!name) return;


    if (currentUser) {

        currentUser.name =
            name;


        localStorage.setItem(
            "studyCurrentUser",
            JSON.stringify(
                currentUser
            )
        );
    }


    if ($("studentName")) {

        $("studentName").value =
            name;
    }


    setText(
        "changeNameMessage",
        currentLanguage === "hi"
            ? "नाम बदल दिया गया।"
            : "Name changed."
    );
}


/* =========================================================
   OWNER
   ========================================================= */

function ownerLogin() {

    const password =
        $("ownerPasswordInput")
            ?.value.trim();


    if (
        password !==
        OWNER_PASSWORD
    ) {

        setText(
            "ownerPasswordMessage",
            currentLanguage === "hi"
                ? "गलत Owner password!"
                : "Wrong Owner password!"
        );

        hide(
            $("ownerPanel")
        );

        return;
    }


    setText(
        "ownerPasswordMessage",
        currentLanguage === "hi"
            ? "Owner login सफल।"
            : "Owner login successful."
    );


    show(
        $("ownerPanel")
    );


    startAllowedUsersRealtime();
}


async function allowUser() {

    if (!currentUser?.isOwner) {

        alert(
            currentLanguage === "hi"
                ? "सिर्फ Owner यह काम कर सकता है।"
                : "Only the Owner can do this."
        );

        return;
    }


    const name =
        $("allowedUserNameInput")
            ?.value.trim();


    const phone =
        normalizePhone(
            $("allowedUserPhoneInput")
                ?.value
        );


    if (!name) {

        alert(
            currentLanguage === "hi"
                ? "User का नाम डालें।"
                : "Enter user name."
        );

        return;
    }


    if (!validPhone(phone)) {

        alert(
            currentLanguage === "hi"
                ? "सही 10 अंकों का नंबर डालें।"
                : "Enter a valid 10-digit number."
        );

        return;
    }


    const loaded =
        await loadFirebase();


    if (!loaded) return;


    try {

        await firebaseModules.setDoc(
            firebaseModules.doc(
                db,
                "allowedUsers",
                phone
            ),
            {
                name:
                    name,

                phone:
                    phone,

                createdBy:
                    OWNER_NAME,

                createdAt:
                    firebaseModules.serverTimestamp()
            }
        );


        $("allowedUserNameInput").value = "";

        $("allowedUserPhoneInput").value = "";


        alert(
            currentLanguage === "hi"
                ? "User allow हो गया।"
                : "User has been allowed."
        );

    } catch (error) {

        console.error(
            "ALLOW USER ERROR:",
            error
        );
    }
}


function startAllowedUsersRealtime() {

    if (!firebaseReady) return;


    if (allowedUsersUnsubscribe) {

        allowedUsersUnsubscribe();
    }


    try {

        const usersRef =
            firebaseModules.collection(
                db,
                "allowedUsers"
            );


        allowedUsersUnsubscribe =
            firebaseModules.onSnapshot(
                usersRef,
                function (snapshot) {

                    renderAllowedUsers(
                        snapshot
                    );
                }
            );

    } catch (error) {

        console.error(
            "ALLOWED USERS ERROR:",
            error
        );
    }
}


function renderAllowedUsers(snapshot) {

    const container =
        $("allowedUsersList");


    if (!container) return;


    container.innerHTML = "";


    snapshot.forEach(
        function (docSnap) {

            const data =
                docSnap.data();


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "allowed-user";


            item.textContent =
                "👤 " +
                (
                    data.name ||
                    "User"
                ) +
                " - " +
                (
                    data.phone ||
                    ""
                );


            container.appendChild(
                item
            );
        }
    );
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
        school: "School",
        notes: "Notes",
        settings: "Settings",

        welcome:
            "Welcome to StudyConnect",

        welcomeText:
            "Connect with your school friends and study together.",

        yourName:
            "Your Name",

        saveName:
            "Save Name",

        onlineNow:
            "Online Now",

        chatDescription:
            "Chat with your school friends in real time.",

        groupsDescription:
            "Create private groups and study together.",

        schoolUpdate:
            "School Update",

        chatTitle:
            "Chat",

        groupsTitle:
            "Groups",

        createGroup:
            "Create Group",

        createGroupButton:
            "Create Group",

        addMember:
            "Add Member",

        addMemberButton:
            "Add Member",

        send:
            "Send",

        homeworkTitle:
            "Homework",

        date:
            "Date",

        saveHomework:
            "Save Homework",

        schoolUpdateTitle:
            "School Updates",

        schoolDescription:
            "School announcements and updates.",

        saveUpdate:
            "Save Update",

        notesTitle:
            "Notes",

        notesDescription:
            "Save your important study notes.",

        saveNote:
            "Save Note",

        settingsTitle:
            "Settings",

        settingsDescription:
            "Manage your StudyConnect settings.",

        changeName:
            "Change Name",

        changeNameButton:
            "Change Name",

        language:
            "Language",

        theme:
            "Theme",

        notifications:
            "Notifications",

        enableNotifications:
            "Enable Notifications",

        appData:
            "App Data",

        resetAppData:
            "Reset App Data",

        owner:
            "Owner"
    },


    hi: {

        home:
            "होम",

        chat:
            "चैट",

        groups:
            "ग्रुप",

        homework:
            "होमवर्क",

        school:
            "स्कूल",

        notes:
            "नोट्स",

        settings:
            "सेटिंग्स",

        welcome:
            "StudyConnect में आपका स्वागत है",

        welcomeText:
            "अपने स्कूल के दोस्तों से जुड़ें और साथ में पढ़ें।",

        yourName:
            "आपका नाम",

        saveName:
            "नाम सेव करें",

        onlineNow:
            "अभी ऑनलाइन",

        chatDescription:
            "अपने स्कूल के दोस्तों से रियल-टाइम चैट करें।",

        groupsDescription:
            "प्राइवेट ग्रुप बनाकर साथ में पढ़ें।",

        schoolUpdate:
            "स्कूल अपडेट",

        chatTitle:
            "चैट",

        groupsTitle:
            "ग्रुप",

        createGroup:
            "ग्रुप बनाएं",

        createGroupButton:
            "ग्रुप बनाएं",

        addMember:
            "सदस्य जोड़ें",

        addMemberButton:
            "सदस्य जोड़ें",

        send:
            "भेजें",

        homeworkTitle:
            "होमवर्क",

        date:
            "तारीख",

        saveHomework:
            "होमवर्क सेव करें",

        schoolUpdateTitle:
            "स्कूल अपडेट",

        schoolDescription:
            "स्कूल की घोषणाएं और अपडेट।",

        saveUpdate:
            "अपडेट सेव करें",

        notesTitle:
            "नोट्स",

        notesDescription:
            "अपने जरूरी पढ़ाई के नोट्स सेव करें।",

        saveNote:
            "नोट सेव करें",

        settingsTitle:
            "सेटिंग्स",

        settingsDescription:
            "StudyConnect की सेटिंग्स मैनेज करें।",

        changeName:
            "नाम बदलें",

        changeNameButton:
            "नाम बदलें",

        language:
            "भाषा",

        theme:
            "थीम",

        notifications:
            "नोटिफिकेशन",

        enableNotifications:
            "नोटिफिकेशन चालू करें",

        appData:
            "ऐप डेटा",

        resetAppData:
            "ऐप डेटा रीसेट करें",

        owner:
            "Owner"
    }
};


function setLanguage(language) {

    if (
        language !== "hi" &&
        language !== "en"
    ) {
        return;
    }


    currentLanguage =
        language;


    localStorage.setItem(
        "studyLanguage",
        language
    );


    applyLanguage();


    setText(
        "languageMessage",
        language === "hi"
            ? "भाषा हिंदी कर दी गई।"
            : "Language changed to English."
    );
}


function applyLanguage() {

    const dictionary =
        translations[
            currentLanguage
        ];


    if (!dictionary) return;


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(
            function (element) {

                const key =
                    element.dataset.i18n;


                if (
                    dictionary[key] !==
                    undefined
                ) {

                    element.textContent =
                        dictionary[key];
                }
            }
        );
}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

    const current =
        localStorage.getItem(
            "studyTheme"
        ) || "light";


    const next =
        current === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        "studyTheme",
        next
    );


    applyTheme();
}


function applyTheme() {

    const theme =
        localStorage.getItem(
            "studyTheme"
        ) || "light";


    document.body.classList.toggle(
        "dark-mode",
        theme === "dark"
    );
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

async function enableNotifications() {

    if (
        !("Notification" in window)
    ) {

        setText(
            "notificationMessage",
            currentLanguage === "hi"
                ? "इस browser में notifications उपलब्ध नहीं हैं।"
                : "Notifications are not available in this browser."
        );

        return;
    }


    try {

        const permission =
            await Notification.requestPermission();


        if (
            permission ===
            "granted"
        ) {

            setText(
                "notificationMessage",
                currentLanguage === "hi"
                    ? "Notifications चालू हो गए।"
                    : "Notifications are enabled."
            );


            new Notification(
                "StudyConnect",
                {
                    body:
                        currentLanguage === "hi"
                            ? "Notifications सफलतापूर्वक चालू हो गए।"
                            : "Notifications enabled successfully."
                }
            );

        } else {

            setText(
                "notificationMessage",
                currentLanguage === "hi"
                    ? "Notification permission नहीं मिली।"
                    : "Notification permission was not granted."
            );
        }

    } catch (error) {

        console.error(
            "NOTIFICATION ERROR:",
            error
        );
    }
}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function setupProfilePhoto() {

    const input =
        $("profilePhotoInput");


    const preview =
        $("profilePhotoPreview");


    if (!input) return;


    input.addEventListener(
        "change",
        function () {

            const file =
                input.files?.[0];


            if (!file) return;


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function () {

                    if (preview) {

                        preview.src =
                            reader.result;

                        show(preview);
                    }


                    if (currentUser) {

                        currentUser.photo =
                            reader.result;


                        localStorage.setItem(
                            "studyCurrentUser",
                            JSON.stringify(
                                currentUser
                            )
                        );
                    }
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================================
   LOAD SAVED USER
   ========================================================= */

function loadSavedUser() {

    try {

        const saved =
            localStorage.getItem(
                "studyCurrentUser"
            );


        if (!saved) return;


        const user =
            JSON.parse(saved);


        if (
            user &&
            user.name &&
            user.phone
        ) {

            currentUser =
                user;
        }

    } catch (error) {

        console.error(
            "SAVED USER ERROR:",
            error
        );
    }
}


/* =========================================================
   RESET LOCAL DATA
   ========================================================= */

function clearAppData() {

    const message =
        currentLanguage === "hi"
            ? "क्या आप अपना local app data हटाना चाहते हैं?"
            : "Do you want to clear your local app data?";


    if (!confirm(message)) {
        return;
    }


    localStorage.removeItem(
        "studyName"
    );

    localStorage.removeItem(
        "studyHomework"
    );

    localStorage.removeItem(
        "studySchoolUpdates"
    );

    localStorage.removeItem(
        "studyNotes"
    );

    localStorage.removeItem(
        "studyCurrentUser"
    );

    localStorage.removeItem(
        "studyLanguage"
    );

    localStorage.removeItem(
        "studyTheme"
    );


    alert(
        currentLanguage === "hi"
            ? "App data reset हो गया।"
            : "App data has been reset."
    );


    location.reload();
}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

function registerServiceWorker() {

    if (
        "serviceWorker" in navigator
    ) {

        window.addEventListener(
            "load",
            function () {

                navigator.serviceWorker
                    .register(
                        "service-worker.js"
                    )
                    .then(
                        function (registration) {

                            console.log(
                                "Service Worker registered:",
                                registration.scope
                            );
                        }
                    )
                    .catch(
                        function (error) {

                            console.log(
                                "Service Worker registration failed:",
                                error
                            );
                        }
                    );
            }
        );
    }
}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "StudyConnect starting..."
        );


        loadSavedUser();


        setupLogin();

        setupProfilePhoto();


        /*
          Firebase background में load होगा।
          इसलिए पहला Next button Firebase पर निर्भर नहीं है।
        */

        await loadFirebase();


        applyLanguage();
        applyTheme();


        registerServiceWorker();


        console.log(
            "StudyConnect initialized."
        );
    }
);


/* =============
