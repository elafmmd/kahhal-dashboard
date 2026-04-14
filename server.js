const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

app.get("/", (req, res) => {
  res.send("API is running");
});

async function login() {
  const body = new URLSearchParams();
  body.append("username", "auto_update");
  body.append("password", "auto_update");
  body.append("hospital_name", "kahhal");

  const res = await axios.post(
    "https://kahhal.instahmsapi.com/instaapps/Customer/Login.do?_method=login",
    body,
    {
      httpsAgent,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",   // 🔥 مهم
        "Accept": "*/*"
      }
    }
  );

  console.log("LOGIN RAW:", res.data);

  if (!res.data?.request_handler_key) {
    throw new Error("LOGIN FAILED: " + JSON.stringify(res.data));
  }

  return res.data.request_handler_key;
}

async function getVisits(date) {
  const token = await login();

  const res = await axios.get(
    "https://kahhal.instahmsapi.com/instaapps/Customer/Registration/GeneralRegistration.do",
    {
      httpsAgent,
      headers: {
        request_handler_key: token
      },
      params: {
        _method: "getPatientVisits",
        from_date: date,
        to_date: date
      }
    }
  );

  const visits = Array.isArray(res.data?.patient_visits_details)
    ? res.data.patient_visits_details
    : [];

  console.log("VISITS:", visits.length);
  return visits;
}

app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date;

    if (!date) {
      return res.json({
        ok: false,
        error: "Missing date"
      });
    }

    const visits = await getVisits(date);

    return res.json({
      ok: true,
      counts: {
        dammamOpRecords: visits.length,
        dammamIpRecords: 0,
        gFlor: 0
      },
      doctorsTable: visits,
      ipDoctorsTable: [],
      date
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});