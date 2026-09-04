// ======================================================
// STUDYCONNECT - COMPLETE JAVASCRIPT
// ======================================================

// ===============================
// BASIC SETTINGS
// ===============================

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";
const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

const FIREBASE_VERSION = "12.1.0";

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyiW3c3AUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};

// ===============================
// HTML ELEMENTS
// ===============================

const passwordScreen = document.getElementById("passwordScreen");
const schoolPasswordStep = document.getElementById("schoolPasswordStep");
const ownerStep = document.getElementById("ownerStep");
const userDetailsStep = document.getElementById("userDetailsStep");
const contactOwnerScreen = document.getElementById("contactOwnerScreen");
const appContainer = document.getElementById("appContainer");

const appPassword = document.getElementById("appPassword");
const unlockBtn = document.getElementById("unlockBtn");
const passwordError = document.getElementById("passwordError");

const ownerNameDisplay = document.getElementById("ownerNameDisplay");
const ownerNextBtn = document.getElementById("ownerNextBtn");

const openUserName = document.getElementById("openUserName");
const openUserPhone = document.getElementById("openUserPhone");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profilePhotoPreview = document.getElementById("profilePhotoPreview");
const enterAppBtn = document.getElementById("enterAppBtn");

const callOwnerBtn = document.getElementById("callOwnerBtn");
const whatsappOwnerBtn = document.getElementById("whatsappOwnerBtn");
const backToLoginBtn = document.getElementById("backToLoginBtn");

// ===============================
// GLOBAL VARIABLES
// ===============================

let firebaseReady = false;
let db = null;
let firebaseModules = null;

let currentUser = null;
let pendingProfilePhoto = "";

let unsubscribeChat = null;
let unsubscribeOnlineUsers = null;
let unsubscribeGroups = null;
let unsubscribeGroupMessages = null;

let onlineHeartbeat = null;
let selectedGroupId = null;

let firebaseLoadPromise = null;

// ===============================
// HELPER FUNCTIONS
// ===============================

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

function setText(element, text) {
    if (element) {
        element.textContent = text;
    }
}

function safeText(value) {
    return value == null ? "" : String(value);
}

// ===============================
// FIREBASE LOAD
// ===============================

async function loadFirebase() {

    if (firebaseLoadPromise) {
        return firebaseLoadPromise;
    }

    firebaseLoadPromise = (async function () {

        try {

            const appModule = await import(
                https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js
            );

            const firestoreModule = await import(
                https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js
            );

            const {
                initializeApp,
                getApps,
                getApp
            } = appModule;

            const {
                getFirestore,
                collection,
                doc,
                addDoc,
                setDoc,
                getDoc,
                getDocs,
                updateDoc,
                deleteDoc,
                query,
                orderBy,
                limit,
                onSnapshot,
                serverTimestamp,
                arrayUnion
            } = firestoreModule;

            let firebaseApp;

            if (getApps().length > 0) {
                firebaseApp = getApp();
            } else {
                firebaseApp = initializeApp(firebaseConfig);
            }

            db = getFirestore(firebaseApp);

            firebaseModules = {
                collection,
                doc,
                addDoc,
                setDoc,
                getDoc,
                getDocs,
                updateDoc,
                deleteDoc,
                query,
                orderBy,
                limit,
                onSnapshot,
                serverTimestamp,
                arrayUnion
            };

            firebaseReady = true;

            return true;

        } catch (error) {

            console.error("Firebase loading error:", error);

            firebaseReady = false;

            return false;
        }

    })();

    return firebaseLoadPromise;
}

// ===============================
// INITIAL SCREEN
// ===============================

function resetLoginScreens() {

    show(passwordScreen);

    show(schoolPasswordStep);
    hide(ownerStep);
    hide(userDetailsStep);
    hide(contactOwnerScreen);
    hide(appContainer);

    if (appPassword) {
        appPassword.value = "";
    }

    if (openUserName) {
        openUserName.value = "";
    }

    if (openUserPhone) {
        openUserPhone.value = "";
    }

    setText(passwordError, "");

    if (ownerNameDisplay) {
        ownerNameDisplay.textContent = OWNER_NAME;
    }
}

// ===============================
// SCHOOL PASSWORD
// ===============================

if (unlockBtn) {

    unlockBtn.addEventListener("click", async function () {

        const enteredPassword = appPassword
            ? appPassword.value.trim()
            : "";

        if (enteredPassword !== SCHOOL_PASSWORD) {

            setText(passwordError, "गलत पासवर्ड!");

            return;
        }

        // Password सही है
        setText(passwordError, "");

        // Firebase पहले तैयार कर दो
        await loadFirebase();

        // School password screen बंद
        hide(schoolPasswordStep);

        // Owner name screen खोलो
        show(ownerStep);

        // Owner name
        setText(ownerNameDisplay, OWNER_NAME);
    });
}

// Enter key से भी password submit होगा
if (appPassword) {

    appPassword.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            event.preventDefault();

            if (unlockBtn) {
                unlockBtn.click();
            }
        }
    });
}

// ======================================================
// OWNER NEXT BUTTON
// ======================================================

if (ownerNextBtn) {

    ownerNextBtn.addEventListener("click", function (event) {

        event.preventDefault();

        console.log("OWNER NEXT BUTTON CLICKED");

        // Owner name दिखाओ
        setText(ownerNameDisplay, OWNER_NAME);

        // Owner step बंद
        hide(ownerStep);

        // User details step खोलो
        show(userDetailsStep);

        // Login error हटाओ
        setText(passwordError, "");

        // Name field पर cursor
        setTimeout(function () {

            if (openUserName) {
                openUserName.focus();
            }

        }, 100);
    });
}

