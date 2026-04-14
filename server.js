const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// ✅ الصفحة الرئيسية (عشان ما يطلع Cannot GET /)
app.get("/", (req, res) => {
  res.send("API is running");
});

let TOKEN = null;

// ===============================
// 🔐 LOGIN
// ===============================
async function login() {
  try {
    const res = await axios.post(
      "https://kahhal.instahmsapi.com/instaapps/Customer/Login.do?_method=login",
      new URLSearchParams({
        username: "auto_update",
        password: "auto_update",
        hospital_name: "kahhal"
      })
    );

    TOKEN = res.data.request_handler_key;

    console.log("✅ LOGIN SUCCESS");

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    throw err;
  }
}

// ===============================
// 📊 GET VISITS (API الصحيح)
// ===============================
async function getVisits(date) {
  if (!TOKEN) await login();

  try {
    const res = await axios.get(
      "https://kahhal.instahmsapi.com/instaapps/Customer/Registration/GeneralRegistration.do",
      {
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
// 🚀 API ENDPOINT
// ===============================
app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date;

    if (!date) {
      return res.json({ ok: false, error: "Missing date" });
    }

    const visits = await getVisits(date);

    // 🔥 حسابات بسيطة (تقدر تطورها بعدين)
    const opCount = visits.length;

    res.json({
      ok: true,
      counts: {
        dammamOpRecords: opCount,
        dammamIpRecords: 0,
        gFlor: 0
      },
      doctorsTable: [], // نضيفها بعدين
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
// 🟢 START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});