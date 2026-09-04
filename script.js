
// =====================================================
// STUDYCONNECT - COMPLETE SCRIPT.JS
// =====================================================

// =====================================================
// 1. BASIC SETTINGS
// =====================================================

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";
const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

let currentUser = null;
let db = null;
let firebaseReady = false;

let unsubscribeChat = null;
let unsubscribeOnline = null;
let unsubscribeGroupMessages = null;

let pendingProfilePhoto = null;


// =====================================================
// 2. HELPER FUNCTIONS
// =====================================================

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


// =====================================================
// 3. IMPORTANT: NEXT BUTTON
//    THIS RUNS BEFORE FIREBASE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const ownerNextBtn = $("ownerNextBtn");
    const ownerStep = $("ownerStep");
    const userDetailsStep = $("userDetailsStep");
    const ownerNameDisplay = $("ownerNameDisplay");
    const passwordError = $("passwordError");

    console.log("StudyConnect JavaScript loaded.");

    // Make sure button cannot submit a form
    if (ownerNextBtn) {
        ownerNextBtn.type = "button";

        ownerNextBtn.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            console.log("NEXT BUTTON CLICKED");

            // Show owner name
            if (ownerNameDisplay) {
                ownerNameDisplay.textContent = OWNER_NAME;
            }

            // Clear old error
            if (passwordError) {
                passwordError.textContent = "";
            }

            // Hide owner step
            if (ownerStep) {
                ownerStep.style.display = "none";
            }

            // Show user details step
            if (userDetailsStep) {
                userDetailsStep.style.display = "block";
            }

        });
    } else {
        console.error("ownerNextBtn NOT FOUND");
    }

});


// =====================================================
// 4. FIREBASE
// =====================================================

let firebasePromise = null;

async function loadFirebase() {

    if (firebasePromise) {
        return firebasePromise;
    }

    firebasePromise = (async function () {

        try {

            const firebaseApp = await import(
                "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"
            );

            const firestore = await import(
                "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
            );

            const firebaseConfig = {

                apiKey: "AIzaSyCquRX2YB59FObuIyi3Wc3AUCdPWypag",

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

            let app;

            try {

                const apps = firebaseApp.getApps();

                if (apps.length > 0) {
                    app = firebaseApp.getApp();
                } else {
                    app = firebaseApp.initializeApp(firebaseConfig);
                }

            } catch (error) {

                console.error("Firebase initialization error:", error);

                try {
                    app = firebaseApp.getApp();
                } catch (e) {
                    throw error;
                }
            }

            db = firestore.getFirestore(app);

            firebaseReady = true;

            console.log("Firebase connected.");

            return {
                db,
                firestore
            };

        } catch (error) {

            console.error("Firebase failed:", error);

            firebaseReady = false;

            return null;
        }

    })();

    return firebasePromise;
}


// =====================================================
// 5. LOGIN SCREEN
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const unlockBtn = $("unlockBtn");
    const appPassword = $("appPassword");
    const passwordScreen = $("passwordScreen");
    const schoolPasswordStep = $("schoolPasswordStep");
    const ownerStep = $("ownerStep");
    const userDetailsStep = $("userDetailsStep");
    const passwordError = $("passwordError");

    if (unlockBtn) {

        unlockBtn.type = "button";

        unlockBtn.addEventListener("click", async function (event) {

            event.preventDefault();

            const password = appPassword
                ? appPassword.value.trim()
                : "";

            if (password !== SCHOOL_PASSWORD) {

                if (passwordError) {
                    passwordError.textContent =
                        "गलत password! कृपया सही password डालें।";
                }

                return;
            }

            if (passwordError) {
                passwordError.textContent = "";
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

        });

    }

});


// =====================================================
// 6. USER LOGIN
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const enterAppBtn = $("enterAppBtn");

    if (!enterAppBtn) {
        return;
    }

    enterAppBtn.type = "button";

    enterAppBtn.addEventListener("click", async function (event) {

        event.preventDefault();

        const nameInput = $("openUserName");
        const phoneInput = $("openUserPhone");

        const name = nameInput
            ? nameInput.value.trim()
            : "";

        const phone = phoneInput
            ? phoneInput.value.trim()
            : "";

        const passwordError = $("passwordError");

        if (!name || !phone) {

            if (passwordError) {
                passwordError.textContent =
                    "कृपया अपना नाम और मोबाइल नंबर डालें।";
            }

            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {

            if (passwordError) {
                passwordError.textContent =
                    "कृपया 10 अंकों का मोबाइल नंबर डालें।";
            }

            return;
        }

        if (passwordError) {
            passwordError.textContent = "Checking...";
        }

        await loginUser(name, phone);

    });

});


