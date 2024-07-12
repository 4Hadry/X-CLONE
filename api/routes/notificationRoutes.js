import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  delNotifications,
  getNotification,
} from "../controller/notificationController.js";

const router = express.Router();

router.get("/", protectRoute, getNotification);
router.delete("/", protectRoute, delNotifications);
// router.delete("/:id", protectRoute, delNotification);

export default router;
