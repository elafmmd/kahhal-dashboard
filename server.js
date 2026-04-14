const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");

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
// 🔐 LOGIN (لازم تكون موجودة)
// ===============================
async function login() {
  const res = await axios.post(
    "https://kahhal.instahmsapi.com/instaapps/Customer/Login.do?_method=login",
    new URLSearchParams({
      username: "auto_update",
      password: "auto_update",
      hospital_name: "kahhal"
    }),
    {
      httpsAgent
    }
  );

  TOKEN = res.data.request_handler_key;

  console.log("✅ NEW TOKEN:", TOKEN);
}

// ===============================
// 📊 GET VISITS
// ===============================
async function getVisits(date) {

  // 🔥 أهم شيء: نسوي login كل مرة
  await login();

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
      error: err.message
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