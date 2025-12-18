/*********************************************************
 * AI CHATBOT FOR COLLEGE ENQUIRY – FINAL STABLE VERSION
 * Frontend Controller (Student + Admin + Chatbot)
 *********************************************************/

/* ===================== CONFIG ===================== */
let sessionToken = localStorage.getItem("sessionToken");
const API = "https://college-chatbot-backend-0x9x.onrender.com/api";



/* ===================== GLOBAL STATE ===================== */
let collegesCache = [];
let selectedCollege = null;
let selectedAdminCollegeId = null;

/* ===================== DOM REFERENCES ===================== */

/* Auth */
const authBox = document.getElementById("authBox");
const adminLoginBox = document.getElementById("adminLoginBox");
const studentBox = document.getElementById("studentBox");
const adminDashboard = document.getElementById("adminDashboard");
const welcome = document.getElementById("welcome");
const studentInfo = document.getElementById("studentInfo");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const percentageInput = document.getElementById("percentage");

/* Admin */
const collegeName = document.getElementById("collegeName");
const collegeInfo = document.getElementById("collegeInfo");
const collegeCutoff = document.getElementById("collegeCutoff");
const collegeWebsite = document.getElementById("collegeWebsite");
const collegeList = document.getElementById("collegeList");

const staffCollegeSelect = document.getElementById("staffCollegeSelect");
const staffNameInput = document.getElementById("staffName");
const staffRoleInput = document.getElementById("staffRole");
const staffList = document.getElementById("staffList");

const facilityCollegeSelect = document.getElementById("facilityCollegeSelect");
const facilityNameInput = document.getElementById("facilityName");
const facilityList = document.getElementById("facilityList");

/* Student Profile */
const studentCollegeList = document.getElementById("studentCollegeList");
const collegeProfile = document.getElementById("collegeProfile");
const profileName = document.getElementById("profileName");
const profileStatus = document.getElementById("profileStatus");
const profileLocation = document.getElementById("profileLocation");
const profileWebsite = document.getElementById("profileWebsite");
const profileStaff = document.getElementById("profileStaff");
const profileFacilities = document.getElementById("profileFacilities");

/* Chat */
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");


/* ===================== ADMIN DROPDOWN SYNC ===================== */
staffCollegeSelect.addEventListener("change", () => {
  selectedAdminCollegeId = staffCollegeSelect.value;
  facilityCollegeSelect.value = selectedAdminCollegeId;
  renderStaff();
  renderFacilities();
});

facilityCollegeSelect.addEventListener("change", () => {
  selectedAdminCollegeId = facilityCollegeSelect.value;
  staffCollegeSelect.value = selectedAdminCollegeId;
  renderStaff();
  renderFacilities();
});



/* ===================== AUTH ===================== */
async function register() {
  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      percentage: percentageInput.value
    })
  });
  const data = await res.json();
  alert(data.success ? "Registration successful" : data.error);
}

async function login() {
  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    // SUCCESS
    localStorage.setItem("sessionToken", data.token);

    authBox.classList.add("hidden");
    studentBox.classList.remove("hidden");

    welcome.innerText = "Welcome " + data.user.name;
    studentInfo.innerText = `Percentage: ${data.user.percentage || "N/A"}%`;

    await loadStudentColleges();

  } catch (err) {
    console.error("Login error:", err);
    alert("Unable to connect to server");
  }
}


  const data = await res.json();
  if (!data.success) return alert("Invalid login");

  sessionToken = data.token;
  localStorage.setItem("sessionToken", sessionToken);

  authBox.classList.add("hidden");
  studentBox.classList.remove("hidden");

  welcome.innerText = "Welcome " + data.user.name;
  studentInfo.innerText = `Percentage: ${data.user.percentage || "N/A"}%`;

  await loadStudentColleges();
  botMessage("👋 Select a college or ask about cutoff, staff, facilities.");
}

