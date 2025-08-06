
/**
 * This middleware will:
 * 1. Extract JWT token from request header. The token is sent under 'Authorization' parameter and 'Bearer' prefix is
 * added to the token. Hence we access the request.header('Authorization') value and replace 'Bearer ' with ''
 * 2. If JWT token is not present, send a error response to fontend.
 * 3. Decode the JWT token and set user info in the request object and finally calls the next() method to handle request.
 */

const jwt = require('jsonwebtoken');

const extractUserInfo = (request, response, next) => {
  const token = request.header('Authorization').replace('Bearer ', '');
  if (!token) return response.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    next();
  } catch (error) {
    response.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = extractUserInfo;