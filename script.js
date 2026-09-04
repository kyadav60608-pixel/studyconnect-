
import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   CONFIG
===================================================== */

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";

const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyiw3c3AUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};


/* =====================================================
   FIREBASE
===================================================== */

let db = null;
let firebasePromise = null;

async function loadFirebase() {

    if (db) {
        return db;
    }

    if (firebasePromise) {
        return firebasePromise;
    }

    firebasePromise = Promise.resolve().then(() => {

        const app = getApps().length
            ? getApp()
            : initializeApp(firebaseConfig);

        db = getFirestore(app);

        return db;

    });

    return firebasePromise;
}


/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null;
let pendingPhoto = "";

let selectedGroup = null;
let groupUnlocked = false;

let chatUnsubscribe = null;
let onlineUnsubscribe = null;
let groupsUnsubscribe = null;
let groupMessagesUnsubscribe = null;
let allowedUsersUnsubscribe = null;

let onlineTimer = null;

let appInitialized = false;
let chatStarted = false;
let groupsStarted = false;


/* =====================================================
   DOM HELPERS
===================================================== */

function $(id) {
    return document.getElementById(id);
}


function show(element) {

    if (!element) return;

    element.classList.remove("hidden");

    if (
        element.id === "passwordScreen" ||
        element.id === "contactOwnerScreen"
    ) {
        element.style.display = "flex";
    } else {
        element.style.display = "block";
    }
}


function hide(element) {

    if (!element) return;

    element.classList.add("hidden");
    element.style.display = "none";
}


function message(id, text, type = "") {

    const element = $(id);

    if (!element) return;

    element.textContent = text;

    element.className = type;
}


/* =====================================================
   LOGIN - STEP 1
===================================================== */

function setupPasswordLogin() {

    const button = $("unlockBtn");

    if (!button) return;

    button.addEventListener("click", () => {

        const password =
            $("appPassword")?.value.trim() || "";

        if (password !== SCHOOL_PASSWORD) {

            message(
                "passwordError",
                "Wrong password.",
                "error"
            );

            return;
        }

        message("passwordError", "");

        hide($("schoolPasswordStep"));
        show($("ownerStep"));

        if ($("ownerNameDisplay")) {
            $("ownerNameDisplay").textContent = OWNER_NAME;
        }

    });
}


/* =====================================================
   NEXT BUTTON
===================================================== */

function setupNextButton() {

    const button = $("ownerNextBtn");

    if (!button) return;

    button.addEventListener("click", () => {

        if ($("ownerNameDisplay")) {
            $("ownerNameDisplay").textContent = OWNER_NAME;
        }

        hide($("ownerStep"));
        show($("userDetailsStep"));

        $("openUserName")?.focus();

    });
}


/* =====================================================
   PROFILE PHOTO
===================================================== */

function setupProfilePhoto() {

    const input = $("profilePhotoInput");

    if (!input) return;

    input.addEventListener("change", () => {

        const file = input.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {

            message(
                "loginMessage",
                "Please select an image.",
                "error"
            );

            input.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            pendingPhoto = String(reader.result || "");

            const preview =
                $("profilePhotoPreview");

            if (preview) {
                preview.src = pendingPhoto;
                preview.style.display = "block";
            }

        };

        reader.readAsDataURL(file);

    });
}


/* =====================================================
   OWNER CONTACT
===================================================== */

function setupOwnerContact() {

    $("callOwnerBtn")?.addEventListener(
        "click",
        () => {
            window.location.href =
                `tel:${OWNER_PHONE}`;
        }
    );


    $("whatsappOwnerBtn")?.addEventListener(
        "click",
        () => {

            window.open(
                `https://wa.me/91${OWNER_PHONE}`,
                "_blank"
            );

        }
    );


    $("backToLoginBtn")?.addEventListener(
        "click",
        () => {

            hide($("contactOwnerScreen"));
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

            pendingPhoto = "";

            message("loginMessage", "");
            message("passwordError", "");

        }
    );
}


/* =====================================================
   USER LOGIN
===================================================== */

