// ============================================================
// STUDYCONNECT - COMPLETE SCRIPT.JS
// ============================================================

// ---------- FIREBASE IMPORTS ----------
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    where
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// 1. FIREBASE CONFIG
// ============================================================
// अपने पुराने script.js में जो firebaseConfig था,
// वही यहाँ पूरा रख दें।

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);


// ============================================================
// 2. BASIC SETTINGS
// ============================================================

const SCHOOL_PASSWORD = "123";
const OWNER_PASSWORD = "12341";

const OWNER_NAME = "Krishna Yadav";
const OWNER_PHONE = "8738084554";

let currentUser = {
    name: "",
    phone: "",
    photo: ""
};

let currentChatUnsubscribe = null;
let currentGroupUnsubscribe = null;
let onlineUnsubscribe = null;
let selectedGroup = null;


// ============================================================
// 3. HELPER FUNCTIONS
// ============================================================

function $(id) {
    return document.getElementById(id);
}

function showElement(id) {
    const el = $(id);
    if (!el) return;

    el.hidden = false;
    el.style.display = "";
}

function hideElement(id) {
    const el = $(id);
    if (!el) return;

    el.hidden = true;
    el.style.display = "none";
}

function setMessage(id, text, type = "") {
    const el = $(id);
    if (!el) return;

    el.textContent = text;
    el.className = type;
}

function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "");
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function formatTime(timestamp) {
    if (!timestamp) return "";

    let date;

    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}


// ============================================================
// 4. LOGIN SCREEN
// ============================================================

function resetLoginScreen() {
    hideElement("contactOwnerScreen");

    showElement("passwordScreen");

    showElement("schoolPasswordStep");
    hideElement("ownerStep");
    hideElement("userDetailsStep");

    if ($("appPassword")) $("appPassword").value = "";

    if ($("openUserName")) $("openUserName").value = "";
    if ($("openUserPhone")) $("openUserPhone").value = "";

    setMessage("passwordError", "");
}


// ---------- SCHOOL PASSWORD ----------

if ($("unlockBtn")) {
    $("unlockBtn").addEventListener("click", () => {

        const password = $("appPassword")?.value.trim();

        if (password !== SCHOOL_PASSWORD) {
            setMessage(
                "passwordError",
                "गलत पासवर्ड। कृपया सही पासवर्ड डालें।"
            );
            return;
        }

        setMessage("passwordError", "");

        hideElement("schoolPasswordStep");
        showElement("ownerStep");
    });
}


// ============================================================
// 5. OWNER NAME SCREEN
// ============================================================

if ($("ownerNameDisplay")) {
    $("ownerNameDisplay").textContent = OWNER_NAME;
}

if ($("ownerNextBtn")) {
    $("ownerNextBtn").addEventListener("click", () => {

        hideElement("ownerStep");
        showElement("userDetailsStep");

        setMessage("passwordError", "");
    });
}


// ============================================================
// 6. PROFILE PHOTO
// ============================================================

if ($("profilePhotoInput")) {

    $("profilePhotoInput").addEventListener("change", function () {

        const file = this.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (event) {

            currentUser.photo = event.target.result;

            if ($("profilePhotoPreview")) {
                $("profilePhotoPreview").src = event.target.result;
                $("profilePhotoPreview").style.display = "block";
            }
        };

        reader.readAsDataURL(file);
    });
}


// ============================================================
// 7. ENTER APP
// ============================================================

if ($("enterAppBtn")) {

    $("enterAppBtn").addEventListener("click", loginUser);
}


async function loginUser() {

    const name = $("openUserName")?.value.trim();
    const phone = cleanPhone($("openUserPhone")?.value);

    if (!name || !phone) {

        setMessage(
            "passwordError",
            "कृपया अपना नाम और मोबाइल नंबर भरें।"
        );

        return;
    }


    // --------------------------------------------------------
    // OWNER DIRECT LOGIN
    // --------------------------------------------------------

    if (
        name.toLowerCase() === OWNER_NAME.toLowerCase() &&
        phone === OWNER_PHONE
    ) {

        currentUser = {
            name: OWNER_NAME,
            phone: OWNER_PHONE,
            photo: currentUser.photo || ""
        };

        localStorage.setItem(
            "studyConnectUser",
            JSON.stringify(currentUser)
        );

        openMainApp();
        return;
    }


    // --------------------------------------------------------
    // OTHER USERS - FIREBASE ALLOWED USERS CHECK
    // --------------------------------------------------------

    try {

        const userRef = doc(db, "allowedUsers", phone);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            showContactOwner();

            return;
        }

        const userData = userSnap.data();

        const savedName =
            String(userData.name || "").trim().toLowerCase();

        if (savedName !== name.toLowerCase()) {

            showContactOwner();

            return;
        }


        currentUser = {
            name: name,
            phone: phone,
            photo: currentUser.photo || userData.photo || ""
        };


        localStorage.setItem(
            "studyConnectUser",
            JSON.stringify(currentUser)
        );


        openMainApp();

    } catch (error) {

        console.error(error);

        setMessage(
            "passwordError",
            "Firebase से संपर्क नहीं हो पाया। इंटरनेट और Firebase Config जाँचें।"
        );
    }
}