// ======================================================
// PROFILE PHOTO
// ======================================================

if (profilePhotoInput) {

    profilePhotoInput.addEventListener("change", function () {

        const file = profilePhotoInput.files &&
                     profilePhotoInput.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            setText(passwordError, "कृपया image file चुनें।");

            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            pendingProfilePhoto = event.target.result;

            if (profilePhotoPreview) {

                profilePhotoPreview.src = pendingProfilePhoto;

                profilePhotoPreview.style.display = "block";
            }
        };

        reader.readAsDataURL(file);
    });
}

// ======================================================
// CONTACT OWNER
// ======================================================

function showContactOwner() {

    hide(passwordScreen);
    hide(appContainer);

    show(contactOwnerScreen);

    setText(
        document.getElementById("contactOwnerTitle"),
        "Owner से संपर्क करें"
    );

    setText(
        document.getElementById("contactOwnerText"),
        "आपका नाम और मोबाइल नंबर Owner की अनुमति सूची में नहीं है।"
    );
}

if (callOwnerBtn) {

    callOwnerBtn.addEventListener("click", function () {

        window.location.href = "tel:" + OWNER_PHONE;
    });
}

if (whatsappOwnerBtn) {

    whatsappOwnerBtn.addEventListener("click", function () {

        window.open(
            "https://wa.me/91" + OWNER_PHONE,
            "_blank"
        );
    });
}

if (backToLoginBtn) {

    backToLoginBtn.addEventListener("click", function () {

        hide(contactOwnerScreen);

        show(passwordScreen);
        show(schoolPasswordStep);

        hide(ownerStep);
        hide(userDetailsStep);

        setText(passwordError, "");
    });
}

// ======================================================
// LOGIN USER
// ======================================================

async function loginUser() {

    const name = openUserName
        ? openUserName.value.trim()
        : "";

    const phone = openUserPhone
        ? openUserPhone.value.trim()
        : "";

    if (!name) {

        setText(passwordError, "अपना नाम डालिए।");

        return;
    }

    if (!phone) {

        setText(passwordError, "अपना मोबाइल नंबर डालिए।");

        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {

        setText(
            passwordError,
            "मोबाइल नंबर 10 अंकों का होना चाहिए।"
        );

        return;
    }

    setText(passwordError, "Checking...");

    const firebaseLoaded = await loadFirebase();

    if (!firebaseLoaded || !db) {

        setText(
            passwordError,
            "Firebase connect नहीं हो पाया। Internet check करें।"
        );

        return;
    }

    try {

        const {
            collection,
            getDocs
        } = firebaseModules;

        // Owner को हमेशा allow
        const isOwner =
            name.toLowerCase() === OWNER_NAME.toLowerCase() &&
            phone === OWNER_PHONE;

        let allowed = false;

        if (isOwner) {

            allowed = true;

        } else {

            const allowedUsersRef =
                collection(db, "allowedUsers");

            const snapshot =
                await getDocs(allowedUsersRef);

            snapshot.forEach(function (userDoc) {

                const userData = userDoc.data();

                if (
                    safeText(userData.name)
                        .trim()
                        .toLowerCase() === name.toLowerCase()
                    &&
                    safeText(userData.phone).trim() === phone
                ) {

                    allowed = true;
                }
            });
        }

        if (!allowed) {

            setText(passwordError, "");

            showContactOwner();

            return;
        }

        // User login सफल
        currentUser = {
            name: name,
            phone: phone,
            isOwner: isOwner,
            profilePhoto: pendingProfilePhoto || ""
        };

        localStorage.setItem(
            "studyCurrentUser",
            JSON.stringify(currentUser)
        );

        finishLogin();

    } catch (error) {

        console.error("Login error:", error);

        setText(
            passwordError,
            "Login में समस्या हुई। Firebase check करें।"
        );
    }
}

// ======================================================
// ENTER APP BUTTON
// ======================================================

if (enterAppBtn) {

    enterAppBtn.addEventListener("click", function (event) {

        event.preventDefault();

        loginUser();
    });
}

// Enter key on user name / phone
if (openUserName) {

    openUserName.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            if (enterAppBtn) {
                enterAppBtn.click();
            }
        }
    });
}

if (openUserPhone) {

    openUserPhone.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            if (enterAppBtn) {
                enterAppBtn.click();
            }
        }
    });
}

// ======================================================
// FINISH LOGIN
// ======================================================

async function finishLogin() {

    hide(passwordScreen);
    hide(contactOwnerScreen);

    show(appContainer);

    // Profile information
    updateCurrentUserProfile();

    // Load Firebase
    await loadFirebase();

    // Start realtime systems
    startOnlinePresence();
    startChatRealtime();
    renderGroups();

    // Existing local data
    loadHomework();
    loadSchoolUpdates();
    loadNotes();

    // Language
    applyLanguage();

    // Theme
    applyTheme();

    // Notification state
    updateNotificationButton();
}

// ======================================================
// CURRENT USER PROFILE
// ======================================================

function updateCurrentUserProfile() {

    if (!currentUser) {
        return;
    }

    setText(
        document.getElementById("studentName"),
        currentUser.name
    );

    const profile = document.getElementById("currentUserProfile");

    if (profile) {

        profile.innerHTML = "";

        const nameElement = document.createElement("div");

        nameElement.textContent = currentUser.name;

        profile.appendChild(nameElement);

        if (currentUser.profilePhoto) {

            const img = document.createElement("img");

            img.src = currentUser.profilePhoto;

            img.style.width = "60px";
            img.style.height = "60px";
            img.style.borderRadius = "50%";
            img.style.objectFit = "cover";

            profile.appendChild(img);
        }
    }
}

