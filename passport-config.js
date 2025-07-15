const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
require('dotenv').config();


passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `https://webify-backend-tau.vercel.app/auth/github/callback`
}, (accessToken, refreshToken, profile, done) => {
  // Save or use the profile here
  console.log(profile._json.avatar_url);
  const user = {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatar: profile._json.avatar_url,
    accessToken: accessToken // store accessToken
  };
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
