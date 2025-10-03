require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');

const config = require('./config');
const pool = require('./config/db/pool');
const routes = require('./routes');
const uploadRoutes = require('./routes/uploadRoutes.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (dev only). Replace with Redis store in prod.
app.use(session({
  secret: config.SESSION_SECRET || 'please-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: config.NODE_ENV === 'production' }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
require('./controllers/authController').init(passport);

// Routes
app.use('/api', routes);
app.use('/api/upload', uploadRoutes);


// Start server
const PORT = config.PORT || 3001;
app.listen(PORT, () => {
  console.log(`RFP backend listening on ${PORT}`);
});