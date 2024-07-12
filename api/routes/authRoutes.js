import express from "express";
import { getMe, logOut, login, signUp } from "../controller/authController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);
router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logOut);

export default router;
