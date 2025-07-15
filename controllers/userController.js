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
            avatar: git.photos?.[0]?.value
        };

        const data = { ...masterTemplate }; // deep copy

        data.gitId = git.username;
        data.gitEmail = git.emails?.[0]?.value;
        data.gitUID = git.id;
        data.user = git.username;
        data.avatar = userData.avatar // also ensure this exists in your schema

        const existingUser = await master.findOne({ gitId: git.username });

        if (!existingUser) {
            const newUser = new master(data);
            await newUser.save();
            // console.log("New user saved:", newUser);
        } else {
            // console.log("User already exists:", existingUser);
        }

        res.redirect(`${process.env.CORS_ORIGIN}/dashboard/${userData.username}`);

    } catch (err) {
        console.error("GitHub login error:", err);
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