// ============================================================
// 8. CONTACT OWNER SCREEN
// ============================================================

function showContactOwner() {

    hideElement("passwordScreen");
    showElement("contactOwnerScreen");

    if ($("contactOwnerTitle")) {
        $("contactOwnerTitle").textContent =
            "Owner से संपर्क करें";
    }

    if ($("contactOwnerText")) {
        $("contactOwnerText").textContent =
            "आपका नाम और मोबाइल नंबर Allowed Users में नहीं है।";
    }
}


// ---------- CALL OWNER ----------

if ($("callOwnerBtn")) {

    $("callOwnerBtn").addEventListener("click", () => {

        window.location.href = `tel:${OWNER_PHONE}`;

    });
}


// ---------- WHATSAPP OWNER ----------

if ($("whatsappOwnerBtn")) {

    $("whatsappOwnerBtn").addEventListener("click", () => {

        window.open(
            `https://wa.me/91${OWNER_PHONE}`,
            "_blank"
        );

    });
}


// ============================================================
// 9. IMPORTANT: BACK BUTTON FIX
// ============================================================

if ($("backToLoginBtn")) {

    $("backToLoginBtn").addEventListener("click", () => {

        // Contact screen बंद
        hideElement("contactOwnerScreen");

        // Login screen वापस
        showElement("passwordScreen");

        // केवल password वाला पहला step दिखे
        showElement("schoolPasswordStep");

        hideElement("ownerStep");
        hideElement("userDetailsStep");

        // पुरानी values साफ
        if ($("appPassword")) {
            $("appPassword").value = "";
        }

        if ($("openUserName")) {
            $("openUserName").value = "";
        }

        if ($("openUserPhone")) {
            $("openUserPhone").value = "";
        }

        setMessage("passwordError", "");

    });
}


// ============================================================
// 10. OPEN MAIN APP
// ============================================================

function openMainApp() {

    hideElement("passwordScreen");
    hideElement("contactOwnerScreen");

    showElement("appContainer");

    if ($("studentName")) {
        $("studentName").value = currentUser.name;
    }

    if ($("currentUserProfile")) {

        $("currentUserProfile").textContent =
            currentUser.name;
    }

    startChatListener();
    startOnlineSystem();
    loadGroups();

}


// ============================================================
// 11. NAVIGATION
// ============================================================

const pages = [
    "home",
    "chat",
    "groups",
    "homework",
    "school",
    "notes",
    "settings"
];

function showPage(pageName) {

    pages.forEach(page => {

        const pageElement = $(page);

        if (!pageElement) return;

        if (page === pageName) {
            pageElement.style.display = "";
            pageElement.hidden = false;
        } else {
            pageElement.style.display = "none";
            pageElement.hidden = true;
        }
    });

    if ($("navMenu")) {
        $("navMenu").classList.remove("open");
    }
}


document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        const page = button.dataset.page;

        if (page) {
            showPage(page);
        }

    });

});


// ---------- MENU ----------

if ($("menuBtn")) {

    $("menuBtn").addEventListener("click", () => {

        if ($("navMenu")) {
            $("navMenu").classList.toggle("open");
        }

    });
}


// ============================================================
// 12. SAVE NAME
// ============================================================

if ($("saveNameBtn")) {

    $("saveNameBtn").addEventListener("click", async () => {

        const name = $("studentName")?.value.trim();

        if (!name) {

            setMessage(
                "nameMessage",
                "कृपया अपना नाम लिखें।"
            );

            return;
        }

        currentUser.name = name;

        localStorage.setItem(
            "studyConnectUser",
            JSON.stringify(currentUser)
        );

        setMessage(
            "nameMessage",
            "नाम सेव हो गया।"
        );

        if ($("currentUserProfile")) {
            $("currentUserProfile").textContent = name;
        }

    });
}


