Web Security Assessment – UploadBox (React) & ExpressApp (Node/Express + MongoDB)
Frontend dev server runs at http://localhost:5173

## Register and Log in (Manual Test)

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

### Lesson learned:

1. Validate everything on the server
   Client-side limits like input length are helpful but not enough. We found that without proper server checks, attackers can bypass restrictions or do NoSQL injection. Always check input types and filter out suspicious characters on the backend.
2. Don’t forget await in async code
   Missing await in password verification caused a big security hole — it skipped the password check! Handling async properly is critical, especially in security logic.
3. Sanitize user input to avoid XSS
   User comments weren’t cleaned, so scripts could be stored and run later (stored XSS). We need to sanitize or escape inputs to block this.

### Security testing of the upload functionality (manual + automated)

1. Authentication / Access Control
   curl -i -F "file=@/etc/hosts" http://127.0.0.1:3000/file/
   "message":"No token, authorization denied"

   "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDM1NTQ3NjciLCJ1c2VybmFtZSI6IkRhdmlkd2FubG9uZyIsImRlcGFydG1lbnQiOiJociIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTc1NDc0NzQxMywiZXhwIjoxNzU0NzUxMDEzfQ.QHJD3VFRVqNpL5RBKGNvrBho-B7r8Bv_8eqdPqxKqG0",
   "username": "Davidwanlong",

   TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDM1NTQ3NjciLCJ1c2VybmFtZSI6IkRhdmlkd2FubG9uZyIsImRlcGFydG1lbnQiOiJociIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTc1NDc0NzQxMywiZXhwIjoxNzU0NzUxMDEzfQ.QHJD3VFRVqNpL5RBKGNvrBho-B7r8Bv_8eqdPqxKqG0'
   curl -i -H "Authorization: Bearer $TOKEN" \
    -F "file=@/etc/hosts" \
    http://127.0.0.1:3000/file/
   "message":"file uploaded","file":{"filename":"hosts","path":"uploads/88d743885f938a9ff655aeb3d2aa8af8","uploadedBy":"Davidwanlong","department":"hr","\_id":"689752d3034e48429e849219","createdAt":"2025-08-09T13:53:23.882Z","\_\_v":0}

   TOKEN=$(curl -s -X POST http://127.0.0.1:3000/user/login \
    -H "Content-Type: application/json" \
    -d '{"username":"Davidwanlong","password":"P@ss0rd!"}' \
  | sed -n 's/.*"authToken":"\([^"]*\)".*/\1/p')
    echo "$TOKEN"

   curl -i -H "Authorization: Bearer bad.token.here" \
    -F "file=@/etc/hosts" \
    http://127.0.0.1:3000/file/
   500 Internal Server Error
   Conclusion: authentication middleware/routes do not properly catch JWT verification exceptions, allowing user-supplied input to bubble up as HTTP 500 (server error). This not only impacts UX, but could also be abused as a low-cost DoS vector (flooding the server with invalid tokens to overwhelm error logs).
   Correction:

   curl -i -H "Authorization: Bearer $TOKEN" \
    -F 'file=@/etc/hosts;filename="<img src=x onerror=alert(1)>.txt"' \
    http://127.0.0.1:3000/file/

   curl -i -F "file=@/etc/hosts" http://127.0.0.1:3000/file/
   No Token → 401

   curl -i -H "Authorization: Bearer bad.token.here" -F "file=@/etc/hosts" http://127.0.0.1:3000/file/
   False Token → 401

   TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9. eyJ1c2VySWQiOiIzMDM1NTQ3NjciLCJ1c2VybmFtZSI6IkRhdmlkd2FubG9uZyIsImRlcGFydG1lbnQiOiJociIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTc 1NDc0NzQxMywiZXhwIjoxNzU0NzUxMDEzfQ.QHJD3VFRVqNpL5RBKGNvrBho-B7r8Bv_8eqdPqxKqG0'
   curl -i -H "Authorization: Bearer $TOKEN" -F "file=@/etc/hosts" http://127.0.0.1:3000/file/

## Lessons Learned from Upload Security Testing

    Authentication is crucial: The upload endpoint correctly rejects requests without a valid token. This prevents unauthorized access, which is great.
    Token error handling needs improvement: When an invalid token is sent, the server threw a 500 error instead of a clean 401 response. This not only confuses users but can also be exploited for denial-of-service attacks by flooding bad tokens. Better error catching is needed here.

### Security testing of CommentComposer

