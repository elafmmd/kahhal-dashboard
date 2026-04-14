const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const qs = require("qs");

const app = express();
app.use(cors());

// SSL fix
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("API is running");
});

let TOKEN = null;

// ===============================
// 🔐 LOGIN (مطابق Postman)
// ===============================
async function login() {
  try {
    const response = await axios.post(
      "https://kahhal.instahmsapi.com/instaapps/Customer/Login.do?_method=login",

      qs.stringify({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
        hospital_name: process.env.HOSPITAL_NAME
      }),

      {
        httpsAgent,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-insta-auth": `${process.env.USERNAME}:${process.env.PASSWORD}`
        }
      }
    );

    if (!response.data.request_handler_key) {
      throw new Error(JSON.stringify(response.data));
    }

    TOKEN = response.data.request_handler_key;

    console.log("✅ LOGIN SUCCESS:", TOKEN);

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ===============================
// 📊 GET VISITS + FILTER
// ===============================
async function getVisits(date) {

  await login();

  try {
    const response = await axios.get(
      "https://kahhal.instahmsapi.com/instaapps/Customer/Registration/GeneralRegistration.do",
      {
        httpsAgent,
        headers: {
          request_handler_key: TOKEN
        },
        params: {
          _method: "getPatientVisits",
          from_date: date + "T00:00:00",
          to_date: date + "T23:59:59"
        }
      }
    );

    const visits = response.data?.patient_visits_details || [];

    console.log("📊 TOTAL VISITS:", visits.length);

    // ===============================
    // 🔥 فلترة دَمّام
    // ===============================
    const dammamVisits = visits.filter(v =>
      (v.CENTER_NAME || "").toUpperCase().includes("DAMMAM")
    );

    // ===============================
    // 🔥 OP / IP
    // ===============================
    const op = dammamVisits.filter(v =>
      (v.VISIT_TYPE || "").toUpperCase() === "OP"
    );

    const ip = dammamVisits.filter(v =>
      (v.VISIT_TYPE || "").toUpperCase() === "IP"
    );

    return {
      all: visits,
      dammam: dammamVisits,
      op,
      ip
    };

  } catch (err) {
    console.error("❌ VISITS ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ===============================
// 🚀 API
// ===============================
app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date;

    if (!date) {
      return res.json({ ok: false, error: "Missing date" });
    }

    const data = await getVisits(date);

    res.json({
      ok: true,
      counts: {
        dammamOpRecords: data.op.length,
        dammamIpRecords: data.ip.length,
        gFlor: 0
      },
      doctorsTable: [],
      ipDoctorsTable: [],
      total: data.dammam.length
    });

  } catch (err) {
    res.json({
      ok: false,
      error: err.response?.data || err.message
    });
  }
});

// ===============================
// 🟢 START
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});