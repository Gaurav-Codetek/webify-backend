const jwt = require("jsonwebtoken");
const axios = require("axios");
const master = require("../models/master");
const { masterTemplate } = require("../utils/masterStruct");

exports.userAuth = async (req, res) => {
  try {
    const git = req.user;

    const userData = {
      githubId: git.id,
      username: git.username,
      email: git.emails?.[0]?.value,
      avatar: git.photos?.[0]?.value,
      accessToken: git.accessToken
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
    }

    // ✅ Decode private key from Base64
    const privateKey = Buffer.from(process.env.GITHUB_PEM, "base64").toString("utf8");

    // ✅ Generate App JWT
    const appJWT = jwt.sign(
      {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
        iss: process.env.GITHUB_APP_ID
      },
      privateKey,
      { algorithm: "RS256" }
    );

    // ✅ Fetch installations
    const installRes = await axios.get("https://api.github.com/app/installations", {
      headers: {
        Authorization: `Bearer ${appJWT}`,
        Accept: "application/vnd.github+json"
      }
    });

    const installations = installRes.data || [];
    const userInstallation = installations.find(
      inst => inst.account?.login?.toLowerCase() === userData.username.toLowerCase()
    );

    if (!userInstallation) {
      req.session.pendingUser = userData.username;
      const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;
      return res.redirect(installUrl);
    }

    res.redirect(`${process.env.CORS_ORIGIN}/dashboard/${userData.username}`);
  } catch (err) {
    console.error("GitHub login error:", err.response?.data || err.message);
    return res.status(500).json({ message: "GitHub login failed" });
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