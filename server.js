const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const qs = require("qs");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

// ===============================
// API CONFIG
// ===============================
const BASE_URL = "https://kahhal.instahmsapi.com/instaapps/Customer";
const HOSPITAL_NAME = "kahhal";
const LOGIN_HEADER_AUTH = "auto_update:auto_update";
const CENTER_ID = 1;
const ORG_ID = "ORG0001";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// ===============================
// DOCTORS (UPDATED NAMES)
// ===============================
function normalizeDoctorName(name) {
  return String(name || "")
    .toUpperCase()
    .replace("DR.", "")
    .replace(/[0-9]/g, "")
    .replace(/-/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .trim();
}

function cleanDisplayName(name) {
  return String(name || "")
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
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
].map(normalizeDoctorName);

const DAMMAM_DOCTORS = [
  "Dr. Mohammaed Al Najar",
  "Dr. Qusai Mohammed",
  "Dr. Waqar Mustafa",
  "Dr. Thuraya .",
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
  "Dr. Elham Al Tamimi",
  "Dr. Sherif Hassan",
  "Dr. Hind Al Dalgan",
  "Dr. Mofi Al Walmany",
  "Dr. Abdulrahman Al Ghadyan",
  "Dr. Abdulrahman  Al Hadlag",
  "Dr. Sana Saaed"
].map(normalizeDoctorName);

// نفس تقسيمك القديم، لكن بالأسماء الجديدة
const CONSULTANTS = [
  "Dr. 01 Adel Al Rushood",
  "Dr. 02 Abdulaziz  Al Rushood",
  "Dr. Mohanna Al Jindan",
  "Dr. Muath Al Rushood",
  "Dr. Abdulrahman Al Ghadyan",
  "Dr. Abdallah Al Owaid",
  "Dr. Elham Al Tamimi",
  "Dr. Qusai Mohammed",
  "Dr. Mofi Al Walmany",
  "Dr. Hind Al Dalgan",
  "Dr. Abdulaziz Al Somali",
  "Dr. Khaled  Al Otaibi",
  "Dr. Uday Al Owaifer",
  "Dr. Abdulrahman  Al Hadlag",
  "Dr. Sana Yassin"
].map(normalizeDoctorName);

const SPECIALISTS = [
  "Dr. Ahmed Ezzat",
  "Dr. Waqar Mustafa",
  "Dr. Mohammaed Al Najar",
  "Dr. Mahdi Al junaidi",
  "Dr. Rayan mohammed",
  "Dr. Sana Saaed",
  "Dr. Sara Mustafa",
  "Dr. Alaaldin Abdulmuneim"
].map(normalizeDoctorName);

const OPTOMETRY = [
  "Dr. Dalal Mohammed",
  "Dr. jessena .",
  "Dr. Thuraya .",
  "Dr. Sashmtha .",
  "Dr. Lolwa Aldahan"
].map(normalizeDoctorName);

const TABLE_ONLY_DOCTORS = [
  "Dr. Sherif Hassan"
].map(normalizeDoctorName);

// نفس منطق الدوام القديم، لكن على الأسماء الجديدة
const CONSULTANT_SCHEDULE = {
  [normalizeDoctorName("Dr. Muath Al Rushood")]: [0, 3],
  [normalizeDoctorName("Dr. Mohanna Al Jindan")]: [1, 4, 6],
  [normalizeDoctorName("Dr. Abdulrahman Al Ghadyan")]: [0, 3],
  [normalizeDoctorName("Dr. Abdallah Al Owaid")]: [1, 4, 6],
  [normalizeDoctorName("Dr. Elham Al Tamimi")]: [2, 3, 6],
  [normalizeDoctorName("Dr. Qusai Mohammed")]: [0, 2, 3, 4, 5, 6],
  [normalizeDoctorName("Dr. Mofi Al Walmany")]: [3],
  [normalizeDoctorName("Dr. Hind Al Dalgan")]: [2],
  [normalizeDoctorName("Dr. Abdulaziz Al Somali")]: [1, 4],
  [normalizeDoctorName("Dr. Khaled  Al Otaibi")]: [0, 2],
  [normalizeDoctorName("Dr. Uday Al Owaifer")]: [0],
  [normalizeDoctorName("Dr. Abdulrahman  Al Hadlag")]: [4],
  [normalizeDoctorName("Dr. Sana Yassin")]: [1, 3]
};

function countByList(activeDoctors, list) {
  return activeDoctors.filter((d) => list.some((name) => d.includes(name))).length;
}

function uniquePatientCount(rows) {
  return new Set(
    rows
      .map(v =>
        String(
          v.MR_NO ||
          v.mr_no ||
          v.MRNO ||
          v.MRN ||
          ""
        ).trim()
      )
      .filter(Boolean)
  ).size;
}

function visitDateKey(v) {
  const raw =
    v.REG_DATE_TIME ||
    v.VISIT_DATE_TIME ||
    v.CREATED_DATE ||
    v.CREATED_AT ||
    v.ADMISSION_DATE ||
    v.VISIT_DATE ||
    "";

  const s = String(raw);
  if (!s) return "";

  if (s.includes("T")) return s.split("T")[0];
  if (s.includes(" ")) return s.split(" ")[0];
  return s.slice(0, 10);
}

function visitDateObj(v) {
  const raw =
    v.REG_DATE_TIME ||
    v.VISIT_DATE_TIME ||
    v.CREATED_DATE ||
    v.CREATED_AT ||
    v.ADMISSION_DATE ||
    v.VISIT_DATE ||
    null;

  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isAppointment(v) {
  return Boolean(v.APPOINTMENT_ID || v.APPOINTMENT_NO);
}

function buildDoctorStats(rows, allowedDoctors, useSchedule = false) {
  const stats = {};

  rows.forEach((v) => {
    const rawName = v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || v.DOCTOR || "";
    const normalized = normalizeDoctorName(rawName);
    if (!normalized) return;

    const allowed = allowedDoctors.some((doc) => normalized.includes(doc));
    if (!allowed) return;

    const dObj = visitDateObj(v);

    if (useSchedule) {
      const schedule = CONSULTANT_SCHEDULE[normalized];
      if (schedule && dObj) {
        const day = dObj.getDay();
        if (!schedule.includes(day)) return;
      }
    }

    if (!stats[normalized]) {
      stats[normalized] = {
        key: normalized,
        name: cleanDisplayName(rawName || normalized),
        appointment: 0,
        walkin: 0,
        lastTime: null
      };
    }

    if (isAppointment(v)) {
      stats[normalized].appointment += 1;
    } else {
      stats[normalized].walkin += 1;
    }

    if (dObj && (!stats[normalized].lastTime || dObj > stats[normalized].lastTime)) {
      stats[normalized].lastTime = dObj;
    }
  });

  return Object.values(stats)
    .map((d) => ({
      name: d.name,
      total: d.appointment + d.walkin,
      lastTime: d.lastTime
    }))
    .sort((a, b) => b.total - a.total);
}

// ===============================
// LOGIN
// ===============================
async function getRequestHandlerKey() {
  const loginRes = await axios.post(
    `${BASE_URL}/Login.do?_method=login`,
    qs.stringify({
      username: "auto_update",
      password: "auto_update",
      hospital_name: HOSPITAL_NAME
    }),
    {
      httpsAgent,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-insta-auth": LOGIN_HEADER_AUTH
      },
      timeout: 30000
    }
  );

  const requestKey = loginRes.data?.request_handler_key;

  if (!requestKey) {
    throw new Error(loginRes.data?.return_message || "request_handler_key not found");
  }

  return requestKey;
}

// ===============================
// ROUTE
// ===============================
app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const requestKey = await getRequestHandlerKey();

    // بدون فلترة API بالتاريخ، ثم نفلتر بالكود
    const visitsUrl =
      `${BASE_URL}/Registration/GeneralRegistration.do?_method=getPatientVisits` +
      `&center_id=${CENTER_ID}` +
      `&org_id=${ORG_ID}`;

    const billsUrl =
      `${BASE_URL}/Bills.do?_method=getBills` +
      `&from_date=${encodeURIComponent(date)}` +
      `&to_date=${encodeURIComponent(date)}` +
      `&center_id=${CENTER_ID}` +
      `&filter_by_finalized_date=N` +
      `&page=1`;

    const [visitsRes, billsRes] = await Promise.all([
      axios.get(visitsUrl, {
        httpsAgent,
        headers: { request_handler_key: requestKey },
        timeout: 60000
      }),
      axios.get(billsUrl, {
        httpsAgent,
        headers: { request_handler_key: requestKey },
        timeout: 60000
      }).catch(() => ({ data: { bills: [] } }))
    ]);

    const allVisits = Array.isArray(visitsRes.data?.patient_visits_details)
      ? visitsRes.data.patient_visits_details
      : [];

    const bills = Array.isArray(billsRes.data?.bills)
      ? billsRes.data.bills
      : [];

    // فلترة اليوم بالكود
    const visits = allVisits.filter(v => visitDateKey(v) === date);

    const opVisits = visits.filter(v =>
      String(v.VISIT_ID || v.MAIN_VISIT_ID || "").toUpperCase().startsWith("OP")
    );

    const ipVisits = visits.filter(v =>
      String(v.VISIT_ID || v.MAIN_VISIT_ID || "").toUpperCase().startsWith("IP")
    );

    const dammamOpVisits = opVisits.filter(v => {
      const normalized = normalizeDoctorName(v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || "");
      return DAMMAM_DOCTORS.some(doc => normalized.includes(doc));
    });

    const dammamIpVisits = ipVisits.filter(v => {
      const normalized = normalizeDoctorName(v.DOCTOR_NAME || v.DOCTOR_FULL_NAME || "");
      return IP_DOCTORS.some(doc => normalized.includes(doc));
    });

    const opPatients = uniquePatientCount(dammamOpVisits);
    const ipPatients = uniquePatientCount(dammamIpVisits);

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
          if (mr) lasikPatients.add(mr);
        }
      });
    });

    const doctorsTable = buildDoctorStats(dammamOpVisits, [...DAMMAM_DOCTORS, ...TABLE_ONLY_DOCTORS], true);
    const ipDoctorsTable = buildDoctorStats(dammamIpVisits, IP_DOCTORS, false);

    const activeDoctors = doctorsTable.map(d => normalizeDoctorName(d.name));

    const gFlorCount = doctorsTable
      .filter(d => !normalizeDoctorName(d.name).includes(normalizeDoctorName("Dr. Sherif Hassan")))
      .reduce((sum, d) => sum + d.total, 0);

    res.json({
      ok: true,
      date,
      counts: {
        appointments: 0,
        opPatients,
        ipPatients,
        lasikWorkup: lasikPatients.size,
        gFlor: gFlorCount,

        // للموقع الحالي
        dammamOpRecords: opPatients,
        dammamIpRecords: ipPatients,
        dammamOpPatients: opPatients,
        dammamIpPatients: ipPatients
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});