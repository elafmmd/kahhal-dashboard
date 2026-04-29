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
  "Dr. 02 Abdulaziz  Al Rushood",
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
  [normalizeDoctorName("Dr. 02 Abdulaziz  Al Rushood")]: [4,6,2,3],

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

    // ===============================
// 🔥 BILLS (ALL PAGES + RANGE)
// ===============================
// ===============================
// 🔥 VISITS (مهم جداً)
// ===============================
const visitsRes = await axios.get(visitsUrl, {
  httpsAgent,
  headers: { request_handler_key: requestKey },
  timeout: 60000
});

const allVisits = Array.isArray(visitsRes.data?.patient_visits_details)
  ? visitsRes.data.patient_visits_details
  : [];

console.log("TOTAL VISITS:", allVisits.length);
// 🔥 قبل يومين وبعد 3 أيام
const baseDate = new Date(date);

const fromDateObj = new Date(baseDate);
fromDateObj.setDate(baseDate.getDate() - 2);

const toDateObj = new Date(baseDate);
toDateObj.setDate(baseDate.getDate() + 3);

const from_date = fromDateObj.toISOString().slice(0, 10);
const to_date = toDateObj.toISOString().slice(0, 10);

let page = 1;
let allBills = [];

while (true) {
  const billsRes = await axios.post(
    `${BASE_URL}/Bills.do`,
    qs.stringify({
      _method: "getBills",
      from_date,
      to_date,
      center_id: CENTER_ID,
      page,
      rows: 100,
      filter_by_finalized_date: "N"
    }),
    {
      httpsAgent,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        request_handler_key: requestKey
      },
      timeout: 60000
    }
  );

  const bills = billsRes.data?.bills || [];

  console.log(`PAGE ${page}:`, bills.length);

  if (!bills.length) break;

  allBills.push(...bills);

  if (bills.length < 100) break;

  page++;
}

console.log("TOTAL BILLS:", allBills.length);

    // فلترة اليوم بالكود
    const visits = allVisits.filter(v => visitDateKey(v) === date);
// 🔥 MAP: visit_id → doctor
const visitDoctorMap = {};

visits.forEach(v => {
  const vid = String(v.VISIT_ID || v.MAIN_VISIT_ID || "").trim();
  if (!vid) return;

  visitDoctorMap[vid] =
    v.DOCTOR_NAME ||
    v.DOCTOR_FULL_NAME ||
    v.DOCTOR ||
    "";
});
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

  return (
    v.CENTER_NAME === "Kahhal_Dammam" &&   // 🔥 هذا أهم شيء
    IP_DOCTORS.some(doc => normalized.includes(doc))
  );
});
const visitIds = new Set(
  visits
    .map(v => String(v.VISIT_ID || v.MAIN_VISIT_ID || "").trim())
    .filter(Boolean)
);
const opVisitWithConsultation = new Set();

allBills.forEach((bill) => {
  if (!bill) return;

  const status = String(bill.bill_status || "").toUpperCase();
  if (!["CLOSED", "FINALIZED"].includes(status)) return;

  if (bill.center_name !== "Kahhal_Dammam") return;

  // رقم الزيارة من الفاتورة
  const billVisitId = String(bill.visit_id || "").trim();

  // لازم رقم زيارة الفاتورة يكون موجود في زيارات اليوم
  if (!visitIds.has(billVisitId)) return;

  // لازم نفس الفاتورة فيها OP Consultation
  const hasOpConsultation = (bill.charges || []).some((c) => {
    const chargeHead = String(c.charge_head || "").trim().toUpperCase();
    return chargeHead === "OP CONSULTATION";
  });

  if (!hasOpConsultation) return;

  // إذا تطابق visit_id + فيها OP Consultation تنحسب
  opVisitWithConsultation.add(billVisitId);
});

const opPatients = opVisitWithConsultation.size;
  const ipPatients = uniquePatientCount(dammamIpVisits);

    // ===============================
// 🔥 LASIK FINAL (Doctor Based)
// ===============================
// ===============================
// 🔥 INJECTION (INJ)
// ===============================

const injVisits = new Set();
const injDoctorMap = {};

