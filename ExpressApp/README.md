# This is the express app for Project Phase 4

To start the express app

1. Download the code
2. cd into the project folder (ExpressApp)
3. Create .env file and copy following details:

   DB_URL=mongodb://localhost:27017

   DATABASE_NAME=projPhase4

   SERVER_PORT=3000

   JWT_SECRET=KJAHS39798A@%6781KAHSF82^&&JHAF131^&!A112323SFW112

4. run **npm install** command
5. run **node app.js** command

## This app has following endpoints

### Base URL

> http://localhost:3000: Just the base url, this is not a endpoint hence you cannot get/post on this url.

### Users

> /user/register: Post user data as in JSON format to register a new user.

user role can be **'admin', 'employee'**

user department can be **'hr', 'sales', 'finance'**

> /user/login: Post username and password to login a user. Return a auth token

### Files

> /file: Post a file for upload.

> /file/:id: Get a unique file using file id

> /file: Get list of all files based on the user's department.

### Comments

> /comment: Post a new comment

> /comment: Get list of all comments.
