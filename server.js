const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const BASE_URL = process.env.BASE_URL;

const HOSPITAL_NAME = process.env.HOSPITAL_NAME;
const LOGIN_HEADER_AUTH = process.env.LOGIN_HEADER_AUTH;
const CENTER_ID = process.env.CENTER_ID;
const ORG_ID = process.env.ORG_ID;

const CONSULTANTS = [
  "Dr. Qusai Mohammed",
  "Dr. Muath Al Rushood",
  "Dr. Mohanna Al Jindan",
  "Dr. Abdallah Al Owaid",
  "Dr. Elham Al Tamimi",
  "Dr. Mofi Al Walmany",
  "Dr. Hind Al Dalgan",
  "Dr. Khaled  Al Otaibi",
  "Dr. Uday Al Owaifer",
  "Dr. Abdulrahman  Al Hadlag",
  "Dr. Sana Yassin",
  "Dr. Abdulrahman Al Ghadyan"
];

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

const CONSULTANT_SCHEDULE = {
  "MUATH ALRUSHOOD": [0, 3],
  "MOHANNA AL JINDAN": [1, 4, 6],
  "GHADYAN ABDULRAHMAN": [0, 3],
  "ABDALLAH ALOWAID": [1, 4, 6],
  "ELHAM AL TAMIMI": [2, 3, 6],
  "QUSAI MOHAMMED": [0, 2, 3, 4, 5, 6],
  "MOFI ALWALMANY": [3],
  "HIND": [2],
  "SOMALI ABDULAZIZ": [1, 4],
  "KHALED ALOTAIBI": [0, 2],
  "UDAY AL OWAIFER": [0],
  "ABDULRAHMAN ALHADLAG": [4],
  "SANA YASSIN": [1, 3]
};

const SPECIALISTS = [
  "Dr. Ahmed Ezzat",
  "Dr. Waqar Mustafa",
  "Dr. Mohammaed Al Najar",
  "Dr. Rayan mohammed",
  "Dr. Sana Saaed",
  "Dr. Sara Mustafa",
  "Dr. Mahdi Al junaidi",
  "Dr. Abdulaziz Al Somali",
  "Dr. 01 Adel Al Rushood",
  "Dr. 02 Abdulaziz  Al Rushood",
  "Dr. Sherif Hassan",
  "Dr. Alaaldin Abdulmuneim",
  "Dr. Lolwa Aldahan"
];

const OPTOMETRY = [
  "Dr. Dalal Mohammed",
  "Dr. jessena .",
  "Dr. Thuraya .",
  "Dr. Sashmtha ."
];

const ALL_DOCTORS = [
  ...CONSULTANTS,
  ...SPECIALISTS,
  ...OPTOMETRY
];

const TABLE_ONLY_DOCTORS = [
  "SHERIF HASSAN"
];

function normalizeDoctorName(name) {
  return String(name || "")
    .toUpperCase()
    .replace("DR.", "")
    .replace(/[0-9]/g, "")        // يشيل الأرقام
    .replace(/\./g, "")           // يشيل النقاط
    .replace(/-/g, " ")
    .replace(/\s+/g, "")          // 🔥 يشيل كل المسافات
    .trim();
}

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
];

const DAMMAM_IP_DOCTORS = [
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
];

