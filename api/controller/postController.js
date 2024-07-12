import { TryCatch } from "../middleware/error.js";
import { v2 as cloudinary } from "cloudinary";
import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Notification } from "../models/notificationModel.js";
import { response } from "express";

export const createPost = TryCatch(async (req, res, next) => {
  const { text } = req.body;
  let { img } = req.body;
  const userId = req.user._id.toString();

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("user not found ", 404));

  if (!text && !img) {
    return next(new ErrorHandler("post must have text or image", 400));
  }
  if (img) {
    const uploadedResponse = await cloudinary.uploader.upload(img);
    img = uploadedResponse.secure_url;
  }
  const newPost = new Post({
    user: userId,
    text,
    img,
  });
  await newPost.save();

  res.status(201).json(newPost);
});
export const deletePost = TryCatch(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) return next(new ErrorHandler("Post not found", 404));

  if (post.user.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("you are not authorized to delete this post", 401)
    );
  }
  if (post.img) {
    const imgId = post.img.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(imgId);
  }

  await Post.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: "Post deleted successfully" });
});

export const commentOnPost = TryCatch(async (req, res, next) => {
  const { text } = req.body;
  const postId = req.params.id;
  const userId = req.user._id;
  if (!text) return next(new ErrorHandler("Text is Required", 400));

  const post = await Post.findById(postId);

  if (!post) return next(new ErrorHandler("Post not found", 404));

  const comment = { user: userId, text };

  post.comments.push(comment);
  await post.save();

  res.status(200).json(post);
});

export const likeUnLike = TryCatch(async (req, res, next) => {
  const userId = req.user._id;
  const { id: postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) return next(new ErrorHandler("Post not found", 404));

  const userLikedPost = post.likes.includes(userId);

  if (userLikedPost) {
    /// unlike Post
    await Promise.all([
      Post.updateOne({ _id: postId }, { $pull: { likes: userId } }),
      User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } }),
    ]);
    const updatedLikes = post.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
    res.status(200).json(updatedLikes);
  } else {
    //like Post
    post.likes.push(userId);
    await Promise.all([
      User.updateOne({ _id: userId }, { $push: { likedPosts: postId } }),
      post.save(),
    ]);

    const notification = new Notification({
      type: "like",
      from: userId,
      to: post.user,
    });
    await notification.save();
    const updatedLikes = post.likes;
    res.status(200).json(updatedLikes);
  }
});

export const allPosts = TryCatch(async (req, res, next) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "user",
      select: "-password",
    })
    .populate({
      path: "comments.user",
      select: "-password",
    });

  if (posts.length === 0) {
    return res.status(200).json([]);
  }

  res.status(200).json(posts);
});

export const getLikedPosts = TryCatch(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
    .populate({
      path: "user",
      select: "-password",
    })
    .populate({
      path: "comments.user",
      select: "-password",
    });

  res.status(200).json(likedPosts);
});

export const getFollowingPosts = TryCatch(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const following = user.followings;

  const feedPosts = await Post.find({ user: { $in: following } })
    .sort({ createdAt: -1 })
    .populate({
      path: "user",
      select: "-password",
    })
    .populate({
      path: "comments.user",
      select: "-password",
    });
  res.status(200).json(feedPosts);
});

export const getUserPosts = TryCatch(async (req, res, next) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return next(new ErrorHandler("User not found", 404));

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "user",
      select: "-password",
    })
    .populate({
      path: "comments.user",
      select: "-password",
    });

  res.status(200).json(posts);
});
