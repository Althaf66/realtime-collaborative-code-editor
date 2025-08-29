const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
        if (!user) {
          user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
          if (!user) {
            // Create new user if none exists
            user = await prisma.user.create({
              data: {
                email: profile.emails[0].value,
                googleId: profile.id,
              },
            });
          } else {
            // Update existing user with Google ID
            user = await prisma.user.update({
              where: { email: profile.emails[0].value },
              data: { googleId: profile.id },
            });
          }
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Serialize user to session (minimal, as we use JWTs)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;