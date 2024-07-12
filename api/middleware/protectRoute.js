import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "./error.js";
import jwt from "jsonwebtoken";

export const protectRoute = TryCatch(async (req, res, next) => {
  const token = req.cookies.jwt;
  //   console.log("cookie", req.cookies.jwt);
  if (!token) {
    return next(new ErrorHandler("Unauthorized: No Token Provided", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded) {
    return next(new ErrorHandler("Unauthorized: Invalid Token", 401));
  }
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return next(new ErrorHandler("user not found", 404));
  }
  req.user = user;
  next();
});
