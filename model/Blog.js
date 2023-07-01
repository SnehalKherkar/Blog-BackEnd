const mongoose = require("mongoose");
const BlogSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String
  },
  author: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
    get: (val) => val.toLocaleString(),
  },
  updated_at: {
    type: Date,
    default: Date.now,
    get: (val) => val.toLocaleString(),
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  likesCount: {
    type: Number,
    default: 0,
  },
  is_deleted: {
    type: Boolean,
  },
  comments: [
    {
      userId: { type: String, required: true },
      author: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      created_at: {
        type: Date,
        default: Date.now,
        get: (val) => val.toLocaleString(),
      },
      updated_at: {
        type: Date,
        default: Date.now,
        get: (val) => val.toLocaleString(),
      },
    },
  ],
});

module.exports = mongoose.model("Blog", BlogSchema);
