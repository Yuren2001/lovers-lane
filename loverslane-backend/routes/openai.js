import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/text", async (req, res) => {
  try {
    const { text, activeChatId } = req.body;

    // Validate request body
    if (!text || !activeChatId) {
      return res
        .status(400)
        .json({ error: "Text and activeChatId are required" });
    }

    // Log OpenAI API key for debugging purposes (ensure to remove in production)
    console.log("OpenAI API Key:", process.env.OPENAI_API_KEY);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: text },
      ],
      temperature: 0.5,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    // Log full response data for debugging
    console.log("OpenAI API Response:", response);

    if (
      response &&
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message &&
      response.choices[0].message.content
    ) {
      const chatCompletionText = response.choices[0].message.content;

      await axios.post(
        `https://api.chatengine.io/chats/${activeChatId}/messages/`,
        { text: chatCompletionText },
        {
          headers: {
            "Project-ID": process.env.PROJECT_ID,
            "User-Name": process.env.BOT_USER_NAME,
            "User-Secret": process.env.BOT_USER_SECRET,
          },
        }
      );

      res.status(200).json({ text: chatCompletionText });
    } else {
      console.error("Unexpected response structure from OpenAI:", response);
      res
        .status(500)
        .json({ error: "Unexpected response structure from OpenAI" });
    }
  } catch (error) {
    // Log detailed error information
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

router.get("/text", (req, res) => {
  res.status(405).json({ error: "Method Not Allowed" }); // GET is not supported for this endpoint
});

export default router;