// ======================================================
// NAVIGATION
// ======================================================

const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

if (menuBtn && navMenu) {

    menuBtn.addEventListener("click", function () {

        if (
            navMenu.style.display === "none" ||
            navMenu.style.display === ""
        ) {

            navMenu.style.display = "block";

        } else {

            navMenu.style.display = "none";
        }
    });
}

const navLinks = document.querySelectorAll("[data-page]");

navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        const pageName = link.getAttribute("data-page");

        if (!pageName) {
            return;
        }

        openPage(pageName);

        if (navMenu) {
            navMenu.style.display = "none";
        }
    });
});

function openPage(pageName) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(function (page) {
        page.style.display = "none";
    });

    const selectedPage =
        document.getElementById(pageName);

    if (selectedPage) {
        selectedPage.style.display = "block";
    }

    if (pageName === "chat") {
        startChatRealtime();
    }

    if (pageName === "groups") {
        renderGroups();
    }
}

// ======================================================
// SAVE NAME
// ======================================================

const saveNameBtn = document.getElementById("saveNameBtn");
const studentName = document.getElementById("studentName");
const nameMessage = document.getElementById("nameMessage");

if (saveNameBtn) {

    saveNameBtn.addEventListener("click", function () {

        const newName =
            studentName
                ? studentName.textContent.trim()
                : "";

        if (!currentUser) {
            return;
        }

        if (newName) {

            currentUser.name = newName;

            localStorage.setItem(
                "studyCurrentUser",
                JSON.stringify(currentUser)
            );

            setText(
                nameMessage,
                "नाम save हो गया।"
            );
        }
    });
}

// ======================================================
// HOME NAME INPUT
// ======================================================

const nameInput =
    document.getElementById("saveNameBtn");

const studentNameElement =
    document.getElementById("studentName");

// ======================================================
// ONLINE PRESENCE
// ======================================================

const onlineToggleBtn =
    document.getElementById("onlineToggleBtn");

let isOnline = false;

if (onlineToggleBtn) {

    onlineToggleBtn.addEventListener("click", function () {

        isOnline = !isOnline;

        if (isOnline) {

            setText(onlineToggleBtn, "Online");

            updateOnlineStatus(true);

        } else {

            setText(onlineToggleBtn, "Offline");

            updateOnlineStatus(false);
        }
    });
}

async function updateOnlineStatus(status) {

    if (!currentUser || !firebaseReady || !db) {
        return;
    }

    try {

        const {
            doc,
            setDoc,
            serverTimestamp
        } = firebaseModules;

        const onlineRef =
            doc(db, "onlineUsers", currentUser.phone);

        await setDoc(
            onlineRef,
            {
                name: currentUser.name,
                phone: currentUser.phone,
                online: status,
                lastSeen: serverTimestamp()
            },
            { merge: true }
        );

    } catch (error) {

        console.error("Online status error:", error);
    }
}

function startOnlinePresence() {

    if (!currentUser) {
        return;
    }

    if (onlineHeartbeat) {
        clearInterval(onlineHeartbeat);
    }

    isOnline = true;

    updateOnlineStatus(true);

    onlineHeartbeat = setInterval(function () {

        updateOnlineStatus(true);

    }, 30000);

    listenOnlineUsers();
}

function listenOnlineUsers() {

    if (!firebaseReady || !db) {
        return;
    }

    if (unsubscribeOnlineUsers) {
        unsubscribeOnlineUsers();
    }

    const {
        collection,
        onSnapshot
    } = firebaseModules;

    const onlineRef =
        collection(db, "onlineUsers");

    unsubscribeOnlineUsers =
        onSnapshot(
            onlineRef,
            function (snapshot) {

                const onlineUsers = [];

                const now = Date.now();

                snapshot.forEach(function (docSnap) {

                    const data = docSnap.data();

                    let lastSeenTime = 0;

                    if (data.lastSeen) {

                        if (typeof data.lastSeen.toMillis === "function") {
                            lastSeenTime = data.lastSeen.toMillis();
                        } else if (data.lastSeen.seconds) {
                            lastSeenTime = data.lastSeen.seconds * 1000;
                        }
                    }

                    if (
                        data.online === true &&
                        lastSeenTime > 0 &&
                        now - lastSeenTime < 90000
                    ) {

                        onlineUsers.push(data);
                    }
                });

                renderOnlineUsers(onlineUsers);
            },
            function (error) {

                console.error(
                    "Online listener error:",
                    error
                );
            }
        );
}

function renderOnlineUsers(users) {

    const onlineCount =
        document.getElementById("onlineCount");

    const onlineUsersContainer =
        document.getElementById("onlineUsers");

    setText(
        onlineCount,
        users.length
    );

    if (!onlineUsersContainer) {
        return;
    }

    onlineUsersContainer.innerHTML = "";

    users.forEach(function (user) {

        const item =
            document.createElement("div");

        item.textContent =
            "🟢 " + safeText(user.name);

        onlineUsersContainer.appendChild(item);
    });
}

// ======================================================
// CHAT
// ======================================================

const messageInput =
    document.getElementById("messageInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

if (sendMessageBtn) {

    sendMessageBtn.addEventListener("click", function () {

        sendMessage();
    });
}

if (messageInput) {

    messageInput.addEventListener("keydown", function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    });
}