allBills.forEach((bill) => {
  if (!bill) return;
  if (bill.bill_status === "CANCELLED") return;
  if (bill.center_name !== "Kahhal_Dammam") return;

  const billVisitId = String(bill.visit_id || "").trim();

  // لازم يكون نفس يوم الزيارة
  if (!visitIds.has(billVisitId)) return;

  let isInj = false;
  let doctorName = "";

  (bill.charges || []).forEach((c) => {
    const desc = String(c.description || "").toUpperCase();

    const isInjection =
      desc.includes("EYLEA") ||
      desc.includes("LUCENTIS") ||
      desc.includes("OZURDEX") ||
      desc.includes("VABYSMO") ||
      desc.includes("INTRAVITREAL") ||
      desc.includes("INTRAVETRIAL");

    if (isInjection) {
      isInj = true;

      if (!doctorName) {
        doctorName =
          c.conducting_doctor ||
          c.doctor ||
          bill.doctor_name ||
          "";
      }
    }
  });

  if (!isInj || !billVisitId) return;

  // 🔥 منع التكرار (يمين + يسار)
  if (injVisits.has(billVisitId)) return;

  injVisits.add(billVisitId);

  // 🔥 نجيب الدكتور من الزيارة (الأدق)
  const visitDoctor = visitDoctorMap[billVisitId] || doctorName || "UNKNOWN";
  const key = normalizeDoctorName(visitDoctor);

  if (!injDoctorMap[key]) {
    injDoctorMap[key] = {
      name: cleanDisplayName(visitDoctor),
      total: 0,
      lastTime: null
    };
  }

  injDoctorMap[key].total += 1;
});

// 🔥 جدول INJ
const injTable = Object.values(injDoctorMap)
  .sort((a, b) => b.total - a.total);


const lasikVisits = new Set();
const lasikDoctorMap = {};

allBills.forEach((bill) => {
  if (!bill) return;
  if (bill.bill_status === "CANCELLED") return;
  if (bill.center_name !== "Kahhal_Dammam") return;

  const billVisitId = String(bill.visit_id || "").trim();

  // لازم يكون عنده زيارة اليوم
  if (!visitIds.has(billVisitId)) return;

  let isLasikBill = false;
  let doctorName = "";

  (bill.charges || []).forEach((c) => {
    const desc = String(c.description || "").toUpperCase();

    const isLasik =
      desc.includes("LASIK") ||
      desc.includes("FEMTO") ||
      desc.includes("EXCIMER") ||
      desc.includes("SMILE") ||
      desc.includes("PRK") ||
      desc.includes("PTK") ||
      desc.includes("CROSS") ||
      desc.includes("REFRACT") ||
      desc.includes("ALK");

    const exclude =
      desc.includes("WORK UP") ||
      desc.includes("CONSULT") ||
      desc.includes("CHECK") ||
      desc.includes("OCT") ||
      desc.includes("TEST");

    if (isLasik && !exclude) {
      isLasikBill = true;

      if (!doctorName) {
  doctorName =
    c.conducting_doctor ||
    c.doctor ||
    bill.doctor_name ||
    bill.DOCTOR_NAME ||
    bill.DOCTOR ||
    "";
}
    }
  });

  if (!isLasikBill || !billVisitId) return;

  // 🔥 منع التكرار (يمين + يسار)
  if (lasikVisits.has(billVisitId)) return;

  lasikVisits.add(billVisitId);

  // 🔥 خذ الدكتور من VISITS (الأهم)
const visitDoctor = visitDoctorMap[billVisitId] || doctorName || "UNKNOWN";

const key = normalizeDoctorName(visitDoctor);

if (!lasikDoctorMap[key]) {
  lasikDoctorMap[key] = {
    name: cleanDisplayName(visitDoctor),
    total: 0,
    lastTime: null
  };
}

  lasikDoctorMap[key].total += 1;
});

// 🔥 الجدول النهائي
const lasikTable = Object.values(lasikDoctorMap)
  .sort((a, b) => b.total - a.total);
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
        lasikWorkup: lasikVisits.size,
lasikCount: lasikVisits.size,
injCount: injVisits.size,
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
ipDoctorsTable,
lasikTable,
injTable
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