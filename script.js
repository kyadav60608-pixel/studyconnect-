import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig={apiKey:"AIzaSyCquRX2YB59FObuIyi3SwWc3aUCdPWypag",authDomain:"studyconnect-99006.firebaseapp.com",projectId:"studyconnect-99006",storageBucket:"studyconnect-99006.firebasestorage.app",messagingSenderId:"15964627995",appId:"1:15964627995:web:0e8a8cd14c175247ed04be",measurementId:"G-SYJYMREJJL"};

const fb=initializeApp(firebaseConfig),db=getFirestore(fb),auth=getAuth(fb);

const OWNER_NAME="Krishna Yadav", OWNER_BOOTSTRAP_PASSWORD="12341", STUDENT_BOOTSTRAP_PASSWORD="123";

let state={
    user:null,
    settings:{
        appName:"StudyConnect",
        language:"en",
        theme:"system",
        welcomeAnimation:true,
        features:{
            chat:true,
            groups:true,
            homework:true,
            notes:true,
            announcements:true,
            registration:true,
            maintenance:false
        }
    },
    students:[],
    groups:[],
    currentChat:null,
    chatUnsub:null,
    selectedMembers:[],
    navHistory:[]
};

const $=id=>document.getElementById(id),
esc=v=>{
    const d=document.createElement("div");
    d.textContent=v??"";
    return d.innerHTML
},
uid=()=>auth.currentUser?.uid||"",
name=()=>state.user?.name||localStorage.getItem("studyName")||"",
phone=()=>state.user?.phone||localStorage.getItem("studyPhone")||"";

const hash=async s=>{
    const b=await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(s)
    );
    return [...new Uint8Array(b)]
        .map(x=>x.toString(16).padStart(2,"0"))
        .join("")
};

const stamp=v=>{
    if(!v)return "";
    const d=v?.toDate?v.toDate():new Date(v);
    return Number.isNaN(d.getTime())
        ?""
        :d.toLocaleTimeString("en-IN",{
            hour:"2-digit",
            minute:"2-digit"
        })
};

const dateLabel=v=>{
    const d=v?.toDate?v.toDate():new Date(v);
    return d.toLocaleDateString("en-IN",{
        day:"numeric",
        month:"long",
        year:"numeric"
    })
};

const toast=(m,icon="✓")=>{
    $("toastMessage").textContent=m;
    $("toastIcon").textContent=icon;
    $("toast").classList.add("show");
    clearTimeout(toast.t);
    toast.t=setTimeout(
        ()=>$("toast").classList.remove("show"),
        2600
    )
};

function setTheme(t){
    document.body.dataset.theme=
        t==="system"
        ?(matchMedia("(prefers-color-scheme:dark)").matches
            ?"dark"
            :"light")
        :t
}

async function ensureAuth(){
    if(auth.currentUser)return auth.currentUser;

    return new Promise((resolve,reject)=>{
        const off=onAuthStateChanged(auth,u=>{
            if(u){
                off();
                resolve(u)
            }
        },reject);

        signInAnonymously(auth).catch(reject)
    })
}

async function getSettings(){
    try{
        const s=await getDoc(doc(db,"appSettings","main"));

        if(s.exists()){
            state.settings={
                ...state.settings,
                ...s.data(),
                features:{
                    ...state.settings.features,
                    ...(s.data().features||{})
                }
            }
        }
    }catch(e){
        console.warn(e)
    }

    setTheme(state.settings.theme);
    $("appTitle").textContent=state.settings.appName
}

async function saveSettings(patch){
    state.settings={
        ...state.settings,
        ...patch,
        features:{
            ...state.settings.features,
            ...(patch.features||{})
        }
    };

    try{
        await setDoc(
            doc(db,"appSettings","main"),
            state.settings,
            {merge:true}
        )
    }catch(e){
        toast("Firebase save failed","!");
        throw e
    }

    setTheme(state.settings.theme);
    $("appTitle").textContent=state.settings.appName
}

function saveLocalUser(){
    localStorage.setItem(
        "studyName",
        state.user?.name||""
    );

    localStorage.setItem(
        "studyPhone",
        state.user?.phone||""
    );

    localStorage.setItem(
        "studyProfileId",
        state.user?.id||""
    )
}

function go(page,push=true){
    const target=$("page-"+page);

    if(!target)return;

    if(!can(page)){
        toast(
            "This section is not available for your permission",
            "!"
        );
        return
    }

    const current=
        document
        .querySelector(".page.active")
        ?.id
        ?.replace("page-","");

    if(
        push &&
        current &&
        current!==page
    ){
        state.navHistory.push(current)
    }

    document
        .querySelectorAll(".page")
        .forEach(x=>x.classList.remove("active"));

    target.classList.add("active");

    document
        .querySelectorAll("[data-page]")
        .forEach(x=>
            x.classList.toggle(
                "active",
                x.dataset.page===page
            )
        );

    $("sidebar").classList.remove("open");

    window.scrollTo({
        top:0,
        behavior:"smooth"
    })
}

function back(){
    const prev=state.navHistory.pop();

    if(prev)
        go(prev,false);
    else
        go("home",false)
}

function can(feature){
    if(!state.user)return false;

    if(state.user.isOwner)return true;

    if(
        state.settings.features.maintenance &&
        feature!=="home" &&
        feature!=="school" &&
        feature!=="homework"
    ){
        return false
    }

    if(state.user.status!=="active"){
        return [
            "home",
            "school",
            "homework",
            "settings"
        ].includes(feature)
    }

    const p=state.user.permission||"normal";

    if(p==="full")
        return true;

    if(p==="normal"){
        return [
            "home",
            "chat",
            "school",
            "homework",
            "settings"
        ].includes(feature)
    }

    return [
        "home",
        "school",
        "homework",
        "settings"
    ].includes(feature)
}

