import { TryCatch } from "../middleware/error.js";
import { v2 as cloudinary } from "cloudinary";
import { Notification } from "../models/notificationModel.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";

export const getUserProfile = TryCatch(async (req, res, next) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).select("-password");

  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }
  res.status(200).json(user);
});

export const followUnfollowUsr = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  if (id === req.user._id.toString()) {
    return next(new ErrorHandler("You can't follow yourself", 400));
  }

  const userToModify = await User.findById(id);
  const currentUsr = await User.findById(req.user._id);

  if (!userToModify || !currentUsr) {
    return next(new ErrorHandler("User not found", 400));
  }

  const isFollowing = currentUsr.followings.includes(id);

  if (isFollowing) {
    // Unfollow user
    await Promise.all([
      User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }),
      User.findByIdAndUpdate(req.user._id, { $pull: { followings: id } }),
    ]);
    // return the id of the user as a response
    res.status(200).json({
      message: "User unfollowed successfully",
    });
  } else {
    // Follow user

    const newNotification = new Notification({
      type: "follow",
      from: req.user._id,
      to: userToModify._id,
    });
    await Promise.all([
      User.findByIdAndUpdate(id, { $push: { followers: req.user._id } }),
      User.findByIdAndUpdate(req.user._id, { $push: { followings: id } }),
      newNotification.save(),
    ]);
    // return the id of the user as a response
    res.status(200).json({
      message: "User followed successfully",
    });
  }
});

export const getSuggestedUsers = TryCatch(async (req, res, next) => {
  // Get the current user's ID from the request object
  const userId = req.user._id;

  // Fetch the users followed by the current user and a random sample of users concurrently
  const [usersFollowedByMe, users] = await Promise.all([
    // Find the current user and select only the 'followings' field
    User.findById(userId).select("followings"),
    // Get a random sample of 10 users excluding the current user
    User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]),
  ]);

  // Filter out the users who are already followed by the current user
  const filteredUsers = users.filter(
    (user) => !usersFollowedByMe.followings.includes(user._id)
  );

  // Get up to 4 users from the filtered list as suggested users
  const suggestedUsers = filteredUsers.slice(0, 4);

  // For each suggested user, set the password field to null to avoid exposing it
  suggestedUsers.forEach((user) => (user.password = null));

  // Send the suggested users in the response with a 200 status code
  res.status(200).json(suggestedUsers);
});
export const updateProfile = TryCatch(async (req, res, next) => {
  let { fullName, email, username, currentPass, newPass, bio, link } = req.body;
  let { profileImg, coverImg } = req.body;
  const userId = req.user._id;

  let user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User Not Found", 404));
  if ((!newPass && currentPass) || (!currentPass && newPass)) {
    return next(
      new ErrorHandler("Please Provide the both currend and new Password", 400)
    );
  }

  if (currentPass && newPass) {
    const isMatch = await user.matchPassword(currentPass);
    // console.log(isMatch);
    if (!isMatch)
      return next(new ErrorHandler("Current password is incorrect", 400));
    if (newPass.length < 6)
      return next(new ErrorHandler("Password must be 6 characters", 400));
    user.password = newPass;
  }
  if (profileImg) {
    if (user.profileImg) {
      await cloudinary.uploader.destroy(
        user.profileImg.split("/").pop().split(".")[0]
      );
    }
    const uplodedResponse = await cloudinary.uploader.upload(profileImg);
    profileImg = uplodedResponse.secure_url;
  }
  if (coverImg) {
    if (user.coverImg) {
      await cloudinary.uploader.destroy(
        user.coverImg.split("/").pop().split(".")[0]
      );
    }
    const uplodedResponse = await cloudinary.uploader.upload(coverImg);
    coverImg = uplodedResponse.secure_url;
  }
  user.fullName = fullName || user.fullName;
  user.email = email || user.email;
  user.username = username || user.username;
  user.bio = bio || user.bio;
  user.link = link || user.link;
  user.profileImg = profileImg || user.profileImg;
  user.coverImg = coverImg || user.coverImg;

  user = await user.save();
  user.password = null;

  return res.status(200).json(user);
});