1. Stored XSS

   TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDM1NTQ3NjciLCJ1c2VybmFtZSI6IkRhdmlkd2FubG9uZyIsImRlcGFydG1lbnQiOiJociIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTc1NDc1Nzk1OSwiZXhwIjoxNzU0NzYxNTU5fQ.fbMcdyBlwZRZ4MSDp23st3TvGEpryuIUEi53rE-ftDw'

   curl -i -X POST http://127.0.0.1:3000/comment \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"username":"Davidwanlong","commenttxt":"<img src=x onerror=alert(1)>"}'
   "message":"comment saved","comment":{"user":"Davidwanlong","text":"<img src=x onerror=alert(1)>"}
   The backend does not perform HTML escaping or sanitization on the comment content, resulting in a stored XSS vulnerability.

   curl -i -X POST http://127.0.0.1:3000/comment \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"username":"Davidwanlong","commenttxt":"<script>alert(1)</script>"}'
   The comment containing <script>alert(1)</script> was successfully saved without any sanitization or escaping on the backend, indicating a stored Cross-Site Scripting (XSS) vulnerability. This allows malicious scripts to be stored and executed in users’ browsers.

   Correction:
   npm i sanitize-html
   <img src=x onerror=alert(1)> is sanitized to empty, the API returns 400 Bad Request, and the presence of X-RateLimit-\* headers indicates rate limiting is working. The stored XSS vulnerability has been effectively mitigated.

2. Identity forgery Test(username controllable on the client side)

   curl -i -X POST http://127.0.0.1:3000/comment \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","commenttxt":"i am not admin"}'
   Use case: POST /comment request body forges "username":"admin"
   Expected/Actual result: The backend still saves the comment with the username "Davidwanlong" from the JWT (the request body field is ignored)
   Conclusion: Identity forgery via the request body has been prevented in commenting.

3.CSRF Test

<form action="http://127.0.0.1:3000/comment" method="POST">
  <input name="commenttxt" value="<b>csrf?</b>">
</form>
<script>document.forms[0].submit()</script>
    python3 -m http.server 9999   http://127.0.0.1:9999/csrf-comment.html，
       Network：
       Request URL
       http://127.0.0.1:3000/comment
       Request Method
       POST
       Status Code
       401 Unauthorized
       Remote Address
       127.0.0.1:3000
       Referrer Policy
       strict-origin-when-cross-origin
       The response “No token, authorization denied” indicates that the API rejected the request because no token was provided.

4.  Abuse/Spam (DoS/Spam): Submitting overly long comments (>500 characters) should be rejected by the backend (the
    frontend has maxLength=500 but it cannot be relied upon).
    Correction:
    npm i express-rate-limit
    import rateLimit from "express-rate-limit";
    const commentLimiter = rateLimit({ windowMs: 60*000, max: 30 });
    commentRouter.post("/", commentLimiter, async (req, res) => { /* ... \_/ });

### Lessons Learned from CommentComposer Security Testing

    The backend did not sanitize or escape comment content, allowing stored XSS attacks. After integrating sanitize-html, malicious HTML is properly sanitized, the API returns 400 Bad Request for invalid input, effectively mitigating the risk.

    Even though the client can forge the username field in the request body, the backend ignores it and uses the username from the JWT token, preventing identity spoofing in comments.

    Frontend limits input length but it cannot be trusted alone. Adding backend rate limiting with express-rate-limit helps prevent comment spamming and DoS attacks.

## Audit

#### ExpressApp Audit

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

#### UploadBox Audit

1. cd /path/to/UploadBox

2. npm audit --json > audit-frontend-before.json
3. npm audit
   found 0 vulnerabilities

## Lessons Learned from the Audit Process

    Running npm audit helped identify a high-severity vulnerability in the multer package used by the Express backend related to denial of service via malformed requests.
    Upgrading multer from version 1.4.4-lts.1 to 2.0.2 fixed this vulnerability, showing the importance of keeping dependencies up to date.

## NMAP Test (nmap --version / brew install nmap)

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

## Lessons Learned from Nmap Security Testing

    backend uses Helmetenables key security headers .
    Local vs Production Differences: Some headers like HSTS don’t work effectively on local HTTP, but they should be kept for production HTTPS environments.

    Former CORS settings allowed many HTTP methods (GET, HEAD, PUT, PATCH, POST, DELETE), which is too broad and increases risk.

    Automated Scans Help Identify Risks: Running specific Nmap scripts like http-headers, http-security-headers, http-methods, http-cors, and http-enum helped reveal configuration issues and potential security improvements.
    CORS policy with tightened whitelist could avoid exposure to cross-origin attacks.