function applyAccess(){
    document
        .querySelectorAll("[data-page]")
        .forEach(el=>{
            const p=el.dataset.page;

            if(p!=="owner"){
                el.classList.toggle(
                    "hidden",
                    !can(p)
                )
            }
        });

    $("controlPanelNav").classList.toggle(
        "hidden",
        !state.user?.isOwner
    );

    $("ownerSettingsCard").classList.toggle(
        "hidden",
        !state.user?.isOwner
    );

    $("maintenanceNotice").classList.toggle(
        "hidden",
        !state.settings.features.maintenance
    );

    if(state.settings.features.maintenance){
        $("maintenanceNotice").textContent=
            "Maintenance mode is active. Some features are temporarily unavailable."
    }
}

function profileUI(){
    const n=name(),
        p=phone(),
        initial=(n||"S")
            .trim()
            .charAt(0)
            .toUpperCase();

    $("profileName").textContent=
        n||"Student";

    $("profilePhone").textContent=
        p?"+91 "+p:"";

    $("profileAvatar").textContent=
        initial;

    $("headerProfileInitial").textContent=
        initial;

    $("homeGreeting").textContent=
        `Welcome, ${n||"Student"} 👋`
}

async function upsertStudent(data){
    const id=
        data.id||
        btoa(data.phone).replace(/=/g,"");

    const ref=doc(db,"students",id);

    await setDoc(
        ref,
        {
            ...data,
            id,
            updatedAt:serverTimestamp()
        },
        {merge:true}
    );

    return {...data,id}
}

async function loadStudents(){
    try{
        const snap=
            await getDocs(
                collection(db,"students")
            );

        state.students=
            snap.docs
            .map(d=>({
                id:d.id,
                ...d.data()
            }))
            .filter(x=>!x.isOwner)

    }catch(e){
        state.students=[];
        console.warn(e)
    }
}

async function loginSubmit(e){
    e.preventDefault();

    const pass=
        $("loginPassword")
        .value
        .trim();

    const msg=$("loginMessage");

    if(!pass){
        msg.textContent="Password डालें।";
        return
    }

    await ensureAuth();

    msg.textContent="Checking…";

    const settings=state.settings;

    let ownerOk=false;

    try{
        const h=await hash(pass);

        ownerOk=
            settings.ownerPasswordHash
            ?settings.ownerPasswordHash===h
            :pass===OWNER_BOOTSTRAP_PASSWORD

    }catch(_){}

    if(ownerOk){
        state.user={
            id:"owner",
            name:OWNER_NAME,
            phone:"",
            permission:"full",
            status:"active",
            isOwner:true
        };

        saveLocalUser();

        await openApp(true);

        return
    }

    let studentOk=false;

    try{
        const h=await hash(pass);

        studentOk=
            settings.appPasswordHash
            ?settings.appPasswordHash===h
            :pass===STUDENT_BOOTSTRAP_PASSWORD

    }catch(_){}

    if(!studentOk){
        msg.textContent="गलत password ❌";
        $("loginPassword").value="";
        return
    }

    const saved=
        localStorage.getItem(
            "studyProfileId"
        );

    if(saved){
        const s=
            await getDoc(
                doc(db,"students",saved)
            );

        if(s.exists()){
            state.user={
                id:saved,
                ...s.data(),
                isOwner:false
            };

            if(state.user.status==="blocked"){
                msg.textContent=
                    "आपका account blocked है।";
                return
            }

            await openApp(false);
            return
        }
    }

    $("loginNameWrap")
        .classList.remove("hidden");

    $("loginPhoneWrap")
        .classList.remove("hidden");

    $("loginPassword").disabled=true;

    $("loginName").required=true;
    $("loginPhone").required=true;

    $("loginBtn").textContent=
        "Create Account →";

    msg.textContent=
        "पहली बार है? अब Name और Mobile Number भरें।";

    $("loginForm").onsubmit=
        registerStudent
}

async function registerStudent(e){
    e.preventDefault();

    const n=
        $("loginName")
        .value
        .trim();

    const p=
        $("loginPhone")
        .value
        .replace(/\D/g,"");

    if(n.length<2||p.length<10){
        $("loginMessage").textContent=
            "सही Name और 10-digit Mobile Number डालें।";
        return
    }

    await ensureAuth();

    const existing=
        (
            await getDocs(
                query(
                    collection(db,"students"),
                    where("phone","==",p)
                )
            )
        ).docs;

    if(existing.length){
        $("loginMessage").textContent=
            "यह mobile पहले से registered है।";
        return
    }

    state.user=
        await upsertStudent({
            name:n,
            phone:p,
            status:"pending",
            permission:"normal",
            joinedAt:Date.now(),
            online:true,
            isOwner:false
        });

    saveLocalUser();

    await logActivity(
        "New student registration: "+n
    );

    toast(
        "Registration saved. Owner approval required.",
        "✓"
    );

    await openApp(false)
}
async function openApp(owner){

    $("loginScreen").classList.add("hidden");
    $("app").classList.remove("hidden");

    profileUI();
    applyAccess();

    await getSettings();
    applyAccess();

    // App तुरंत खोलो
    go(owner ? "owner" : "home", false);

    // Welcome animation को app loading से अलग रखो
    if(owner && state.settings.welcomeAnimation){
        ownerWelcome();
    }

    // बाकी data background में load होगा
    if(owner){
        loadOwner().catch(console.error);
    }

    loadContent().catch(console.error);

    startPresence();
}


function ownerWelcome(){

    const w = $("ownerWelcome");

    if(!w) return;

    w.classList.remove("hidden");

    const box = $("fallingStars");

    if(box){
        box.innerHTML = "";

        for(let i = 0; i < 70; i++){

            const s = document.createElement("span");

            s.className = "star";

            s.textContent =
                ["✦","✧","★","•"]
                [Math.floor(Math.random() * 4)];

            s.style.left =
                Math.random() * 100 + "%";

            s.style.animationDuration =
                (1.4 + Math.random() * 1.5) + "s";

            s.style.animationDelay =
                Math.random() * 0.8 + "s";

            box.appendChild(s);
        }
    }

    // Maximum 2 seconds बाद Welcome हटेगा
    setTimeout(() => {

        w.classList.add("hidden");

    }, 2000);
}

