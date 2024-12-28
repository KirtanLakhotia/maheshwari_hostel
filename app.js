const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./module/data_base.js')
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const ejs= require("ejs") ;
require('dotenv').config();
const app = express();
mongoose.connect(process.env.MONGO_URI) ;

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.urlencoded({ extended: true })); // For parsing form data
app.use(bodyParser.json()); // For parsing JSON data

app.set('view engine','ejs') ;
// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());



passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
},


  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in the database
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Create a new user
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          photo: profile.photos[0].value,
          text_input: "NOTHING",
        });

        await user.save(); // Save to database
      }

      return done(null, user); // Pass the user to the session
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id); // Store user ID in the session
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id); // Retrieve user by ID
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard'); // Redirect to personalized dashboard
  });

  app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/google'); // Redirect to login if not authenticated
    }
    // Access user data
    // res.send(`Welcome ${req.user.name}. Your email is ${req.user.email}`);
    let val=req.user.text_input ;
    res.render("input",{input_text:val}) ;
  });
  app.post('/input', async function(req,res){
    console.log(req.user) ;
    console.log(req.body) ;
    await User.updateOne({ googleId:req.user.googleId }, { $set: { text_input: req.body.input_text } });
    res.send("hello world") ;
  }) 

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
