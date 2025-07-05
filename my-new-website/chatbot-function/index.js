// index.js (for Google Cloud Functions/AWS Lambda) or api/chatbot.js (for Vercel/Netlify Functions)
// This file will contain the serverless function logic.

// For Google Cloud Functions, this would be the entry point.
// For Vercel/Netlify, this would be in a file like `api/chatbot.js` in your project root.

// IMPORTANT: Your Gemini API Key should be stored as an Environment Variable
// on your chosen serverless platform (e.g., GEMINI_API_KEY).
// DO NOT hardcode your API key directly in this file for production.
const API_KEY = process.env.GEMINI_API_KEY || AIzaSyCSkr2jJOAC3X-gwd9Xdn5ME_MjFsmBrUY; // Replace with your actual API key if testing locally without env vars

// Helper function to fetch content (simulated for now, would read from files or database in a real scenario)
async function getWebsiteContentAsContext() {
    // In a real application, you would load content from your website files (e.g., by reading them
    // from storage or a database, or even by crawling your deployed GitHub Pages site periodically).
    // For simplicity, this is a hardcoded example.
    const content = `
        Helena Andrés is an innovator and AI enthusiast. Her career journey includes being a Senior AI Developer at InnovateTech Solutions (Jan 2022 - Present), where she led development of real-time anomaly detection systems and MLOps pipelines. Before that, she was a Software Engineer at Global Data Corp (Jul 2018 - Dec 2021), developing backend services and optimizing database queries. Her core values include Continuous Learning, Impactful Innovation, Collaborative Growth, and Ethical Responsibility. Her technical skills include Python, JavaScript, Go, SQL, TensorFlow/Keras, PyTorch, Scikit-learn, Hugging Face Transformers, AWS, Docker, Git/GitHub, and CI/CD. Projects include an Intelligent Chatbot Assistant, an Interactive Data Dashboard, and an Automated MLOps Pipeline. She also writes a blog about the future of innovation and AI.
    `;
    return content;
}

// Main handler for the serverless function
// This structure is common for many serverless platforms (e.g., Google Cloud Functions, AWS Lambda with API Gateway)
// For Vercel/Netlify Functions, the request and response objects might be slightly different but the core logic is similar.
exports.handler = async (req, res) => {
    // Set CORS headers for security and to allow your GitHub Pages site to call this function
    res.set('Access-Control-Allow-Origin', '*'); // WARNING: For production, replace '*' with your specific GitHub Pages domain (e.g., 'https://helenaandres.github.io')
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request (CORS)
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            res.status(400).json({ error: 'Message is required.' });
            return;
        }

        // Get website content to use as context for the LLM
        const websiteContext = await getWebsiteContentAsContext();

        let chatHistory = [];
        // Provide system instructions or context to the LLM
        chatHistory.push({
            role: "user",
            parts: [{ text: `You are a helpful assistant providing information about Helena Andrés based on her website content. Here is information about Helena's website: ${websiteContext}\n\nUser's question: ${userMessage}` }]
        });

        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        let botResponse;
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            botResponse = result.candidates[0].content.parts[0].text;
        } else {
            console.error('Unexpected API response structure:', JSON.stringify(result, null, 2));
            botResponse = "Sorry, I couldn't generate a response from the AI at this time. Please try rephrasing your question.";
        }

        res.status(200).json({ reply: botResponse });

    } catch (error) {
        console.error('Error in chatbot function:', error);
        res.status(500).json({ reply: "An internal server error occurred." });
    }
};

// For local testing (optional, requires Express/Node.js setup like before)
// This part won't be deployed as a serverless function, but helps test locally.
/*
const express = require('express');
const app = express();
app.use(express.json());
app.use(cors()); // For local testing

app.post('/api/chatbot', exports.handler); // Route to your handler

const localPort = 3001; // Use a different port than your static site if running both locally
app.listen(localPort, () => {
    console.log(`Local serverless function test endpoint running at http://localhost:${localPort}/api/chatbot`);
});
*/
