// routes/githubAppRouter.js
const fs = require("fs");
const path = require("path");
const express = require("express");
require("dotenv").config();

const router = express.Router();

(async () => {
  const { Octokit } = await import("@octokit/core");
  const { createAppAuth } = await import("@octokit/auth-app");

  const privateKey = fs.readFileSync(
    path.join(__dirname, "../webify-deployer.pem"),
    "utf8"
  );

  // Create GitHub App authenticated client
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PEM.replace(/\\n/g, '\n'),
      clientId: process.env.GITHUB_APP_CLIENT_ID,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
    },
  });

  // Webhook handler
  router.post("/webhook", express.json(), async (req, res) => {
    try {
      const event = req.headers["x-github-event"];
      const payload = req.body;

      console.log(`🔔 GitHub event: ${event}`);

      if (event === "push") {
        const repo = payload.repository.full_name;
        const branch = payload.ref.split("/").pop();
        const commit = payload.after;

        console.log(`🚀 Push detected on ${repo}@${branch}`);
      }

      res.status(200).send("Webhook received");
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).send("Error processing webhook");
    }
  });
})();

module.exports = router;
