const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('../generated/prisma');
const { logger } = require('../utils/logger');

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
        logger.info(`Google OAuth attempt for profile ID: ${profile.id}`);
        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
        if (!user) {
          user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: profile.emails[0].value,
                googleId: profile.id,
              },
            });
            logger.info(`Created new user via Google OAuth: ${user.id}`);
          } else {
            user = await prisma.user.update({
              where: { email: profile.emails[0].value },
              data: { googleId: profile.id },
            });
            logger.info(`Linked Google ID to existing user: ${user.id}`);
          }
        }
        done(null, user);
      } catch (error) {
        logger.error(`Google OAuth strategy error:`, error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  logger.debug(`Serializing user: ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    logger.error(`Deserialize user error for ID ${id}:`, error);
    done(error, null);
  }
});

module.exports = passport;