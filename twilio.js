require("dotenv").config();
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendTestMessage() {
  try {
    const message = await client.messages.create({
      body: process.env.TWILIO_MESSAGE,  
      from: process.env.TWILIO_WHATSAPP_FROM,  
      to: process.env.TWILIO_WHATSAPP_TO  
    });

    console.log(`✅ Message Sent! SID: ${message.sid}`);
  } catch (error) {
    console.error("❌ Error sending message:", error.message);
  }
}

sendTestMessage();

