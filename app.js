console.log("APP RUNNING");

const reportDateInput = document.getElementById("reportDate");
const gFlorCountEl = document.getElementById("gFlorCount");
const opCountEl = document.getElementById("opCount");
const ipCountEl = document.getElementById("ipCount");
const debugBox = document.getElementById("debugBox");

let currentMode = "OP";

const btnOP = document.getElementById("btnOP");
const btnIP = document.getElementById("btnIP");
btnOP.classList.add("active");

function normalizeName(name) {
  return String(name || "")
    .toUpperCase()
    .replace("DR.", "")              
    .replace(/[0-9]/g, "")           
    .replace(/-/g, " ")              
    .replace(/\./g, "")              
    .replace(/\s+/g, " ")            
    .trim();
}

const IP_DOCTORS = [
  "ADEL RUSHOOD",
  "ABDULAZIZ RUSHOOD",
  "MOHANNA AL JINDAN",
  "MUATH ALRUSHOOD",
  "GHADYAN ABDULRAHMAN",
  "ABDALLAH ALOWAID",
  "ELHAM AL TAMIMI",
  "QUSAI MOHAMMED",
  "MOFI ALWALMANY",
  "HIND AL DALGAN",
  "SOMALI ABDULAZIZ",
  "KHALED ALOTAIBI",
  "UDAY AL OWAIFER",
  "ABDULRAHMAN ALHADLAG",
  "SANA YASSIN"
].map(normalizeName);

const DAMMAM_DOCTORS = [
  "ADEL RUSHOOD",
  "ABDULAZIZ RUSHOOD",
  "MOHANNA AL JINDAN",
  "MUATH ALRUSHOOD",
  "GHADYAN ABDULRAHMAN",
  "ABDALLAH ALOWAID",
  "ELHAM AL TAMIMI",
  "QUSAI MOHAMMED",
  "MOFI ALWALMANY",
  "HIND AL DALGAN",
  "SOMALI ABDULAZIZ",
  "KHALED ALOTAIBI",
  "UDAY AL OWAIFER",
  "ABDULRAHMAN ALHADLAG",
  "SANA YASSIN",
  "AHMED EZZAT",
  "WAQAR MUSTAFA",
  "NAJAR MOHAMMAED",
  "RAYAN MOHAMEED",
  "SANA SAAED",
  "SARA MUSTAFA",
  "DALLAL MOHAMMAD AL MADANI",
  "JESEENA JAMALUDIN",
  "THURAYA",
  "SUSHMITHA ARCOT",
  "ALAAELDIN ABDULMONEIM",
  "MAHDI ABDULLA AL JUNAIDI",
  "SHERIF HASSAN",
  "QURAIN ABDULAZIZ"
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

    const res = await fetch(`https://kahhal-dashboard.onrender.com/api/dashboard?date=${date}`);
    const result = await res.json();

    if (!res.ok || !result.ok) {
      debugBox.textContent = JSON.stringify(result, null, 2);
      return;
    }

    const opRows = Array.isArray(result.doctorsTable) ? result.doctorsTable : [];
    const ipRows = Array.isArray(result.ipDoctorsTable) ? result.ipDoctorsTable : [];

    opCountEl.textContent = result.counts?.dammamOpPatients ?? 0;
    ipCountEl.textContent = result.counts?.dammamIpPatients ?? 0;
    gFlorCountEl.textContent = result.counts?.gFlor ?? 0;

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

    let rows = [];

    if (currentMode === "OP") {
      rows = opRows;
    } else {
      rows = ipRows.filter(d => {
        const n = normalizeName(d.name);
        return IP_DOCTORS.some(doc => n.includes(doc));
      });
    }

    rows.forEach((d) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.name ?? "-"}</td>
        <td>${d.total ?? 0}</td>
        <td>${d.lastTime ? new Date(d.lastTime).toLocaleTimeString() : "-"}</td>
      `;
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

btnOP.addEventListener("click", () => {
  currentMode = "OP";
  btnOP.classList.add("active");
  btnIP.classList.remove("active");
  loadDashboard();
});

btnIP.addEventListener("click", () => {
  currentMode = "IP";
  btnIP.classList.add("active");
  btnOP.classList.remove("active");
  loadDashboard();
});

reportDateInput.addEventListener("change", loadDashboard);

setDefaultDate();
loadDashboard();

setInterval(() => {
  console.log("Auto refresh...");
  loadDashboard();
}, 30000);