function logout() {
  localStorage.removeItem("sessionToken");
  studentBox.classList.add("hidden");
  authBox.classList.remove("hidden");
}

/* ===================== ADMIN LOGIN ===================== */
async function adminLogin() {
  const res = await fetch(API + "/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: adminUser.value,
      password: adminPass.value
    })
  });

  const data = await res.json();
  if (!data.success) return alert("Invalid admin credentials");

  authBox.classList.add("hidden");
  adminLoginBox.classList.add("hidden");
  adminDashboard.classList.remove("hidden");

  loadAdminColleges();
}

function adminLogout() {
  selectedAdminCollegeId = null;
  collegesCache = [];
  adminDashboard.classList.add("hidden");
  authBox.classList.remove("hidden");
}


/* ===================== ADMIN COLLEGES ===================== */
async function loadAdminColleges() {
  const res = await fetch(API + "/colleges");
  collegesCache = await res.json();

  collegeList.innerHTML = "";
  staffCollegeSelect.innerHTML = "";
  facilityCollegeSelect.innerHTML = "";

  collegesCache.forEach(c => {
    collegeList.innerHTML += `
      <li>
        <b>${c.name}</b><br>
        Cutoff: ${c.cutoff || "N/A"}%<br>
        <button onclick="selectAdminCollege('${c.id}')">Edit</button>
        <button onclick="deleteCollege('${c.id}')">Delete</button>
      </li>
    `;
    staffCollegeSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    facilityCollegeSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });

  if (collegesCache.length > 0) {
    selectedAdminCollegeId = collegesCache[0].id;
    staffCollegeSelect.value = selectedAdminCollegeId;
    facilityCollegeSelect.value = selectedAdminCollegeId;
    renderAdminColleges();

  }
}

function selectAdminCollege(id) {
  const c = collegesCache.find(x => x.id == id);
  if (!c) return;

  selectedAdminCollegeId = id;
  collegeName.value = c.name;
  collegeInfo.value = c.info || "";
  collegeCutoff.value = c.cutoff || "";
  collegeWebsite.value = c.website || "";

  staffCollegeSelect.value = id;
  facilityCollegeSelect.value = id;

  renderStaff();
  renderFacilities();
}

/* ===================== ADMIN CRUD ===================== */
function addCollege() {
  collegesCache.push({
    id: Date.now(),
    name: collegeName.value,
    info: collegeInfo.value,
    cutoff: collegeCutoff.value,
    website: collegeWebsite.value,
    staff: [],
    facilities: []
  });

  clearCollegeForm();
  renderAdminColleges();
}


function updateCollege() {
  const c = collegesCache.find(c => c.id == selectedAdminCollegeId);
  if (!c) return;

  c.name = collegeName.value;
  c.info = collegeInfo.value;
  c.cutoff = collegeCutoff.value;
  c.website = collegeWebsite.value;

  renderAdminColleges();
}


async function deleteCollege(id) {
  if (!confirm("Delete this college?")) return;
  await fetch(API + "/colleges/" + id, { method: "DELETE" });
  loadAdminColleges();
}

function clearCollegeForm() {
  collegeName.value = "";
  collegeInfo.value = "";
  collegeCutoff.value = "";
  collegeWebsite.value = "";
}


function renderAdminColleges() {
  collegeList.innerHTML = "";
  staffCollegeSelect.innerHTML = "";
  facilityCollegeSelect.innerHTML = "";

  collegesCache.forEach(c => {
    collegeList.innerHTML += `
      <li>
        <b>${c.name}</b><br>
        Cutoff: ${c.cutoff || "N/A"}%<br>
        <button onclick="selectAdminCollege('${c.id}')">Edit</button>
      </li>
    `;

    staffCollegeSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    facilityCollegeSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });

  if (collegesCache.length > 0) {
    selectedAdminCollegeId = staffCollegeSelect.value;
    renderStaff();
    renderFacilities();
  }
}