// ============================================================
// 13. REAL-TIME CHAT
// ============================================================

function startChatListener() {

    if (currentChatUnsubscribe) {
        currentChatUnsubscribe();
    }

    const chatRef = collection(db, "messages");

    const chatQuery = query(
        chatRef,
        orderBy("createdAt", "asc")
    );

    currentChatUnsubscribe = onSnapshot(
        chatQuery,
        snapshot => {

            const container = $("chatMessages");

            if (!container) return;

            container.innerHTML = "";

            snapshot.forEach(messageDoc => {

                const message = messageDoc.data();

                renderMessage(
                    container,
                    messageDoc.id,
                    message
                );

            });

            container.scrollTop =
                container.scrollHeight;

            markChatAsRead(snapshot);

        },
        error => {

            console.error(
                "Chat listener error:",
                error
            );

        }
    );
}


function renderMessage(container, id, message) {

    const wrapper =
        document.createElement("div");

    const isMine =
        cleanPhone(message.senderPhone) ===
        cleanPhone(currentUser.phone);

    wrapper.className =
        isMine ? "message mine" : "message other";


    const sender =
        escapeHTML(message.senderName || "User");

    const text =
        escapeHTML(message.text || "");

    const time =
        formatTime(message.createdAt);


    let tick = "";

    if (isMine) {

        if (message.seenBy &&
            message.seenBy.length > 1) {

            tick = "✓✓";

        } else if (message.delivered) {

            tick = "✓✓";

        } else {

            tick = "✓";

        }
    }


    wrapper.innerHTML = `
        <div class="message-sender">
            ${sender}
        </div>

        <div class="message-text">
            ${text}
        </div>

        <div class="message-meta">
            ${time}
            <span class="message-tick">
                ${tick}
            </span>
        </div>
    `;


    container.appendChild(wrapper);
}


// ============================================================
// 14. SEND CHAT MESSAGE
// ============================================================

if ($("sendMessageBtn")) {

    $("sendMessageBtn").addEventListener(
        "click",
        sendMessage
    );
}


