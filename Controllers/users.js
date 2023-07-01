const express = require("express");
const user = express.Router();
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const jwt_pass = require("../Middlewear/auth");
const verify_jwt = require("../Middlewear/verify_jwt");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");

//

const awsConfig = {
  accessKeyId: "AKIA5IRU7DUSDOG5QJFZ",
  secretAccessKey: "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",
  region: "ap-south-1",
};

const S3 = new AWS.S3(awsConfig);

const uploadToS3 = (fileData) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: "mubucketcreatedfromsdkforblog",
      Key: `${Date.now().toString()}.jpg`,
      Body: fileData,
    };
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      console.log(data);
      return resolve(data);
    });
  });
};

user.post("/userregistration", async (req, res) => {
  try {
    console.log(req.file);
    const {
      Email,
      Contact_no,
      First_Name,
      Middle_Name,
      Last_Name,
      Date_of_Birth,
      username,
      password,
      bio,
      is_Verified,
      is_Private,
      is_Buisenessaccount,
      is_Active,
    } = req.body;
    let profile_picture = "";
    if (req.file) {
      await uploadToS3(req.file.buffer).then((res) => {
        profile_picture = res.Location;
      });
    }
    const is_deleted = false;
    const existinguser = await User.findOne({
      $or: [{ Email }, { Contact_no }],
    });
    if (existinguser) {
      return res.status(400).send({
        success: false,
        message: "User already registered with existing email Id or Mobile No",
      });
    } else {
      const hashedpassword = await bcrypt.hash(password, saltRounds);
      const newUser = await User.create({
        Email,
        Contact_no,
        First_Name,
        Middle_Name,
        Last_Name,
        Date_of_Birth,
        username,
        hashedpassword,
        profile_picture,
        bio,
        is_Verified,
        is_Private,
        is_Buisenessaccount,
        is_Active,
        is_deleted,
      });
      res.status(201).send({
        success: true,
        message: "User registered Successfully!",
        data: newUser,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

user.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const login_user = await User.find({ username: username });
    if (!login_user) {
      return res.status(401).send({
        success: false,
        error: "Invalid username or password",
      });
    }
    const db_pass = login_user[0]?.hashedpassword;
    if (!db_pass) {
      return res.status(500).send({
        success: false,
        message: "Pls make sure you entered field are correct",
      });
    }
    if (login_user[0].is_deleted === true) {
      return res.status(401).send({
        success: false,
        message:
          "Your account is not active currently...Pls make sure you have activated your account!",
        data: [],
      });
    }
    const match = await bcrypt.compare(password, db_pass);
    if (match) {
      const token = jwt.sign(
        {
          _id: login_user[0]._id,
          username: login_user[0].username,
        },
        jwt_pass,
        { expiresIn: "4h" }
      );
      res.status(200).send({
        success: true,
        message: "Login Successfully!",
        data: token,
      });
    } else {
      res.status(401).send({
        success: false,
        message: "Invalid username or password",
        data: [],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

//we are deleting account of the user by using soft delete method...
user.put("/deleteAccount", [verify_jwt], async (req, res) => {
  try {
    const _id = await req.decode._id;
    const deleteUser = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      { $set: { is_deleted: true } }
    );
    res.status(200).send({
      success: true,
      message: "User account deleted successfully",
      data: deleteUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});
//if user wants to activate his account again
user.put("/activateYourAccount", async (req, res) => {
  try {
    const { username, password, Email, Contact_no } = req.body;
    const existinguser = await User.findOne({
      $or: [{ Email }, { Contact_no }],
    });
    const db_pass = existinguser.hashedpassword;
    const delete1 = existinguser.is_deleted;
    if (delete1 === false) {
      if (!res.headersSent) {
        res.status(500).send({
          status: false,
          message: "Your account is already activated",
        });
      }
    } else {
      const match = await bcrypt.compare(password, db_pass);
      if (!match) {
        res.status(500).send({
          success: false,
          message:
            "You may have entered wrong password...Pls make sure you enterd correct password!",
        });
      }

      if (existinguser) {
        const activateUser = await User.updateOne(
          { $and: [{ Email }, { Contact_no }, { username }] },
          { $set: { is_deleted: false } }
        );
        res.status(200).send({
          success: true,
          message: "User's account activated successfully!",
          data: activateUser,
        });
      } else {
        res.status(401).send({
          success: true,
          message:
            "User does not exist for given emailId or mobile no Pls register first...!",
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

user.get("/getAllusers", async (req, res) => {
  try {
    const getAllusers = await User.find(
      { is_deleted: { $ne: true } },
      {
        hashedpassword: 0,
        is_Verified: 0,
        is_Active: 0,
        is_Buisenessaccount: 0,
        is_Private: 0,
      }
    );
    res.status(200).send({
      success: true,
      message: "Successfully fetched all users!",
      data: getAllusers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

module.exports = user;
