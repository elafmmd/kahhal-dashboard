console.log("APP RUNNING");

const reportDateInput = document.getElementById("reportDate");
const gFlorCountEl = document.getElementById("gFlorCount");
const appointmentsCountEl = document.getElementById("appointmentsCount");
const opCountEl = document.getElementById("opCount");
const ipCountEl = document.getElementById("ipCount");
const debugBox = document.getElementById("debugBox");
let currentMode = "OP";


const btnOP = document.getElementById("btnOP");
const btnIP = document.getElementById("btnIP");
btnOP.classList.add("active");


const IP_DOCTORS = [
  "MOHANNA AL JINDAN",
  "MUATH ALRUSHOOD",
  "GHADYAN ABDULRAHMAN",
  "ABDALLAH ALOWAID",
  "ELHAM AL TAMIMI",
  "QUSAI MOHAMMED",
  "MOFI ALWALMANY",
  "HIND",
  "SOMALI ABDULAZIZ",
  "KHALED ALOTAIBI",
  "UDAY AL OWAIFER",
  "ABDULRAHMAN ALHADLAG",
  "SANA YASSIN",
  "ADEL ALRUSHOOD",
  "ABDULAZIZ ALRUSHOOD"
];

const OP_CARD_DOCTORS = [
  "ADEL ALRUSHOOD",
  "ABDULAZIZ ALRUSHOOD",
  "MOHANNA AL JINDAN",
  "MUATH ALRUSHOOD",
  "ABDULRAHMAN ALGHADYAN",
  "ABDALLAH ALOWAID",
  "ELHAM AL TAMIMI",
  "QUSAI MOHAMMED",
  "MOFI ALWALMANY",
  "HIND AL-DALGAN",
  "ABDULAZIZ ALSOMALI",
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
  "DALLAL MOHAMMAD",
  "JESEENA JAMALUDIN",
  "THURAYA",
  "SUSHMITHA ARCOT",
  "ALAAELDIN",
  "MAHDI ABDULLA",
  "SHERIF HASSAN",
  "ABDULAZIZ ALQURAIN"
];

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

    appointmentsCountEl.textContent = result.counts?.appointments ?? 0;
    const opRows = Array.isArray(result.doctorsTable) ? result.doctorsTable : [];

const opCardTotal = opRows
  .filter(d => OP_CARD_DOCTORS.includes((d.name || "").toUpperCase().trim()))
  .reduce((sum, d) => sum + (d.total || 0), 0);

opCountEl.textContent = opCardTotal;
    ipCountEl.textContent = result.counts?.ipPatients ?? 0;
gFlorCountEl.textContent = result.counts.gFlor;
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
  rows = Array.isArray(result.doctorsTable) ? result.doctorsTable : [];
} else {
  const allRows = Array.isArray(result.doctorsTable) ? result.doctorsTable : [];

  rows = allRows.filter(d =>
    IP_DOCTORS.includes((d.name || "").toUpperCase().trim())
  );
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
      `OP Patients: ${result.counts?.opPatients ?? 0}\n` +
      `IP Patients: ${result.counts?.ipPatients ?? 0}\n` +
      `Lasik Workup: ${result.counts?.lasikWorkup ?? 0}`;
  } catch (err) {
    debugBox.textContent = `Error: ${err.message}`;
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