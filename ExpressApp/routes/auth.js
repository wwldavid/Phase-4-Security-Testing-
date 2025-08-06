const express = require('express');
const User = require('../models/User');
const argon2 = require('argon2');       // library to hash the password.

const jwt = require('jsonwebtoken');


const router = express.Router();    // getting a router object to create Authentication routes.


router.post('/register', async (req, res) => {
    try {
        
        console.log(`Body: ${req.body.email}`); // testing if we are getting correct info in request object

        const {email, password, role = 'user'} = req.body;     // destructuring body object to get email and password. Adding default value to role parameter

        const hashPassword = await argon2.hash(password);

        const newUser = new User({email: email, password: hashPassword, role: role});   // create a newUser using User model object

        await newUser.save();           // saving newUser to DB

        res.status(201).json({message:"User registered successfully"}); // sending response code 201, with message


    } catch(err) {
        res.status(500).json({error:"Internal server error"});
        console.log(`error in auth register route: ${err}`)
    }
})

router.post('/login', async(request, res) => {
    try {
        const {email, password} = request.body;

        const user = await User.findOne({email})
        if(!user)
            return res.status(400).json({message: "invalid Username or Password"});

        const isMatch = await argon2.verify(user.password, password);

        if(!isMatch)
            return res.status(400).json({message: "Invalid Username or Password"});

        /**
         * If user has successfully logged in, we create a JWT token using user details (including user's role).
         * This token is returned to user, and all the subsequent request header should contain this token.
         * Using this token we can extract user's role and accordingly user to access any URL/Resource.
         */
        const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,  // Store the secret in the .env file
        { expiresIn: '1h' }
        );

        res.status(200).json({message: "Login Successful", token}); // returning JWT token to user.
    } catch (error) {
        res.status(500).json({message: "Internal server error"})
        console.log(`Error while login ${error.message}`);
    }
});


module.exports = router