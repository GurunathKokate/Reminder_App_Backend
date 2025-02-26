require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { addReminder, getReminders, updateReminderStatus } = require("./sheets");
const twilio = require("twilio");
const cron = require("node-cron");

const app = express();
app.use(cors({ origin: "*", methods: "GET,POST,PUT,DELETE" }));
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;

// Twilio setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// API to add a reminder
app.post("/reminders", async (req, res) => {
  try {
    await addReminder(req.body);
    res.status(201).json({ message: "Reminder saved!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save reminder" });
  }
});

// API to get reminders
app.get("/reminders", async (req, res) => {
  try {
    console.log("Fetching reminders...");  // Debugging
    const reminders = await getReminders();
    console.log("Reminders:", reminders); // Debugging
    res.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

const moment = require("moment-timezone");



const sendReminders = async () => {
  // console.log("⏳ Checking for due reminders...");

  const reminders = await getReminders();
  // console.log("📋 Total Reminders Fetched:", reminders.length);

  const nowIST = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm");
  // console.log("⏰ Current IST Time:", nowIST);

  for (let reminder of reminders.slice(1)) {
    const [id, message, phoneNumber, scheduledTime, status] = reminder;

    const scheduledTimeIST = moment.tz(scheduledTime, "Asia/Kolkata").format("YYYY-MM-DD HH:mm");

    // console.log(`🔍 Checking Reminder ID: ${id}`);
    // console.log(`📅 Scheduled Time (IST): ${scheduledTimeIST}`);
    // console.log(`📌 Status: ${status}`);
    // console.log(`📞 Phone Number (Before Fix): ${phoneNumber}`);

    let formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    const whatsappPhone = `whatsapp:${formattedPhone}`;
    console.log(`📞 Phone Number (After Fix): ${formattedPhone}`);

    if (scheduledTimeIST <= nowIST && status === "Pending") {
      console.log(`📨 Sending messages to ${formattedPhone}...`);

      try {
        // Send WhatsApp Message
        const whatsappMessage = await client.messages.create({
          body: message,
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: whatsappPhone,
        });
        console.log(`✅ WhatsApp Reminder Sent! SID: ${whatsappMessage.sid}`);

        // Send SMS
        const smsMessage = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        console.log(`✅ SMS Reminder Sent! SID: ${smsMessage.sid}`);

        await updateReminderStatus(id);
      } catch (error) {
        console.error("❌ Error sending reminder:", error.message);
      }
    } else {
      console.log("⏳ Reminder is either not due yet or already sent.");
    }
  }
};


cron.schedule("* * * * *", sendReminders);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