// =====================================================
// 7. LOGIN CHECK
// =====================================================

async function loginUser(name, phone) {

    const passwordError = $("passwordError");

    // Owner can always enter
    if (
        name.toLowerCase() === OWNER_NAME.toLowerCase() &&
        phone === OWNER_PHONE
    ) {

        currentUser = {
            name: OWNER_NAME,
            phone: phone,
            isOwner: true
        };

        finishLogin();

        return;
    }

    const firebase = await loadFirebase();

    if (!firebase) {

        if (passwordError) {
            passwordError.textContent =
                "Firebase connect नहीं हुआ। Internet check करें।";
        }

        return;
    }

    try {

        const {
            collection,
            getDocs
        } = firebase.firestore;

        const usersRef = collection(db, "allowedUsers");

        const snapshot = await getDocs(usersRef);

        let allowed = false;

        snapshot.forEach(function (doc) {

            const data = doc.data();

            const savedName =
                String(data.name || "")
                    .trim()
                    .toLowerCase();

            const savedPhone =
                String(data.phone || "").trim();

            if (
                savedName === name.toLowerCase() &&
                savedPhone === phone
            ) {
                allowed = true;
            }

        });

        if (!allowed) {

            showContactOwner();

            return;
        }

        currentUser = {
            name: name,
            phone: phone,
            isOwner: false
        };

        finishLogin();

    } catch (error) {

        console.error(error);

        if (passwordError) {
            passwordError.textContent =
                "Login check में समस्या आई।";
        }

    }
}


// =====================================================
// 8. FINISH LOGIN
// =====================================================

function finishLogin() {

    localStorage.setItem(
        "studyCurrentUser",
        JSON.stringify(currentUser)
    );

    const passwordScreen = $("passwordScreen");
    const contactOwnerScreen = $("contactOwnerScreen");
    const appContainer = $("appContainer");

    hide(passwordScreen);
    hide(contactOwnerScreen);
    show(appContainer);

    setText("studentName", currentUser.name);

    loadSavedSettings();

    startOnlinePresence();

    startChatRealtime();

    updateOnlineUsers();

    if (currentUser.isOwner) {
        const ownerSection = $("ownerSettingsSection");

        if (ownerSection) {
            show(ownerSection);
        }
    }

}


// =====================================================
// 9. CONTACT OWNER
// =====================================================

function showContactOwner() {

    hide($("passwordScreen"));
    show($("contactOwnerScreen"));

    setText(
        "contactOwnerTitle",
        "Owner से संपर्क करें"
    );

    setText(
        "contactOwnerText",
        "आपका नाम और मोबाइल नंबर अभी allowed users में नहीं है।"
    );

}

document.addEventListener("DOMContentLoaded", function () {

    const backBtn = $("backToLoginBtn");

    if (backBtn) {

        backBtn.type = "button";

        backBtn.addEventListener("click", function () {

            hide($("contactOwnerScreen"));
            show($("passwordScreen"));

            show($("schoolPasswordStep"));
            hide($("ownerStep"));
            hide($("userDetailsStep"));

        });

    }

});


// =====================================================
// 10. NAVIGATION
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const menuBtn = $("menuBtn");
    const navMenu = $("navMenu");

    if (menuBtn) {

        menuBtn.type = "button";

        menuBtn.addEventListener("click", function () {

            if (!navMenu) {
                return;
            }

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

    const navButtons = document.querySelectorAll(
        "[data-page]"
    );

    navButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const pageName =
                button.getAttribute("data-page");

            document.querySelectorAll(".page").forEach(
                function (page) {
                    page.style.display = "none";
                }
            );

            const selectedPage = $(pageName);

            if (selectedPage) {
                selectedPage.style.display = "block";
            }

            if (navMenu) {
                navMenu.style.display = "none";
            }

        });

    });

});


// =====================================================
// 11. HOME NAME
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const saveNameBtn = $("saveNameBtn");

    if (!saveNameBtn) {
        return;
    }

    saveNameBtn.type = "button";

    saveNameBtn.addEventListener("click", function () {

        const studentName = $("studentName");

        if (!studentName || !currentUser) {
            return;
        }

        const newName =
            studentName.textContent.trim();

        if (!newName) {
            return;
        }

        currentUser.name = newName;

        localStorage.setItem(
            "studyCurrentUser",
            JSON.stringify(currentUser)
        );

        setText(
            "nameMessage",
            "Name saved successfully!"
        );

    });

});


