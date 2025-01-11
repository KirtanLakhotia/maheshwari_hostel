const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  photo: String,
  text_input:String ,
  check1:Boolean,
});
const User =mongoose.model('User', UserSchema);;
module.exports = User;