async function loginUser() {

    const name =
        $("openUserName")?.value.trim() || "";

    const phone =
        $("openUserPhone")?.value.trim() || "";

    if (!name) {

        message(
            "loginMessage",
            "Please enter your name.",
            "error"
        );

        return;
    }


    if (!/^\d{10}$/.test(phone)) {

        message(
            "loginMessage",
            "Please enter a valid 10 digit mobile number.",
            "error"
        );

        return;
    }


    const button = $("enterAppBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Checking...";
    }


    try {

        const firestore =
            await loadFirebase();

        const userRef =
            doc(
                firestore,
                "allowedUsers",
                phone
            );

        const userSnap =
            await getDoc(userRef);


        const isOwner =
            name.toLowerCase() ===
                OWNER_NAME.toLowerCase() &&
            phone === OWNER_PHONE;


        const isAllowed =
            userSnap.exists() || isOwner;


        if (!isAllowed) {

            hide($("passwordScreen"));
            show($("contactOwnerScreen"));

            return;
        }


        currentUser = {

            name: name,

            phone: phone,

            displayName: name,

            photo: pendingPhoto || "",

            isOwner: isOwner

        };


        localStorage.setItem(
            "studyCurrentUser",
            JSON.stringify(currentUser)
        );


        await finishLogin();

    }
    catch (error) {

        console.error(
            "Login error:",
            error
        );

        message(
            "loginMessage",
            "Firebase connection failed. Check internet and Firebase settings.",
            "error"
        );

    }
    finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Enter App";
        }

    }
}


/* =====================================================
   FINISH LOGIN
===================================================== */

async function finishLogin() {

    hide($("passwordScreen"));
    hide($("contactOwnerScreen"));

    show($("appContainer"));

    updateProfileUI();

    applySavedLanguage();
    applySavedTheme();

    await setupOnlinePresence();

    await startChatRealtime();

    await startGroupsRealtime();

    renderHomework();
    renderSchool();
    renderNotes();

}


/* =====================================================
   PROFILE UI
===================================================== */

function updateProfileUI() {

    if (!currentUser) return;


    const studentName =
        $("studentName");

    if (studentName) {

        studentName.textContent =
            currentUser.displayName ||
            currentUser.name;

    }


    const profile =
        $("currentUserProfile");

    if (!profile) return;

    profile.innerHTML = "";


    if (currentUser.photo) {

        const img =
            document.createElement("img");

        img.src = currentUser.photo;

        img.className =
            "profile-preview";

        profile.appendChild(img);

    }


    const text =
        document.createElement("p");

    text.textContent =
        `${currentUser.displayName || currentUser.name} • ${currentUser.phone}`;

    profile.appendChild(text);

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    $("menuBtn")?.addEventListener(
        "click",
        () => {

            $("navMenu")?.classList.toggle("open");

        }
    );


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const page =
                        button.dataset.page;

                    if (!page) return;


                    document
                        .querySelectorAll(".page")
                        .forEach(section => {

                            section.classList.remove(
                                "active"
                            );

                        });


                    const target = $(page);

                    if (target) {
                        target.classList.add("active");
                    }


                    $("navMenu")
                        ?.classList.remove("open");


                    if (page === "chat") {
                        await markChatAsRead();
                    }


                    if (page === "groups") {
                        await startGroupsRealtime();
                    }

                }
            );

        });

}


/* =====================================================
   HOME NAME
===================================================== */

function setupHomeName() {

    $("saveNameBtn")?.addEventListener(
        "click",
        () => {

            if (!currentUser) return;


            const input =
                $("saveNameInput");

            const name =
                input?.value.trim() || "";


            if (!name) {

                message(
                    "nameMessage",
                    "Enter a name.",
                    "error"
                );

                return;
            }


            currentUser.displayName = name;


            localStorage.setItem(
                "studyCurrentUser",
                JSON.stringify(currentUser)
            );


            updateProfileUI();


            message(
                "nameMessage",
                "Name saved.",
                "success"
            );

        }
    );

}


/* =====================================================
   ONLINE PRESENCE
===================================================== */