// =====================================================
// 12. PROFILE PHOTO
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const profilePhotoInput =
        $("profilePhotoInput");

    const profilePhotoPreview =
        $("profilePhotoPreview");

    if (!profilePhotoInput) {
        return;
    }

    profilePhotoInput.addEventListener(
        "change",
        function () {

            const file =
                profilePhotoInput.files[0];

            if (!file) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload = function (event) {

                pendingProfilePhoto =
                    event.target.result;

                if (profilePhotoPreview) {

                    profilePhotoPreview.src =
                        pendingProfilePhoto;

                    profilePhotoPreview.style.display =
                        "block";
                }

                if (currentUser) {

                    currentUser.profilePhoto =
                        pendingProfilePhoto;

                    localStorage.setItem(
                        "studyCurrentUser",
                        JSON.stringify(currentUser)
                    );

                }

            };

            reader.readAsDataURL(file);

        }
    );

});


// =====================================================
// 13. ONLINE PRESENCE
// =====================================================

async function startOnlinePresence() {

    const firebase = await loadFirebase();

    if (!firebase || !currentUser) {
        return;
    }

    const {
        doc,
        setDoc
    } = firebase.firestore;

    const phone = currentUser.phone;

    async function updateOnline() {

        try {

            await setDoc(
                doc(db, "onlineUsers", phone),
                {
                    name: currentUser.name,
                    phone: phone,
                    online: true,
                    lastSeen: Date.now()
                },
                {
                    merge: true
                }
            );

        } catch (error) {

            console.error(
                "Online update error:",
                error
            );

        }

    }

    await updateOnline();

    setInterval(updateOnline, 30000);

}


// =====================================================
// 14. ONLINE USERS
// =====================================================

async function updateOnlineUsers() {

    const firebase = await loadFirebase();

    if (!firebase) {
        return;
    }

    if (unsubscribeOnline) {
        unsubscribeOnline();
        unsubscribeOnline = null;
    }

    const {
        collection,
        onSnapshot
    } = firebase.firestore;

    const onlineRef =
        collection(db, "onlineUsers");

    unsubscribeOnline =
        onSnapshot(
            onlineRef,
            function (snapshot) {

                const list =
                    $("onlineUsers");

                const count =
                    $("onlineCount");

                if (!list) {
                    return;
                }

                list.innerHTML = "";

                let onlineCount = 0;

                snapshot.forEach(function (docSnap) {

                    const data =
                        docSnap.data();

                    const lastSeen =
                        Number(data.lastSeen || 0);

                    const isOnline =
                        data.online === true &&
                        Date.now() - lastSeen < 90000;

                    if (!isOnline) {
                        return;
                    }

                    onlineCount++;

                    const item =
                        document.createElement("div");

                    item.className =
                        "online-user";

                    item.textContent =
                        "🟢 " +
                        (data.name || "User");

                    list.appendChild(item);

                });

                if (count) {
                    count.textContent =
                        onlineCount;
                }

            }
        );

}


// =====================================================
// 15. ONLINE TOGGLE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const onlineToggleBtn =
        $("onlineToggleBtn");

    if (!onlineToggleBtn) {
        return;
    }

    onlineToggleBtn.type = "button";

    onlineToggleBtn.addEventListener(
        "click",
        async function () {

            if (!currentUser) {
                return;
            }

            const firebase =
                await loadFirebase();

            if (!firebase) {
                return;
            }

            const {
                doc,
                setDoc
            } = firebase.firestore;

            await setDoc(
                doc(
                    db,
                    "onlineUsers",
                    currentUser.phone
                ),
                {
                    name: currentUser.name,
                    phone: currentUser.phone,
                    online: true,
                    lastSeen: Date.now()
                },
                {
                    merge: true
                }
            );

            updateOnlineUsers();

        }
    );

});


// =====================================================
// 16. MAIN CHAT - REALTIME
// =====================================================

