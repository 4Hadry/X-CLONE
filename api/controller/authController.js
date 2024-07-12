import { TryCatch } from "../middleware/error.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export const signUp = TryCatch(async (req, res, next) => {
  const { fullName, username, email, password } = req.body;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorHandler("Invalid email format", 400));
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return next(new ErrorHandler("username already Exists", 400));
  }
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return next(new ErrorHandler("email already Exists", 400));
  }
  if (password < 6) {
    return next(new ErrorHandler("password must be 6 characters ", 400));
  }

  const newUser = new User({
    fullName,
    username,
    email,
    password,
  });
  if (newUser) {
    generateTokenAndSetCookie(newUser._id, res);
    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      followers: newUser.followers,
      following: newUser.followings,
      profile: newUser.profileImg,
      coverImg: newUser.coverImg,
    });
  } else {
    return next(new ErrorHandler("Invalid User Data", 400));
  }
});

export const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return next(new ErrorHandler("wrong username ", 400));
  const isPasswordCorrect = await user.matchPassword(password);

  if (!user || !isPasswordCorrect) {
    return next(new ErrorHandler("invalid credentials ", 400));
  }
  generateTokenAndSetCookie(user._id, res);

  res.status(200).json({
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    followers: user.followers,
    following: user.followings,
    profile: user.profileImg,
    coverImg: user.coverImg,
  });
});

export const logOut = TryCatch(async (req, res, next) => {
  res.cookie("jwt", "", { maxAge: 0 });

  res.status(200).json({
    message: "Logged out successfully",
  });
});
export const getMe = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).json(user);
});