async function logActivity(text){
    try{
        await addDoc(
            collection(db,"activityLogs"),
            {
                text,
                actor:state.user?.name||"System",
                createdAt:serverTimestamp()
            }
        )
    }catch(_){}
}

function wireNavigation(){
    document.addEventListener("click",e=>{
        const n=e.target.closest("[data-page]");

        if(n){
            e.preventDefault();
            go(n.dataset.page)
        }

        const b=e.target.closest("[data-back]");

        if(b){
            e.preventDefault();
            back()
        }
    });

    $("mobileMenuBtn").onclick=()=>{
        $("sidebar").classList.toggle("open")
    };

    $("headerProfileBtn").onclick=()=>{
        go("settings")
    };

    $("headerNotificationBtn").onclick=()=>{
        toast("No new notifications")
    };

    $("logoutBtn").onclick=logout;

    $("settingsLogoutBtn").onclick=logout;

    $("profileSettingsBtn").onclick=editProfile;

    $("languageSelect").onchange=()=>{
        localStorage.setItem(
            "studyLanguage",
            $("languageSelect").value
        );

        toast("Language preference saved")
    };

    $("themeSelect").onchange=()=>{
        setTheme($("themeSelect").value);

        localStorage.setItem(
            "studyTheme",
            $("themeSelect").value
        )
    };

    $("openOwnerPanelBtn").onclick=()=>{
        go("owner");
        loadOwner()
    };

    $("chatSearchBtn").onclick=()=>{
        $("chatSearchBox")
            .classList.toggle("hidden")
    }
}

async function logout(){
    if(
        state.user?.id &&
        !state.user.isOwner
    ){
        await setDoc(
            doc(db,"students",state.user.id),
            {
                online:false,
                lastSeen:serverTimestamp()
            },
            {merge:true}
        ).catch(()=>{})
    }

    localStorage.removeItem("studyProfileId");

    state.user=null;
    state.navHistory=[];

    if(state.chatUnsub)
        state.chatUnsub();

    $("app").classList.add("hidden");

    $("loginScreen")
        .classList.remove("hidden");

    $("loginForm").reset();

    location.reload()
}

async function editProfile(){
    const old=name();

    openModal(
        "Change Name",
        `
        <input
            id="editName"
            class="text-input"
            value="${esc(old)}"
        >

        <button
            id="saveEditName"
            class="primary-btn"
        >
            Save Name
        </button>
        `
    );

    $("saveEditName").onclick=async()=>{
        const n=
            $("editName")
            .value
            .trim();

        if(!n)return;

        state.user.name=n;

        await setDoc(
            doc(db,"students",state.user.id),
            {
                name:n,
                updatedAt:serverTimestamp()
            },
            {merge:true}
        );

        saveLocalUser();
        profileUI();
        closeModal();

        toast("Name updated")
    }
}

function openModal(title,body){
    $("appModalTitle").textContent=title;
    $("appModalBody").innerHTML=body;
    $("appModal").classList.remove("hidden")
}

function closeModal(){
    $("appModal")
        .classList.add("hidden")
}

$("closeAppModalBtn").onclick=closeModal;

$("appModal").addEventListener(
    "click",
    e=>{
        if(e.target===$("appModal"))
            closeModal()
    }
);

$("closeGroupModalBtn").onclick=()=>{
    $("groupModal").classList.add("hidden")
};

async function renderPeople(){
    await loadStudents();

    const list=$("chatPeopleList");

    const term=
        ($("chatSearchInput").value||"")
        .toLowerCase();

    list.innerHTML="";

    state.students
        .filter(
            s=>
                s.status==="active" &&
                !s.isOwner &&
                (s.name||"")
                    .toLowerCase()
                    .includes(term)
        )
        .forEach(s=>{
            const b=
                document.createElement("button");

            b.className="person-row";

            b.innerHTML=`
                <span class="avatar">
                    ${esc(
                        (s.name||"S")
                        [0]
                        .toUpperCase()
                    )}
                </span>

                <span>
                    <b>${esc(s.name)}</b>
                    <small>
                        ${s.online
                            ?"● Online"
                            :"Offline"}
                    </small>
                </span>
            `;

            b.onclick=()=>{
                openChat(s)
            };

            list.appendChild(b)
        });

    if(!list.children.length){
        list.innerHTML=`
            <div class="empty-state">
                No approved students found.
            </div>
        `
    }
}

function chatId(a,b){
    return [a,b]
        .sort()
        .join("__")
}

