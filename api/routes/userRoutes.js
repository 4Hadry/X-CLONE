import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  followUnfollowUsr,
  getSuggestedUsers,
  getUserProfile,
  updateProfile,
} from "../controller/userController.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUsr);
router.post("/update", protectRoute, updateProfile);

export default router;
