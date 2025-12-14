const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');
const User = require('../models/User');
const { encrypt } = require('../utils/crypto');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const people = google.people({ version: 'v1', auth: oauth2Client });
      const profileData = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos'
      });

      const email = profileData.data.emailAddresses[0].value;
      const photo = profileData.data.photos[0].url;
      const googleId = profile.id;

      const encryptedEmail = encrypt(email);
      const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

      let [user, created] = await User.findOrCreate({
        where: { googleId },
        defaults: {
          googleId,
          email: encryptedEmail,
          profilePicture: photo,
          refreshToken: encryptedRefreshToken
        }
      });

      if (!created) {
        await user.update({
          email: encryptedEmail,
          profilePicture: photo,
          refreshToken: encryptedRefreshToken
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
