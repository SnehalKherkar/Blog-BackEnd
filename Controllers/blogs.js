const express = require("express");
const blog = express.Router();
const Blog = require("../model/Blog");
const verify_jwt = require("../Middlewear/verify_jwt");
const { default: mongoose } = require("mongoose");
const User = require("../model/user");

const AWS= require("aws-sdk");
const multerS3=require("multer-s3")

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
        console.log(err)
        return reject(err);
      }
      console.log(data);
      return resolve(data);
    });
  });
};

blog.post(
  "/CreateBlog",
  [verify_jwt],
   // Use 'single' for single image upload
  async (req, res) => {
    try {
      const userid = req.decode._id;
      const author = req.decode.username;
      const is_deleted = false;
      const { title, content, tags } = req.body;
      let image = "";
      if (req.file) {
        await uploadToS3(req.file.buffer).then((res) => {
          image = res.Location;
        });
      }
      const blog = await Blog.create({
        userid,
        title,
        image, // Store the image URL
        content,
        author,
        tags,
        is_deleted,
      });
      await blog.save();
      return res.status(201).send({
        success: true,
        message: "Created Successfully",
        data: blog,
      });
    } catch (error) {
      console.log(`Error in calling API: ${error}`);
      return res.status(500).send({
        success: false,
        error: "Server Error",
      });
    }
  }
);

//to get all blogs of all users...
blog.get("/getallblogs", async (req, res) => {
  try {
    const getAllBlog = await Blog.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "username",
          as: "users",
        },
      },
      {
        $match: {
          is_deleted: false,
        },
      },
      {
        $match: {
          "users.is_deleted": false,
        },
      },
      {
        $project: {
          hashedpassword: 0,
        },
      },
    ]);
    res.status(201).send({
      success: true,
      message: "Fetched Successfully",
      data: getAllBlog,
    });
  } catch (error) {
    console.log(`Error in calling api ${error}`);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});
//get single blog by blogId
blog.get("/getSingleBlogbyblogId/:blogId", async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const response = await Blog.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(blogId), is_deleted: false },
      },
      {
        $lookup: {
          from: "users", // Assuming your User collection is named "users"
          localField: "author",
          foreignField: "username",
          as: "authorData",
        },
      },
      { $unwind: "$authorData" },
    ]);

    if (response.length > 0) {
      res.status(200).send({
        success: true,
        message: "Fetched Successfully",
        data: response[0],
      });
    } else {
      res.status(404).send({
        success: false,
        error: "Blog not found",
      });
    }
  } catch (error) {
    console.log(`Error in calling API: ${error}`);
    res.status(500).send({
      success: false,
      error: "Internal Server Error",
    });
  }
});

//get blogs of specific user who has login

