
import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`;

  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  // API Routes
  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      // In a real app, you'd store this in a session or database.
      // For this demo, we'll pass it back to the client via postMessage.
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_SUCCESS', 
                  tokens: ${JSON.stringify(tokens)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Proxy for Google Fit API to avoid CORS and keep tokens secure if needed
  // But for simplicity in this demo, we can let the client call it with the token
  // or provide a helper endpoint.
  app.post("/api/google/fit/steps", async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: "No access token" });

    try {
      // Get daily step count
      // Google Fit API endpoint for aggregate data
      const startTimeMillis = new Date().setHours(0, 0, 0, 0);
      const endTimeMillis = new Date().getTime();

      const response = await axios.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        {
          aggregateBy: [
            {
              dataTypeName: "com.google.step_count.delta",
              dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
            }
          ],
          bucketByTime: { durationMillis: 86400000 }, // 24 hours
          startTimeMillis,
          endTimeMillis
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      // Extract steps from response
      let totalSteps = 0;
      if (response.data.bucket && response.data.bucket[0].dataset[0].point[0]) {
        totalSteps = response.data.bucket[0].dataset[0].point[0].value[0].intVal;
      }

      res.json({ steps: totalSteps });
    } catch (error: any) {
      console.error("Error fetching Google Fit data:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to fetch Google Fit data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