async function setupOnlinePresence() {

    if (!currentUser) return;


    const firestore =
        await loadFirebase();


    const onlineRef =
        doc(
            firestore,
            "onlineUsers",
            currentUser.phone
        );


    const updateOnline = async () => {

        if (!currentUser) return;

        try {

            await setDoc(
                onlineRef,
                {

                    name:
                        currentUser.displayName ||
                        currentUser.name,

                    phone:
                        currentUser.phone,

                    lastSeen:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );

        }
        catch (error) {

            console.error(
                "Online update:",
                error
            );

        }

    };


    await updateOnline();


    if (onlineTimer) {
        clearInterval(onlineTimer);
    }


    onlineTimer =
        setInterval(
            updateOnline,
            30000
        );


    if (!onlineUnsubscribe) {

        onlineUnsubscribe =
            onSnapshot(
                collection(
                    firestore,
                    "onlineUsers"
                ),

                snapshot => {

                    const now =
                        Date.now();

                    const users = [];


                    snapshot.forEach(item => {

                        const data =
                            item.data();

                        let lastSeen = 0;


                        if (
                            data.lastSeen &&
                            typeof data.lastSeen.toMillis ===
                                "function"
                        ) {

                            lastSeen =
                                data.lastSeen.toMillis();

                        }


                        if (
                            lastSeen &&
                            now - lastSeen < 90000
                        ) {

                            users.push(data);

                        }

                    });


                    if ($("onlineCount")) {

                        $("onlineCount").textContent =
                            String(users.length);

                    }


                    const container =
                        $("onlineUsers");

                    if (!container) return;


                    container.innerHTML = "";


                    users.forEach(user => {

                        const div =
                            document.createElement("div");

                        div.textContent =
                            `🟢 ${user.name || user.phone}`;

                        container.appendChild(div);

                    });

                },

                error => {

                    console.error(
                        "Online listener:",
                        error
                    );

                }

            );

    }

}


/* =====================================================
   ONLINE TOGGLE
===================================================== */

function setupOnlineToggle() {

    let online = true;


    $("onlineToggleBtn")?.addEventListener(
        "click",
        async () => {

            if (!currentUser) return;


            online = !online;


            const button =
                $("onlineToggleBtn");


            if (button) {

                button.textContent =
                    online
                        ? "Go Offline"
                        : "Go Online";

            }


            try {

                const firestore =
                    await loadFirebase();


                const ref =
                    doc(
                        firestore,
                        "onlineUsers",
                        currentUser.phone
                    );


                if (online) {

                    await setDoc(
                        ref,
                        {

                            name:
                                currentUser.displayName ||
                                currentUser.name,

                            phone:
                                currentUser.phone,

                            lastSeen:
                                serverTimestamp()

                        },
                        {
                            merge: true
                        }
                    );

                }
                else {

                    await deleteDoc(ref)
                        .catch(() => {});

                }

            }
            catch (error) {

                console.error(
                    "Online toggle:",
                    error
                );

            }

        }
    );


    $("onlineArrow")?.addEventListener(
        "click",
        () => {

            $("onlineUsers")
                ?.classList.toggle("hidden");

        }
    );

}


/* =====================================================
   CHAT REALTIME
===================================================== */

async function startChatRealtime() {

    if (chatStarted) return;

    chatStarted = true;


    const firestore =
        await loadFirebase();


    const messagesQuery =
        query(
            collection(
                firestore,
                "messages"
            ),
            orderBy(
                "createdAt",
                "asc"
            ),
            limit(100)
        );


    chatUnsubscribe =
        onSnapshot(
            messagesQuery,

            snapshot => {

                const container =
                    $("chatMessages");

                if (!container) return;


                container.innerHTML = "";


                snapshot.forEach(item => {

                    renderMessage(
                        container,
                        item.data(),
                        item.id
                    );

                });


                container.scrollTop =
                    container.scrollHeight;

            },

            error => {

                console.error(
                    "Chat:",
                    error
                );

            }
        );

}


/* =====================================================
   RENDER MESSAGE
===================================================== */

function renderMessage(
    container,
    data,
    id
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message";


    const isMine =
        currentUser &&
        data.senderPhone ===
            currentUser.phone;


    if (isMine) {
        wrapper.classList.add("mine");
    }


    const sender =
        document.createElement("strong");

    sender.textContent =
        data.senderName || "User";


    const text =
        document.createElement("div");

    text.textContent =
        data.text || "";


    const info =
        document.createElement("div");

    info.className =
        "message-info";


    let time = "";


    if (
        data.createdAt &&
        typeof data.createdAt.toDate ===
            "function"
    ) {

        time =
            data.createdAt
                .toDate()
                .toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

    }


    let ticks = "";


    if (isMine) {

        const readBy =
            Array.isArray(data.readBy)
                ? data.readBy
                : [];


        const someoneRead =
            readBy.some(
                phone =>
                    phone !==
                    currentUser.phone
            );


        ticks =
            someoneRead
                ? ` <span class="blue-tick">✓✓</span>`
                : " <span>✓✓</span>";

    }


    info.innerHTML =
        `${time}${ticks}`;


    wrapper.appendChild(sender);
    wrapper.appendChild(text);
    wrapper.appendChild(info);


    container.appendChild(wrapper);

}


/* =====================================================
   SEND CHAT MESSAGE
===================================================== */

async function sendChatMessage() {

    if (!currentUser) return;


    const input =
        $("messageInput");


    const text =
        input?.value.trim() || "";


    if (!text) return;


    const button =
        $("sendMessageBtn");


    if (button) {
        button.disabled = true;
    }


    try {

        const firestore =
            await loadFirebase();


        await addDoc(
            collection(
                firestore,
                "messages"
            ),
            {

                text: text,

                senderName:
                    currentUser.displayName ||
                    currentUser.name,

                senderPhone:
                    currentUser.phone,

                createdAt:
                    serverTimestamp(),

                readBy: [
                    currentUser.phone
                ]

            }
        );


        input.value = "";

    }
    catch (error) {

        console.error(
            "Send message:",
            error
        );

        alert(
            "Message send failed."
        );

    }
    finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =====================================================
   CHAT BUTTONS
===================================================== */

function setupChatButtons() {

    $("sendMessageBtn")?.addEventListener(
        "click",
        sendChatMessage
    );


    $("messageInput")?.addEventListener(
        "keydown",
        event => {

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
        () => {

            const input =
                $("messageInput");

            if (!input) return;

            input.value += "😊";
            input.focus();

        }
    );

}


/* =====================================================
   READ RECEIPTS
===================================================== */

async function markChatAsRead() {

    if (!currentUser) return;


    try {

        const firestore =
            await loadFirebase();


        const messagesQuery =
            query(
                collection(
                    firestore,
                    "messages"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(100)
            );


        const snapshot =
            await new Promise(
                (resolve, reject) => {

                    let unsubscribe;

                    unsubscribe =
                        onSnapshot(
                            messagesQuery,
                            snap => {

                                unsubscribe();
                                resolve(snap);

                            },
                            reject
                        );

                }
            );


        const updates = [];


        snapshot.forEach(item => {

            const data =
                item.data();


            if (
                data.senderPhone !==
                currentUser.phone
            ) {

                updates.push(
                    updateDoc(
                        doc(
                            firestore,
                            "messages",
                            item.id
                        ),
                        {

                            readBy:
                                arrayUnion(
                                    currentUser.phone
                                )

                        }
                    )
                );

            }

        });


        await Promise.all(updates);

    }
    catch (error) {

        console.error(
            "Read receipt:",
            error
        );

    }

}


/* =====================================================
   GROUPS REALTIME
===================================================== */

async function startGroupsRealtime() {

    if (!currentUser) return;


    if (groupsStarted) return;

    groupsStarted = true;


    const firestore =
        await loadFirebase();


    groupsUnsubscribe =
        onSnapshot(
            collection(
                firestore,
                "groups"
            ),

            snapshot => {

                const groups = [];


                snapshot.forEach(item => {

                    const data =
                        item.data();


                    const members =
                        Array.isArray(
                            data.members
                        )
                            ? data.members
                            : [];


                    const allowed =
                        data.ownerPhone ===
                            currentUser.phone ||

                        members.some(
                            member =>
                                member.phone ===
                                currentUser.phone
                        );


                    if (allowed) {

                        groups.push({

                            id: item.id,

                            ...data

                        });

                    }

                });


                renderGroups(groups);

            },

            error => {

                console.error(
                    "Groups:",
                    error
                );

            }

        );

}


/* =====================================================
   RENDER GROUPS
===================================================== */

function renderGroups(groups) {

    const container =
        $("groupList");

    if (!container) return;


    container.innerHTML = "";


    if (!groups.length) {

        const p =
            document.createElement("p");

        p.className = "muted";

        p.textContent =
            "No groups yet.";

        container.appendChild(p);

        return;

    }


    groups.forEach(group => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.textContent =
            `👥 ${group.name}`;


        button.addEventListener(
            "click",
            () => {

                openGroup(group);

            }
        );


        container.appendChild(button);

    });

}


/* =====================================================
   CREATE GROUP
===================================================== */

async function createGroup() {

    if (!currentUser) return;


    const name =
        $("groupInput")?.value.trim() || "";


    const password =
        $("groupPasswordInput")
            ?.value.trim() || "";


    if (!name) {

        alert(
            "Enter group name."
        );

        return;
    }


    if (!password) {

        alert(
            "Enter group password."
        );

        return;
    }


    try {

        const firestore =
            await loadFirebase();


        await addDoc(
            collection(
                firestore,
                "groups"
            ),
            {

                name: name,

                ownerName:
                    currentUser.displayName ||
                    currentUser.name,

                ownerPhone:
                    currentUser.phone,

                password: password,

                members: [

                    {

                        name:
                            currentUser.displayName ||
                            currentUser.name,

                        phone:
                            currentUser.phone

                    }

                ],

                createdAt:
                    serverTimestamp()

            }
        );


        $("groupInput").value = "";
        $("groupPasswordInput").value = "";


        alert(
            "Group created successfully."
        );

    }
    catch (error) {

        console.error(
            "Create group:",
            error
        );

        alert(
            "Group creation failed."
        );

    }

}


/* =====================================================
   OPEN GROUP
===================================================== */

function openGroup(group) {

    selectedGroup = group;

    groupUnlocked = false;


    show($("groupChatSection"));


    if ($("selectedGroupName")) {

        $("selectedGroupName").textContent =
            group.name || "Group";

    }


    if ($("selectedGroupOwner")) {

        $("selectedGroupOwner").textContent =
            `Owner: ${group.ownerName || group.ownerPhone}`;

    }


    show($("groupPasswordSection"));

    hide($("groupContent"));


    if ($("enterGroupPasswordInput")) {

        $("enterGroupPasswordInput").value = "";

    }


    message(
        "groupPasswordMessage",
        ""
    );


    renderMembers(
        Array.isArray(group.members)
            ? group.members
            : []
    );

}


/* =====================================================
   UNLOCK GROUP
===================================================== */

function unlockGroup() {

    if (!selectedGroup) return;


    const password =
        $("enterGroupPasswordInput")
            ?.value.trim() || "";


    if (
        password !==
        selectedGroup.password
    ) {

        message(
            "groupPasswordMessage",
            "Wrong group password.",
            "error"
        );

        return;
    }


    groupUnlocked = true;


    hide($("groupPasswordSection"));

    show($("groupContent"));


    renderMembers(
        Array.isArray(
            selectedGroup.members
        )
            ? selectedGroup.members
            : []
    );


    startGroupMessages();

}


/* =====================================================
   ADD GROUP MEMBER
===================================================== */

async function addGroupMember() {

    if (
        !selectedGroup ||
        !currentUser ||
        !groupUnlocked
    ) {
        return;
    }


    if (
        selectedGroup.ownerPhone !==
        currentUser.phone
    ) {

        alert(
            "Only the group creator can add members."
        );

        return;
    }


    const name =
        $("memberNameInput")
            ?.value.trim() || "";


    const phone =
        $("memberPhoneInput")
            ?.value.trim() || "";


    if (!name) {

        alert(
            "Enter member name."
        );

        return;
    }


    if (!/^\d{10}$/.test(phone)) {

        alert(
            "Enter valid 10 digit mobile number."
        );

        return;
    }


    const members =
        Array.isArray(
            selectedGroup.members
        )
            ? [...selectedGroup.members]
            : [];


    if (
        members.some(
            member =>
                member.phone === phone
        )
    ) {

        alert(
            "This member is already in the group."
        );

        return;
    }


    members.push({

        name: name,

        phone: phone

    });


    try {

        const firestore =
            await loadFirebase();


        await updateDoc(
            doc(
                firestore,
                "groups",
                selectedGroup.id
            ),
            {

                members: members

            }
        );


        selectedGroup.members =
            members;


        $("memberNameInput").value = "";
        $("memberPhoneInput").value = "";


        renderMembers(members);


        alert(
            "Member added successfully."
        );

    }
    catch (error) {

        console.error(
            "Add member:",
            error
        );

        alert(
            "Member could not be added."
        );

    }

}


/* =====================================================
   RENDER MEMBERS
===================================================== */

function renderMembers(members) {

    const container =
        $("memberList");

    if (!container) return;


    container.innerHTML = "";


    const heading =
        document.createElement("h4");

    heading.textContent =
        "Members";

    container.appendChild(heading);


    members.forEach(member => {

        const div =
            document.createElement("div");

        div.className =
            "list-item";


        div.textContent =
            `${member.name} • ${member.phone}`;


        container.appendChild(div);

    });

}


/* =====================================================
   GROUP MESSAGES
===================================================== */

async function startGroupMessages() {

    if (
        !selectedGroup ||
        !groupUnlocked ||
        !currentUser
    ) {
        return;
    }


    if (groupMessagesUnsubscribe) {

        groupMessagesUnsubscribe();

        groupMessagesUnsubscribe = null;

    }


    const firestore =
        await loadFirebase();


    const messagesRef =
        collection(
            firestore,
            "groups",
            selectedGroup.id,
            "messages"
        );


    const messagesQuery =
        query(
            messagesRef,
            orderBy(
                "createdAt",
                "asc"
            ),
            limit(100)
        );


    groupMessagesUnsubscribe =
        onSnapshot(
            messagesQuery,

            snapshot => {

                const container =
                    $("groupMessages");

                if (!container) return;


                container.innerHTML = "";


                snapshot.forEach(item => {

                    renderMessage(
                        container,
                        item.data(),
                        item.id
                    );

                });


                container.scrollTop =
                    container.scrollHeight;

            },

            error => {

                console.error(
                    "Group messages:",
                    error
                );

            }

        );

}


/* =====================================================
   SEND GROUP MESSAGE
===================================================== */

async function sendGroupMessage() {

    if (
        !selectedGroup ||
        !groupUnlocked ||
        !currentUser
    ) {
        return;
    }


    const input =
        $("groupMessageInput");


    const text =
        input?.value.trim() || "";


    if (!text) return;


    const button =
        $("sendGroupMessageBtn");


    if (button) {
        button.disabled = true;
    }


    try {

        const firestore =
            await loadFirebase();


        await addDoc(
            collection(
                firestore,
                "groups",
                selectedGroup.id,
                "messages"
            ),
            {

                text: text,

                senderName:
                    currentUser.displayName ||
                    currentUser.name,

                senderPhone:
                    currentUser.phone,

                createdAt:
                    serverTimestamp(),

                readBy: [
                    currentUser.phone
                ]

            }
        );


        input.value = "";

    }
    catch (error) {

        console.error(
            "Group message:",
            error
        );

        alert(
            "Group message failed."
        );

    }
    finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =====================================================
   GROUP BUTTONS
===================================================== */

function setupGroupButtons() {

    $("createGroupBtn")?.addEventListener(
        "click",
        createGroup
    );


    $("unlockGroupBtn")?.addEventListener(
        "click",
        unlockGroup
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
        event => {

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


/* =====================================================
   HOMEWORK
===================================================== */

function getHomework() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );

    }
    catch {

        return [];

    }

}


function saveHomeworkData(data) {

    localStorage.setItem(
        "studyHomework",
        JSON.stringify(data)
    );

}


function setupHomework() {

    $("addHomeworkBtn")?.addEventListener(
        "click",
        () => {

            const item = {

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


            const data =
                getHomework();


            data.push(item);


            saveHomeworkData(data);


            renderHomework();

        }
    );

}


function renderHomework() {

    const container =
        $("homeworkList");

    if (!container) return;


    container.innerHTML = "";


    getHomework().forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "list-item";


        div.innerHTML = `

            <strong>Date:</strong>
            ${escapeHtml(item.date)}

            <br>

            <strong>Hindi:</strong>
            ${escapeHtml(item.hindi)}

            <br>

            <strong>English:</strong>
            ${escapeHtml(item.english)}

            <br>

            <strong>Math:</strong>
            ${escapeHtml(item.math)}

            <br>

            <strong>Science:</strong>
            ${escapeHtml(item.science)}

            <br>

            <strong>SST:</strong>
            ${escapeHtml(item.sst)}

            <br>

            <strong>Computer:</strong>
            ${escapeHtml(item.computer)}

            <br>

            <strong>Art:</strong>
            ${escapeHtml(item.art)}

        `;


        container.appendChild(div);

    });

}


/* =====================================================
   SCHOOL
===================================================== */

function getSchoolUpdates() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "studySchool"
            ) || "[]"
        );

    }
    catch {

        return [];

    }

}