blog.get("/getBlogbyuserId", [verify_jwt], async (req, res) => {
  const userid = await req.decode._id;
  try {
    const blogByuserid = await Blog.find({ userid: userid, is_deleted: false });
    res.status(201).send({
      success: true,
      message: "Fetched Successfully",
      data: blogByuserid,
    });
  } catch (error) {
    console.log(`Error in calling api ${error}`);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

//Updates likes for blogs

blog.put("/likeBlog/:blogId", [verify_jwt], async (req, res) => {
  const userId = req.decode._id;
  const blogId = req.params.blogId;
  try {
    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "Please login first, then try to like the post.",
      });
    }
    const blog = await Blog.findOne({ _id: blogId, is_deleted: false });
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found.",
      });
    }
    const likes = blog.likes || [];
    if (likes.includes(userId)) {
      return res.status(400).send({
        success: false,
        message: "You have already liked this post.",
      });
    }
    likes.push(userId);
    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: blogId },
      { likes: likes, $inc: { likesCount: 1 } },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Post liked successfully.",
      data: updatedBlog,
    });
  } catch (error) {
    console.log(`Error in calling api ${error}`);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

blog.put("/unlikeBlog/:blogId", [verify_jwt], async (req, res) => {
  const userId = req.decode._id;
  const userId1 = new mongoose.Types.ObjectId(userId);
  const blogId = req.params.blogId;
  try {
    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "Please login first, then try to unlike the post.",
      });
    }
    const blog = await Blog.findOne({ _id: blogId, is_deleted: false });
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog not found.",
      });
    }
    const likes = blog.likes;
    if (!likes.includes(userId1)) {
      return res.status(400).send({
        success: false,
        message: "You have not liked this post yet.",
      });
    }

    const index = likes.indexOf(userId1);

    if (index > -1) {
      likes.splice(index, 1);
    }
    const updatedLikes = likes.filter((like) => like !== userId);
    blog.likes = updatedLikes;
    blog.likesCount = updatedLikes.length;
    const updatedBlog = await blog.save();
    res.status(200).send({
      success: true,
      message: "Post unliked successfully.",
      data: updatedBlog,
    });
  } catch (error) {
    console.log(`Error in calling api ${error}`);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

blog.put("/deleteBlog/:blogId", [verify_jwt], async (req, res) => {
  const userId = req.decode._id;
  const blogId = req.params.blogId;

  try {
    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "Please login first, then try to delete the post.",
      });
    }

    const blog = await Blog.findOne({ _id: blogId });

    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog/Post not found.",
      });
    }

    // Add authorization check
    if (blog.userid !== userId) {
      return res.status(401).send({
        success: false,
        message: "You are not authorized to delete this post.",
      });
    }

    const deleteblog1 = await Blog.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(blogId) },
      { $set: { is_deleted: true } }
    );

    res.status(200).send({
      success: true,
      message: "User's post deleted successfully",
      data: deleteblog1,
    });
  } catch (error) {
    console.log(`Error in calling api ${error}`);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});


blog.put("/commentsAdd/:blogId", [verify_jwt], async (req, res) => {
  const userId = await req.decode._id;
  const blogId = await req.params.blogId;
  const content = req.body.content;
  try {
    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "Please login first, then try to post the comments",
      });
    }
    const blog = await Blog.findOne({ _id: blogId, is_deleted: false });
    if (!blog) {
      return res.status(404).send({
        success: false,
        message: "Blog/Post not found.",
      });
    }

    const user1 = await User.findOne({ _id: userId });
    if (!user1) {
      return res.status(404).send({
        success: false,
        message: "User not found.",
      });
    }

    const newComment = {
      author: user1.username,
      userId: user1._id,
      content: content,
    };

    blog.comments.unshift(newComment);

    await blog.save();

    res.status(200).send({
      success: true,
      message: "Comment added successfully.",
      comment: newComment,
    });
  } catch (error) {
    console.log(`Error in calling api ${error}`);
    res.status(500).send({
      success: false,
      error: "Server Error",
    });
  }
});

blog.delete(
  "/deletecomment/:blogId/:commentId",
  [verify_jwt],
  async (req, res) => {
    const userId = await req.decode._id;
    const blogId = await req.params.blogId;
    const commentId = await req.params.commentId;
    try {
      const blogFinding = await Blog.findOne({ _id: blogId });
      const commentFind = await blogFinding.comments;
      const comment = commentFind.find(
        (comment) => comment._id.toString() === commentId.toString()
      );

      if (!comment) {
        return res.status(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      if (comment.userId !== userId) {
        return res.status(401).send({
          success: false,
          error: "You are not authorized to delete this comment",
        });
      }

      const index = commentFind.findIndex(
        (comment) => comment._id.toString() === commentId.toString()
      );

      if (index > -1) {
        commentFind.splice(index, 1);
      }

      const updatedComments = commentFind.filter(
        (comment) => comment !== commentId
      );

      const updatedBlog = await blogFinding.save();

      res.status(200).send({
        success: true,
        message: "Comment deleted successfully.",
        data: updatedBlog,
      });
    } catch (error) {
      console.log(`Error in calling API: ${error}`);
      res.status(500).send({
        success: false,
        error: "Server Error",
      });
    }
  }
);
module.exports = blog;