/* ===================== STAFF ===================== */
function addStaff() {
  const c = collegesCache.find(c => c.id == selectedAdminCollegeId);
  if (!c) return;

  c.staff.push({
    name: staffNameInput.value,
    role: staffRoleInput.value
  });

  staffNameInput.value = "";
  staffRoleInput.value = "";
  renderStaff();
}


function renderStaff() {
  staffList.innerHTML = "";
  const c = collegesCache.find(x => x.id == staffCollegeSelect.value);
  if (!c || !c.staff) return;

  c.staff.forEach((s, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <b>${s.name}</b> (${s.role})
      <button onclick="editStaff(${index})">Edit</button>
      <button onclick="deleteStaff(${index})">Delete</button>
    `;
    staffList.appendChild(li);
  });
}
function editStaff(index) {
  const c = collegesCache.find(x => x.id == selectedAdminCollegeId);
  if (!c) return;

  staffNameInput.value = c.staff[index].name;
  staffRoleInput.value = c.staff[index].role;

  // overwrite on next add
  deleteStaff(index);
}

function deleteStaff(index) {
  const c = collegesCache.find(x => x.id == selectedAdminCollegeId);
  if (!c) return;

  c.staff.splice(index, 1);

  fetch(API + "/colleges/" + selectedAdminCollegeId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c)
  }).then(loadAdminColleges);
}


/* ===================== FACILITIES ===================== */
function addFacility() {
  const c = collegesCache.find(c => c.id == selectedAdminCollegeId);
  if (!c) return;

  c.facilities.push(facilityNameInput.value);
  facilityNameInput.value = "";
  renderFacilities();
}


function renderFacilities() {
  facilityList.innerHTML = "";
  const c = collegesCache.find(x => x.id == facilityCollegeSelect.value);
  if (!c || !c.facilities) return;

  c.facilities.forEach((f, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${f}
      <button onclick="editFacility(${index})">Edit</button>
      <button onclick="deleteFacility(${index})">Delete</button>
    `;
    facilityList.appendChild(li);
  });
}
function editFacility(index) {
  const c = collegesCache.find(x => x.id == selectedAdminCollegeId);
  if (!c) return;

  facilityNameInput.value = c.facilities[index];
  deleteFacility(index);
}

function deleteFacility(index) {
  const c = collegesCache.find(x => x.id == selectedAdminCollegeId);
  if (!c) return;

  c.facilities.splice(index, 1);

  fetch(API + "/colleges/" + selectedAdminCollegeId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c)
  }).then(loadAdminColleges);
}


/* ===================== STUDENT COLLEGES ===================== */
async function loadStudentColleges() {
  const res = await fetch(API + "/colleges");
  collegesCache = await res.json();

  studentCollegeList.innerHTML = "";
  collegesCache.forEach(c => {
    const li = document.createElement("li");
    li.className = "college-item";
    li.innerHTML = `<b>${c.name}</b>`;
    li.onclick = () => selectStudentCollege(c.id);
    studentCollegeList.appendChild(li);
  });
}

function selectStudentCollege(id) {
  selectedCollege = collegesCache.find(c => c.id == id);
  if (!selectedCollege) return;

  collegeProfile.classList.remove("hidden");
  profileName.innerText = selectedCollege.name;
  profileLocation.innerText = selectedCollege.location || "Ichalkaranji / Kolhapur";
  profileWebsite.innerText = selectedCollege.website || "N/A";
  profileWebsite.href = selectedCollege.website || "#";

  const p = parseFloat(percentageInput.value || 0);
  profileStatus.innerText =
    p >= selectedCollege.cutoff ? "🟢 Eligible" : "🔴 Not Eligible";

  profileStaff.innerHTML = "";
  selectedCollege.staff.forEach(s => {
    profileStaff.innerHTML += `<li>${s.name} (${s.role})</li>`;
  });

  profileFacilities.innerHTML = "";
  selectedCollege.facilities.forEach(f => {
    profileFacilities.innerHTML += `<li>${f}</li>`;
  });
}