async function openChat(other){
    if(!state.user)return;

    state.currentChat=other;

    const layout=
        document.querySelector(".chat-layout");

    layout.classList.add("chat-open");

    const win=$("chatWindow");

    win.className="chat-window";

    win.innerHTML=`
        <div class="chat-header">

            <button
                class="icon-btn chat-back"
            >
                ←
            </button>

            <span class="avatar">
                ${esc(
                    (other.name||"S")
                    [0]
                    .toUpperCase()
                )}
            </span>

            <div>
                <b>${esc(other.name)}</b>

                <small>
                    ${other.online
                        ?"Online"
                        :"Offline"}
                </small>
            </div>

        </div>

        <div
            id="chatMessages"
            class="chat-messages"
        ></div>

        <form
            id="chatComposer"
            class="chat-composer"
        >

            <button
                type="button"
                id="emojiBtn"
                class="emoji-btn"
            >
                😊
            </button>

            <input
                id="messageInput"
                autocomplete="off"
                placeholder="Message…"
            >

            <button
                id="sendMessageBtn"
                class="send-btn"
            >
                ➤
            </button>

        </form>
    `;

    win.querySelector(".chat-back").onclick=()=>{
        layout.classList.remove("chat-open")
    };

    $("emojiBtn").onclick=()=>{
        $("messageInput").value+=" 😊";
        $("messageInput").focus()
    };

    $("chatComposer").onsubmit=async e=>{
        e.preventDefault();
        await sendMessage()
    };

    if(state.chatUnsub)
        state.chatUnsub();

    const key=
        chatId(
            state.user.id,
            other.id
        );

    const q=query(
        collection(db,"messages"),
        where("chatId","==",key)
    );

    state.chatUnsub=
        onSnapshot(
            q,
            snap=>{
                const docs=
                    snap.docs
                    .map(d=>({
                        id:d.id,
                        ...d.data()
                    }))
                    .sort(
                        (a,b)=>
                            (
                                a.createdAt?.toMillis
                                ?a.createdAt.toMillis()
                                :a.createdAt||0
                            )-
                            (
                                b.createdAt?.toMillis
                                ?b.createdAt.toMillis()
                                :b.createdAt||0
                            )
                    );

                renderMessages(docs);

                docs
                    .filter(
                        m=>
                            m.senderId===other.id &&
                            !(m.seenBy||[])
                                .includes(
                                    state.user.id
                                )
                    )
                    .forEach(
                        m=>
                            updateDoc(
                                doc(
                                    db,
                                    "messages",
                                    m.id
                                ),
                                {
                                    delivered:true,
                                    seenBy:[
                                        ...(m.seenBy||[]),
                                        state.user.id
                                    ]
                                }
                            ).catch(()=>{})
                    )
            }
        )
}

function renderMessages(ms){
    const box=$("chatMessages");

    if(!box)return;

    box.innerHTML="";

    let lastDay="";

    ms.forEach(m=>{
        const d=
            m.createdAt?.toDate
            ?m.createdAt.toDate()
            :new Date(
                m.createdAt||Date.now()
            );

        const day=d.toDateString();

        if(day!==lastDay){
            const sep=
                document.createElement("div");

            sep.className="message-day";

            sep.innerHTML=`
                <span>
                    ${esc(dateLabel(d))}
                </span>
            `;

            box.appendChild(sep);

            lastDay=day
        }

        const mine=
            m.senderId===state.user.id;

        const row=
            document.createElement("div");

        row.className=
            "message-row "+
            (mine?"sent":"received");

        const seen=
            mine &&
            (m.seenBy||[]).length>0;

        row.innerHTML=`
            <div class="bubble">

                <div class="bubble-text">
                    ${esc(m.text)}
                </div>

                <div class="bubble-meta">
                    ${stamp(m.createdAt)}

                    ${
                        mine
                        ?`
                            <span
                                class="tick ${
                                    seen?"seen":""
                                }"
                            >
                                ${
                                    seen
                                    ?"✓✓"
                                    :"✓"
                                }
                            </span>
                        `
                        :""
                    }
                </div>

            </div>
        `;

        box.appendChild(row)
    });

    box.scrollTop=box.scrollHeight
}

async function sendMessage(){
    if(
        !state.currentChat ||
        !can("chat")
    ){
        return
    }

    const input=$("messageInput");

    const text=
        input.value.trim();

    if(!text)return;

    const key=
        chatId(
            state.user.id,
            state.currentChat.id
        );

    try{
        await addDoc(
            collection(db,"messages"),
            {
                chatId:key,
                senderId:state.user.id,
                senderName:name(),
                receiverId:
                    state.currentChat.id,
                receiverName:
                    state.currentChat.name,
                text,
                createdAt:
                    serverTimestamp(),
                delivered:false,
                seenBy:[]
            }
        );

        input.value=""

    }catch(e){
        toast(
            "Message send नहीं हुआ",
            "!"
        )
    }
}

async function loadContent(){
    await Promise.all([
        renderHomework(),
        renderSchool(),
        renderNotes(),
        renderAnnouncements(),
        renderGroups(),
        renderPeople()
    ])
}

async function getPublished(col){
    const snap=
        await getDocs(
            collection(db,col)
        );

    return snap.docs
        .map(d=>({
            id:d.id,
            ...d.data()
        }))
        .filter(
            x=>x.published!==false
        )
        .sort(
            (a,b)=>
                (
                    b.createdAt?.toMillis
                    ?b.createdAt.toMillis()
                    :b.createdAt||0
                )-
                (
                    a.createdAt?.toMillis
                    ?a.createdAt.toMillis()
                    :a.createdAt||0
                )
        )
}

async function renderHomework(){
    const arr=
        await getPublished("homework");

    $("homeworkList").innerHTML=
        arr.length
        ?arr.map(
            x=>`
                <article class="list-card">

                    <h3>
                        📝
                        ${esc(
                            x.title||
                            x.subject||
                            "Homework"
                        )}
                    </h3>

                    <p>
                        ${esc(
                            x.description||
                            x.text||
                            ""
                        )}
                    </p>

                    <p>
                        <small>
                            ${esc(x.className||"")}
                            ${esc(x.chapter||"")}
                        </small>
                    </p>

                </article>
            `
        ).join("")
        :`
            <div class="empty-state">
                No homework published yet.
            </div>
        `
}

async function renderSchool(){
    const arr=
        await getPublished("school");

    $("schoolUpdatesList").innerHTML=
        arr.length
        ?arr.map(
            x=>`
                <article class="list-card">

                    <h3>
                        📢
                        ${esc(
                            x.title||
                            "School Update"
                        )}
                    </h3>

                    <p>
                        ${esc(
                            x.text||
                            x.description||
                            ""
                        )}
                    </p>

                </article>
            `
        ).join("")
        :`
            <div class="empty-state">
                No school updates yet.
            </div>
        `
}

async function renderNotes(){
    const arr=
        await getPublished("notes");

    $("notesList").innerHTML=
        arr.length
        ?arr.map(
            x=>`
                <article class="list-card">

                    <h3>
                        📚
                        ${esc(
                            x.title||"Note"
                        )}
                    </h3>

                    <p>
                        ${esc(
                            x.text||
                            x.note||
                            ""
                        )}
                    </p>

                </article>
            `
        ).join("")
        :`
            <div class="empty-state">
                No notes published yet.
            </div>
        `
}

