## Manual Test

1.  Register a test account
    David
    Davidwanlong
    P@ss0rd!
    P@ss0rd!
    HR
    Employee

2.  Manual testing of the login API (/user/login)
    Davidwanlong
    P@ss0rd!

3.  XSS test: Inject <script>alert('XSS')</script> into the username field to check for input sanitization.
    The login API is considered safe against XSS — it neither accepts nor reflects script tags.

          Input <b>foo</b> into the username field on the login failure screen.
                   The login API blocks any input containing HTML tags and returns a 400 error, indicating strict server-side validation on the
                   username field. As a result, such content is neither reflected nor stored, effectively preventing reflected XSS attacks at this
                   stage.

4.  Boundary and size constraints testing
    ennter over 1000 characters in both the username and password fields to check whether the front-end maxLength={50} restriction works and whether the back end also enforces a limit.
    The username has a length limit, but the password does not.

5.  Injection Testing (NoSQL / Logic Bypass)
    By sending {"username": {"$ne": null}, "password": ""}, it is possible to authenticate as any user. The server responds with the profile of the first matching user in the database and issues a JWT token.

    Last login: Fri Aug 8 14:30:09 on ttys016
    wanlongwu@Wanlongs-Laptop ~ % curl -X POST http://127.0.0.1:3000/user/login \
     -H "Content-Type: application/json" \
     -d '{"username": {"$ne": null}, "password": ""}'
     {"message":"login successful","authToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.     eyJ1c2VySWQiOiIzMDM1NTQ3NjciLCJ1c2VybmFtZSI6IkRhdmlkd2FubG9uZyIsImRlcGFydG1lbnQiOiJociIsInJvbGU     iOiJlbXBsb3llZSIsImlhdCI6MTc1NDY4NTkzMSwiZXhwIjoxNzU0Njg5NTMxfQ.     24GeIzh1col8A9DuImIB3pzdZ9XabF2zJgd3MK7C2JQ","username":"Davidwanlong","name":"David",     "role":"employee","department":"hr","id":"303554767"}%                          wanlongwu@Wanlongs-Laptop ~ %
     Issue ----  NoSQL Injection
     Const user = await User.findOne({username});
     The username type is not validated. An attacker can pass an object such as {“$ne”:null}, allowing MongoDB to match any user.
    Password Verification Bypass
    Const isPasswordValid = argon2.verify(user.hashPassword, password);
    The await keyword is missing. As a result, isPasswordValid is a Promise object, and if (!isPasswordValid)will always evaluate to false, causing the password check to be skipped.

    Correction // Route to login user
    userRouter.post('/login', async (req, res) => {
    try {
    const { username, password } = req.body;

        // 1. Input validation to prevent NoSQL injection
                if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input type' });
        }
        if (username.includes('$') || username.includes('.')) {
            return res.status(400).json({ message: 'Invalid characters in username' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.log('no user found');
            return res.status(400).json({ message: 'invalid username or password' });
        }
        // 2. Fix the missing await vulnerability
        const isPasswordValid = await argon2.verify(user.hashPassword, password);
        if (!isPasswordValid) {
            console.log('invalid password');
            return res.status(400).json({ message: 'invalid username or password' });
        }
        console.log(user);
        const jwtToken = jwt.sign(
            {
                userId: user.userId,
                username: user.username,
                department: user.department,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'login successful',
            authToken: jwtToken,
            username: user.username,
            name: user.name,
            role: user.role,
            department: user.department,
            id: user.userId
        });

    } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
    console.log(err);
    }});

6.  Error Information Disclosure – Attempt to log in with a non-existent username or an incorrect password, and verify
    whether the server response exposes a stack trace, database error details, or sensitive information.

        The response for invalid login attempts returns a generic message:
        {"message":"invalid username or password"}.
        This avoids exposing sensitive information such as passwords or detailed error traces,
        which is good practice for security.

7.  CSRF (Cross-Site Request Forgery) Testing
    After logging in, open a blank HTML file containing the following:
    <form action="http://localhost:3000/user/login" method="POST">
    <input name="username" value="attacker" />
    <input name="password" value="pass" />
    </form>
       <script>document.forms[0].submit();</script>
        After successfully logging in, open a blank HTML file with the   above form and auto-
        submit script. While the user is still logged in, access this file in the browser and
        observe whether the form is automatically submitted, potentially triggering an unintended
        login or session tampering. This tests for CSRF vulnerabilities.
        Developer Tools / Network panel shows cross-origin request from: http://127.0.0.1:9999;
         Backend logs record a POST /user/login request with status code.
         The API only accepts JSON payloads and requires Authorization: Bearer headers. Cross-
        site form submissions cannot include these credentials and cannot send JSON payloads, so
        CSRF attacks are mitigated by the architecture.
    Correction:
    Parse only application/json and remove urlencoded parsing to prevent form data from being treated as valid JSON (helps mitigate CSRF).
    helmet + app.disable("x-powered-by") to enhance security header settings.