if ($("messageInput")) {

    $("messageInput").addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


async function sendMessage() {

    const input = $("messageInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;


    try {

        await addDoc(
            collection(db, "messages"),
            {
                text: text,
                senderName: currentUser.name,
                senderPhone: currentUser.phone,
                createdAt: serverTimestamp(),
                delivered: true,
                seenBy: [currentUser.phone]
            }
        );

        input.value = "";

    } catch (error) {

        console.error(
            "Message send error:",
            error
        );

    }
}


// ============================================================
// 15. MARK CHAT AS READ
// ============================================================

async function markChatAsRead(snapshot) {

    for (const messageDoc of snapshot.docs) {

        const data = messageDoc.data();

        if (
            cleanPhone(data.senderPhone) ===
            cleanPhone(currentUser.phone)
        ) {
            continue;
        }

        const seenBy =
            Array.isArray(data.seenBy)
                ? [...data.seenBy]
                : [];

        if (
            !seenBy.includes(currentUser.phone)
        ) {

            seenBy.push(currentUser.phone);

            try {

                await updateDoc(
                    doc(
                        db,
                        "messages",
                        messageDoc.id
                    ),
                    {
                        seenBy: seenBy,
                        delivered: true
                    }
                );

            } catch (error) {

                console.error(error);

            }
        }
    }
}


// ============================================================
// 16. ONLINE SYSTEM
// ============================================================

let onlineInterval = null;

function startOnlineSystem() {

    if (!currentUser.phone) return;


    const onlineRef =
        doc(
            db,
            "onlineUsers",
            currentUser.phone
        );


    const updateOnline = async () => {

        try {

            await setDoc(
                onlineRef,
                {
                    name: currentUser.name,
                    phone: currentUser.phone,
                    photo: currentUser.photo || "",
                    lastSeen: serverTimestamp()
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
    };


    updateOnline();

    if (onlineInterval) {
        clearInterval(onlineInterval);
    }

    onlineInterval =
        setInterval(
            updateOnline,
            30000
        );


    listenOnlineUsers();
}


function listenOnlineUsers() {

    if (onlineUnsubscribe) {
        onlineUnsubscribe();
    }


    const onlineRef =
        collection(db, "onlineUsers");


    onlineUnsubscribe =
        onSnapshot(
            onlineRef,
            snapshot => {

                const users = [];

                const now =
                    Date.now();


                snapshot.forEach(
                    userDoc => {

                        const user =
                            userDoc.data();

                        let lastSeenTime = 0;

                        if (user.lastSeen?.toDate) {
                            lastSeenTime =
                                user.lastSeen
                                    .toDate()
                                    .getTime();
                        }


                        // पिछले 90 सेकंड में active
                        if (
                            now -
                            lastSeenTime
                            <
                            90000
                        ) {

                            users.push(user);

                        }

                    }
                );


                updateOnlineUI(users);

            }
        );
}


function updateOnlineUI(users) {

    if ($("onlineCount")) {

        $("onlineCount").textContent =
            users.length;
    }


    const list =
        $("onlineUsers");

    if (!list) return;

    list.innerHTML = "";


    users.forEach(user => {

        const item =
            document.createElement("div");

        item.className =
            "online-user";

        item.textContent =
            user.name || "User";

        list.appendChild(item);

    });
}


// ---------- ONLINE ARROW ----------

if ($("onlineArrow")) {

    $("onlineArrow").addEventListener(
        "click",
        () => {

            if ($("onlineUsers")) {

                $("onlineUsers").classList.toggle(
                    "show"
                );

            }

        }
    );
}


if ($("onlineToggleBtn")) {

    $("onlineToggleBtn").addEventListener(
        "click",
        () => {

            if ($("onlineUsers")) {

                $("onlineUsers").classList.toggle(
                    "show"
                );

            }

        }
    );
}


// ============================================================
// 17. GROUPS
// ============================================================

if ($("createGroupBtn")) {

    $("createGroupBtn").addEventListener(
        "click",
        createGroup
    );
}


async function createGroup() {

    const name =
        $("groupInput")?.value.trim();

    const password =
        $("groupPasswordInput")?.value.trim();


    if (!name || !password) {

        alert(
            "Group name और password दोनों भरें।"
        );

        return;
    }


    try {

        const groupDoc =
            await addDoc(
                collection(db, "groups"),
                {
                    name: name,
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


        await setDoc(
            doc(
                db,
                "groups",
                groupDoc.id,
                "members",
                currentUser.phone
            ),
            {
                name: currentUser.name,
                phone: currentUser.phone,
                addedAt: serverTimestamp()
            }
        );


        $("groupInput").value = "";
        $("groupPasswordInput").value = "";

        alert("Group बन गया।");

    } catch (error) {

        console.error(error);

        alert(
            "Group बनाने में समस्या हुई।"
        );

    }
}


// ============================================================
// 18. LOAD GROUPS
// ============================================================

function loadGroups() {

    const groupsRef =
        collection(db, "groups");


    onSnapshot(
        groupsRef,
        snapshot => {

            const list =
                $("groupList");

            if (!list) return;

            list.innerHTML = "";


            snapshot.forEach(
                groupDoc => {

                    const group =
                        groupDoc.data();

                    const members =
                        Array.isArray(group.members)
                            ? group.members
                            : [];


                    const isMember =
                        members.some(
                            member =>
                                cleanPhone(
                                    member.phone
                                ) ===
                                cleanPhone(
                                    currentUser.phone
                                )
                        );


                    if (!isMember) return;


                    const button =
                        document.createElement("button");

                    button.type = "button";

                    button.textContent =
                        group.name;

                    button.addEventListener(
                        "click",
                        () => {

                            openGroup(
                                groupDoc.id,
                                group
                            );

                        }
                    );


                    list.appendChild(button);

                }
            );

        }
    );
}


// ============================================================
// 19. OPEN GROUP
// ============================================================

function openGroup(groupId, group) {

    selectedGroup = {
        id: groupId,
        ...group
    };


    showElement("groupChatSection");

    hideElement("groupContent");

    showElement("groupPasswordSection");


    if ($("selectedGroupName")) {
        $("selectedGroupName").textContent =
            group.name;
    }


    if ($("selectedGroupOwner")) {

        $("selectedGroupOwner").textContent =
            `Owner: ${group.ownerName}`;
    }


    if ($("enterGroupPasswordInput")) {
        $("enterGroupPasswordInput").value = "";
    }

    setMessage(
        "groupPasswordMessage",
        ""
    );
}


// ============================================================
// 20. UNLOCK GROUP
// ============================================================

if ($("unlockGroupBtn")) {

    $("unlockGroupBtn").addEventListener(
        "click",
        () => {

            if (!selectedGroup) return;


            const password =
                $("enterGroupPasswordInput")
                    ?.value.trim();


            if (
                password !==
                selectedGroup.password
            ) {

                setMessage(
                    "groupPasswordMessage",
                    "गलत Group Password।"
                );

                return;
            }


            setMessage(
                "groupPasswordMessage",
                ""
            );


            hideElement(
                "groupPasswordSection"
            );

            showElement(
                "groupContent"
            );


            showGroupMembers();

            startGroupMessages(
                selectedGroup.id
            );

        }
    );
}


// ============================================================
// 21. GROUP MEMBERS
// ============================================================

function showGroupMembers() {

    const list =
        $("memberList");

    if (!list || !selectedGroup) return;

    list.innerHTML = "";


    const members =
        Array.isArray(selectedGroup.members)
            ? selectedGroup.members
            : [];


    members.forEach(member => {

        const item =
            document.createElement("div");

        item.textContent =
            `${member.name} - ${member.phone}`;

        list.appendChild(item);

    });
}


// ============================================================
// 22. ADD GROUP MEMBER
// ============================================================

if ($("addMemberBtn")) {

    $("addMemberBtn").addEventListener(
        "click",
        addGroupMember
    );
}


async function addGroupMember() {

    if (!selectedGroup) return;


    const name =
        $("memberNameInput")?.value.trim();

    const phone =
        cleanPhone(
            $("memberPhoneInput")?.value
        );


    if (!name || !phone) {

        alert(
            "Member का नाम और मोबाइल नंबर भरें।"
        );

        return;
    }


    if (
        cleanPhone(
            selectedGroup.ownerPhone
        ) !==
        cleanPhone(
            currentUser.phone
        )
    ) {

        alert(
            "सिर्फ Group Owner member जोड़ सकता है।"
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

        const allowedSnap =
            await getDoc(allowedRef);


        if (!allowedSnap.exists()) {

            alert(
                "यह user Allowed Users में नहीं है।"
            );

            return;
        }


        const allowedData =
            allowedSnap.data();


        if (
            String(
                allowedData.name || ""
            ).toLowerCase()
            !==
            name.toLowerCase()
        ) {

            alert(
                "नाम और मोबाइल नंबर match नहीं करते।"
            );

            return;
        }


        const members =
            Array.isArray(
                selectedGroup.members
            )
                ? [...selectedGroup.members]
                : [];


        const alreadyMember =
            members.some(
                member =>
                    cleanPhone(member.phone)
                    === phone
            );


        if (alreadyMember) {

            alert(
                "यह member पहले से group में है।"
            );

            return;
        }


        members.push({
            name: name,
            phone: phone
        });


        await updateDoc(
            doc(
                db,
                "groups",
                selectedGroup.id
            ),
            {
                members: members
            }
        );


        await setDoc(
            doc(
                db,
                "groups",
                selectedGroup.id,
                "members",
                phone
            ),
            {
                name: name,
                phone: phone,
                addedAt: serverTimestamp()
            }
        );


        selectedGroup.members =
            members;


        $("memberNameInput").value = "";
        $("memberPhoneInput").value = "";

        showGroupMembers();

        alert(
            "Member successfully add हो गया।"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Member add करने में समस्या हुई।"
        );

    }
}


// ============================================================
// 23. GROUP CHAT
// ============================================================

function startGroupMessages(groupId) {

    if (currentGroupUnsubscribe) {
        currentGroupUnsubscribe();
    }


    const messagesRef =
        collection(
            db,
            "groups",
            groupId,
            "messages"
        );


    const messagesQuery =
        query(
            messagesRef,
            orderBy(
                "createdAt",
                "asc"
            )
        );


    currentGroupUnsubscribe =
        onSnapshot(
            messagesQuery,
            snapshot => {

                const container =
                    $("groupMessages");

                if (!container) return;

                container.innerHTML = "";


                snapshot.forEach(
                    messageDoc => {

                        const message =
                            messageDoc.data();


                        const div =
                            document.createElement(
                                "div"
                            );


                        const mine =
                            cleanPhone(
                                message.senderPhone
                            ) ===
                            cleanPhone(
                                currentUser.phone
                            );


                        div.className =
                            mine
                                ? "message mine"
                                : "message other";


                        div.innerHTML = `
                            <div>
                                <strong>
                                    ${escapeHTML(
                                        message.senderName || "User"
                                    )}
                                </strong>
                            </div>

                            <div>
                                ${escapeHTML(
                                    message.text || ""
                                )}
                            </div>

                            <small>
                                ${formatTime(
                                    message.createdAt
                                )}
                            </small>
                        `;


                        container.appendChild(div);

                    }
                );


                container.scrollTop =
                    container.scrollHeight;

            }
        );
}


if ($("sendGroupMessageBtn")) {

    $("sendGroupMessageBtn")
        .addEventListener(
            "click",
            sendGroupMessage
        );
}


async function sendGroupMessage() {

    if (!selectedGroup) return;


    const input =
        $("groupMessageInput");

    if (!input) return;


    const text =
        input.value.trim();

    if (!text) return;


    try {

        await addDoc(
            collection(
                db,
                "groups",
                selectedGroup.id,
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

        console.error(error);

    }
}


// ============================================================
// 24. HOMEWORK
// ============================================================

if ($("addHomeworkBtn")) {

    $("addHomeworkBtn")
        .addEventListener(
            "click",
            saveHomework
        );
}


function saveHomework() {

    const date =
        $("homeworkDate")?.value ||
        new Date().toISOString().slice(0, 10);


    const homework = {

        date: date,

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


    displayHomework();

    alert(
        "Homework save हो गया।"
    );
}


function displayHomework() {

    const list =
        $("homeworkList");

    if (!list) return;


    const data =
        JSON.parse(
            localStorage.getItem(
                "studyHomework"
            ) || "[]"
        );


    list.innerHTML = "";


    data.forEach(homework => {

        const div =
            document.createElement("div");

        div.className =
            "homework-item";


        div.innerHTML = `
            <strong>
                Date: ${escapeHTML(homework.date)}
            </strong>

            <p>Hindi: ${escapeHTML(homework.hindi)}</p>
            <p>English: ${escapeHTML(homework.english)}</p>
            <p>Math: ${escapeHTML(homework.math)}</p>
            <p>Science: ${escapeHTML(homework.science)}</p>
            <p>SST: ${escapeHTML(homework.sst)}</p>
            <p>Computer: ${escapeHTML(homework.computer)}</p>
            <p>Art: ${escapeHTML(homework.art)}</p>
        `;


        list.appendChild(div);

    });
}


// ============================================================
// 25. SCHOOL UPDATES
// ============================================================

if ($("saveSchoolBtn")) {

    $("saveSchoolBtn")
        .addEventListener(
            "click",
            saveSchoolUpdate
        );
}


function saveSchoolUpdate() {

    const text =
        $("schoolInput")?.value.trim();

    if (!text) return;


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


    $("schoolInput").value = "";

    displaySchoolUpdates();
}


function displaySchoolUpdates() {

    const list =
        $("schoolList");

    if (!list) return;


    const data =
        JSON.parse(
            localStorage.getItem(
                "studySchoolUpdates"
            ) || "[]"
        );


    list.innerHTML = "";


    data.forEach(update => {

        const div =
            document.createElement("div");

        div.className =
            "school-update";


        div.innerHTML = `
            <p>
                ${escapeHTML(update.text)}
            </p>

            <small>
                ${escapeHTML(update.date)}
            </small>
        `;


        list.appendChild(div);

    });
}


// ============================================================
// 26. NOTES
// ============================================================

if ($("saveNoteBtn")) {

    $("saveNoteBtn")
        .addEventListener(
            "click",
            saveNote
        );
}


function saveNote() {

    const text =
        $("noteInput")?.value.trim();

    if (!text) return;


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


    $("noteInput").value = "";

    displayNotes();
}


function displayNotes() {

    const list =
        $("notesList");

    if (!list) return;


    const notes =
        JSON.parse(
            localStorage.getItem(
                "studyNotes"
            ) || "[]"
        );


    list.innerHTML = "";


    notes.forEach(note => {

        const div =
            document.createElement("div");


        div.className =
            "note-item";


        div.innerHTML = `
            <p>
                ${escapeHTML(note.text)}
            </p>

            <small>
                ${escapeHTML(note.date)}
            </small>
        `;


        list.appendChild(div);

    });
}


// ============================================================
// 27. CHANGE NAME
// ============================================================

if ($("changeNameBtn")) {

    $("changeNameBtn")
        .addEventListener(
            "click",
            () => {

                const name =
                    $("changeNameInput")
                        ?.value.trim();


                if (!name) {

                    setMessage(
                        "changeNameMessage",
                        "नया नाम लिखें।"
                    );

                    return;
                }


                currentUser.name =
                    name;


                localStorage.setItem(
                    "studyConnectUser",
                    JSON.stringify(
                        currentUser
                    )
                );


                if ($("studentName")) {
                    $("studentName").value =
                        name;
                }


                if ($("currentUserProfile")) {
                    $("currentUserProfile")
                        .textContent =
                        name;
                }


                setMessage(
                    "changeNameMessage",
                    "नाम बदल दिया गया।"
                );

            }
        );
}


// ============================================================
// 28. LANGUAGE
// ============================================================

const translations = {

    hi: {

        home: "होम",
        chat: "चैट",
        groups: "ग्रुप्स",
        homework: "होमवर्क",
        school: "स्कूल",
        notes: "नोट्स",
        settings: "सेटिंग्स",

        welcome: "StudyConnect में आपका स्वागत है",
        welcomeText:
            "अपने दोस्तों और स्कूल के साथ जुड़े रहें।",

        yourName: "आपका नाम",
        saveName: "नाम सेव करें",

        onlineNow: "अभी ऑनलाइन",

        chatTitle: "चैट",
        send: "भेजें",

        groupsTitle: "ग्रुप्स",
        createGroup: "ग्रुप बनाएँ",
        createGroupButton: "ग्रुप बनाएँ",

        addMember: "Member जोड़ें",
        addMemberButton: "Member जोड़ें",

        homeworkTitle: "होमवर्क",
        date: "तारीख",
        saveHomework: "होमवर्क सेव करें",

        schoolUpdateTitle: "स्कूल अपडेट",
        saveUpdate: "अपडेट सेव करें",

        notesTitle: "नोट्स",
        saveNote: "नोट सेव करें",

        settingsTitle: "सेटिंग्स",

        changeName: "नाम बदलें",
        changeNameButton: "नाम बदलें",

        language: "भाषा",
        theme: "थीम",

        notifications: "नोटिफिकेशन",
        enableNotifications:
            "नोटिफिकेशन चालू करें",

        resetAppData:
            "App Data Reset करें",

        owner: "Owner"

    },

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
            "Stay connected with your friends and school.",

        yourName: "Your Name",
        saveName: "Save Name",

        onlineNow: "Online Now",

        chatTitle: "Chat",
        send: "Send",

        groupsTitle: "Groups",
        createGroup: "Create Group",
        createGroupButton: "Create Group",

        addMember: "Add Member",
        addMemberButton: "Add Member",

        homeworkTitle: "Homework",
        date: "Date",
        saveHomework: "Save Homework",

        schoolUpdateTitle: "School Update",
        saveUpdate: "Save Update",

        notesTitle: "Notes",
        saveNote: "Save Note",

        settingsTitle: "Settings",

        changeName: "Change Name",
        changeNameButton: "Change Name",

        language: "Language",
        theme: "Theme",

        notifications: "Notifications",
        enableNotifications:
            "Enable Notifications",

        resetAppData:
            "Reset App Data",

        owner: "Owner"

    }

};


function setLanguage(language) {

    const selected =
        translations[language];

    if (!selected) return;


    document
        .querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key =
                element.dataset.i18n;

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


if ($("hindiLanguageBtn")) {

    $("hindiLanguageBtn")
        .addEventListener(
            "click",
            () => {

                setLanguage("hi");

                setMessage(
                    "languageMessage",
                    "भाषा हिन्दी कर दी गई।"
                );

            }
        );
}


if ($("englishLanguageBtn")) {

    $("englishLanguageBtn")
        .addEventListener(
            "click",
            () => {

                setLanguage("en");

                setMessage(
                    "languageMessage",
                    "Language changed to English."
                );

            }
        );
}


// ============================================================
// 29. THEME
// ============================================================

if ($("themeBtn")) {

    $("themeBtn")
        .addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "dark-mode"
                );


                const dark =
                    document.body.classList.contains(
                        "dark-mode"
                    );


                localStorage.setItem(
                    "studyDarkMode",
                    dark
                        ? "true"
                        : "false"
                );

            }
        );
}


// ============================================================
// 30. NOTIFICATIONS
// ============================================================

if ($("notificationBtn")) {

    $("notificationBtn")
        .addEventListener(
            "click",
            async () => {

                if (
                    !("Notification" in window)
                ) {

                    setMessage(
                        "notificationMessage",
                        "इस browser में notifications उपलब्ध नहीं हैं।"
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

                        setMessage(
                            "notificationMessage",
                            "Notifications चालू हो गए।"
                        );


                        new Notification(
                            "StudyConnect",
                            {
                                body:
                                    "Notifications successfully enabled."
                            }
                        );

                    } else {

                        setMessage(
                            "notificationMessage",
                            "Notifications की अनुमति नहीं मिली।"
                        );

                    }

                } catch (error) {

                    console.error(error);

                }

            }
        );
}


// ============================================================
// 31. OWNER PANEL
// ============================================================

if ($("ownerLoginBtn")) {

    $("ownerLoginBtn")
        .addEventListener(
            "click",
            openOwnerPanel
        );
}


function openOwnerPanel() {

    const password =
        $("ownerPasswordInput")
            ?.value.trim();


    if (
        password !==
        OWNER_PASSWORD
    ) {

        setMessage(
            "ownerPasswordMessage",
            "गलत Owner Password।"
        );

        return;
    }


    showElement("ownerPanel");

    setMessage(
        "ownerPasswordMessage",
        "Owner Panel खुल गया।"
    );


    loadAllowedUsers();
}


// ============================================================
// 32. ADD ALLOWED USER
// ============================================================

if ($("allowUserBtn")) {

    $("allowUserBtn")
        .addEventListener(
            "click",
            allowUser
        );
}


async function allowUser() {

    const name =
        $("allowedUserNameInput")
            ?.value.trim();


    const phone =
        cleanPhone(
            $("allowedUserPhoneInput")
                ?.value
        );


    if (!name || !phone) {

        alert(
            "User का नाम और मोबाइल नंबर भरें।"
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
                name: name,
                phone: phone,
                addedAt: serverTimestamp()
            }
        );


        $("allowedUserNameInput")
            .value = "";

        $("allowedUserPhoneInput")
            .value = "";


        loadAllowedUsers();


        alert(
            "User को अनुमति दे दी गई।"
        );

    } catch (error) {

        console.error(error);

        alert(
            "User add करने में समस्या हुई।"
        );

    }
}


// ============================================================
// 33. LOAD ALLOWED USERS
// ============================================================

async function loadAllowedUsers() {

    const list =
        $("allowedUsersList");

    if (!list) return;


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
            userDoc => {

                const user =
                    userDoc.data();


                const item =
                    document.createElement(
                        "div"
                    );


                item.textContent =
                    `${user.name} - ${user.phone}`;


                list.appendChild(item);

            }
        );

    } catch (error) {

        console.error(error);

    }
}


// ============================================================
// 34. RESET APP DATA
// ============================================================

if ($("clearDataBtn")) {

    $("clearDataBtn")
        .addEventListener(
            "click",
            () => {

                const confirmReset =
                    confirm(
                        "क्या आप App का local data हटाना चाहते हैं?"
                    );


                if (!confirmReset) return;


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
                    "studyDarkMode"
                );


                setMessage(
                    "settingsMessage",
                    "App data reset हो गया।"
                );


                displayHomework();
                displaySchoolUpdates();
                displayNotes();

            }
        );
}


// ============================================================
// 35. RESTORE SETTINGS
// ============================================================

const savedLanguage =
    localStorage.getItem(
        "studyLanguage"
    ) || "hi";

setLanguage(savedLanguage);


if (
    localStorage.getItem(
        "studyDarkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark-mode"
    );
}


// ============================================================
// 36. RESTORE USER
// ============================================================

try {

    const savedUser =
        JSON.parse(
            localStorage.getItem(
                "studyConnectUser"
            )
        );


    if (
        savedUser &&
        savedUser.name &&
        savedUser.phone
    ) {

        currentUser =
            savedUser;

    }

} catch (error) {

    console.error(error);

}


// ============================================================
// 37. INITIAL LOCAL DATA
// ============================================================

displayHomework();
displaySchoolUpdates();
displayNotes();


// ============================================================
// 38. DEFAULT PAGE
// ============================================================

showPage("home");


// ============================================================
// 39. SERVICE WORKER / PWA
// ============================================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    registration => {

                        console.log(
                            "Service Worker registered:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    error => {

                        console.error(
                            "Service Worker error:",
                            error
                        );

                    }
                );

        }
    );
}


console.log(
    "StudyConnect JavaScript loaded successfully."
);
