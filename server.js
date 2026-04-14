const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());

// 🔥 حل مشكلة SSL
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("API is running");
});

let TOKEN = null;

// ===============================
// 🔐 LOGIN
// ===============================
async function login() {
  try {
    const body = new URLSearchParams();
    body.append("username", process.env.USERNAME);
    body.append("password", process.env.PASSWORD);
    body.append("hospital_name", process.env.HOSPITAL_NAME);

    console.log("🔐 TRY LOGIN WITH:", {
      USERNAME: process.env.USERNAME,
      PASSWORD: process.env.PASSWORD ? "*****" : "❌ EMPTY",
      HOSPITAL: process.env.HOSPITAL_NAME
    });

    const res = await axios.post(
      "https://kahhal.instahmsapi.com/instaapps/Customer/Login.do?_method=login",
      body,
      { httpsAgent }
    );

    if (!res.data?.request_handler_key) {
      throw new Error("LOGIN FAILED: " + JSON.stringify(res.data));
    }

    TOKEN = res.data.request_handler_key;

    console.log("✅ LOGIN SUCCESS");

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ===============================
// 📊 GET VISITS
// ===============================
async function getVisits(date) {

  // 🔥 نسوي login كل مرة (حل مشكلة انتهاء التوكن)
  await login();

  try {
    const res = await axios.get(
      "https://kahhal.instahmsapi.com/instaapps/Customer/Registration/GeneralRegistration.do",
      {
        httpsAgent,
        headers: {
          request_handler_key: TOKEN
        },
        params: {
          _method: "getPatientVisits",
          from_date: date,
          to_date: date
        }
      }
    );

    const visits = res.data?.patient_visits_details || [];

    console.log("📊 VISITS:", visits.length);

    return visits;

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

    const visits = await getVisits(date);

    res.json({
      ok: true,
      counts: {
        dammamOpRecords: visits.length,
        dammamIpRecords: 0,
        gFlor: 0
      },
      doctorsTable: [],
      ipDoctorsTable: [],
      date
    });

  } catch (err) {
    console.error("❌ DASHBOARD ERROR:", err.message);

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