const { google } = require("googleapis");

// Authenticate using credentials from environment variables
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), // Read credentials from .env
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SHEET_ID = process.env.SHEET_ID; // Spreadsheet ID from .env
const RANGE = "Sheet1!A:E";

// Add a new reminder to the Google Sheet
const addReminder = async (reminder) => {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[Date.now(), reminder.message, reminder.phone, reminder.scheduledTime, "Pending"]],
      },
    });
    console.log("✅ Reminder added!");
  } catch (error) {
    console.error("❌ Error adding reminder:", error.message);
  }
};

// Fetch all reminders from the Google Sheet
const getReminders = async () => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });
    return response.data.values || [];
  } catch (error) {
    console.error("❌ Error fetching reminders:", error.message);
    return [];
  }
};

// Update the status of a reminder after it's sent
const updateReminderStatus = async (id) => {
  try {
    const reminders = await getReminders();
    const rowIndex = reminders.findIndex((reminder) => reminder[0] === id);
    
    if (rowIndex > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!E${rowIndex + 1}`,
        valueInputOption: "RAW",
        resource: { values: [["Sent"]] },
      });
      console.log(`✅ Reminder ID ${id} marked as Sent.`);
    }
  } catch (error) {
    console.error("❌ Error updating reminder status:", error.message);
  }
};

module.exports = { addReminder, getReminders, updateReminderStatus };

