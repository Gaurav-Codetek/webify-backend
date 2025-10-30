const axios = require("axios");
const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const git = req.user;
    const userData = {
      username: git.username,
      email: git.emails?.[0]?.value,
      githubId: git.id,
    };

    // ✅ Decode Base64 encoded PEM from .env
    const privateKey = Buffer.from(process.env.GITHUB_PEM, "base64").toString("utf8");

    // ✅ Generate App JWT (valid for 10 min)
    const appJWT = jwt.sign(
      {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
        iss: process.env.GITHUB_APP_ID,
      },
      privateKey,
      { algorithm: "RS256" }
    );

    // ✅ Fetch all installations for this GitHub App
    const installRes = await axios.get("https://api.github.com/app/installations", {
      headers: {
        Authorization: `Bearer ${appJWT}`,
        Accept: "application/vnd.github+json",
      },
    });

    const installations = installRes.data || [];

    // ✅ Find if this user has an installation
    const userInstallation = installations.find(
      inst => inst.account?.login?.toLowerCase() === userData.username.toLowerCase()
    );

    if (!userInstallation) {
      // ⚠️ No installation found → redirect to install page
      req.session.pendingUser = userData.username;
      const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;
      console.log(`Redirecting ${userData.username} to install GitHub App`);
      return res.redirect(installUrl);
    }

    // ✅ Installation exists → attach to request (optional)
    req.githubAppInstallation = userInstallation;

    // ✅ Continue to next middleware or dashboard
    return next();

  } catch (err) {
    console.error("GitHub App check failed:", err.response?.data || err.message);
    return res.status(500).json({ message: "GitHub App installation check failed" });
  }
};