async function startChatRealtime() {

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        collection,
        query,
        orderBy,
        limit,
        onSnapshot,
        addDoc,
        serverTimestamp,
        doc,
        updateDoc,
        arrayUnion
    } = firebase.firestore;

    const chatMessages =
        $("chatMessages");

    if (!chatMessages) {
        return;
    }

    if (unsubscribeChat) {
        unsubscribeChat();
    }

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

                chatMessages.innerHTML = "";

                snapshot.forEach(function (docSnap) {

                    const data =
                        docSnap.data();

                    const message =
                        document.createElement("div");

                    message.className =
                        "chat-message";

                    const text =
                        document.createElement("div");

                    text.textContent =
                        data.text || "";

                    const meta =
                        document.createElement("small");

                    const sender =
                        data.senderName ||
                        "User";

                    let tick = "✓✓";

                    const readBy =
                        data.readBy || [];

                    if (
                        currentUser &&
                        readBy.includes(currentUser.phone)
                    ) {
                        tick = "✓✓";
                        meta.className =
                            "read-message";
                    }

                    meta.textContent =
                        sender +
                        " • " +
                        tick;

                    message.appendChild(text);
                    message.appendChild(meta);

                    chatMessages.appendChild(message);

                });

                chatMessages.scrollTop =
                    chatMessages.scrollHeight;

            }
        );

}


// =====================================================
// 17. SEND CHAT MESSAGE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const sendMessageBtn =
        $("sendMessageBtn");

    const messageInput =
        $("messageInput");

    if (!sendMessageBtn) {
        return;
    }

    sendMessageBtn.type = "button";

    sendMessageBtn.addEventListener(
        "click",
        async function () {

            const text =
                messageInput
                    ? messageInput.value.trim()
                    : "";

            if (!text || !currentUser) {
                return;
            }

            const firebase =
                await loadFirebase();

            if (!firebase) {
                return;
            }

            const {
                collection,
                addDoc,
                serverTimestamp
            } = firebase.firestore;

            try {

                await addDoc(
                    collection(db, "messages"),
                    {
                        text: text,
                        senderName:
                            currentUser.name,
                        senderPhone:
                            currentUser.phone,
                        createdAt:
                            serverTimestamp(),
                        readBy: []
                    }
                );

                messageInput.value = "";

            } catch (error) {

                console.error(
                    "Message send error:",
                    error
                );

            }

        }
    );

});


// =====================================================
// 18. EMOJI BUTTON
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const emojiBtn = $("emojiBtn");
    const messageInput = $("messageInput");

    if (emojiBtn && messageInput) {

        emojiBtn.type = "button";

        emojiBtn.addEventListener(
            "click",
            function () {

                messageInput.value += " 😊";

                messageInput.focus();

            }
        );

    }

});


// =====================================================
// 19. GROUP CREATION
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const createGroupBtn =
        $("createGroupBtn");

    if (!createGroupBtn) {
        return;
    }

    createGroupBtn.type = "button";

    createGroupBtn.addEventListener(
        "click",
        createGroup
    );

});

async function createGroup() {

    if (!currentUser) {
        return;
    }

    const groupName =
        $("groupInput")
            ? $("groupInput").value.trim()
            : "";

    const password =
        $("groupPasswordInput")
            ? $("groupPasswordInput").value.trim()
            : "";

    if (!groupName || !password) {
        return;
    }

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        collection,
        addDoc,
        serverTimestamp
    } = firebase.firestore;

    try {

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

        $("groupInput").value = "";
        $("groupPasswordInput").value = "";

        renderGroups();

    } catch (error) {

        console.error(
            "Group create error:",
            error
        );

    }

}


// =====================================================
// 20. SHOW GROUPS
// =====================================================

async function renderGroups() {

    const list =
        $("groupList");

    if (!list) {
        return;
    }

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        collection,
        onSnapshot
    } = firebase.firestore;

    onSnapshot(
        collection(db, "groups"),
        function (snapshot) {

            list.innerHTML = "";

            snapshot.forEach(function (docSnap) {

                const data =
                    docSnap.data();

                const button =
                    document.createElement("button");

                button.type = "button";

                button.textContent =
                    data.name || "Group";

                button.addEventListener(
                    "click",
                    function () {

                        openGroup(
                            docSnap.id,
                            data
                        );

                    }
                );

                list.appendChild(button);

            });

        }
    );

}


// =====================================================
// 21. OPEN GROUP
// =====================================================

let selectedGroupId = null;
let selectedGroupData = null;

function openGroup(groupId, data) {

    selectedGroupId = groupId;
    selectedGroupData = data;

    show($("groupChatSection"));

    setText(
        "selectedGroupName",
        data.name || "Group"
    );

    setText(
        "selectedGroupOwner",
        "Owner: " +
        (data.ownerName || "")
    );

    hide($("groupContent"));

    show($("groupPasswordSection"));

    setText(
        "groupPasswordMessage",
        ""
    );

}


