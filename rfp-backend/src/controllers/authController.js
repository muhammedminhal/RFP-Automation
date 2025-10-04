// src/controllers/authController.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const config = require('../config');
const { findById, findByEmail, upsertUser, createUser } = require('../models/userModel');
const { authLogger } = require('../utils/logger');

exports.init = (passportInstance) => {
  authLogger.info('Initializing passport authentication', {
    googleClientId: config.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
    googleClientSecret: config.GOOGLE_CLIENT_SECRET ? 'configured' : 'missing',
    callbackUrl: config.GOOGLE_CALLBACK_URL
  });

  passportInstance.serializeUser((user, done) => {
    authLogger.debug('Serializing user', { userId: user.id, userEmail: user.email });
    done(null, user.id);
  });
  
  passportInstance.deserializeUser(async (id, done) => {
    authLogger.debug('Deserializing user', { userId: id });
    try {
      const user = await findById(id);
      if (user) {
        authLogger.debug('User deserialized successfully', { userId: id, userEmail: user.email });
      } else {
        authLogger.warn('User not found during deserialization', { userId: id });
      }
      done(null, user);
    } catch (err) {
      authLogger.error('Error deserializing user', { userId: id, error: err.message });
      done(err);
    }
  });

  passportInstance.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    authLogger.info('Google OAuth callback received', {
      profileId: profile.id,
      profileEmail: profile.emails?.[0]?.value,
      profileName: profile.displayName || profile.username,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      const name = profile.displayName || profile.username;
      const provider = 'google';
      const provider_id = profile.id;

      if (!email) {
        authLogger.error('No email found in Google profile', { profileId: profile.id });
        return done(new Error('No email found in Google profile'));
      }

      // Check if user exists in database by email
      const existingUser = await findByEmail(email);
      
      if (!existingUser) {
        authLogger.warn('User not found in database - unauthorized access', {
          email,
          profileId: profile.id,
          profileName: name
        });
        return done(new Error('User not authorized - not found in system'));
      }

      authLogger.info('User found in database', {
        userId: existingUser.id,
        userEmail: existingUser.email,
        hasProviderId: !!existingUser.provider_id,
        currentProviderId: existingUser.provider_id,
        newProviderId: provider_id
      });

      // If user exists but provider_id is missing or different, update user details
      if (!existingUser.provider_id || existingUser.provider_id !== provider_id) {
        authLogger.info('Updating user details with provider information', {
          userId: existingUser.id,
          email,
          oldProviderId: existingUser.provider_id,
          newProviderId: provider_id
        });

        const updatedUser = await upsertUser({ 
          email, 
          name, 
          provider, 
          provider_id 
        });

        authLogger.info('User details updated successfully', {
          userId: updatedUser.id,
          userEmail: updatedUser.email,
          providerId: updatedUser.provider_id,
          lastLoginAt: updatedUser.last_login_at,
          emailVerified: updatedUser.email_verified
        });

        done(null, updatedUser);
      } else {
        // Even if provider_id is up to date, we still want to update login tracking
        const updatedUser = await upsertUser({ 
          email, 
          name, 
          provider, 
          provider_id 
        });
        
        authLogger.info('User details are up to date, but login tracking updated', {
          userId: updatedUser.id,
          userEmail: updatedUser.email,
          lastLoginAt: updatedUser.last_login_at,
          emailVerified: updatedUser.email_verified
        });
        
        done(null, updatedUser);
      }
    } catch (err) {
      authLogger.error('Error in Google OAuth strategy', {
        profileId: profile.id,
        profileEmail: profile.emails?.[0]?.value,
        error: err.message,
        stack: err.stack
      });
      done(err);
    }
  }));

  authLogger.info('Google OAuth strategy configured successfully');
};

exports.authenticateGoogle = (req, res, next) => {
  authLogger.info('Google authentication initiated', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    referer: req.get('Referer'),
    timestamp: new Date().toISOString()
  });
  
  passport.authenticate('google', { scope: ['profile','email'] })(req, res, next);
};

exports.handleGoogleCallback = (req, res, next) => {
  authLogger.info('Google OAuth callback handler called', {
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      authLogger.error('Google OAuth authentication failed', {
        error: err.message,
        stack: err.stack,
        info: info,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Check if it's an unauthorized user error
      if (err.message.includes('User not authorized')) {
        authLogger.warn('Unauthorized user attempted to access system', {
          error: err.message,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.redirect(`${config.FRONTEND_URL}/?error=unauthorized_user`);
      }
      
      return res.redirect(`${config.FRONTEND_URL}/login?error=auth_failed`);
    }
    
    if (!user) {
      authLogger.warn('Google OAuth authentication succeeded but no user returned', {
        info: info,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.redirect(`${config.FRONTEND_URL}/login?error=no_user`);
    }

    authLogger.info('Google OAuth authentication successful', {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      ip: req.ip
    });

    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      authLogger.info('JWT token generated successfully', {
        userId: user.id,
        userEmail: user.email,
        tokenLength: token.length
      });

      // Redirect to search page with token
      const redirectUrl = `${config.FRONTEND_URL}/search?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name
      }))}`;

      authLogger.info('Redirecting authenticated user to search page', {
        userId: user.id,
        userEmail: user.email,
        redirectUrl: redirectUrl.substring(0, 100) + '...' // Truncate for logging
      });

      res.redirect(redirectUrl);
    } catch (tokenError) {
      authLogger.error('Error generating JWT token', {
        userId: user.id,
        userEmail: user.email,
        error: tokenError.message,
        stack: tokenError.stack
      });
      res.redirect(`${config.FRONTEND_URL}/login?error=token_generation_failed`);
    }
  })(req, res, next);
};

exports.success = (req, res) => {
  authLogger.info('Authentication success endpoint called', {
    userId: req.user?.id,
    userEmail: req.user?.email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.json({ success: true, user: req.user || null });
};

exports.me = (req, res) => {
  authLogger.debug('User profile endpoint called', {
    userId: req.user?.id,
    userEmail: req.user?.email,
    ip: req.ip
  });
  res.json({ user: req.user || null });
};

exports.ensureAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  authLogger.debug('Authentication middleware called', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenLength: token?.length,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method
  });
  
  if (!token) {
    authLogger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Verify user still exists in database
    const user = await findById(decoded.id);
    if (!user) {
      authLogger.warn('Authentication failed: User not found in database', {
        userId: decoded.id,
        userEmail: decoded.email,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is still active (you can add additional checks here)
    req.user = {
      ...decoded,
      ...user // Include latest user data from database
    };
    
    authLogger.info('Authentication successful', {
      userId: decoded.id,
      userEmail: decoded.email,
      ip: req.ip,
      path: req.path,
      method: req.method,
      tokenExpiry: new Date(decoded.exp * 1000).toISOString()
    });
    
    next();
  } catch (err) {
    let errorMessage = 'Invalid token';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Malformed token';
    }
    
    authLogger.error('Authentication failed: Invalid token', {
      error: err.message,
      errorType: err.name,
      tokenLength: token.length,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    res.status(401).json({ error: errorMessage });
  }
};