async function renderAnnouncements(){
    const arr=
        await getPublished(
            "announcements"
        );

    $("homeAnnouncements").innerHTML=
        arr.length
        ?arr
            .slice(0,6)
            .map(
                x=>`
                    <article class="list-card">

                        <h3>
                            📢
                            ${esc(
                                x.title||
                                "Announcement"
                            )}
                        </h3>

                        <p>
                            ${esc(
                                x.text||""
                            )}
                        </p>

                    </article>
                `
            )
            .join("")
        :`
            <div class="empty-state">
                No announcements.
            </div>
        `
}

async function renderGroups(){
    await loadStudents();

    const snap=
        await getDocs(
            collection(db,"groups")
        );

    state.groups=
        snap.docs
        .map(d=>({
            id:d.id,
            ...d.data()
        }))
        .filter(
            g=>
                !g.disabled &&
                (
                    (g.memberIds||[])
                        .includes(
                            state.user?.id
                        ) ||
                    state.user?.isOwner
                )
        );

    const list=$("groupsList");

    list.innerHTML=
        state.groups.length
        ?state.groups.map(
            g=>`
                <button
                    class="list-card"
                    data-group-id="${g.id}"
                    style="text-align:left"
                >

                    <h3>
                        👥
                        ${esc(g.name)}
                    </h3>

                    <p>
                        ${(g.memberIds||[]).length}
                        members · 🔒 Private
                    </p>

                </button>
            `
        ).join("")
        :`
            <div class="empty-state">
                No groups yet.
            </div>
        `;

    list
        .querySelectorAll("[data-group-id]")
        .forEach(
            b=>
                b.onclick=()=>
                    openGroup(
                        b.dataset.groupId
                    )
        )
}

async function openGroup(id){
    const g=
        state.groups.find(
            x=>x.id===id
        );

    if(!g)return;

    openModal(
        "🔒 "+g.name,
        `
            <p>
                This is a private group.
                Enter the group password.
            </p>

            <input
                id="groupAccessPassword"
                class="text-input"
                type="password"
                placeholder="Group password"
            >

            <button
                id="groupAccessBtn"
                class="primary-btn"
            >
                Open Group
            </button>

            <div id="groupAccessResult"></div>
        `
    );

    $("groupAccessBtn").onclick=
        async()=>{
            const p=
                $("groupAccessPassword")
                .value;

            const h=await hash(p);

            if(h!==g.passwordHash){
                $("groupAccessResult")
                    .textContent=
                    "Wrong password ❌";
                return
            }

            closeModal();

            toast("Group opened");

            openModal(
                g.name,
                `
                    <h3>Members</h3>

                    <p>
                        ${
                            (g.memberNames||[])
                            .map(esc)
                            .join(", ")
                        }
                    </p>

                    <p class="muted">
                        Group chat interface can be
                        extended here without changing
                        your private group membership.
                    </p>
                `
            )
        }
}

async function setupGroupCreation(){
    await loadStudents();

    state.selectedMembers=[];

    $("groupModal")
        .classList.remove("hidden");

    $("groupMemberSearch").value="";

    $("groupMemberResults")
        .innerHTML="";

    $("selectedGroupMembers")
        .innerHTML=""
}

function renderMemberResults(){
    const q=
        $("groupMemberSearch")
        .value
        .trim();

    const list=
        $("groupMemberResults");

    list.innerHTML="";

    state.students
        .filter(
            s=>
                s.status==="active" &&
                s.id!==state.user.id &&
                (s.phone||"").includes(q)
        )
        .forEach(s=>{
            const b=
                document.createElement("button");

            b.type="button";

            b.className="person-row";

            b.innerHTML=`
                <span class="avatar">
                    ${esc(
                        (s.name||"S")[0]
                    )}
                </span>

                <span>
                    <b>
                        ${esc(s.name)}
                    </b>

                    <small>
                        ${esc(s.phone)}
                    </small>
                </span>
            `;

            b.onclick=()=>{
                if(
                    !state.selectedMembers
                    .some(
                        x=>x.id===s.id
                    )
                ){
                    state.selectedMembers
                        .push(s)
                }

                renderSelectedMembers()
            };

            list.appendChild(b)
        })
}

function renderSelectedMembers(){
    $("selectedGroupMembers")
        .innerHTML=
        state.selectedMembers
        .map(
            s=>`
                <span class="chip">
                    ${esc(s.name)}

                    <button
                        type="button"
                        data-remove="${s.id}"
                    >
                        ×
                    </button>
                </span>
            `
        )
        .join("");

    $("selectedGroupMembers")
        .querySelectorAll("[data-remove]")
        .forEach(
            b=>
                b.onclick=()=>{
                    state.selectedMembers=
                        state.selectedMembers
                        .filter(
                            x=>
                                x.id!==b.dataset.remove
                        );

                    renderSelectedMembers()
                }
        )
}

async function createGroup(e){
    e.preventDefault();

    if(!can("groups"))return;

    const n=
        $("groupNameInput")
        .value
        .trim();

    const p=
        $("groupPasswordInput")
        .value;

    if(!n||!p)return;

    const members=[
        state.user,
        ...state.selectedMembers
    ];

    const passwordHash=
        await hash(p);

    await addDoc(
        collection(db,"groups"),
        {
            name:n,
            creatorId:
                state.user.id,
            creatorName:name(),
            memberIds:
                members.map(
                    x=>x.id
                ),
            memberNames:
                members.map(
                    x=>x.name
                ),
            passwordHash,
            disabled:false,
            createdAt:
                serverTimestamp()
        }
    );

    $("groupModal")
        .classList.add("hidden");

    toast("Group created");

    await renderGroups();

    await logActivity(
        "Group created: "+n
    )
}