function cleanName(name) {
  return String(name || "")
    .toUpperCase()
    .replace("DR.", "")
    .replace(/[0-9]/g, "")
    .replace(/\./g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDoctorInList(rawName, doctorList) {
  const n = normalizeDoctorName(rawName);
  return doctorList.some(doc => {
  const d = normalizeDoctorName(doc);
  return n.includes(d) || d.includes(n);
});
}

function countByList(activeDoctors, list) {
  return activeDoctors.filter((d) => isDoctorInList(d, list)).length;
}

async function getRequestHandlerKey() {
  const loginUrl = `${BASE_URL}/Customer/Login.do?_method=login`;

  const loginRes = await axios.post(
    loginUrl,
    new URLSearchParams({
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
      hospital_name: process.env.HOSPITAL_NAME
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  const requestKey = loginRes.data?.request_handler_key;

  if (!requestKey) {
    throw new Error("request_handler_key not found");
  }

  return requestKey;
}

app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const requestKey = await getRequestHandlerKey();

   const visitsUrl =
  `${BASE_URL}/Customer/patientclinicaldata.do?_method=getPatientClinicalData` +
  `&from_date=${encodeURIComponent(date + " 00:00:00")}` +
  `&to_date=${encodeURIComponent(date + " 23:59:59")}`;
      

    const billsUrl =
      `${BASE_URL}/Bills.do?_method=getBills` +
      `&from_date=${encodeURIComponent(date)}` +
      `&to_date=${encodeURIComponent(date)}` +
      `&center_id=${CENTER_ID}` +
      `&filter_by_finalized_date=N` +
      `&page=1`;

    const [visitsRes, billsRes] = await Promise.all([
      axios.get(visitsUrl, {
        headers: { request_handler_key: requestKey }
      }),
      axios.get(billsUrl, {
        headers: { request_handler_key: requestKey }
      }).catch(() => ({ data: { bills: [] } }))
    ]);

const visits =
  visitsRes.data?.patientClinicalData ||
  visitsRes.data?.patient_clinical_data ||
  visitsRes.data?.data ||
  visitsRes.data?.visits ||
  [];
  console.log("FULL RESPONSE:", visitsRes.data);
console.log("VISITS LENGTH:", visits.length);    const bills = Array.isArray(billsRes.data?.bills)
      ? billsRes.data.bills
      : [];
console.log("VISITS LENGTH:", visits.length);
    const opVisits = visits.filter(v =>
  isDoctorInList(v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || "", DAMMAM_DOCTORS)
);

const ipVisits = visits.filter(v =>
  isDoctorInList(
    v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || v.SURGEON_NAME || v.TREATING_DOCTOR || "",
    DAMMAM_IP_DOCTORS
  )
);

    const opPatients = new Set(
      opVisits.map(v => String(v.MR_NO || v.mr_no || "").trim()).filter(Boolean)
    ).size;

    const ipPatients = new Set(
      ipVisits.map(v => String(v.MR_NO || v.mr_no || "").trim()).filter(Boolean)
    ).size;

    const dammamOpPatients = new Set(
      opVisits
        .filter(v => isDoctorInList(v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || "", DAMMAM_DOCTORS))
        .map(v => String(v.MR_NO || v.mr_no || "").trim())
        .filter(Boolean)
    ).size;
const dammamOpRecords = opVisits.filter(v =>
  isDoctorInList(v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || "", DAMMAM_DOCTORS)
).length;
const dammamIpRecords = ipVisits.filter(v =>
  isDoctorInList(
    v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || v.SURGEON_NAME || v.TREATING_DOCTOR || "",
    DAMMAM_IP_DOCTORS
  )
).length;
    const dammamIpPatients = new Set(
      ipVisits
        .filter(v =>
          isDoctorInList(
            v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || v.SURGEON_NAME || v.TREATING_DOCTOR || "",
            DAMMAM_IP_DOCTORS
          )
        )
        .map(v => String(v.MR_NO || v.mr_no || "").trim())
        .filter(Boolean)
    ).size;

    const lasikPatients = new Set();

    bills.forEach((bill) => {
      const charges = Array.isArray(bill.charges) ? bill.charges : [];

      charges.forEach((c) => {
        const desc = String(c.description || "")
          .toUpperCase()
          .replace(/\s+/g, " ")
          .trim();

        if (
          desc.includes("REFRECTIVE SURGERY WORKUP") ||
          desc.includes("REFRACTIVE SURGERY WORKUP")
        ) {
          const mr = String(bill.mr_no || "").trim();
          if (mr) {
            lasikPatients.add(mr);
          }
        }
      });
    });

    const lasikWorkupCount = lasikPatients.size;
    console.log("TOTAL BILLS:", bills.length);

    bills.forEach((bill, i) => {
      const charges = Array.isArray(bill.charges) ? bill.charges : [];
      charges.forEach((c) => {
        const desc = String(c.description || "").toUpperCase().trim();
        if (desc.includes("WORKUP")) {
          console.log("WORKUP FOUND", i + 1, {
            bill_no: bill.bill_no,
            mr_no: bill.mr_no,
            visit_id: bill.visit_id,
            description: c.description
          });
        }
      });
    });

    const doctorStats = {};
    const ipDoctorStats = {};

    opVisits.forEach((v) => {
      const rawName = v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || "";
      const name = cleanName(rawName);
      if (!name) return;

      const visitTimeRaw = v.REG_DATE_TIME || null;
      const visitTime = visitTimeRaw ? new Date(visitTimeRaw) : null;

      const schedule = CONSULTANT_SCHEDULE[name];
      if (schedule && visitTime) {
        const day = visitTime.getDay();
        if (!schedule.includes(day)) return;
      }

      if (!doctorStats[name]) {
        doctorStats[name] = {
          name,
          appointment: 0,
          walkin: 0,
          lastTime: null
        };
      }

      if (v.APPOINTMENT_ID || v.APPOINTMENT_NO) {
        doctorStats[name].appointment += 1;
      } else {
        doctorStats[name].walkin += 1;
      }

      if (visitTime) {
        if (!doctorStats[name].lastTime || visitTime > doctorStats[name].lastTime) {
          doctorStats[name].lastTime = visitTime;
        }
      }
    });

    ipVisits.forEach((v) => {
      const rawName =
        v.DOCTOR_NAME ||
        v.DOCTOR_FULL_NAME ||
        v.SURGEON_NAME ||
        v.TREATING_DOCTOR ||
        "";
      const name = cleanName(rawName);
      if (!name) return;

      const visitTimeRaw = v.REG_DATE_TIME || null;
      const visitTime = visitTimeRaw ? new Date(visitTimeRaw) : null;

      if (!ipDoctorStats[name]) {
        ipDoctorStats[name] = {
          name,
          total: 0,
          lastTime: null
        };
      }

      ipDoctorStats[name].total += 1;

      if (visitTime) {
        if (!ipDoctorStats[name].lastTime || visitTime > ipDoctorStats[name].lastTime) {
          ipDoctorStats[name].lastTime = visitTime;
        }
      }
    });

    const activeDoctors = Object.keys(doctorStats);

    const doctorsTable = Object.values(doctorStats)
  .filter(d => isDoctorInList(d.name, DAMMAM_DOCTORS))
  .map(d => ({
    name: d.name,
    total: d.appointment + d.walkin,
    lastTime: d.lastTime
  }))
  .sort((a, b) => b.total - a.total);

    const ipDoctorsTable = Object.values(ipDoctorStats)
      .sort((a, b) => b.total - a.total);

    const gFlorCount = doctorsTable
      .filter(d => !d.name.includes("SHERIF HASSAN"))
      .reduce((sum, d) => sum + d.total, 0);

    res.json({
      ok: true,
      date,
      counts: {
  appointments: 0,
  opPatients,
  ipPatients,
  dammamOpPatients,
  dammamIpPatients,
  dammamOpRecords,
  dammamIpRecords,
  lasikWorkup: lasikWorkupCount,
  gFlor: gFlorCount
},
      doctors: {
        consultant: countByList(activeDoctors, CONSULTANTS),
        specialist: countByList(activeDoctors, SPECIALISTS),
        optometry: countByList(activeDoctors, OPTOMETRY)
      },
      doctorsTable,
      ipDoctorsTable
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      details: err.response?.data || null
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});