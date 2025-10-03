// src/controllers/authController.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../config');
const { findById, upsertUser } = require('../models/userModel');

exports.init = (passportInstance) => {
  passportInstance.serializeUser((user, done) => {
    done(null, user.id);
  });
  passportInstance.deserializeUser(async (id, done) => {
    try {
      const user = await findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passportInstance.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    // Upsert user
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      const name = profile.displayName || profile.username;
      const provider = 'google';
      const provider_id = profile.id;

      const user = await upsertUser({ email, name, provider, provider_id });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
};

exports.authenticateGoogle = passport.authenticate('google', { scope: ['profile','email'] });

exports.handleGoogleCallback = passport.authenticate('google', {
  failureRedirect: '/auth/failure',
  successRedirect: '/auth/success',
  session: true
});

exports.success = (req, res) => {
  res.json({ success: true, user: req.user || null });
};

exports.me = (req, res) => {
  res.json({ user: req.user || null });
};

exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: 'not authenticated' });
};