// =====================================================
// 22. UNLOCK GROUP
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const unlockGroupBtn =
        $("unlockGroupBtn");

    if (!unlockGroupBtn) {
        return;
    }

    unlockGroupBtn.type = "button";

    unlockGroupBtn.addEventListener(
        "click",
        function () {

            const entered =
                $("enterGroupPasswordInput")
                    ? $("enterGroupPasswordInput")
                        .value
                        .trim()
                    : "";

            if (
                !selectedGroupData ||
                entered !== selectedGroupData.password
            ) {

                setText(
                    "groupPasswordMessage",
                    "गलत group password!"
                );

                return;
            }

            hide($("groupPasswordSection"));
            show($("groupContent"));

            loadGroupMembers();

            startGroupMessages();

        }
    );

});


// =====================================================
// 23. ADD GROUP MEMBER
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const addMemberBtn =
        $("addMemberBtn");

    if (!addMemberBtn) {
        return;
    }

    addMemberBtn.type = "button";

    addMemberBtn.addEventListener(
        "click",
        addGroupMember
    );

});

async function addGroupMember() {

    if (!selectedGroupId || !currentUser) {
        return;
    }

    if (
        selectedGroupData.ownerPhone !==
        currentUser.phone
    ) {

        setText(
            "groupPasswordMessage",
            "सिर्फ group owner member जोड़ सकता है।"
        );

        return;
    }

    const name =
        $("memberNameInput")
            ? $("memberNameInput").value.trim()
            : "";

    const phone =
        $("memberPhoneInput")
            ? $("memberPhoneInput").value.trim()
            : "";

    if (!name || !phone) {
        return;
    }

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        doc,
        updateDoc,
        arrayUnion
    } = firebase.firestore;

    try {

        await updateDoc(
            doc(db, "groups", selectedGroupId),
            {
                members: arrayUnion({
                    name: name,
                    phone: phone
                })
            }
        );

        $("memberNameInput").value = "";
        $("memberPhoneInput").value = "";

        loadGroupMembers();

    } catch (error) {

        console.error(
            "Add member error:",
            error
        );

    }

}


// =====================================================
// 24. GROUP MEMBERS
// =====================================================

async function loadGroupMembers() {

    if (!selectedGroupData) {
        return;
    }

    const list =
        $("memberList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    const members =
        selectedGroupData.members || [];

    members.forEach(function (member) {

        const item =
            document.createElement("div");

        item.textContent =
            "👤 " +
            member.name +
            " - " +
            member.phone;

        list.appendChild(item);

    });

}


// =====================================================
// 25. GROUP CHAT
// =====================================================

async function startGroupMessages() {

    if (!selectedGroupId) {
        return;
    }

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        collection,
        query,
        orderBy,
        onSnapshot
    } = firebase.firestore;

    const messages =
        $("groupMessages");

    if (!messages) {
        return;
    }

    if (unsubscribeGroupMessages) {
        unsubscribeGroupMessages();
    }

    const ref =
        collection(
            db,
            "groups",
            selectedGroupId,
            "messages"
        );

    const q =
        query(
            ref,
            orderBy("createdAt", "asc")
        );

    unsubscribeGroupMessages =
        onSnapshot(
            q,
            function (snapshot) {

                messages.innerHTML = "";

                snapshot.forEach(function (docSnap) {

                    const data =
                        docSnap.data();

                    const item =
                        document.createElement("div");

                    item.textContent =
                        (data.senderName || "User") +
                        ": " +
                        (data.text || "");

                    messages.appendChild(item);

                });

                messages.scrollTop =
                    messages.scrollHeight;

            }
        );

}


// =====================================================
// 26. SEND GROUP MESSAGE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const sendBtn =
        $("sendGroupMessageBtn");

    if (!sendBtn) {
        return;
    }

    sendBtn.type = "button";

    sendBtn.addEventListener(
        "click",
        sendGroupMessage
    );

});

async function sendGroupMessage() {

    if (!selectedGroupId || !currentUser) {
        return;
    }

    const input =
        $("groupMessageInput");

    const text =
        input
            ? input.value.trim()
            : "";

    if (!text) {
        return;
    }

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        collection,
        addDoc,
        serverTimestamp
    } = firebase.firestore;

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

}


