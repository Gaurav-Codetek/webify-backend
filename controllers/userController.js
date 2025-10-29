const { authenticate } = require("passport");
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
      accessToken: git.accessToken // make sure passport adds this
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

    // ✅ Check GitHub App installation
    const installRes = await axios.get("https://api.github.com/user/installations", {
      headers: {
        Authorization: `token ${userData.accessToken}`,
        Accept: "application/vnd.github+json"
      }
    });

    const installations = installRes.data.installations || [];
    if (installations.length === 0) {
      // no installation yet
      const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;
      return res.redirect(installUrl);
    }

    // if installed, go to dashboard
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