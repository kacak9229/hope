const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: { type: String, unique: true, lowercase: true},
  phone: String,
  firstName: String,
  lastName: String,
  password: String,
  photo: String,
  about: String,

  facebookId: String,
});


module.exports = mongoose.model('User', UserSchema);
