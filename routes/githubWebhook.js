// routes/githubWebhook.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

// Middleware to parse raw body (required for signature validation)
router.use(express.json({ verify: (req, res, buf) => (req.rawBody = buf) }));

router.post("/github/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const deliveryId = req.headers["x-github-delivery"];
    const secret = process.env.GITHUB_APP_SECRET;

    // ✅ Verify the signature
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(req.rawBody).digest("hex");

    if (signature !== digest) {
      console.warn("❌ Webhook signature mismatch");
      return res.status(401).send("Invalid signature");
    }

    // ✅ Signature verified
    console.log(`✅ Received ${event} event (${deliveryId})`);

    const payload = req.body;

    // ⚙️ Handle specific event types
    if (event === "push") {
      const repo = payload.repository.full_name;
      const branch = payload.ref.replace("refs/heads/", "");
      const pusher = payload.pusher.name;

      console.log(`🚀 Push event in ${repo} on branch ${branch} by ${pusher}`);
      console.log(`Commit message: ${payload.head_commit.message}`);

      // TODO: trigger your build/deploy logic here
      // e.g., enqueue a job in SQS, start build worker, etc.
    }

    // Always respond quickly to GitHub
    res.status(200).send("Event received");
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
