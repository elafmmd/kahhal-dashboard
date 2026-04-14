const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// ✅ Route أساسي
app.get("/", (req, res) => {
  res.send("API is running");
});

let TOKEN = null;

// 🔹 LOGIN (صححنا الرابط)
async function login() {
  const res = await axios.post(
    "https://api.instahealthsolutions.com/instaapps/Customer/Login.do?_method=login",
    new URLSearchParams({
      username: "auto_update",
      password: "auto_update",
      hospital_name: "kahhal"
    })
  );

  console.log("LOGIN OK");
  TOKEN = res.data.request_handler_key;
}

// 🔹 GET VISITS (مع retry)
async function getVisits(date) {
  try {
    if (!TOKEN) await login();

    const res = await axios.get(
      "https://api.instahealthsolutions.com/instaapps/Customer/patientclinicaldata.do?_method=getPatientClinicalData",
      {
        headers: {
          request_handler_key: TOKEN
        },
        params: {
          from_date: date,
          to_date: date
        }
      }
    );

    return res.data;

  } catch (err) {
    // 🔥 إذا التوكن انتهى
    console.log("TOKEN EXPIRED → RELOGIN");
    await login();

    const res = await axios.get(
      "https://api.instahealthsolutions.com/instaapps/Customer/patientclinicaldata.do?_method=getPatientClinicalData",
      {
        headers: {
          request_handler_key: TOKEN
        },
        params: {
          from_date: date,
          to_date: date
        }
      }
    );

    return res.data;
  }
}

// 🔹 API
app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date;

    const visits = await getVisits(date);

    console.log("VISITS:", visits?.length);

    res.json({
      ok: true,
      counts: {
        dammamOpRecords: visits?.length || 0,
        dammamIpRecords: 0,
        gFlor: 0
      },
      doctorsTable: visits || [], // 👈 مؤقت عشان نشوف البيانات
      ipDoctorsTable: [],
      date
    });

  } catch (err) {
    console.error(err.message);
    res.json({ ok: false, error: err.message });
  }
});

// 🔹 PORT (مهم لـ Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));