console.log("APP RUNNING");

const reportDateInput = document.getElementById("reportDate");
const gFlorCountEl = document.getElementById("gFlorCount");
const opCountEl = document.getElementById("opCount");
const ipCountEl = document.getElementById("ipCount");
const debugBox = document.getElementById("debugBox");
const lasikCountEl = document.getElementById("lasikCount");
const injCountEl = document.getElementById("injCount");
const lastHeader = document.getElementById("lastPatientHeader");
let currentMode = "OP";

const btnOP = document.getElementById("btnOP");
const btnIP = document.getElementById("btnIP");
const btnLASIK = document.getElementById("btnLASIK");
const btnINJ = document.getElementById("btnINJ");
btnOP.classList.add("active");

function normalizeName(name) {
  return String(name || "")
    .toUpperCase()
    .replace("DR.", "")
    .replace(/[0-9]/g, "")
    .replace(/-/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .trim();
}

const IP_DOCTORS = [
  "Dr. 02 Abdulaziz  Al Rushood",
  "Dr. Qusai Mohammed",
  "Dr. 01 Adel Al Rushood",
  "Dr. Uday Al Owaifer",
  "Dr. Khaled  Al Otaibi",
  "Dr. Muath Al Rushood",
  "Dr. Sana Yassin",
  "Dr. Abdallah Al Owaid",
  "Dr. Mohanna Al Jindan",
  "Dr. Elham Al Tamimi",
  "Dr. Hind Al Dalgan",
  "Dr. Mofi Al Walmany",
  "Dr. Abdulrahman Al Ghadyan",
  "Dr. Abdulrahman  Al Hadlag"
].map(normalizeName);

const DAMMAM_DOCTORS = [
  "Dr. 02 Abdulaziz  Al Rushood",
  "Dr. Mohammaed Al Najar",
  "Dr. Mahdi Al junaidi",
  "Dr. Qusai Mohammed",
  "Dr. Waqar Mustafa",
  "Dr. Thuraya .",
  "Dr. 01 Adel Al Rushood",
  "Dr. Ahmed Ezzat",
  "Dr. Dalal Mohammed",
  "Dr. Uday Al Owaifer",
  "Dr. jessena .",
  "Dr. Khaled  Al Otaibi",
  "Dr. Muath Al Rushood",
  "Dr. Sara Mustafa",
  "Dr. Sashmtha .",
  "Dr. Sana Yassin",
  "Dr. Abdulaziz Al Somali",
  "Dr. Rayan mohammed",
  "Dr. Abdallah Al Owaid",
  "Dr. Mohanna Al Jindan",
  "Dr. Alaaldin Abdulmuneim",
  "Dr. Elham Al Tamimi",
  "Dr. Sherif Hassan",
  "Dr. Hind Al Dalgan",
  "Dr. Mofi Al Walmany",
  "Dr. Lolwa Aldahan",
  "Dr. Abdulrahman Al Ghadyan",
  "Dr. Abdulrahman  Al Hadlag",
  "Dr. Sana Saaed"
].map(normalizeName);
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function setDefaultDate() {
  const today = new Date();
  reportDateInput.value = formatDate(today);
}

async function loadDashboard() {
  try {
    const date = reportDateInput.value;
    debugBox.textContent = "Updating...";

    const res = await fetch(`/api/dashboard?date=${date}`);
    const result = await res.json();

    if (!res.ok || !result.ok) {
      debugBox.textContent = JSON.stringify(result, null, 2);
      return;
    }

    const opRows = Array.isArray(result.doctorsTable) ? result.doctorsTable : [];
    const ipRows = Array.isArray(result.ipDoctorsTable) ? result.ipDoctorsTable : [];

    opCountEl.textContent = result.counts?.dammamOpRecords ?? 0;
ipCountEl.textContent = result.counts?.dammamIpRecords ?? 0;
    gFlorCountEl.textContent = result.counts?.gFlor ?? 0;
lasikCountEl.textContent = result.counts?.lasikCount ?? result.counts?.lasikWorkup ?? 0;
injCountEl.textContent = result.counts?.injCount ?? 0;
    const doctorCountsEl = document.getElementById("doctorCounts");
    if (doctorCountsEl) {
      doctorCountsEl.innerHTML = `
        Consultant: ${result.doctors?.consultant ?? 0} |
        Specialist: ${result.doctors?.specialist ?? 0} |
        Optometry: ${result.doctors?.optometry ?? 0}
      `;
    }

    const tbody = document.querySelector("#doctorTable tbody");
    tbody.innerHTML = "";
// 🔥 إخفاء عمود Last Patient في LASIK و INJ
if (currentMode === "LASIK" || currentMode === "INJ") {
  lastHeader.style.display = "none";
} else {
  lastHeader.style.display = "";
}
    let rows = [];

    if (currentMode === "OP") {
  rows = opRows;
} else if (currentMode === "IP") {
  rows = ipRows.filter(d => {
    const n = normalizeName(d.name);
    return IP_DOCTORS.some(doc => n.includes(doc));
  });
} else if (currentMode === "LASIK") {
  rows = Array.isArray(result.lasikTable) ? result.lasikTable : [];
}
else if (currentMode === "INJ") {
  rows = Array.isArray(result.injTable) ? result.injTable : [];
}

    rows.forEach((d) => {
      const tr = document.createElement("tr");
      if (currentMode === "LASIK" || currentMode === "INJ") {
  tr.innerHTML = `
    <td>${d.name ?? "-"}</td>
    <td>${d.total ?? 0}</td>
  `;
} else {
  tr.innerHTML = `
    <td>${d.name ?? "-"}</td>
    <td>${d.total ?? 0}</td>
    <td>${d.lastTime ? new Date(d.lastTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
  `;
}
      tbody.appendChild(tr);
    });

    debugBox.textContent =
  `Selected Date: ${result.date}\n` +
  `OP Patients: ${result.counts?.dammamOpPatients ?? 0}\n` +
  `IP Patients: ${result.counts?.dammamIpPatients ?? 0}\n` +
  `Lasik Workup: ${result.counts?.lasikWorkup ?? 0}`;
  } catch (err) {
    debugBox.textContent = `Error: ${err.message}`;
    console.error(err);
  }
}

function resetButtons() {
  btnOP.classList.remove("active");
  btnIP.classList.remove("active");
  btnLASIK.classList.remove("active");
  btnINJ.classList.remove("active");
}

btnOP.addEventListener("click", () => {
  currentMode = "OP";
  resetButtons();
  btnOP.classList.add("active");
  loadDashboard();
});

btnIP.addEventListener("click", () => {
  currentMode = "IP";
  resetButtons();
  btnIP.classList.add("active");
  loadDashboard();
});

btnLASIK.addEventListener("click", () => {
  currentMode = "LASIK";
  resetButtons();
  btnLASIK.classList.add("active");
  loadDashboard();
});

btnINJ.addEventListener("click", () => {
  currentMode = "INJ";
  resetButtons();
  btnINJ.classList.add("active");
  loadDashboard();
});
reportDateInput.addEventListener("change", loadDashboard);

setDefaultDate();
loadDashboard();

setInterval(() => {
  console.log("Auto refresh...");
  loadDashboard();
}, 30000);