import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        message: "User not authenticated.",
        success: false,
      });
    }
    const verify = await jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verify.userId;
    next();
  } catch (error) {
    console.log(error);
  }
};
export default isAuthenticated;
