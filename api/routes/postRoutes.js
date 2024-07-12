import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  allPosts,
  commentOnPost,
  createPost,
  deletePost,
  getFollowingPosts,
  getLikedPosts,
  getUserPosts,
  likeUnLike,
} from "../controller/postController.js";

const router = express.Router();

router.get("/all", protectRoute, allPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnLike);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);

export default router;
