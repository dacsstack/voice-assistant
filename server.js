import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";

const app = express();
const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());

app.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    // 1️⃣ Speech to Text
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "gpt-4o-mini-transcribe",
    });

    // 2️⃣ GPT Response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: transcript.text }],
    });

    const reply = completion.choices[0].message.content;

    // 3️⃣ Text to Speech
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: reply,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

app.listen(3000, () => console.log("Server running"));
