import express from "express";
import dotenv from "dotenv";
import sendRoutes from "./routes/send.js";
import path from "path";

dotenv.config();
const app = express();
app.use(express.json());


app.use(express.static("public"));

app.use("/api", sendRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});