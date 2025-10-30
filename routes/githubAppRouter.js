// routes/githubAppRouter.js
const fs = require("fs");
const path = require("path");
const express = require("express");
require("dotenv").config();
const master = require("../models/master");

const router = express.Router();

// (async () => {
//   const { Octokit } = await import("@octokit/core");
//   const { createAppAuth } = await import("@octokit/auth-app");

//   const privateKey = fs.readFileSync(
//     path.join(__dirname, "../webify-deployer.pem"),
//     "utf8"
//   );

//   // Create GitHub App authenticated client
//   const octokit = new Octokit({
//     authStrategy: createAppAuth,
//     auth: {
//       appId: process.env.GITHUB_APP_ID,
//       privateKey: Buffer.from(process.env.GITHUB_PEM, "base64").toString("utf8"),
//       clientId: process.env.GITHUB_APP_CLIENT_ID,
//       clientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
//     },
//   });

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
// })();

router.get("/install/callback", async (req, res) => {
  try {
    const { installation_id, setup_action } = req.query;
    const username = req.session.pendingUser; // recover stored OAuth user

    if (!username) {
      return res.status(400).send("Session expired or user unknown.");
    }

    // Link installation with the user
    // await master.updateOne(
    //   { gitId: username },
    //   { installationId: installation_id, setupAction: setup_action }
    // );

    // Clear session placeholder
    delete req.session.pendingUser;

    // Redirect to frontend dashboard
    return res.redirect(`${process.env.CORS_ORIGIN}/dashboard/${username}`);
  } catch (err) {
    console.error("Installation callback error:", err.message);
    res.status(500).send("Installation callback failed");
  }
});

module.exports = router;
