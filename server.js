const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const qs = require("qs");

const app = express();
app.use(cors());

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

app.get("/", (req, res) => {
  res.send("API is running");
});

let TOKEN = null;

// ===============================
// 🔐 LOGIN (محاكاة Postman)
// ===============================
async function login() {
  try {

    const response = await axios({
      method: "POST",
      url: "https://kahhal.instahmsapi.com/instaapps/Customer/Login.do?_method=login",

      data: qs.stringify({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
        hospital_name: process.env.HOSPITAL_NAME
      }),

      httpsAgent,

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "PostmanRuntime/7.32.3",
        "Accept": "*/*",
        "Connection": "keep-alive"
      }
    });

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

  const response = await axios.get(
    "https://kahhal.instahmsapi.com/instaapps/Customer/Registration/GeneralRegistration.do",
    {
      httpsAgent,
      headers: {
        request_handler_key: TOKEN,
        "User-Agent": "PostmanRuntime/7.32.3"
      },
      params: {
        _method: "getPatientVisits",
        from_date: date,
        to_date: date
      }
    }
  );

  return response.data?.patient_visits_details || [];
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});