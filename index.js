require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const sequelize = require('./config/database');
const { decrypt } = require('./utils/crypto');

const app = express();

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// Главная страница
app.get('/', (req, res) => {
  res.send('<h1>MDK 0902 PR OAuth 2.0</h1><a href="/auth/google">Login with Google</a>');
});

// Инициация OAuth
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

// Callback от Google
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/error' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

// Профиль
app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/google');
  }

  const user = req.user;
  
  const decryptedEmail = decrypt(user.email);

  res.json({
    id: user.googleId,
    email: decryptedEmail,
    profilePicture: user.profilePicture
  });
});

// Выход
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Обработка ошибок
app.get('/error', (req, res) => {
  res.send('Authentication failed!');
});

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Database connection error:', err);
});
