import { TryCatch } from "../middleware/error.js";
import { Notification } from "../models/notificationModel.js";
import ErrorHandler from "../utils/errorHandler.js";

export const getNotification = TryCatch(async (req, res, next) => {
  const userId = req.user._id;

  const notification = await Notification.find({ to: userId }).populate({
    path: "from",
    select: "username profileImg",
  });

  await Notification.updateMany({ to: userId }, { read: true });

  res.status(200).json(notification);
});
export const delNotifications = TryCatch(async (req, res, next) => {
  const userId = req.user._id;

  await Notification.deleteMany({ to: userId });

  res.status(200).json({ message: "Notification deleted successfully" });
});

// export const delNotification = TryCatch(async (req, res, next) => {
//   const notificationId = req.params.id;
//   const userId = req.user._id;
//   const notification = await Notification.findById(notificationId);

//   if (!notification)
//     return next(new ErrorHandler("Notification not found", 404));

//   if (notification.to.toString() !== userId.toString()) {
//     return next(
//       new ErrorHandler("You are not allowed to delete this notification", 403)
//     );
//   }

//   await Notification.findByIdAndDelete(notificationId);

//   res.status(200).json({ message: "Notification deleted successfully" });
// });
