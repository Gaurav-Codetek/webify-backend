const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const master = require("../models/master");
const { masterTemplate } = require("../utils/masterStruct");

exports.userAuth = async (req, res) => {
  try {
    const git = req.user;

    // --- STEP 1️⃣: Generate JWT for GitHub App ---
    const PRIVATE_KEY = process.env.GITHUB_PEM.replace(/\\n/g, '\n')

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + 600, // valid 10 minutes
      iss: process.env.GITHUB_APP_ID,
    };

    const appJWT = jwt.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
    console.log("🔐 GitHub App JWT created");

    // --- STEP 2️⃣: Get App Installations ---
    const appInstallationsRes = await axios.get("https://api.github.com/app/installations", {
      headers: {
        Authorization: `Bearer ${appJWT}`,
        Accept: "application/vnd.github+json",
      },
    });

    const installations = appInstallationsRes.data;
    console.log(`📦 Found ${installations.length} app installations`);

    // --- STEP 3️⃣: Save or update the GitHub user ---
    const userData = {
      githubId: git.id,
      username: git.username,
      email: git.emails?.[0]?.value,
      avatar: git.photos?.[0]?.value,
    };

    const data = { ...masterTemplate };
    data.gitId = git.username;
    data.gitEmail = git.emails?.[0]?.value;
    data.gitUID = git.id;
    data.user = git.username;
    data.avatar = userData.avatar;

    let user = await master.findOne({ gitId: git.username });
    if (!user) {
      user = await new master(data).save();
      console.log(`🆕 New user saved: ${git.username}`);
    } else {
      console.log(`👤 Returning user: ${git.username}`);
    }

    // --- STEP 4️⃣: Check if user has installed the App ---
    const hasInstalled = installations.some(
      (inst) => inst.account?.login.toLowerCase() === git.username.toLowerCase()
    );

    if (!hasInstalled) {
      console.log(`⚠️ ${git.username} has not installed the GitHub App`);
      const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;
      return res.redirect(installUrl);
    }

    const installation = installations.find(
      (inst) => inst.account?.login.toLowerCase() === git.username.toLowerCase()
    );
    const installationId = installation?.id;

    // --- STEP 5️⃣: Generate Installation Access Token ---
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
    console.log(`✅ Installation token generated for ${git.username}`);

    // --- STEP 6️⃣: Save Installation Token in DB ---
    user.installationId = installationId;
    user.installationToken = installationToken;
    user.installationTokenExpiresAt = tokenRes.data.expires_at;
    await user.save();

    // --- STEP 7️⃣: Redirect to Dashboard ---
    return res.redirect(`${process.env.CORS_ORIGIN}/dashboard/${git.username}`);
  } catch (err) {
    console.error("🚨 GitHub login error:", err.response?.data || err.message);
    return res.status(500).json({
      message: "GitHub login failed",
      error: err.response?.data || err.message,
    });
  }
};



exports.logout = (req, res) => {
  try {
    req.logout(err => {
      if (err) return res.status(500).send('Logout error');

      req.session.destroy(destroyErr => {
        if (destroyErr) return res.status(500).send('Session destroy error');

        res.clearCookie('connect.sid'); // Or 'sid' if you renamed it
        return res.status(200).json({message: "Logged out", authenticated: false});
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal server error');
  }
};

exports.checkAuth = async (req, res) => {
  if (req.isAuthenticated()) {
    // console.log(req.user);
    const data = req.user;
    userData = {
        id: data.id,
        username: data.username
    }
    res.status(200).json({ authenticated: true, user: userData });
  } else {
    res.status(401).json({ authenticated: false });
  }
};