async function sendMessage() {

    if (!currentUser) {
        return;
    }

    const text =
        messageInput
            ? messageInput.value.trim()
            : "";

    if (!text) {
        return;
    }

    const firebaseLoaded =
        await loadFirebase();

    if (!firebaseLoaded || !db) {
        return;
    }

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = firebaseModules;

        await addDoc(
            collection(db, "messages"),
            {
                text: text,
                senderName: currentUser.name,
                senderPhone: currentUser.phone,
                createdAt: serverTimestamp(),
                readBy: []
            }
        );

        messageInput.value = "";

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );
    }
}

// ======================================================
// REALTIME CHAT
// ======================================================

async function startChatRealtime() {

    if (unsubscribeChat) {
        return;
    }

    const firebaseLoaded =
        await loadFirebase();

    if (!firebaseLoaded || !db) {
        return;
    }

    const {
        collection,
        query,
        orderBy,
        limit,
        onSnapshot
    } = firebaseModules;

    const messagesRef =
        collection(db, "messages");

    const messagesQuery =
        query(
            messagesRef,
            orderBy("createdAt", "asc"),
            limit(100)
        );

    unsubscribeChat =
        onSnapshot(
            messagesQuery,
            function (snapshot) {

                const messages = [];

                snapshot.forEach(function (docSnap) {

                    messages.push({
                        id: docSnap.id,
                        ...docSnap.data()
                    });
                });

                renderChatMessages(messages);

                markIncomingMessagesRead(messages);
            },
            function (error) {

                console.error(
                    "Chat realtime error:",
                    error
                );
            }
        );
}

function renderChatMessages(messages) {

    const container =
        document.getElementById("chatMessages");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    messages.forEach(function (message) {

        const wrapper =
            document.createElement("div");

        const isMine =
            currentUser &&
            message.senderPhone === currentUser.phone;

        wrapper.style.marginBottom = "10px";

        if (isMine) {
            wrapper.style.textAlign = "right";
        }

        const bubble =
            document.createElement("div");

        bubble.style.display = "inline-block";
        bubble.style.padding = "8px 12px";
        bubble.style.borderRadius = "12px";
        bubble.style.maxWidth = "80%";

        const sender =
            document.createElement("div");

        sender.style.fontSize = "12px";
        sender.textContent =
            isMine
                ? "You"
                : safeText(message.senderName);

        const text =
            document.createElement("div");

        text.textContent =
            safeText(message.text);

        bubble.appendChild(sender);
        bubble.appendChild(text);

        if (isMine) {

            const ticks =
                document.createElement("span");

            const readBy =
                Array.isArray(message.readBy)
                    ? message.readBy
                    : [];

            if (readBy.length > 0) {

                ticks.textContent = " ✓✓";
                ticks.style.color = "blue";

            } else {

                ticks.textContent = " ✓✓";
            }

            bubble.appendChild(ticks);
        }

        wrapper.appendChild(bubble);

        container.appendChild(wrapper);
    });

    container.scrollTop =
        container.scrollHeight;
}

// ======================================================
// MARK CHAT MESSAGE AS READ
// ======================================================

async function markIncomingMessagesRead(messages) {

    if (!currentUser || !firebaseReady || !db) {
        return;
    }

    const {
        doc,
        updateDoc,
        arrayUnion
    } = firebaseModules;

    for (const message of messages) {

        if (
            message.senderPhone &&
            message.senderPhone !== currentUser.phone
        ) {

            const readBy =
                Array.isArray(message.readBy)
                    ? message.readBy
                    : [];

            if (!readBy.includes(currentUser.phone)) {

                try {

                    await updateDoc(
                        doc(db, "messages", message.id),
                        {
                            readBy:
                                arrayUnion(currentUser.phone)
                        }
                    );

                } catch (error) {

                    console.error(
                        "Read receipt error:",
                        error
                    );
                }
            }
        }
    }
}

// ======================================================
// GROUPS
// ======================================================

const createGroupBtn =
    document.getElementById("createGroupBtn");

if (createGroupBtn) {

    createGroupBtn.addEventListener("click", function () {

        createGroup();
    });
}

async function createGroup() {

    if (!currentUser) {
        return;
    }

    const groupInput =
        document.getElementById("groupInput");

    const groupPasswordInput =
        document.getElementById("groupPasswordInput");

    const groupName =
        groupInput
            ? groupInput.value.trim()
            : "";

    const password =
        groupPasswordInput
            ? groupPasswordInput.value.trim()
            : "";

    if (!groupName || !password) {
        return;
    }

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = firebaseModules;

        await addDoc(
            collection(db, "groups"),
            {
                name: groupName,
                password: password,
                ownerName: currentUser.name,
                ownerPhone: currentUser.phone,
                members: [
                    {
                        name: currentUser.name,
                        phone: currentUser.phone
                    }
                ],
                createdAt: serverTimestamp()
            }
        );

        groupInput.value = "";
        groupPasswordInput.value = "";

    } catch (error) {

        console.error(
            "Create group error:",
            error
        );
    }
}

// ======================================================
// RENDER GROUPS
// ======================================================