async function loadOwner(){
    if(!state.user?.isOwner)return;

    await loadStudents();

    const all=state.students;

    $("ownerTotalStudents")
        .textContent=all.length;

    $("ownerOnlineStudents")
        .textContent=
        all.filter(
            s=>s.online
        ).length;

    $("ownerPendingStudents")
        .textContent=
        all.filter(
            s=>s.status==="pending"
        ).length;

    try{
        $("ownerTotalMessages")
            .textContent=
            (
                await getDocs(
                    collection(
                        db,
                        "messages"
                    )
                )
            ).size;

        $("ownerTotalGroups")
            .textContent=
            (
                await getDocs(
                    collection(
                        db,
                        "groups"
                    )
                )
            ).size;

        $("ownerTotalHomework")
            .textContent=
            (
                await getDocs(
                    collection(
                        db,
                        "homework"
                    )
                )
            ).size
    }catch(_){}

    renderOwnerPeople();
    renderApprovals();
    renderOwnerGroups();
    renderOwnerContent();
    renderActivity()
}

function renderOwnerPeople(){
    const term=
        ($("ownerStudentSearch").value||"")
        .toLowerCase();

    const list=
        $("ownerPeopleList");

    list.innerHTML=
        state.students
        .filter(
            s=>
                (s.name||"")
                .toLowerCase()
                .includes(term) ||
                (s.phone||"")
                .includes(term)
        )
        .map(
            s=>`
                <button
                    class="person-row"
                    data-student="${s.id}"
                >

                    <span class="avatar">
                        ${esc(
                            (s.name||"S")
                            [0]
                        )}
                    </span>

                    <span>
                        <b>
                            ${esc(s.name)}
                        </b>

                        <small>
                            ${esc(s.phone)}
                            ·
                            ${esc(
                                s.status||
                                "pending"
                            )}
                        </small>
                    </span>

                </button>
            `
        )
        .join("")
        ||
        `
            <div class="empty-state">
                No students.
            </div>
        `;

    list
        .querySelectorAll("[data-student]")
        .forEach(
            b=>
                b.onclick=()=>
                    showStudent(
                        b.dataset.student
                    )
        )
}

function showStudent(id){
    const s=
        state.students.find(
            x=>x.id===id
        );

    if(!s)return;

    const exp=
        s.permissionExpiresAt
        ?new Date(
            s.permissionExpiresAt
        ).toLocaleString("en-IN")
        :"Not set";

    $("ownerPersonDetails")
        .innerHTML=`
            <div class="profile-card">

                <div class="avatar">
                    ${esc(
                        (s.name||"S")[0]
                    )}
                </div>

                <div>
                    <h2>
                        ${esc(s.name)}
                    </h2>

                    <p>
                        ${esc(s.phone)}
                    </p>
                </div>

            </div>

            <p>
                <b>Status:</b>
                ${esc(
                    s.status||"pending"
                )}
            </p>

            <p>
                <b>Permission:</b>
                ${esc(
                    s.permission||"normal"
                )}
            </p>

            <p>
                <b>Permission expiry:</b>
                ${esc(exp)}
            </p>

            <div class="content-actions">

                <button
                    class="primary-btn"
                    id="approveStudent"
                >
                    Allow 24h
                </button>

                <button
                    class="secondary-btn"
                    id="normalStudent"
                >
                    Normal 24h
                </button>

                <button
                    class="danger-btn"
                    id="denyStudent"
                >
                    Don't Allow
                </button>

            </div>

            <button
                class="danger-btn"
                id="blockStudent"
            >
                ${
                    s.status==="blocked"
                    ?"Unblock"
                    :"Block"
                }
            </button>
        `;

    $("approveStudent").onclick=
        ()=>setPermission(
            s,
            "full",
            true
        );

    $("normalStudent").onclick=
        ()=>setPermission(
            s,
            "normal",
            true
        );

    $("denyStudent").onclick=
        ()=>setPermission(
            s,
            "none",
            false
        );

    $("blockStudent").onclick=
        ()=>toggleBlock(s)
}

async function setPermission(
    s,
    p,
    active
){
    const patch={
        permission:p,
        status:
            active
            ?"active"
            :"rejected",
        permissionGrantedAt:
            active
            ?Date.now()
            :null,
        permissionExpiresAt:
            active
            ?Date.now()+
                24*60*60*1000
            :null
    };

    await updateDoc(
        doc(db,"students",s.id),
        patch
    );

    Object.assign(
        s,
        patch
    );

    toast(
        active
        ?"Allowed for 24 hours"
        :"Access denied"
    );

    await logActivity(
        `${s.name}: ${p}`
    );

    loadOwner()
}

async function toggleBlock(s){
    const status=
        s.status==="blocked"
        ?"active"
        :"blocked";

    await updateDoc(
        doc(db,"students",s.id),
        {status}
    );

    s.status=status;

    toast(
        status==="blocked"
        ?"Student blocked"
        :"Student unblocked"
    );

    loadOwner()
}

function renderApprovals(){
    $("ownerApprovalList")
        .innerHTML=
        state.students
        .filter(
            s=>s.status==="pending"
        )
        .map(
            s=>`
                <div class="list-card">

                    <h3>
                        ${esc(s.name)}
                    </h3>

                    <p>
                        ${esc(s.phone)}
                    </p>

                    <div class="content-actions">

                        <button
                            class="primary-btn"
                            data-ap="${s.id}"
                        >
                            Approve 24h
                        </button>

                        <button
                            class="danger-btn"
                            data-re="${s.id}"
                        >
                            Reject
                        </button>

                    </div>

                </div>
            `
        )
        .join("")
        ||
        `
            <div class="empty-state">
                No pending approvals.
            </div>
        `;

    $("ownerApprovalList")
        .querySelectorAll("[data-ap]")
        .forEach(
            b=>
                b.onclick=()=>{
                    const s=
                        state.students.find(
                            x=>
                                x.id===
                                b.dataset.ap
                        );

                    setPermission(
                        s,
                        "normal",
                        true
                    )
                }
        );

    $("ownerApprovalList")
        .querySelectorAll("[data-re]")
        .forEach(
            b=>
                b.onclick=()=>{
                    const s=
                        state.students.find(
                            x=>
                                x.id===
                                b.dataset.re
                        );

                    setPermission(
                        s,
                        "none",
                        false
                    )
                }
        )
}

