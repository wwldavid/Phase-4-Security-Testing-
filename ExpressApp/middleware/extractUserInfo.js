/**
 * This middleware will:
 * 1. Extract JWT token from request header. The token is sent under 'Authorization' parameter and 'Bearer' prefix is
 * added to the token. Hence we access the request.header('Authorization') value and replace 'Bearer ' with ''
 * 2. If JWT token is not present, send a error response to fontend.
 * 3. Decode the JWT token and set user info in the request object and finally calls the next() method to handle request.
 */

// middleware/extractUserInfo.js
import jwt from "jsonwebtoken";

export default function extractUserInfo(req, res, next) {
  const authHeader = req.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
