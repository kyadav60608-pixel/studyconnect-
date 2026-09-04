import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================
   FIREBASE
========================= */

const firebaseConfig = {
    apiKey: "AIzaSyCquRX2YB59FObuIyiw3c3AUCdPWypag",
    authDomain: "studyconnect-99006.firebaseapp.com",
    projectId: "studyconnect-99006",
    storageBucket: "studyconnect-99006.firebasestorage.app",
    messagingSenderId: "15964627995",
    appId: "1:15964627995:web:0e8a8cd14c175247ed04be",
    measurementId: "G-SYJYMREJJL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================
   SETTINGS
========================= */

const SCHOOL_PASSWORD = "123";
const OWNER_NAME = "Krishna Yadav";


/* =========================
   ELEMENTS
========================= */

const loginScreen = document.getElementById("loginScreen");
const contactScreen = document.getElementById("contactScreen");
const appScreen = document.getElementById("appScreen");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

const appPassword = document.getElementById("appPassword");
const userName = document.getElementById("userName");
const userPhone = document.getElementById("userPhone");

const nextPasswordBtn =
    document.getElementById("nextPasswordBtn");

const nextOwnerBtn =
    document.getElementById("nextOwnerBtn");

const openAppBtn =
    document.getElementById("openAppBtn");

const backBtn =
    document.getElementById("backBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const passwordError =
    document.getElementById("passwordError");

const loginMessage =
    document.getElementById("loginMessage");

const welcomeUser =
    document.getElementById("welcomeUser");


/* =========================
   STEP FUNCTION
========================= */

function showStep(stepNumber) {

    step1.classList.add("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");

    if (stepNumber === 1) {
        step1.classList.remove("hidden");
    }

    if (stepNumber === 2) {
        step2.classList.remove("hidden");
    }

    if (stepNumber === 3) {
        step3.classList.remove("hidden");
    }
}


/* =========================
   FIRST NEXT
========================= */

nextPasswordBtn.addEventListener("click", function () {

    const password = appPassword.value.trim();

    if (password === SCHOOL_PASSWORD) {

        passwordError.textContent = "";

        showStep(2);

    } else {

        passwordError.textContent =
            "गलत Password है।";

        appPassword.focus();
    }
});


/* =========================
   OWNER NEXT
========================= */

nextOwnerBtn.addEventListener("click", function () {

    showStep(3);

    userName.focus();

});


/* =========================
   ENTER APP
========================= */

openAppBtn.addEventListener("click", async function () {

    const name = userName.value.trim();
    const phone = userPhone.value.trim();

    loginMessage.textContent = "";

    if (name.length < 2) {

        loginMessage.textContent =
            "कृपया अपना सही नाम लिखें।";

        userName.focus();
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {

        loginMessage.textContent =
            "कृपया 10 अंकों का मोबाइल नंबर डालें।";

        userPhone.focus();
        return;
    }


    openAppBtn.disabled = true;
    openAppBtn.textContent = "Checking...";


    try {

        /*
          Firebase में document ID = मोबाइल नंबर
          Example:
          allowedUsers
             └── 9876543210
        */

        const userRef =
            doc(db, "allowedUsers", phone);

        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            showContactScreen();
            return;
        }


        const data = userSnapshot.data();

        const allowedName =
            String(data.name || "")
                .trim()
                .toLowerCase();


        if (allowedName !== name.toLowerCase()) {

            showContactScreen();
            return;
        }


        // Allowed user

        localStorage.setItem(
            "studyUserName",
            name
        );

        localStorage.setItem(
            "studyUserPhone",
            phone
        );

        showApp(name);

    } catch (error) {

        console.error(error);

        loginMessage.textContent =
            "Firebase से connection नहीं हो पाया।";

    } finally {

        openAppBtn.disabled = false;
        openAppBtn.textContent =
            "Open StudyConnect";
    }

});


/* =========================
   SHOW CONTACT
========================= */

function showContactScreen() {

    loginScreen.classList.add("hidden");
    appScreen.classList.add("hidden");

    contactScreen.classList.remove("hidden");

}


/* =========================
   SHOW APP
========================= */

function showApp(name) {

    loginScreen.classList.add("hidden");
    contactScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");

    welcomeUser.textContent =
        `Welcome, ${name}!`;
}


/* =========================
   BACK
========================= */

backBtn.addEventListener("click", function () {

    contactScreen.classList.add("hidden");
    appScreen.classList.add("hidden");

    loginScreen.classList.remove("hidden");

    appPassword.value = "";
    userName.value = "";
    userPhone.value = "";

    showStep(1);

});


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener("click", function () {

    localStorage.removeItem("studyUserName");
    localStorage.removeItem("studyUserPhone");

    appScreen.classList.add("hidden");
    contactScreen.classList.add("hidden");

    loginScreen.classList.remove("hidden");

    appPassword.value = "";
    userName.value = "";
    userPhone.value = "";

    showStep(1);

});


/* =========================
   ENTER KEY SUPPORT
========================= */

appPassword.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        nextPasswordBtn.click();
    }

});

userPhone.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        openAppBtn.click();
    }

});


/* =========================
   START
========================= */

showStep(1);