function renderSchool() {

    const container =
        $("schoolList");

    if (!container) return;


    container.innerHTML = "";


    getSchoolUpdates().forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "list-item";

        div.textContent =
            item;

        container.appendChild(div);

    });

}


function setupSchool() {

    $("saveSchoolBtn")?.addEventListener(
        "click",
        () => {

            const text =
                $("schoolInput")
                    ?.value.trim() || "";


            if (!text) return;


            const data =
                getSchoolUpdates();


            data.push(text);


            localStorage.setItem(
                "studySchool",
                JSON.stringify(data)
            );


            $("schoolInput").value = "";


            renderSchool();

        }
    );

}


/* =====================================================
   NOTES
===================================================== */

function getNotes() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "studyNotes"
            ) || "[]"
        );

    }
    catch {

        return [];

    }

}


function renderNotes() {

    const container =
        $("notesList");

    if (!container) return;


    container.innerHTML = "";


    getNotes().forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "list-item";

        div.textContent =
            item;

        container.appendChild(div);

    });

}


function setupNotes() {

    $("saveNoteBtn")?.addEventListener(
        "click",
        () => {

            const text =
                $("noteInput")
                    ?.value.trim() || "";


            if (!text) return;


            const data =
                getNotes();


            data.push(text);


            localStorage.setItem(
                "studyNotes",
                JSON.stringify(data)
            );


            $("noteInput").value = "";


            renderNotes();

        }
    );

}


