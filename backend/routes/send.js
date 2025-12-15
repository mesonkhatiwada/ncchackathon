import express from "express";
import fs from "fs";
import { sendSMS } from "../config/sms.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const numbers = fs.readFileSync("numbers.txt", "utf-8")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const messages = fs.readFileSync("messages.txt", "utf-8")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  for (const number of numbers) {
    try {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      await sendSMS(number, randomMessage);
      console.log(`SMS sent to ${number}: ${randomMessage}`);
    } catch (err) {
      console.error(`Error sending to ${number}: ${err.message}`);
    }
  }

  res.json({ success: true, message: "Random emergency SMS sent ✅" });
});

export default router;
