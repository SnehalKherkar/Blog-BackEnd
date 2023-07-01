const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  First_Name: {
    type: String,
    required: true,
  },
  Middle_Name: {
    type: String,
  },
  Last_Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Contact_no: {
    type: String,
    required: true,
    unique: true,
  },
  Date_of_Birth: {
    type: Date,
    required: true,
    default: Date.now,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  hashedpassword: {
    type: String,
    required: true,
  },
  profile_picture: {
    type: String,
  },
  bio: {
    type: String,
  },
  is_Verified: {
    type: Boolean,
    default: false,
  },
  is_Private: {
    type: Boolean,
    default: false,
  },
  is_Buisenessaccount: {
    type: Boolean,
    default: false,
  },
  is_Active: {
    type: Boolean,
    default: true,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", UserSchema);