async function renderGroups() {

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    if (unsubscribeGroups) {
        unsubscribeGroups();
    }

    const {
        collection,
        onSnapshot
    } = firebaseModules;

    unsubscribeGroups =
        onSnapshot(
            collection(db, "groups"),
            function (snapshot) {

                const groupList =
                    document.getElementById("groupList");

                if (!groupList) {
                    return;
                }

                groupList.innerHTML = "";

                snapshot.forEach(function (docSnap) {

                    const group =
                        docSnap.data();

                    const button =
                        document.createElement("button");

                    button.type = "button";

                    button.textContent =
                        "👥 " + safeText(group.name);

                    button.addEventListener(
                        "click",
                        function () {

                            selectGroup(
                                docSnap.id,
                                group
                            );
                        }
                    );

                    groupList.appendChild(button);
                });
            },
            function (error) {

                console.error(
                    "Groups listener error:",
                    error
                );
            }
        );
}

// ======================================================
// SELECT GROUP
// ======================================================

function selectGroup(groupId, group) {

    selectedGroupId = groupId;

    setText(
        document.getElementById("selectedGroupName"),
        group.name
    );

    setText(
        document.getElementById("selectedGroupOwner"),
        "Owner: " + safeText(group.ownerName)
    );

    hide(
        document.getElementById("groupContent")
    );

    show(
        document.getElementById("groupPasswordSection")
    );

    setText(
        document.getElementById("groupPasswordMessage"),
        ""
    );
}

// ======================================================
// UNLOCK GROUP
// ======================================================

const unlockGroupBtn =
    document.getElementById("unlockGroupBtn");

if (unlockGroupBtn) {

    unlockGroupBtn.addEventListener(
        "click",
        function () {

            unlockSelectedGroup();
        }
    );
}

async function unlockSelectedGroup() {

    if (!selectedGroupId) {
        return;
    }

    const passwordInput =
        document.getElementById(
            "enterGroupPasswordInput"
        );

    const enteredPassword =
        passwordInput
            ? passwordInput.value.trim()
            : "";

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    try {

        const {
            doc,
            getDoc
        } = firebaseModules;

        const groupRef =
            doc(db, "groups", selectedGroupId);

        const groupSnapshot =
            await getDoc(groupRef);

        if (!groupSnapshot.exists()) {
            return;
        }

        const group =
            groupSnapshot.data();

        if (enteredPassword !== safeText(group.password)) {

            setText(
                document.getElementById(
                    "groupPasswordMessage"
                ),
                "गलत group password!"
            );

            return;
        }

        hide(
            document.getElementById(
                "groupPasswordSection"
            )
        );

        show(
            document.getElementById(
                "groupContent"
            )
        );

        renderGroupMembers(group.members || []);

        startGroupMessages();

    } catch (error) {

        console.error(
            "Unlock group error:",
            error
        );
    }
}

// ======================================================
// ADD GROUP MEMBER
// ======================================================

const addMemberBtn =
    document.getElementById("addMemberBtn");

if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        function () {

            addGroupMember();
        }
    );
}

async function addGroupMember() {

    if (!selectedGroupId || !currentUser) {
        return;
    }

    const memberNameInput =
        document.getElementById(
            "memberNameInput"
        );

    const memberPhoneInput =
        document.getElementById(
            "memberPhoneInput"
        );

    const memberName =
        memberNameInput
            ? memberNameInput.value.trim()
            : "";

    const memberPhone =
        memberPhoneInput
            ? memberPhoneInput.value.trim()
            : "";

    if (!memberName || !memberPhone) {
        return;
    }

    if (!/^[0-9]{10}$/.test(memberPhone)) {
        return;
    }

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    try {

        const {
            doc,
            getDoc,
            updateDoc,
            arrayUnion
        } = firebaseModules;

        const groupRef =
            doc(db, "groups", selectedGroupId);

        const groupSnapshot =
            await getDoc(groupRef);

        if (!groupSnapshot.exists()) {
            return;
        }

        const group =
            groupSnapshot.data();

        // केवल group owner member add कर सकता है
        if (
            group.ownerPhone !== currentUser.phone
        ) {

            alert(
                "सिर्फ Group Owner member add कर सकता है।"
            );

            return;
        }

        await updateDoc(
            groupRef,
            {
                members: arrayUnion({
                    name: memberName,
                    phone: memberPhone
                })
            }
        );

        memberNameInput.value = "";
        memberPhoneInput.value = "";

    } catch (error) {

        console.error(
            "Add member error:",
            error
        );
    }
}

// ======================================================
// RENDER GROUP MEMBERS
// ======================================================

function renderGroupMembers(members) {

    const memberList =
        document.getElementById("memberList");

    if (!memberList) {
        return;
    }

    memberList.innerHTML = "";

    members.forEach(function (member) {

        const item =
            document.createElement("div");

        item.textContent =
            "👤 " +
            safeText(member.name) +
            " - " +
            safeText(member.phone);

        memberList.appendChild(item);
    });
}

// ======================================================
// GROUP CHAT
// ======================================================

const sendGroupMessageBtn =
    document.getElementById(
        "sendGroupMessageBtn"
    );

if (sendGroupMessageBtn) {

    sendGroupMessageBtn.addEventListener(
        "click",
        function () {

            sendGroupMessage();
        }
    );
}

