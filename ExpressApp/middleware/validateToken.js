import jwt from 'jsonwebtoken';

const validateJWT = (req, res, next) => {
    console.log("validating token")
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if(!token) {
        return res.status(401).json({
            message: "No token, authorization denied",
        })
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // extract user info from token
        req.user = decodedToken;                                        // put user info in req object to easy access
        next();                                                 // calling next middleware in the chain
    } catch(err) {
        console.log("error in validating token")
        console.log(err);
        return res.status(500).json({message: "internal server error"});
        
    }
}

export default validateJWT;