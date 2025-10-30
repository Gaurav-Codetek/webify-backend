const axios = require("axios");
const jwt = require("jsonwebtoken");
const master = require("../models/master"); // your DB model

exports.getUserRepos = async (req, res) => {
  try {
    const username = req.user.username; // or req.params.username depending on your setup

    // 🔹 1. Fetch user's installationId from DB
    const user = await master.findOne({ gitId: username });
    if (!user || !user.installationId) {
      return res.status(400).json({ message: "No installation found for this user" });
    }

    const installationId = user.installationId;

    // 🔹 2. Decode PEM (base64 from .env)
    const privateKey = Buffer.from(process.env.GITHUB_PEM, "base64").toString("utf8");

    // 🔹 3. Create App JWT
    const appJWT = jwt.sign(
      {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
        iss: process.env.GITHUB_APP_ID,
      },
      privateKey,
      { algorithm: "RS256" }
    );

    // 🔹 4. Create Installation Access Token
    const tokenRes = await axios.post(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {},
      {
        headers: {
          Authorization: `Bearer ${appJWT}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const installationToken = tokenRes.data.token;

    // 🔹 5. Fetch Repositories accessible to this installation
    const reposRes = await axios.get("https://api.github.com/installation/repositories", {
      headers: {
        Authorization: `token ${installationToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "WebifyApp",
      },
    });

    const repos = reposRes.data.repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      html_url: repo.html_url,
      permissions: repo.permissions,
    }));

    res.status(200).json(repos);

  } catch (err) {
    console.error("GitHub App repo fetch error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch app installation repositories" });
  }
};


exports.createWebhook = async (req, res) => {
  const { webhookUrl, owner, repo } = req.body;
  const { accessToken } = req.user;
  const config = {
    url: `https://api.github.com/repos/${owner}/${repo}/hooks`,
    method: "post",
    withCredentials:true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    data: {
      name: "web",
      active: true,
      events: ["push"],
      config: {
        url: webhookUrl,
        content_type: "json",
        insecure_ssl: "0"
      }
    }
  }
  console.log(accessToken);
  try {
    const response = await axios(config);
    console.log("✅ Webhook created successfully!");
    console.log(response.data);
    res.status(200).json({ data: response.data, message: "Webhook created!" });

  } catch (error) {
    console.error("❌ Failed to create webhook:", error.response?.data || error.message);
    console.log(error);
    throw error;
  }
}