const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = process.env.BASE_URL;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const HOSPITAL_NAME = process.env.HOSPITAL_NAME;

app.get("/", (req, res) => {
  res.send("API is running");
});

async function login() {
  const body = new URLSearchParams();
  body.append("username", USERNAME || "");
  body.append("password", PASSWORD || "");
  body.append("hospital_name", HOSPITAL_NAME || "");

  const res = await axios.post(
    `${BASE_URL}/Customer/Login.do?_method=login`,
    body.toString(),
    {
      httpsAgent,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
        "User-Agent": "PostmanRuntime/7.43.4"
      },
      timeout: 30000
    }
  );

  console.log("LOGIN RESPONSE:", res.data);

  if (!res.data?.request_handler_key) {
    throw new Error(JSON.stringify(res.data));
  }

  return res.data.request_handler_key;
}

async function getVisits(date) {
  const token = await login();

  const res = await axios.get(
    `${BASE_URL}/Customer/Registration/GeneralRegistration.do`,
    {
      httpsAgent,
      headers: {
        request_handler_key: token,
        "Accept": "*/*",
        "User-Agent": "PostmanRuntime/7.43.4"
      },
      params: {
        _method: "getPatientVisits",
        from_date: date,
        to_date: date
      },
      timeout: 60000
    }
  );

  console.log("VISITS RESPONSE KEYS:", Object.keys(res.data || {}));

  const visits = Array.isArray(res.data?.patient_visits_details)
    ? res.data.patient_visits_details
    : [];

  console.log("VISITS COUNT:", visits.length);

  return visits;
}

app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date;

    if (!date) {
      return res.status(400).json({
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