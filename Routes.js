const express = require("express");
const router = express.Router();
const blog = require("./Controllers/blogs");
const user = require("./Controllers/users");
const upload = require("./Middlewear/uploads");

router.use("/user",upload.single("profile_picture"), user);
router.use("/blog", upload.single("image"), blog);

module.exports = router;