async function sendGroupMessage() {

    if (!selectedGroupId || !currentUser) {
        return;
    }

    const input =
        document.getElementById(
            "groupMessageInput"
        );

    const text =
        input
            ? input.value.trim()
            : "";

    if (!text) {
        return;
    }

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = firebaseModules;

        await addDoc(
            collection(
                db,
                "groups",
                selectedGroupId,
                "messages"
            ),
            {
                text: text,
                senderName: currentUser.name,
                senderPhone: currentUser.phone,
                createdAt: serverTimestamp()
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
// GROUP REALTIME MESSAGES
// ======================================================

async function startGroupMessages() {

    if (!selectedGroupId) {
        return;
    }

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    if (unsubscribeGroupMessages) {
        unsubscribeGroupMessages();
    }

    const {
        collection,
        query,
        orderBy,
        limit,
        onSnapshot
    } = firebaseModules;

    const messagesRef =
        collection(
            db,
            "groups",
            selectedGroupId,
            "messages"
        );

    const messagesQuery =
        query(
            messagesRef,
            orderBy("createdAt", "asc"),
            limit(100)
        );

    unsubscribeGroupMessages =
        onSnapshot(
            messagesQuery,
            function (snapshot) {

                const groupMessages =
                    document.getElementById(
                        "groupMessages"
                    );

                if (!groupMessages) {
                    return;
                }

                groupMessages.innerHTML = "";

                snapshot.forEach(function (docSnap) {

                    const message =
                        docSnap.data();

                    const item =
                        document.createElement("div");

                    const isMine =
                        currentUser &&
                        message.senderPhone ===
                        currentUser.phone;

                    item.textContent =
                        (isMine
                            ? "You"
                            : safeText(message.senderName))
                        +
                        ": " +
                        safeText(message.text);

                    groupMessages.appendChild(item);
                });

                groupMessages.scrollTop =
                    groupMessages.scrollHeight;
            },
            function (error) {

                console.error(
                    "Group messages error:",
                    error
                );
            }
        );
}

// ======================================================
// HOMEWORK
// ======================================================

const addHomeworkBtn =
    document.getElementById("addHomeworkBtn");

if (addHomeworkBtn) {

    addHomeworkBtn.addEventListener(
        "click",
        function () {

            saveHomework();
        }
    );
}

function saveHomework() {

    const date =
        document.getElementById(
            "homeworkDate"
        )?.value || "";

    const homework = {

        date: date,

        Hindi:
            document.getElementById(
                "hindiHomework"
            )?.value || "",

        English:
            document.getElementById(
                "englishHomework"
            )?.value || "",

        Math:
            document.getElementById(
                "mathHomework"
            )?.value || "",

        Science:
            document.getElementById(
                "scienceHomework"
            )?.value || "",

        SST:
            document.getElementById(
                "sstHomework"
            )?.value || "",

        Computer:
            document.getElementById(
                "computerHomework"
            )?.value || "",

        Art:
            document.getElementById(
                "artHomework"
            )?.value || ""
    };

    const oldHomework =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );

    oldHomework.push(homework);

    localStorage.setItem(
        "studyHomework",
        JSON.stringify(oldHomework)
    );

    loadHomework();
}

function loadHomework() {

    const list =
        document.getElementById(
            "homeworkList"
        );

    if (!list) {
        return;
    }

    const homework =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );

    list.innerHTML = "";

    homework.forEach(function (item) {

        const div =
            document.createElement("div");

        div.textContent =
            "📚 " +
            safeText(item.date) +
            " | " +
            Object.entries(item)
                .filter(function ([key, value]) {
                    return key !== "date" && value;
                })
                .map(function ([key, value]) {
                    return key + ": " + value;
                })
                .join(" | ");

        list.appendChild(div);
    });
}

// ======================================================
// SCHOOL UPDATES
// ======================================================

const saveSchoolBtn =
    document.getElementById("saveSchoolBtn");

if (saveSchoolBtn) {

    saveSchoolBtn.addEventListener(
        "click",
        function () {

            const input =
                document.getElementById(
                    "schoolInput"
                );

            const text =
                input
                    ? input.value.trim()
                    : "";

            if (!text) {
                return;
            }

            const updates =
                JSON.parse(
                    localStorage.getItem(
                        "studySchoolUpdates"
                    ) || "[]"
                );

            updates.push({
                text: text,
                date: new Date().toLocaleString()
            });

            localStorage.setItem(
                "studySchoolUpdates",
                JSON.stringify(updates)
            );

            input.value = "";

            loadSchoolUpdates();
        }
    );
}

function loadSchoolUpdates() {

    const list =
        document.getElementById(
            "schoolList"
        );

    if (!list) {
        return;
    }

    const updates =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );

    list.innerHTML = "";

    updates.forEach(function (item) {

        const div =
            document.createElement("div");

        div.textContent =
            "📢 " +
            safeText(item.text) +
            " (" +
            safeText(item.date) +
            ")";

        list.appendChild(div);
    });
}

// ======================================================
// NOTES
// ======================================================

const saveNoteBtn =
    document.getElementById("saveNoteBtn");

if (saveNoteBtn) {

    saveNoteBtn.addEventListener(
        "click",
        function () {

            const input =
                document.getElementById(
                    "noteInput"
                );

            const text =
                input
                    ? input.value.trim()
                    : "";

            if (!text) {
                return;
            }

            const notes =
                JSON.parse(
                    localStorage.getItem(
                        "studyNotes"
                    ) || "[]"
                );

            notes.push({
                text: text,
                date: new Date().toLocaleString()
            });

            localStorage.setItem(
                "studyNotes",
                JSON.stringify(notes)
            );

            input.value = "";

            loadNotes();
        }
    );
}

function loadNotes() {

    const list =
        document.getElementById(
            "notesList"
        );

    if (!list) {
        return;
    }

    const notes =
        JSON.parse(
            localStorage.getItem(
                "studyNotes"
            ) || "[]"
        );

    list.innerHTML = "";

    notes.forEach(function (note) {

        const div =
            document.createElement("div");

        div.textContent =
            "📝 " +
            safeText(note.text) +
            " (" +
            safeText(note.date) +
            ")";

        list.appendChild(div);
    });
}