async function renderOwnerGroups(){
    const snap=
        await getDocs(
            collection(db,"groups")
        );

    const groups=
        snap.docs.map(
            d=>({
                id:d.id,
                ...d.data()
            })
        );

    $("ownerGroupsList")
        .innerHTML=
        groups
        .map(
            g=>`
                <div class="list-card">

                    <h3>
                        👥
                        ${esc(g.name)}
                    </h3>

                    <p>
                        Creator:
                        ${esc(
                            g.creatorName||""
                        )}
                    </p>

                    <p>
                        Members:
                        ${esc(
                            (g.memberNames||[])
                            .join(", ")
                        )}
                    </p>

                    <div class="content-actions">

                        <button
                            class="secondary-btn"
                            data-gdisable="${g.id}"
                        >
                            ${
                                g.disabled
                                ?"Enable"
                                :"Disable"
                            }
                        </button>

                        <button
                            class="danger-btn"
                            data-gdelete="${g.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `
        )
        .join("")
        ||
        `
            <div class="empty-state">
                No groups.
            </div>
        `;

    $("ownerGroupsList")
        .querySelectorAll("[data-gdisable]")
        .forEach(
            b=>
                b.onclick=async()=>{
                    const g=
                        groups.find(
                            x=>
                                x.id===
                                b.dataset.gdisable
                        );

                    await updateDoc(
                        doc(
                            db,
                            "groups",
                            g.id
                        ),
                        {
                            disabled:
                                !g.disabled
                        }
                    );

                    loadOwner()
                }
        );

    $("ownerGroupsList")
        .querySelectorAll("[data-gdelete]")
        .forEach(
            b=>
                b.onclick=async()=>{
                    if(
                        confirm(
                            "Delete this group?"
                        )
                    ){
                        await deleteDoc(
                            doc(
                                db,
                                "groups",
                                b.dataset.gdelete
                            )
                        );

                        loadOwner()
                    }
                }
        )
}

function contentModal(
    type,
    existing=null
){
    const title=
        existing
        ?"Edit "+type
        :"Add "+type;

    const data=
        existing||{};

    openModal(
        title,
        `
            <input
                id="cTitle"
                class="text-input"
                placeholder="Title"
                value="${esc(
                    data.title||""
                )}"
            >

            <textarea
                id="cText"
                class="text-input"
                rows="7"
                placeholder="Content"
            >${esc(
                data.text||
                data.description||
                ""
            )}</textarea>

            <label>
                <input
                    id="cPublished"
                    type="checkbox"
                    ${
                        data.published!==false
                        ?"checked"
                        :""
                    }
                >
                Published
            </label>

            <button
                id="cSave"
                class="primary-btn"
            >
                Save
            </button>
        `
    );

    $("cSave").onclick=
        async()=>{
            const payload={
                title:
                    $("cTitle")
                    .value
                    .trim(),

                text:
                    $("cText")
                    .value
                    .trim(),

                published:
                    $("cPublished")
                    .checked,

                updatedAt:
                    serverTimestamp()
            };

            if(
                !payload.title||
                !payload.text
            ){
                return toast(
                    "Title and content required",
                    "!"
                )
            }

            const collectionName=
                type.toLowerCase()==="announcement"
                ?"announcements"
                :type.toLowerCase();

            if(existing){
                await updateDoc(
                    doc(
                        db,
                        collectionName,
                        existing.id
                    ),
                    payload
                )
            }else{
                await addDoc(
                    collection(
                        db,
                        collectionName
                    ),
                    {
                        ...payload,
                        createdAt:
                            serverTimestamp()
                    }
                )
            }

            closeModal();

            toast(
                type+" saved"
            );

            loadOwner();
            loadContent()
        }
}

async function renderOwnerContent(){
    for(
        const [col,id]
        of [
            ["homework","ownerHomeworkList"],
            ["notes","ownerNotesList"],
            ["announcements","ownerAnnouncementsList"]
        ]
    ){
        let snap;

        try{
            snap=
                await getDocs(
                    collection(
                        db,
                        col
                    )
                )
        }catch(_){
            continue
        }

        const arr=
            snap.docs.map(
                d=>({
                    id:d.id,
                    ...d.data()
                })
            );

        $(id).innerHTML=
            arr.map(
                x=>`
                    <div class="list-card">

                        <h3>
                            ${esc(
                                x.title||
                                "Untitled"
                            )}
                        </h3>

                        <p>
                            ${esc(
                                x.text||
                                x.description||
                                ""
                            )}
                        </p>

                        <div class="content-actions">

                            <button
                                class="secondary-btn"
                                data-edit-col="${col}"
                                data-edit-id="${x.id}"
                            >
                                Edit
                            </button>

                            <button
                                class="danger-btn"
                                data-del-col="${col}"
                                data-del-id="${x.id}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                `
            )
            .join("")
            ||
            `
                <div class="empty-state">
                    No items.
                </div>
            `;

        $(id)
            .querySelectorAll("[data-edit-id]")
            .forEach(
                b=>
                    b.onclick=async()=>{
                        const d=
                            await getDoc(
                                doc(
                                    db,
                                    b.dataset.editCol,
                                    b.dataset.editId
                                )
                            );

                        contentModal(
                            b.dataset.editCol==="homework"
                            ?"Homework"
                            :b.dataset.editCol==="notes"
                            ?"Note"
                            :"Announcement",
                            {
                                id:b.dataset.editId,
                                ...d.data()
                            }
                        )
                    }
            );

        $(id)
            .querySelectorAll("[data-del-id]")
            .forEach(
                b=>
                    b.onclick=async()=>{
                        if(
                            confirm(
                                "Delete this item?"
                            )
                        ){
                            await deleteDoc(
                                doc(
                                    db,
                                    b.dataset.delCol,
                                    b.dataset.delId
                                )
                            );

                            loadOwner();
                            loadContent()
                        }
                    }
            )
    }
}