/* =====================================================
   CHANGE NAME
===================================================== */

function setupChangeName() {

    $("changeNameBtn")?.addEventListener(
        "click",
        () => {

            if (!currentUser) return;


            const name =
                $("changeNameInput")
                    ?.value.trim() || "";


            if (!name) {

                message(
                    "changeNameMessage",
                    "Enter a name.",
                    "error"
                );

                return;
            }


            currentUser.displayName =
                name;


            localStorage.setItem(
                "studyCurrentUser",
                JSON.stringify(currentUser)
            );


            updateProfileUI();


            message(
                "changeNameMessage",
                "Name changed.",
                "success"
            );

        }
    );

}


/* =====================================================
   LANGUAGE
===================================================== */

const translations = {

    en: {

        home: "Home",
        chat: "Chat",
        groups: "Groups",
        homework: "Homework",
        school: "School",
        notes: "Notes",
        settings: "Settings"

    },

    hi: {

        home: "होम",
        chat: "चैट",
        groups: "ग्रुप",
        homework: "होमवर्क",
        school: "स्कूल",
        notes: "नोट्स",
        settings: "सेटिंग्स"

    }

};


function applyLanguage(language) {

    const data =
        translations[language] ||
        translations.en;


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(element => {

            const key =
                element.dataset.i18n;


            if (data[key]) {

                element.textContent =
                    data[key];

            }

        });


    document.documentElement.lang =
        language === "hi"
            ? "hi"
            : "en";


    localStorage.setItem(
        "studyLanguage",
        language
    );


    message(
        "languageMessage",
        language === "hi"
            ? "भाषा हिन्दी कर दी गई है।"
            : "Language changed to English.",
        "success"
    );

}