// ======================================================
// CHANGE NAME
// ======================================================

const changeNameBtn =
    document.getElementById(
        "changeNameBtn"
    );

if (changeNameBtn) {

    changeNameBtn.addEventListener(
        "click",
        function () {

            if (!currentUser) {
                return;
            }

            const input =
                document.getElementById(
                    "changeNameInput"
                );

            const newName =
                input
                    ? input.value.trim()
                    : "";

            if (!newName) {
                return;
            }

            currentUser.name = newName;

            localStorage.setItem(
                "studyCurrentUser",
                JSON.stringify(currentUser)
            );

            updateCurrentUserProfile();

            setText(
                document.getElementById(
                    "changeNameMessage"
                ),
                "नाम बदल दिया गया।"
            );
        }
    );
}

// ======================================================
// LANGUAGE
// ======================================================

const translations = {

    en: {

        home: "Home",
        chat: "Chat",
        groups: "Groups",
        homework: "Homework",
        school: "School",
        notes: "Notes",
        settings: "Settings",

        welcome: "Welcome to StudyConnect",
        welcomeText: "Your student community",

        yourName: "Your Name",
        saveName: "Save Name",

        onlineNow: "Online Now",

        chatDescription:
            "Chat with your friends",

        groupsDescription:
            "Create and join groups",

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
            "Important school updates",

        saveUpdate:
            "Save Update",

        notesTitle:
            "Notes",

        notesDescription:
            "Save your notes",

        saveNote:
            "Save Note",

        settingsTitle:
            "Settings",

        settingsDescription:
            "Manage your app",

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

        home: "होम",
        chat: "चैट",
        groups: "ग्रुप",
        homework: "होमवर्क",
        school: "स्कूल",
        notes: "नोट्स",
        settings: "सेटिंग्स",

        welcome: "StudyConnect में आपका स्वागत है",
        welcomeText: "आपका Student Community App",

        yourName: "आपका नाम",
        saveName: "नाम सेव करें",

        onlineNow: "अभी ऑनलाइन",

        chatDescription:
            "अपने दोस्तों से चैट करें",

        groupsDescription:
            "ग्रुप बनाएँ और जुड़ें",

        schoolUpdate:
            "स्कूल अपडेट",

        chatTitle:
            "चैट",

        groupsTitle:
            "ग्रुप",

        createGroup:
            "ग्रुप बनाएँ",

        createGroupButton:
            "ग्रुप बनाएँ",

        addMember:
            "Member जोड़ें",

        addMemberButton:
            "Member जोड़ें",

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
            "जरूरी स्कूल अपडेट",

        saveUpdate:
            "अपडेट सेव करें",

        notesTitle:
            "नोट्स",

        notesDescription:
            "अपने नोट्स सेव करें",

        saveNote:
            "नोट सेव करें",

        settingsTitle:
            "सेटिंग्स",

        settingsDescription:
            "अपना ऐप मैनेज करें",

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
            "ऐप डेटा Reset करें",

        owner:
            "Owner"
    }
};

function applyLanguage() {

    const language =
        localStorage.getItem(
            "studyLanguage"
        ) || "en";

    const texts =
        translations[language] ||
        translations.en;

    const elements =
        document.querySelectorAll(
            "[data-i18n]"
        );

    elements.forEach(function (element) {

        const key =
            element.getAttribute(
                "data-i18n"
            );

        if (texts[key]) {
            element.textContent =
                texts[key];
        }
    });
}

const hindiLanguageBtn =
    document.getElementById(
        "hindiLanguageBtn"
    );

const englishLanguageBtn =
    document.getElementById(
        "englishLanguageBtn"
    );

if (hindiLanguageBtn) {

    hindiLanguageBtn.addEventListener(
        "click",
        function () {

            localStorage.setItem(
                "studyLanguage",
                "hi"
            );

            applyLanguage();

            setText(
                document.getElementById(
                    "languageMessage"
                ),
                "भाषा हिंदी कर दी गई।"
            );
        }
    );
}

if (englishLanguageBtn) {

    englishLanguageBtn.addEventListener(
        "click",
        function () {

            localStorage.setItem(
                "studyLanguage",
                "en"
            );

            applyLanguage();

            setText(
                document.getElementById(
                    "languageMessage"
                ),
                "Language changed to English."
            );
        }
    );
}

// ======================================================
// THEME
// ======================================================

const themeBtn =
    document.getElementById(
        "themeBtn"
    );

function applyTheme() {

    const theme =
        localStorage.getItem(
            "studyTheme"
        ) || "light";

    if (theme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

    } else {

        document.body.classList.remove(
            "dark-mode"
        );
    }
}

