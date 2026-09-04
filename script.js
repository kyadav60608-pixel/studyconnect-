// ===============================
// StudyConnect - Login Flow Fix
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const passwordScreen = document.getElementById("passwordScreen");

    const schoolPasswordStep = document.getElementById("schoolPasswordStep");
    const ownerStep = document.getElementById("ownerStep");
    const userDetailsStep = document.getElementById("userDetailsStep");

    const appPassword = document.getElementById("appPassword");
    const unlockBtn = document.getElementById("unlockBtn");

    const ownerNextBtn = document.getElementById("ownerNextBtn");

    const openUserName = document.getElementById("openUserName");
    const openUserPhone = document.getElementById("openUserPhone");
    const enterAppBtn = document.getElementById("enterAppBtn");

    const passwordError = document.getElementById("passwordError");

    const contactOwnerScreen =
        document.getElementById("contactOwnerScreen");

    const appContainer =
        document.getElementById("appContainer");

    const backToLoginBtn =
        document.getElementById("backToLoginBtn");

    // Passwords
    const SCHOOL_PASSWORD = "123";

    // --------------------------------
    // Step बदलने का function
    // --------------------------------
    function showStep(step) {

        const steps = passwordScreen.querySelectorAll(".step");

        steps.forEach(item => {
            item.classList.remove("active");
        });

        step.classList.add("active");

        passwordError.textContent = "";
    }

    // --------------------------------
    // पहला Next button
    // Password 123
    // --------------------------------
    unlockBtn.addEventListener("click", () => {

        const password = appPassword.value.trim();

        if (password === SCHOOL_PASSWORD) {

            showStep(ownerStep);

        } else {

            passwordError.textContent =
                "गलत Password! सही Password डालें।";

        }
    });

    // --------------------------------
    // Krishna Yadav के बाद Next
    // --------------------------------
    ownerNextBtn.addEventListener("click", () => {

        showStep(userDetailsStep);

    });

    // --------------------------------
    // Enter App
    // --------------------------------
    enterAppBtn.addEventListener("click", () => {

        const name = openUserName.value.trim();
        const phone = openUserPhone.value.trim();

        if (name === "") {

            alert("अपना नाम लिखें।");
            return;

        }

        if (!/^[0-9]{10}$/.test(phone)) {

            alert("10 अंकों का मोबाइल नंबर डालें।");
            return;

        }

        // अभी basic login
        // Firebase authorization बाद में जोड़ेंगे

        localStorage.setItem("studyUserName", name);
        localStorage.setItem("studyUserPhone", phone);

        passwordScreen.style.display = "none";

        if (contactOwnerScreen) {
            contactOwnerScreen.style.display = "none";
        }

        if (appContainer) {
            appContainer.style.display = "block";
        }

    });

    // --------------------------------
    // Contact Owner से वापस
    // --------------------------------
    if (backToLoginBtn) {

        backToLoginBtn.addEventListener("click", () => {

            if (contactOwnerScreen) {
                contactOwnerScreen.style.display = "none";
            }

            if (passwordScreen) {
                passwordScreen.style.display = "block";
            }

            showStep(schoolPasswordStep);

        });

    }

    // --------------------------------
    // शुरुआत में सिर्फ Password वाला step
    // --------------------------------
    showStep(schoolPasswordStep);

});
