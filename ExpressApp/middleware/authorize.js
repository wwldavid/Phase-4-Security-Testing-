/**
 * We have created a middleware which will check each request coming from fontend, and verify if the req.user.role is equal
 * to the role which has access to the URL.
 * This middleware will return an "Access denied" response if the role does not match. Otherwise it will call the next() 
 * method to continue with request handling.
 */

const authorize = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next(); // Role matches, grant access
        } else {
            res.status(403).json({ message: "Access denied" });
        }
    };    
};

module.exports = authorize;