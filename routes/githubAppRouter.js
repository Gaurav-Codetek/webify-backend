// routes/githubAppRouter.js
const express = require("express");
require("dotenv").config();
const master = require("../models/master");
const router = express.Router();

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
    await master.updateOne(
      { gitId: username },         // filter: find by username or id
      { $set: { installationId: installation_id } } // update: add or update this field
    );

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