## audit

### ExpressApp

1. cd /path/to/ExpressApp
2. npm audit --json > audit-express-before.json
   npm audit
   multer 1.4.4-lts.1 - 2.0.1
   Severity: high
   Multer vulnerable to Denial of Service via unhandled exception from malformed request - https://github.com/advisories/GHSA-fjgf-rc76-4x9p
   fix available via `npm audit fix`
   node_modules/multer

3. npm ls multer
4. npm i multer@^2.0.2
5. npm audit
6. npm audit --json > audit-express-after.json

### UploadBox

1. cd /path/to/UploadBox

2. npm audit --json > audit-frontend-before.json
3. npm audit
   found 0 vulnerabilities

# 同理，如仍有高危且允许强制：

npm audit fix --force #（可选）

# 前端也分别保存 prod/dev 视角

npm audit --omit=dev --json > audit-frontend-prod.json
npm audit --json > audit-frontend-after.json

## nmap test (nmap --version / brew install nmap)

1. nmap -sV -p 3000,5173 127.0.0.1 -oN nmap-services.txt
   CSP / HSTS and Other Security Headers Enabled (I have added Helmet)
   Severity: Informational / Low (Positive Finding)

   Evidence: Partial HTTP response headers from nmap scan.

   HSTS is not effective over local HTTP but should be retained in the production HTTPS environment.

   CORS Allows Excessive HTTP Methods
   Severity: Medium (Indicates the service claims to accept many methods, even if not all are implemented by the routes)

   CORS configuration currently allows: GET, HEAD, PUT, PATCH, POST, DELETE.

   Recommendation: Restrict allowed HTTP methods to only those actually in use (likely GET, POST, and OPTIONS).
   // app.js
   app.use(cors({
   origin: 'http://localhost:5173',
   methods: ['GET', 'POST', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization'],
   optionsSuccessStatus: 200
   }));

2. nmap -sV -p 3000 --script http-headers,http-security-headers -vv 127.0.0.1 -oN nmap-headers-3000.txt
3. curl -i -X OPTIONS http://127.0.0.1:3000/user/login \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST"

   Access-Control-Allow-Methods: GET,POST,OPTIONS
   Access-Control-Allow-Headers: Content-Type,Authorization
   Access-Control-Allow-Origin: http://localhost:5173

4. nmap -6 -sV -p 5173 ::1 \
    --script http-headers,http-security-headers \
    --script-args http.host=localhost,http-headers.path=/ \
    -vv -oN nmap-headers-5173-ipv6.txt

   Finding (Info): Dev server missing hardening headers
   Target: http://[::1]:5173/ (Vite dev)
   Evidence: No Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, etc.
   Risk: Low (development only, not in production)
   Mitigation (Prod): Serve built assets via Express (+helmet.contentSecurityPolicy) or Nginx/CDN with:
   • Content-Security-Policy (restrict to same-origin scripts/styles/images)
   • Strict-Transport-Security (HTTPS only)
   • X-Content-Type-Options: nosniff, X-Frame-Options: DENY/SAMEORIGIN, Referrer-Policy: no-referrer

   Finding (Info): Broad CORS methods on dev server
   Target: http://[::1]:5173/
   Evidence: Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
   Risk: Low (dev server; static hosting shouldn’t handle API CORS)
   Mitigation (Prod): Static server usually doesn’t set CORS; API CORS already restricted to GET,POST,OPTIONS with whitelisted frontend origin.

5. nmap -sV -p 3000 127.0.0.1 \
    --script http-methods \
    --script-args http-methods.url-path=/user/login \
    -vv -oN nmap-methods-3000.txt

   Finding (Medium → Closed): CORS allowed methods were broad (before: GET,HEAD,PUT,PATCH,POST,DELETE).
   Fix: GET,POST,OPTIONS，only whitelist: http://localhost:5173，restrict allowedHeaders to Content-Type, Authorization。

6. nmap -sV -p 3000 127.0.0.1 \
   --script http-cors \
   --script-args http-cors.path=/user/login \
   -vv -oN nmap-cors-3000.txt

7. nmap -sV -p 3000 127.0.0.1 \
   --script http-enum \
   -vv -oN nmap-enum-3000.txt