/* ===================== CHATBOT ===================== */
function userMessage(msg) {
  chatBox.innerHTML += `<div class="userMsg">${msg}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function botMessage(msg) {
  chatBox.innerHTML += `<div class="botMsg">${msg}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const q = userInput.value.toLowerCase().trim();
  if (!q) return;

  userMessage(q);
  userInput.value = "";

  if (!selectedCollege) {
    botMessage("Please select a college first.");
    return;
  }

  if (q.includes("cutoff"))
    return botMessage(`Cutoff: ${selectedCollege.cutoff}%`);

  if (q.includes("website"))
    return botMessage(selectedCollege.website || "Website not available");

  if (q.includes("staff")) {
    selectedCollege.staff.forEach(s =>
      botMessage(`${s.name} (${s.role})`)
    );
    return;
  }

  if (q.includes("facility") || q.includes("facilities")) {
    selectedCollege.facilities.forEach(f =>
      botMessage(`✔ ${f}`)
    );
    return;
  }

  if (q.includes("admission"))
    return botMessage("Admissions are open. Please contact the college.");

  if (q.includes("recommend"))
    return botMessage("Recommendation is based on your percentage.");

  botMessage("Ask about cutoff, staff, facilities, website or admission.");
}

function quickAsk(text) {
  userInput.value = text;
  sendMessage();
}

async function restoreSession() {
  if (!sessionToken) return;

  const res = await fetch(API + "/session", {
    headers: { "x-session-token": sessionToken }
  });

  if (!res.ok) {
    localStorage.removeItem("sessionToken");
    return;
  }

  const data = await res.json();

  authBox.classList.add("hidden");
  studentBox.classList.remove("hidden");

  welcome.innerText = "Welcome " + data.user.name;
  studentInfo.innerText = `Percentage: ${data.user.percentage || "N/A"}%`;

  await loadStudentColleges();
}

staffCollegeSelect.onchange = () => {
  selectedAdminCollegeId = staffCollegeSelect.value;
  facilityCollegeSelect.value = selectedAdminCollegeId;
  renderStaff();
  renderFacilities();
};

facilityCollegeSelect.onchange = () => {
  selectedAdminCollegeId = facilityCollegeSelect.value;
  staffCollegeSelect.value = selectedAdminCollegeId;
  renderStaff();
  renderFacilities();
};



/* ===================== NAV ===================== */
function showAdminLogin() {
  authBox.classList.add("hidden");
  adminLoginBox.classList.remove("hidden");
}

function backToStudent() {
  adminLoginBox.classList.add("hidden");
  authBox.classList.remove("hidden");
}

/* ===================== GLOBAL EXPOSE ===================== */
Object.assign(window, {
  register,
  login,
  logout,
  adminLogin,
  adminLogout,
  addCollege,
  updateCollege,
  deleteCollege,
  addStaff,
  addFacility,
  sendMessage,
  quickAsk,
  showAdminLogin,
  backToStudent
});
restoreSession();

async function saveAllAdminChanges() {
  if (!confirm("Save all changes permanently?")) return;

  for (const college of collegesCache) {
    await fetch(API + "/colleges/" + college.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(college)
    });
  }

  alert("All changes saved");
  loadAdminColleges();
}
function discardAdminChanges() {
  if (!confirm("Discard all changes?")) return;
  loadAdminColleges();
}

async function restoreStudentSession() {
  const token = localStorage.getItem("sessionToken");
  if (!token) return;

  const res = await fetch(API + "/session", {
    headers: { "x-session-token": token }
  });

  if (!res.ok) {
    localStorage.removeItem("sessionToken");
    return;
  }

  const data = await res.json();

  authBox.classList.add("hidden");
  studentBox.classList.remove("hidden");

  welcome.innerText = "Welcome " + data.user.name;
  studentInfo.innerText = `Percentage: ${data.user.percentage || "N/A"}%`;

  await loadStudentColleges();
}
restoreStudentSession();
