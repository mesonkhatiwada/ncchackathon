import Twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async (to, message) => {
  try {
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to
    });
    return sms;
  } catch (err) {
    throw err;
  }
};
