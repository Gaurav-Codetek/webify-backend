const express = require('express');
const router = express.Router();
require('dotenv').config();
const passport = require('passport');
const userController = require('../controllers/userController');
const gitController = require('../controllers/gitController');
const isAuthenticated = require('../middleware/isAuth');
const verifyApiKey = require('../middleware/apiAuth');

// Redirect to GitHub for login
router.get('/github', passport.authenticate('github', { scope: ['repo', 'admin:repo_hook', 'user:email'] }));

// Callback after GitHub login
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CORS_ORIGIN}/auth` }),
  userController.userAuth
);

router.get('/logout', userController.logout);
router.get('/check',isAuthenticated, userController.checkAuth);

router.get('/repo', isAuthenticated , gitController.getUserRepos);
router.post('/createWebhook', isAuthenticated, gitController.createWebhook);

module.exports = router;