if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        function () {

            const currentTheme =
                localStorage.getItem(
                    "studyTheme"
                ) || "light";

            const newTheme =
                currentTheme === "dark"
                    ? "light"
                    : "dark";

            localStorage.setItem(
                "studyTheme",
                newTheme
            );

            applyTheme();
        }
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
        async function () {

            if (!("Notification" in window)) {

                setText(
                    notificationMessage,
                    "इस browser में notifications उपलब्ध नहीं हैं।"
                );

                return;
            }

            try {

                const permission =
                    await Notification.requestPermission();

                if (permission === "granted") {

                    new Notification(
                        "StudyConnect",
                        {
                            body:
                                "Notifications चालू हो गए हैं।"
                        }
                    );

                    setText(
                        notificationMessage,
                        "Notifications चालू हैं।"
                    );

                } else {

                    setText(
                        notificationMessage,
                        "Notifications की permission नहीं मिली।"
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

function updateNotificationButton() {

    if (!notificationBtn) {
        return;
    }

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        notificationBtn.textContent =
            "Notifications Enabled";
    }
}

// ======================================================
// OWNER SETTINGS
// ======================================================

const ownerLoginBtn =
    document.getElementById(
        "ownerLoginBtn"
    );

if (ownerLoginBtn) {

    ownerLoginBtn.addEventListener(
        "click",
        function () {

            ownerLogin();
        }
    );
}

function ownerLogin() {

    const input =
        document.getElementById(
            "ownerPasswordInput"
        );

    const password =
        input
            ? input.value.trim()
            : "";

    const message =
        document.getElementById(
            "ownerPasswordMessage"
        );

    if (
        !currentUser ||
        !currentUser.isOwner
    ) {

        setText(
            message,
            "Owner access केवल Owner के लिए है।"
        );

        return;
    }

    if (password !== OWNER_PASSWORD) {

        setText(
            message,
            "गलत Owner Password!"
        );

        return;
    }

    setText(
        message,
        "Owner Panel खुल गया।"
    );

    show(
        document.getElementById(
            "ownerPanel"
        )
    );

    loadAllowedUsers();
}

// ======================================================
// ALLOW USER
// ======================================================

const allowUserBtn =
    document.getElementById(
        "allowUserBtn"
    );

if (allowUserBtn) {

    allowUserBtn.addEventListener(
        "click",
        function () {

            allowUser();
        }
    );
}

async function allowUser() {

    if (
        !currentUser ||
        !currentUser.isOwner
    ) {
        return;
    }

    const nameInput =
        document.getElementById(
            "allowedUserNameInput"
        );

    const phoneInput =
        document.getElementById(
            "allowedUserPhoneInput"
        );

    const name =
        nameInput
            ? nameInput.value.trim()
            : "";

    const phone =
        phoneInput
            ? phoneInput.value.trim()
            : "";

    if (!name || !phone) {
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        return;
    }

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    try {

        const {
            collection,
            addDoc
        } = firebaseModules;

        await addDoc(
            collection(db, "allowedUsers"),
            {
                name: name,
                phone: phone,
                createdAt: new Date().toISOString()
            }
        );

        nameInput.value = "";
        phoneInput.value = "";

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
        document.getElementById(
            "allowedUsersList"
        );

    if (!list) {
        return;
    }

    await loadFirebase();

    if (!firebaseReady || !db) {
        return;
    }

    try {

        const {
            collection,
            getDocs
        } = firebaseModules;

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "allowedUsers"
                )
            );

        list.innerHTML = "";

        snapshot.forEach(function (docSnap) {

            const user =
                docSnap.data();

            const item =
                document.createElement("div");

            item.textContent =
                "👤 " +
                safeText(user.name) +
                " - " +
                safeText(user.phone);

            list.appendChild(item);
        });

    } catch (error) {

        console.error(
            "Load allowed users error:",
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
        function () {

            const confirmed =
                confirm(
                    "क्या आप अपना local app data हटाना चाहते हैं?"
                );

            if (!confirmed) {
                return;
            }

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
                "studyLanguage"
            );

            localStorage.removeItem(
                "studyTheme"
            );

            setText(
                document.getElementById(
                    "settingsMessage"
                ),
                "App data reset हो गया।"
            );

            setTimeout(function () {

                location.reload();

            }, 800);
        }
    );
}

// ======================================================
// EMOJI BUTTON
// ======================================================

const emojiBtn =
    document.getElementById(
        "emojiBtn"
    );

if (emojiBtn) {

    emojiBtn.addEventListener(
        "click",
        function () {

            if (!messageInput) {
                return;
            }

            messageInput.value += " 😊";

            messageInput.focus();
        }
    );
}

// ======================================================
// LOAD SAVED USER
// ======================================================

function loadSavedUser() {

    try {

        const saved =
            localStorage.getItem(
                "studyCurrentUser"
            );

        if (!saved) {
            return;
        }

        currentUser =
            JSON.parse(saved);

        if (
            currentUser &&
            currentUser.name &&
            currentUser.phone
        ) {

            // Saved login को automatically open नहीं कर रहे,
            // सिर्फ data memory में रख रहे हैं.
        }

    } catch (error) {

        console.error(
            "Saved user error:",
            error
        );

        currentUser = null;
    }
}

// ======================================================
// SERVICE WORKER / PWA
// ======================================================

async function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {
        return;
    }

    try {

        await navigator.serviceWorker.register(
            "service-worker.js"
        );

        console.log(
            "Service Worker registered successfully."
        );

    } catch (error) {

        console.error(
            "Service Worker registration error:",
            error
        );
    }
}

// ======================================================
// BEFORE UNLOAD
// ======================================================

window.addEventListener(
    "beforeunload",
    function () {

        if (onlineHeartbeat) {

            clearInterval(
                onlineHeartbeat
            );
        }

        // Best effort offline update
        updateOnlineStatus(false);

        if (unsubscribeChat) {
            unsubscribeChat();
        }

        if (unsubscribeOnlineUsers) {
            unsubscribeOnlineUsers();
        }

        if (unsubscribeGroups) {
            unsubscribeGroups();
        }

        if (unsubscribeGroupMessages) {
            unsubscribeGroupMessages();
        }
    }
);

// ======================================================
// APP START
// ======================================================

loadSavedUser();

applyLanguage();

applyTheme();

registerServiceWorker();

console.log(
    "StudyConnect JavaScript loaded successfully."
);
