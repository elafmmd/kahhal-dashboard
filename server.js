const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());

// 🔥 حل مشكلة SSL (مهم جداً)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("API is running");
});

let TOKEN = null;

async function getVisits(date) {
  // 🔥 دايم نسوي login جديد
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
    console.error("❌ API ERROR FULL:", err.response?.data || err.message);
    throw err;
  }
}
// ===============================
// 📊 GET VISITS
// ===============================
async function getVisits(date) {
  if (!TOKEN) await login();

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

    // 🔥 إذا التوكن انتهى
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.log("🔁 TOKEN EXPIRED → RELOGIN");

      await login();

      const retry = await axios.get(
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

      return retry.data?.patient_visits_details || [];
    }

    console.error("❌ API ERROR:", err.message);
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