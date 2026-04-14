app.get("/", (req, res) => {
  res.send("API is running");
});
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

let TOKEN = null;

// 🔹 تسجيل دخول
async function login() {
  const res = await axios.post(
    "https://kahhal.instahmsapi.com/instaapps/Customer/Login.do?_method=login",
    new URLSearchParams({
      username: "auto_update",
      password: "auto_update",
      hospital_name: "kahhal"
    })
  );

  console.log("LOGIN RESPONSE:", res.data);

  TOKEN = res.data.request_handler_key;
}

// 🔹 جلب البيانات
async function getVisits(date) {
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

  console.log("VISITS LENGTH:", res.data?.length);
  console.log("RAW VISITS:", res.data);

  return res.data;
}

// 🔹 API حقك
app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date;

    const visits = await getVisits(date);

    res.json({
      ok: true,
      counts: {
        dammamOpRecords: visits?.length || 0,
        dammamIpRecords: 0,
        gFlor: 0
      },
      doctorsTable: [],
      ipDoctorsTable: [],
      date
    });

  } catch (err) {
    console.error(err.message);
    res.json({ ok: false, error: err.message });
  }
});

app.listen(3000, () => console.log("Server running"));