// =====================================================
// 27. HOMEWORK
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const addHomeworkBtn =
        $("addHomeworkBtn");

    if (!addHomeworkBtn) {
        return;
    }

    addHomeworkBtn.type = "button";

    addHomeworkBtn.addEventListener(
        "click",
        saveHomework
    );

    loadHomework();

});

function saveHomework() {

    const date =
        $("homeworkDate")
            ? $("homeworkDate").value
            : "";

    const homework = {

        date: date,

        hindi:
            $("hindiHomework")
                ? $("hindiHomework").value
                : "",

        english:
            $("englishHomework")
                ? $("englishHomework").value
                : "",

        math:
            $("mathHomework")
                ? $("mathHomework").value
                : "",

        science:
            $("scienceHomework")
                ? $("scienceHomework").value
                : "",

        sst:
            $("sstHomework")
                ? $("sstHomework").value
                : "",

        computer:
            $("computerHomework")
                ? $("computerHomework").value
                : "",

        art:
            $("artHomework")
                ? $("artHomework").value
                : ""

    };

    const old =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );

    old.push(homework);

    localStorage.setItem(
        "studyHomework",
        JSON.stringify(old)
    );

    loadHomework();

}

function loadHomework() {

    const list =
        $("homeworkList");

    if (!list) {
        return;
    }

    const data =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );

    list.innerHTML = "";

    data.forEach(function (item) {

        const div =
            document.createElement("div");

        div.textContent =
            "📅 " +
            item.date +
            " | Hindi: " +
            item.hindi +
            " | English: " +
            item.english +
            " | Math: " +
            item.math +
            " | Science: " +
            item.science +
            " | SST: " +
            item.sst;

        list.appendChild(div);

    });

}


// =====================================================
// 28. SCHOOL UPDATES
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const btn =
        $("saveSchoolBtn");

    if (!btn) {
        return;
    }

    btn.type = "button";

    btn.addEventListener(
        "click",
        saveSchoolUpdate
    );

    loadSchoolUpdates();

});

function saveSchoolUpdate() {

    const input =
        $("schoolInput");

    const text =
        input
            ? input.value.trim()
            : "";

    if (!text) {
        return;
    }

    const data =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );

    data.push({
        text: text,
        date: new Date().toLocaleString()
    });

    localStorage.setItem(
        "studySchoolUpdates",
        JSON.stringify(data)
    );

    input.value = "";

    loadSchoolUpdates();

}

function loadSchoolUpdates() {

    const list =
        $("schoolList");

    if (!list) {
        return;
    }

    const data =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );

    list.innerHTML = "";

    data.forEach(function (item) {

        const div =
            document.createElement("div");

        div.textContent =
            "📢 " +
            item.text +
            " • " +
            item.date;

        list.appendChild(div);

    });

}


// =====================================================
// 29. NOTES
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const btn =
        $("saveNoteBtn");

    if (!btn) {
        return;
    }

    btn.type = "button";

    btn.addEventListener(
        "click",
        saveNote
    );

    loadNotes();

});

function saveNote() {

    const input =
        $("noteInput");

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

function loadNotes() {

    const list =
        $("notesList");

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
            note.text;

        list.appendChild(div);

    });

}


// =====================================================
// 30. CHANGE NAME
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const btn =
        $("changeNameBtn");

    if (!btn) {
        return;
    }

    btn.type = "button";

    btn.addEventListener(
        "click",
        function () {

            if (!currentUser) {
                return;
            }

            const input =
                $("changeNameInput");

            const newName =
                input
                    ? input.value.trim()
                    : "";

            if (!newName) {
                return;
            }

            currentUser.name =
                newName;

            localStorage.setItem(
                "studyCurrentUser",
                JSON.stringify(currentUser)
            );

            setText(
                "changeNameMessage",
                "Name changed successfully!"
            );

            setText(
                "studentName",
                newName
            );

        }
    );

});


