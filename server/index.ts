import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = process.env.PORT || 8080;

// Initialize Gemini with direct API key
const genAI = new GoogleGenerativeAI('AIzaSyA1234567890abcdefghijklmnopqrstuvwxyz');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.use(cors());
app.use(express.json());

app.post('/api/generate-ai-insights', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { prompt } = req.body;

    if (!prompt) {
      console.error('No prompt provided in request');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating content with prompt:', prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Ensure the response is valid JSON
    let insights;
    try {
      insights = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text);
      // If parsing fails, wrap the text in a JSON object
      insights = { rawResponse: text };
    }
    
    console.log('Generated insights:', insights);
    res.json({ insights });
  } catch (error) {
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ 
      error: 'Failed to generate AI insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 