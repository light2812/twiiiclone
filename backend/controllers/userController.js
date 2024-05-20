import { User } from "../models/userSchema.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
//register
export const Register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body; //receive from req.body
    // basic validation
    if (!name || !username || !email || !password) {
      //validation
      return res.status(401).json({
        message: "All fields are required.",
        success: false,
      });
    }
    const user = await User.findOne({ email }); //find email from userchema
    if (user) {
      return res.status(401).json({
        message: "User already exist.",
        success: false,
      });
    }
    const hashedPassword = await bcryptjs.hash(password, 10); //encrypt

    await User.create({
      //if no existing user, make new one
      name,
      username,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
//login
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body; //await credentials from form
    if (!email || !password) {
      return res.status(401).json({
        message: "All fields are required.", //basic validation
        success: false,
      });
    }
    const user = await User.findOne({ email }); //invalide credentials
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }
    const isMatch = await bcryptjs.compare(password, user.password); //password validation
    if (!isMatch) {
      return res.status(401).json({
        message: "Incorect email or password",
        success: false,
      });
    }
    const tokenData = {
      //token authentication
      userId: user._id,
    };
    const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: "5d",
    });
    return res
      .status(201)
      .cookie("token", token, { expiresIn: "5d", httpOnly: true }) //store in cookies
      .json({
        message: `Welcome ${user.name}`,
        user,
        success: true,
      });
  } catch (error) {
    console.log(error);
  }
};
//logout-->reset cookies
export const logout = (req, res) => {
  return res.cookie("token", "", { expiresIn: new Date(Date.now()) }).json({
    message: "user logged out successfully.",
    success: true,
  });
};

//logged in user profile
export const getMyProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("-password"); //gives user profile data except for password
    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

//other users
export const getOtherUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const otherUsers = await User.find({ _id: { $ne: id } }).select(
      //ne operator will retun all id != user id
      "-password"
    );
    if (!otherUsers) {
      return res.status(401).json({
        message: "No other users.",
      });
    }
    return res.status(200).json({
      otherUsers,
    });
  } catch (error) {
    console.log(error);
  }
};
//following
export const follow = async (req, res) => {
  try {
    const loggedInUserId = req.body.id;
    const userId = req.params.id;
    const loggedInUser = await User.findById(loggedInUserId);
    const user = await User.findById(userId);
    if (!user.followers.includes(loggedInUserId)) {
      await user.updateOne({ $push: { followers: loggedInUserId } });
      await loggedInUser.updateOne({ $push: { following: userId } });
    } else {
      return res.status(400).json({
        message: `User already following ${user.name}`,
      });
    }
    return res.status(200).json({
      message: `${loggedInUser.name} has followed  ${user.name}`,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
//unfollowing
export const unfollow = async (req, res) => {
  try {
    const loggedInUserId = req.body.id;
    const userId = req.params.id;
    const loggedInUser = await User.findById(loggedInUserId);
    const user = await User.findById(userId);
    if (loggedInUser.following.includes(userId)) {
      await user.updateOne({ $pull: { followers: loggedInUserId } });
      await loggedInUser.updateOne({ $pull: { following: userId } });
    } else {
      return res.status(400).json({
        message: `User has not followed yet`,
      });
    }
    return res.status(200).json({
      message: `${loggedInUser.name} unfollowed  ${user.name}`,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
