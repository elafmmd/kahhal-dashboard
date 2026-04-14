const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const qs = require("qs");

const app = express();
app.use(cors());

// 🔥 حل SSL
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

    // 🔥 اطبع القيم (أهم خطوة حالياً)
    console.log("USERNAME =", process.env.USERNAME);
    console.log("PASSWORD =", process.env.PASSWORD);
    console.log("HOSPITAL_NAME =", process.env.HOSPITAL_NAME);

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
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (!response.data.request_handler_key) {
      console.error("❌ LOGIN RESPONSE:", response.data);
      throw new Error("Login failed");
    }

    TOKEN = response.data.request_handler_key;

    console.log("✅ LOGIN SUCCESS:", TOKEN);

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ===============================
// 📊 GET VISITS
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
          from_date: date,
          to_date: date
        }
      }
    );

    const visits = response.data?.patient_visits_details || [];

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