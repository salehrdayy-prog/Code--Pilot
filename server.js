import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = "اینجا API KEY خودتو بزار";

app.post("/ask", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: userMessage
      })
    });

    const data = await response.json();

    res.json({
      reply: data.output?.[0]?.content?.[0]?.text || "جوابی نیومد"
    });

  } catch (error) {
    res.json({ reply: "خطا در اتصال به AI" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});