async function renderActivity(){
    try{
        const snap=
            await getDocs(
                collection(
                    db,
                    "activityLogs"
                )
            );

        const arr=
            snap.docs
            .map(d=>d.data())
            .sort(
                (a,b)=>
                    (
                        b.createdAt?.toMillis
                        ?b.createdAt.toMillis()
                        :b.createdAt||0
                    )-
                    (
                        a.createdAt?.toMillis
                        ?a.createdAt.toMillis()
                        :a.createdAt||0
                    )
            )
            .slice(0,100);

        $("ownerActivityLog")
            .innerHTML=
            arr.map(
                x=>`
                    <div class="list-card">

                        <b>
                            ${esc(x.text)}
                        </b>

                        <p>
                            ${esc(
                                x.actor||""
                            )}
                            ·
                            ${stamp(
                                x.createdAt
                            )}
                        </p>

                    </div>
                `
            )
            .join("")
            ||
            `
                <div class="empty-state">
                    No activity yet.
                </div>
            `

    }catch(_){}
}

function wireOwner(){
    document
        .querySelectorAll(".owner-tab")
        .forEach(
            t=>
                t.onclick=()=>{
                    document
                        .querySelectorAll(
                            ".owner-tab"
                        )
                        .forEach(
                            x=>
                                x.classList
                                .remove("active")
                        );

                    document
                        .querySelectorAll(
                            ".owner-section"
                        )
                        .forEach(
                            x=>
                                x.classList
                                .remove("active")
                        );

                    t.classList.add("active");

                    $("ownerSection-"+t.dataset.ownerSection)
                        .classList.add("active");

                    if(
                        t.dataset.ownerSection===
                        "students"
                    ){
                        renderOwnerPeople()
                    }

                    if(
                        t.dataset.ownerSection===
                        "activity"
                    ){
                        renderActivity()
                    }
                }
        );

    $("ownerStudentSearch").oninput=
        renderOwnerPeople;

    $("ownerAddHomeworkBtn").onclick=
        ()=>contentModal("Homework");

    $("ownerAddNoteBtn").onclick=
        ()=>contentModal("Note");

    $("ownerAddAnnouncementBtn").onclick=
        ()=>contentModal("Announcement");

    $("saveGlobalSettingsBtn").onclick=
        async()=>{
            await saveSettings({
                appName:
                    $("ownerAppName")
                    .value
                    .trim()||
                    "StudyConnect",

                language:
                    $("ownerGlobalLanguage")
                    .value,

                theme:
                    $("ownerGlobalTheme")
                    .value,

                welcomeAnimation:
                    $("ownerWelcomeAnimation")
                    .checked
            });

            toast(
                "Global settings saved"
            );

            await logActivity(
                "Global settings updated"
            )
        };

    $("saveFeatureSettingsBtn").onclick=
        async()=>{
            const features={
                chat:
                    $("featureChat").checked,

                groups:
                    $("featureGroups").checked,

                homework:
                    $("featureHomework").checked,

                notes:
                    $("featureNotes").checked,

                announcements:
                    $("featureAnnouncements").checked,

                registration:
                    $("featureRegistration").checked,

                maintenance:
                    $("featureMaintenance").checked
            };

            await saveSettings({
                features
            });

            applyAccess();

            toast(
                "Feature settings saved"
            );

            await logActivity(
                "Feature settings updated"
            )
        };

    $("changeOwnerPasswordBtn").onclick=
        async()=>{
            const a=
                $("ownerNewPassword")
                .value;

            const b=
                $("ownerConfirmPassword")
                .value;

            if(
                a.length<4||
                a!==b
            ){
                return toast(
                    "Password match नहीं हुआ",
                    "!"
                )
            }

            await saveSettings({
                ownerPasswordHash:
                    await hash(a)
            });

            $("ownerNewPassword").value="";
            $("ownerConfirmPassword").value="";

            toast(
                "Owner password changed"
            );

            await logActivity(
                "Owner password changed"
            )
        }
}

async function init(){
    wireNavigation();

    wireOwner();

    $("createGroupBtn").onclick=
        setupGroupCreation;

    $("groupMemberSearch").oninput=
        renderMemberResults;

    $("groupForm").onsubmit=
        createGroup;

    $("chatSearchInput").oninput=
        renderPeople;

    $("notificationToggle").onchange=
        ()=>{
            localStorage.setItem(
                "studyNotifications",
                $("notificationToggle").checked
            )
        };

    $("loginForm").onsubmit=
        loginSubmit;

    const savedTheme=
        localStorage.getItem(
            "studyTheme"
        );

    if(savedTheme){
        $("themeSelect").value=
            savedTheme;

        setTheme(savedTheme)
    }

    await ensureAuth();

    await getSettings();

    $("languageSelect").value=
        state.settings.language;

    $("themeSelect").value=
        state.settings.theme;

    await loadStudents();

    const saved=
        localStorage.getItem(
            "studyProfileId"
        );

    if(saved){
        const s=
            await getDoc(
                doc(
                    db,
                    "students",
                    saved
                )
            ).catch(()=>null);

        if(
            s?.exists()
        ){
            state.user={
                id:saved,
                ...s.data(),
                isOwner:false
            };

            if(
                s.data().status!=="blocked"
            ){
                await openApp(false)
            }
        }
    }
}

init().catch(e=>{
    console.error(e);

    $("loginMessage").textContent=
        "App start नहीं हुआ। Firebase settings check करें।"
});
