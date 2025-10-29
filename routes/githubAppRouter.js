// routes/githubAppRouter.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const { App } = require("octokit");
const router = express.Router();
require("dotenv").config();

const privateKey = fs.readFileSync(
  path.join(__dirname, "../webify-deployer.pem"),
  "utf8"
);

// Initialize GitHub App
const app = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey,
  webhooks: {
    secret: process.env.GITHUB_APP_SECRET,
  },
});

// Webhook listener
router.post("/webhook", express.json(), async (req, res) => {
  try {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    console.log(`🔔 GitHub event received: ${event}`);

    if (event === "push") {
      const repo = payload.repository.full_name;
      const branch = payload.ref.split("/").pop();
      const commit = payload.after;

      console.log(`🚀 Push detected on ${repo}@${branch}`);
      
      // 👉 Trigger your deployment worker or queue here
      // e.g. sendJobToSQS({ repo, branch, commit });
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Error processing webhook");
  }
});

module.exports = router;