function applySavedLanguage() {

    const language =
        localStorage.getItem(
            "studyLanguage"
        ) || "en";


    applyLanguage(language);

}


function setupLanguage() {

    $("hindiLanguageBtn")?.addEventListener(
        "click",
        () => {

            applyLanguage("hi");

        }
    );


    $("englishLanguageBtn")?.addEventListener(
        "click",
        () => {

            applyLanguage("en");

        }
    );

}


/* =====================================================
   THEME
===================================================== */

function applySavedTheme() {

    const dark =
        localStorage.getItem(
            "studyDarkMode"
        ) === "true";


    document.body.classList.toggle(
        "dark",
        dark
    );


    if ($("themeBtn")) {

        $("themeBtn").textContent =
            dark
                ? "Light Mode"
                : "Dark Mode";

    }

}


function setupTheme() {

    $("themeBtn")?.addEventListener(
        "click",
        () => {

            const dark =
                !document.body.classList.contains(
                    "dark"
                );


            document.body.classList.toggle(
                "dark",
                dark
            );


            localStorage.setItem(
                "studyDarkMode",
                String(dark)
            );


            $("themeBtn").textContent =
                dark
                    ? "Light Mode"
                    : "Dark Mode";

        }
    );

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

function setupNotifications() {

    $("notificationBtn")?.addEventListener(
        "click",
        async () => {

            if (
                !("Notification" in window)
            ) {

                message(
                    "notificationMessage",
                    "Notifications are not supported.",
                    "error"
                );

                return;
            }


            try {

                const permission =
                    await Notification.requestPermission();


                if (
                    permission === "granted"
                ) {

                    new Notification(
                        "StudyConnect",
                        {
                            body:
                                "Notifications are enabled."
                        }
                    );


                    message(
                        "notificationMessage",
                        "Notifications enabled.",
                        "success"
                    );

                }
                else {

                    message(
                        "notificationMessage",
                        "Notification permission was not granted.",
                        "error"
                    );

                }

            }
            catch (error) {

                console.error(
                    "Notification:",
                    error
                );


                message(
                    "notificationMessage",
                    "Could not enable notifications.",
                    "error"
                );

            }

        }
    );

}


/* =====================================================
   OWNER PANEL
===================================================== */

function setupOwnerPanel() {

    $("ownerLoginBtn")?.addEventListener(
        "click",
        async () => {

            const password =
                $("ownerPasswordInput")
                    ?.value.trim() || "";


            if (
                password !==
                OWNER_PASSWORD
            ) {

                message(
                    "ownerPasswordMessage",
                    "Wrong owner password.",
                    "error"
                );


                hide($("ownerPanel"));

                return;

            }


            show($("ownerPanel"));


            message(
                "ownerPasswordMessage",
                "Owner login successful.",
                "success"
            );


            await loadAllowedUsers();

        }
    );


    $("allowUserBtn")?.addEventListener(
        "click",
        allowUser
    );

}


/* =====================================================
   ALLOW USER
===================================================== */

async function allowUser() {

    const name =
        $("allowedUserNameInput")
            ?.value.trim() || "";


    const phone =
        $("allowedUserPhoneInput")
            ?.value.trim() || "";


    if (!name) {

        alert(
            "Enter user name."
        );

        return;
    }


    if (!/^\d{10}$/.test(phone)) {

        alert(
            "Enter valid 10 digit mobile."
        );

        return;
    }


    try {

        const firestore =
            await loadFirebase();


        await setDoc(
            doc(
                firestore,
                "allowedUsers",
                phone
            ),
            {

                name: name,

                phone: phone,

                addedAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


        $("allowedUserNameInput").value = "";
        $("allowedUserPhoneInput").value = "";


        alert(
            "User allowed successfully."
        );

    }
    catch (error) {

        console.error(
            "Allow user:",
            error
        );


        alert(
            "Could not allow user."
        );

    }

}


/* =====================================================
   ALLOWED USERS
===================================================== */

async function loadAllowedUsers() {

    if (allowedUsersUnsubscribe) {

        allowedUsersUnsubscribe();

        allowedUsersUnsubscribe = null;

    }


    const firestore =
        await loadFirebase();


    allowedUsersUnsubscribe =
        onSnapshot(
            collection(
                firestore,
                "allowedUsers"
            ),

            snapshot => {

                const container =
                    $("allowedUsersList");

                if (!container) return;


                container.innerHTML = "";


                const heading =
                    document.createElement("h4");

                heading.textContent =
                    "Allowed Users";

                container.appendChild(
                    heading
                );


                snapshot.forEach(item => {

                    const data =
                        item.data();


                    const div =
                        document.createElement("div");

                    div.className =
                        "list-item";


                    div.textContent =
                        `${data.name || ""} • ${data.phone || item.id}`;


                    container.appendChild(div);

                });

            },

            error => {

                console.error(
                    "Allowed users:",
                    error
                );

            }

        );

}


/* =====================================================
   RESET APP DATA
===================================================== */

function setupClearData() {

    $("clearDataBtn")?.addEventListener(
        "click",
        () => {

            const confirmReset =
                window.confirm(
                    "Are you sure you want to reset local app data?"
                );


            if (!confirmReset) return;


            localStorage.removeItem(
                "studyHomework"
            );

            localStorage.removeItem(
                "studySchool"
            );

            localStorage.removeItem(
                "studyNotes"
            );

            localStorage.removeItem(
                "studyDarkMode"
            );

            localStorage.removeItem(
                "studyLanguage"
            );

            localStorage.removeItem(
                "studyCurrentUser"
            );


            location.reload();

        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =====================================================
   LOAD SAVED USER
===================================================== */

async function loadSavedUser() {

    const saved =
        localStorage.getItem(
            "studyCurrentUser"
        );


    if (!saved) {
        return false;
    }


    try {

        const user =
            JSON.parse(saved);


        if (
            !user ||
            !user.name ||
            !user.phone
        ) {

            localStorage.removeItem(
                "studyCurrentUser"
            );

            return false;

        }


        const firestore =
            await loadFirebase();


        const userRef =
            doc(
                firestore,
                "allowedUsers",
                user.phone
            );


        const snap =
            await getDoc(userRef);


        const isOwner =
            user.name.toLowerCase() ===
                OWNER_NAME.toLowerCase() &&
            user.phone === OWNER_PHONE;


        if (
            !snap.exists() &&
            !isOwner
        ) {

            localStorage.removeItem(
                "studyCurrentUser"
            );

            return false;

        }


        currentUser = {

            ...user,

            isOwner: isOwner

        };


        return true;

    }
    catch (error) {

        console.error(
            "Saved user:",
            error
        );


        localStorage.removeItem(
            "studyCurrentUser"
        );


        return false;

    }

}


/* =====================================================
   SERVICE WORKER / PWA
===================================================== */

async function registerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {
        return;
    }


    try {

        await navigator.serviceWorker.register(
            "service-worker.js"
        );

        console.log(
            "Service Worker registered."
        );

    }
    catch (error) {

        console.error(
            "Service Worker:",
            error
        );

    }

}


/* =====================================================
   INITIALIZATION
===================================================== */

async function initializeAppUI() {

    if (appInitialized) return;

    appInitialized = true;


    setupPasswordLogin();

    setupNextButton();

    setupProfilePhoto();

    setupOwnerContact();

    setupNavigation();

    setupHomeName();

    setupOnlineToggle();

    setupChatButtons();

    setupGroupButtons();

    setupHomework();

    setupSchool();

    setupNotes();

    setupChangeName();

    setupLanguage();

    setupTheme();

    setupNotifications();

    setupOwnerPanel();

    setupClearData();


    const loggedIn =
        await loadSavedUser();


    if (loggedIn) {

        await finishLogin();

    }


    registerServiceWorker();

}


/* =====================================================
   ENTER APP BUTTON
===================================================== */

$("enterAppBtn")?.addEventListener(
    "click",
    loginUser
);


/* =====================================================
   START APP
===================================================== */

initializeAppUI()
    .catch(error => {

        console.error(
            "StudyConnect startup error:",
            error
        );

    });
