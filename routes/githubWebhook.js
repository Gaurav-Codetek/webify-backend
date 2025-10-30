const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const master = require("../models/master");
const router = express.Router();

router.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Helper to trigger redeploy
const redeploy = async (projectDoc) => {
  const envString =
    typeof projectDoc.env === "object"
      ? JSON.stringify(projectDoc.env)
      : projectDoc.env || "";

  const projectData = {
    repo_url: projectDoc.repository,
    subdomain: projectDoc.subdomainurl.split('.')[0],
    framework: projectDoc.framework,
    env: envString,
  };

  try {
    const res = await axios.post(
      `${process.env.REACT_APP_AWS_URL}/deploy`,
      projectData,
      {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY },
      }
    );
    console.log(`✅ Redeploy triggered successfully for ${projectDoc.prname}`);
    return res.status === 200;
  } catch (err) {
    console.error(
      `❌ Redeploy failed for ${projectDoc.prname}:`,
      err.response?.data || err.message
    );
    return false;
  }
};

router.post("/github/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const deliveryId = req.headers["x-github-delivery"];
    const secret = process.env.GITHUB_APP_SECRET;

    // ✅ Verify webhook signature
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(req.rawBody).digest("hex");
    if (signature !== digest) {
      console.warn("❌ Webhook signature mismatch");
      return res.status(401).send("Invalid signature");
    }

    const payload = req.body;
    console.log(`✅ Received ${event} event (${deliveryId})`);

    if (event === "push") {
      const repoUrl = payload.repository.clone_url; // e.g. "https://github.com/Gaurav-Codetek/campus-ai.git"
      const gitId = payload.repository.owner.login; // e.g. "Gaurav-Codetek"
      const branch = payload.ref.replace("refs/heads/", "");
      const commitMsg = payload.head_commit?.message;

      console.log(`🚀 Push detected on ${repoUrl} [${branch}]`);
      console.log(`📝 Commit: ${commitMsg}`);

      // 🔍 Find the user by GitHub username
      const masterDoc = await master.findOne({ gitId });
      if (!masterDoc) {
        console.warn(`⚠️ No master record found for user: ${gitId}`);
        return res.status(404).send("User not found");
      }

      // 🔍 Find the project by matching repository URL
      const projectDoc = masterDoc.projects.find(
        (proj) =>
          proj.repository?.toLowerCase() === repoUrl.toLowerCase() ||
          proj.repository?.toLowerCase() === repoUrl
            .replace(/\.git$/, "")
            .toLowerCase()
      );

      if (!projectDoc) {
        console.warn(`⚠️ No project found for repository: ${repoUrl}`);
        return res.status(404).send("Project not found");
      }

      // ✅ Trigger redeploy for this project
      const success = await redeploy(projectDoc);
      if (success) {
        console.log(`🚀 Redeployment triggered for ${repoUrl}`);
      } else {
        console.error(`❌ Redeployment failed for ${repoUrl}`);
      }
    }

    res.status(200).send("Event received");
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
