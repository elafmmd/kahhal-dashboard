const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// ✅ تأكد السيرفر شغال
app.get("/", (req, res) => {
  res.send("API is running");
});

let TOKEN = null;

// 🔹 LOGIN (رابط صحيح)
async function login() {
  const res = await axios.post(
    "https://api.instahealthsolutions.com/instaapps/Customer/Login.do?_method=login",
    new URLSearchParams({
      username: "auto_update",
      password: "auto_update",
      hospital_name: "kahhal"
    })
  );

  console.log("LOGIN SUCCESS");
  TOKEN = res.data.request_handler_key;
}

// 🔹 GET VISITS (endpoint الصحيح + retry)
async function getVisits(date) {
  try {
    if (!TOKEN) await login();

    const res = await axios.get(
      "https://api.instahealthsolutions.com/kahhal/Customer/Visits.do",
      {
        headers: {
          request_handler_key: TOKEN
        },
        params: {
          from_date: date,
          to_date: date,
          center_id: 1
        }
      }
    );

    console.log("VISITS COUNT:", res.data?.length);
    return res.data;

  } catch (err) {
    console.log("TOKEN EXPIRED → RELOGIN");

    await login();

    const res = await axios.get(
      "https://api.instahealthsolutions.com/kahhal/Customer/Visits.do",
      {
        headers: {
          request_handler_key: TOKEN
        },
        params: {
          from_date: date,
          to_date: date,
          center_id: 1
        }
      }
    );

    console.log("VISITS COUNT AFTER RETRY:", res.data?.length);
    return res.data;
  }
}

// 🔹 API الرئيسي
app.get("/api/dashboard", async (req, res) => {
  try {
    const date = req.query.date;

    if (!date) {
      return res.json({ ok: false, error: "Date is required" });
    }

    const visits = await getVisits(date);

    res.json({
      ok: true,
      counts: {
        dammamOpRecords: visits?.length || 0,
        dammamIpRecords: 0,
        gFlor: 0
      },
      doctorsTable: visits || [], // 👈 مؤقت (نشوف البيانات)
      ipDoctorsTable: [],
      date
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    res.json({ ok: false, error: err.message });
  }
});

// 🔹 PORT مهم لـ Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});