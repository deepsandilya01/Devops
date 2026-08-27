import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";
import config from "../config/config.js";
import User from "../model/user.model.js";

export const protect = async (req, res, next) => {
  try {
    // Check for token in cookies
    let token = req.cookies.token;


    token = req.cookies.token

    if (!token) {
      return next({ status: 401, message: "Not authorized to access this route" });
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await redisClient.exists(`blacklist_${token}`);
      if (isBlacklisted) {
        return next({ status: 401, message: "Token has been revoked. Please login again." });
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.id).select("+githubAccessToken")
      req.user = user;
      req.token = token; // Store token in request for logout
      next();
    } catch (error) {
      console.log("Invalid token",error)
      return next({ status: 401, message: "Invalid token" });
    }
  } catch (error) {
    console.log("Not authorized to access this route",error)
    return next({ status: 500, message: "Not authorized to access this route" });
  }
};

export const isAdmin = async (req,res,next) =>{
  try {
    // Check for token in cookies
    let token = req.cookies.token;

    token = req.cookies.token;

    if (!token) {
      return next({ status: 401, message: "Not authorized to access this route" });
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await redisClient.exists(`blacklist_${token}`);
      if (isBlacklisted) {
        return next({ status: 401, message: "Token has been revoked. Please login again." });
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);

      const user = await User.findById(decoded.id)

      if(user.role !== "admin"){
        return next({ status: 401, message: "Not authorized to access this route" });
      }
      
      req.user = user
      req.token = token; // Store token in request for logout
      next();
    } catch (error) {
      return next({ status: 401, message: "Invalid token" });
    }
  } catch (error) {
    return next({ status: 401, message: "Not authorized to access this route" });
  }
}
