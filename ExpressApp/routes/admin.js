/**
 * This file contains routes that an 'admin' can access. Hence if user role is 'admin' then only give access otherwise
 * access denied.
 */

const express = require('express')
const adminRoutes = express.Router();

const extractUserInfo = require('../middleware/extractUserInfo');
const authorize = require('../middleware/authorize');

/**
 * '/protected' route will execute 2 middleware before responding. First extractUserInfo to get user info, then authorize
 *  to check if user.role == 'admin' or not.
 */
adminRoutes.get('/protected', extractUserInfo, authorize('admin'), (request, response) => {
    response.status(200).json({message: "Access Granted to ADMIN user"});
});

module.exports = adminRoutes;