// =====================================================
// 31. LANGUAGE SYSTEM
// =====================================================

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
        welcomeText:
            "Connect with your school friends.",

        yourName: "Your Name",
        saveName: "Save Name",

        onlineNow: "Online Now",

        chatDescription:
            "Chat with your friends.",

        groupsDescription:
            "Create and join groups.",

        schoolUpdate:
            "School Updates",

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
            "Important school information.",

        saveUpdate:
            "Save Update",

        notesTitle:
            "Notes",

        notesDescription:
            "Save your notes here.",

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

        home: "होम",
        chat: "चैट",
        groups: "ग्रुप",
        homework: "होमवर्क",
        school: "स्कूल",
        notes: "नोट्स",
        settings: "सेटिंग्स",

        welcome: "StudyConnect में आपका स्वागत है",
        welcomeText:
            "अपने स्कूल के दोस्तों से जुड़ें।",

        yourName: "आपका नाम",
        saveName: "नाम सेव करें",

        onlineNow: "अभी ऑनलाइन",

        chatDescription:
            "अपने दोस्तों से चैट करें।",

        groupsDescription:
            "ग्रुप बनाएं और जुड़ें।",

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
            "स्कूल की जरूरी जानकारी।",

        saveUpdate:
            "अपडेट सेव करें",

        notesTitle:
            "नोट्स",

        notesDescription:
            "अपने नोट्स यहां सेव करें।",

        saveNote:
            "नोट सेव करें",

        settingsTitle:
            "सेटिंग्स",

        settingsDescription:
            "StudyConnect की सेटिंग्स बदलें।",

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


function applyLanguage(language) {

    const selected =
        translations[language] ||
        translations.en;

    document
        .querySelectorAll("[data-i18n]")
        .forEach(function (element) {

            const key =
                element.getAttribute("data-i18n");

            if (selected[key]) {
                element.textContent =
                    selected[key];
            }

        });

    localStorage.setItem(
        "studyLanguage",
        language
    );

}


document.addEventListener("DOMContentLoaded", function () {

    const hindiBtn =
        $("hindiLanguageBtn");

    const englishBtn =
        $("englishLanguageBtn");

    if (hindiBtn) {

        hindiBtn.type = "button";

        hindiBtn.addEventListener(
            "click",
            function () {

                applyLanguage("hi");

                setText(
                    "languageMessage",
                    "भाषा हिंदी कर दी गई है।"
                );

            }
        );

    }

    if (englishBtn) {

        englishBtn.type = "button";

        englishBtn.addEventListener(
            "click",
            function () {

                applyLanguage("en");

                setText(
                    "languageMessage",
                    "Language changed to English."
                );

            }
        );

    }

    const savedLanguage =
        localStorage.getItem(
            "studyLanguage"
        ) || "en";

    applyLanguage(savedLanguage);

});


// =====================================================
// 32. DARK MODE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const themeBtn =
        $("themeBtn");

    if (!themeBtn) {
        return;
    }

    themeBtn.type = "button";

    themeBtn.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "dark-mode"
            );

            const dark =
                document.body.classList.contains(
                    "dark-mode"
                );

            localStorage.setItem(
                "studyDarkMode",
                dark ? "true" : "false"
            );

        }
    );

});


// =====================================================
// 33. NOTIFICATIONS
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const notificationBtn =
        $("notificationBtn");

    if (!notificationBtn) {
        return;
    }

    notificationBtn.type = "button";

    notificationBtn.addEventListener(
        "click",
        async function () {

            if (!("Notification" in window)) {

                setText(
                    "notificationMessage",
                    "इस browser में notifications available नहीं हैं।"
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
                                "Notifications चालू हो गए हैं!"
                        }
                    );

                    setText(
                        "notificationMessage",
                        "Notifications enabled."
                    );

                } else {

                    setText(
                        "notificationMessage",
                        "Notification permission नहीं मिली।"
                    );

                }

            } catch (error) {

                console.error(error);

            }

        }
    );

});


// =====================================================
// 34. OWNER PANEL
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const ownerLoginBtn =
        $("ownerLoginBtn");

    if (!ownerLoginBtn) {
        return;
    }

    ownerLoginBtn.type = "button";

    ownerLoginBtn.addEventListener(
        "click",
        ownerLogin
    );

});

function ownerLogin() {

    const input =
        $("ownerPasswordInput");

    const password =
        input
            ? input.value.trim()
            : "";

    if (password !== OWNER_PASSWORD) {

        setText(
            "ownerPasswordMessage",
            "गलत Owner password!"
        );

        return;
    }

    if (!currentUser || !currentUser.isOwner) {

        setText(
            "ownerPasswordMessage",
            "सिर्फ Owner इस section को खोल सकता है।"
        );

        return;
    }

    show($("ownerPanel"));

    setText(
        "ownerPasswordMessage",
        "Owner Panel खुल गया।"
    );

    loadAllowedUsers();

}


// =====================================================
// 35. ALLOW USER
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const allowUserBtn =
        $("allowUserBtn");

    if (!allowUserBtn) {
        return;
    }

    allowUserBtn.type = "button";

    allowUserBtn.addEventListener(
        "click",
        allowUser
    );

});

async function allowUser() {

    if (!currentUser || !currentUser.isOwner) {
        return;
    }

    const name =
        $("allowedUserNameInput")
            ? $("allowedUserNameInput").value.trim()
            : "";

    const phone =
        $("allowedUserPhoneInput")
            ? $("allowedUserPhoneInput").value.trim()
            : "";

    if (!name || !phone) {
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {

        setText(
            "settingsMessage",
            "सही 10 अंकों का mobile number डालें।"
        );

        return;
    }

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        collection,
        addDoc,
        serverTimestamp
    } = firebase.firestore;

    try {

        await addDoc(
            collection(db, "allowedUsers"),
            {
                name: name,
                phone: phone,
                addedBy: OWNER_NAME,
                createdAt: serverTimestamp()
            }
        );

        $("allowedUserNameInput").value = "";
        $("allowedUserPhoneInput").value = "";

        setText(
            "settingsMessage",
            "User allowed successfully!"
        );

        loadAllowedUsers();

    } catch (error) {

        console.error(error);

        setText(
            "settingsMessage",
            "User add नहीं हो सका।"
        );

    }

}


// =====================================================
// 36. SHOW ALLOWED USERS
// =====================================================

async function loadAllowedUsers() {

    const list =
        $("allowedUsersList");

    if (!list) {
        return;
    }

    const firebase =
        await loadFirebase();

    if (!firebase) {
        return;
    }

    const {
        collection,
        onSnapshot
    } = firebase.firestore;

    onSnapshot(
        collection(db, "allowedUsers"),
        function (snapshot) {

            list.innerHTML = "";

            snapshot.forEach(function (docSnap) {

                const data =
                    docSnap.data();

                const div =
                    document.createElement("div");

                div.textContent =
                    "👤 " +
                    (data.name || "") +
                    " - " +
                    (data.phone || "");

                list.appendChild(div);

            });

        }
    );

}


// =====================================================
// 37. RESET APP DATA
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const clearBtn =
        $("clearDataBtn");

    if (!clearBtn) {
        return;
    }

    clearBtn.type = "button";

    clearBtn.addEventListener(
        "click",
        function () {

            const confirmReset =
                confirm(
                    "क्या आप अपना local app data हटाना चाहते हैं?"
                );

            if (!confirmReset) {
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
                "studyCurrentUser"
            );

            localStorage.removeItem(
                "studyLanguage"
            );

            setText(
                "settingsMessage",
                "App data reset हो गया।"
            );

        }
    );

});


// =====================================================
// 38. LOAD SAVED SETTINGS
// =====================================================

function loadSavedSettings() {

    const dark =
        localStorage.getItem(
            "studyDarkMode"
        );

    if (dark === "true") {

        document.body.classList.add(
            "dark-mode"
        );

    }

    if (currentUser) {

        const photo =
            currentUser.profilePhoto;

        const preview =
            $("profilePhotoPreview");

        if (photo && preview) {

            preview.src = photo;

            preview.style.display =
                "block";

        }

    }

}


// =====================================================
// 39. SERVICE WORKER / PWA
// =====================================================

function registerServiceWorker() {

    if (
        "serviceWorker" in navigator
    ) {

        navigator.serviceWorker
            .register("service-worker.js")
            .then(function () {

                console.log(
                    "Service Worker registered."
                );

            })
            .catch(function (error) {

                console.error(
                    "Service Worker error:",
                    error
                );

            });

    }

}


// =====================================================
// 40. RESTORE USER
// =====================================================

function restoreUser() {

    try {

        const saved =
            localStorage.getItem(
                "studyCurrentUser"
            );

        if (!saved) {
            return;
        }

        const user =
            JSON.parse(saved);

        if (
            user &&
            user.name &&
            user.phone
        ) {

            currentUser = user;

        }

    } catch (error) {

        console.error(
            "Restore user error:",
            error
        );

    }

}


// =====================================================
// 41. INITIAL START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        restoreUser();

        registerServiceWorker();

        // Load groups after Firebase
        loadFirebase().then(
            function () {

                renderGroups();

            }
        );

    }
);


// =====================================================
// 42. PAGE EXIT
// =====================================================

window.addEventListener(
    "beforeunload",
    function () {

        if (unsubscribeChat) {
            unsubscribeChat();
        }

        if (unsubscribeOnline) {
            unsubscribeOnline();
        }

        if (unsubscribeGroupMessages) {
            unsubscribeGroupMessages();
        }

    }
);
