# COMP3123 Assignment 1 Employee Management API

Student number: **101568492**

A REST API built with Node.js, Express, MongoDB and Mongoose. Users register, log in with a username or email, and manage their own employees through JWT-protected endpoints.

Repository: https://github.com/teni-create/101568492_COMP3123_Assignment1

Hosted API: https://101568492comp3123assignment1.vercel.app

Hosted health check: https://101568492comp3123assignment1.vercel.app/health

## Technologies and structure

JavaScript with CommonJS modules; Express 5; Mongoose; dotenv; bcrypt; jsonwebtoken; express-validator; Helmet; express-rate-limit; Winston. Exact dependency versions are recorded in `package-lock.json`.

```text
src/
  server.js                 Express setup and server startup
  config/
    database.js             MongoDB connection
    logger.js               Winston file logging
  controllers/              Signup, login and employee operations
  middleware/               Authentication, validation, errors and rate limits
  models/                   User and Employee schemas
  routes/                   Express Routers
  validators/               Request field and employee ID validation
logs/                       Generated locally; excluded from Git
.env.example                Safe configuration template
101568492_COMP3123_Assignment1.postman_collection.json
```

Requests pass through routes, validation and controllers. Employee routes additionally require authentication. Controllers use Mongoose models for database operations; errors are handled by centralized middleware.

## Installation and startup

Prerequisites: Node.js 24 (the development major version), npm, MongoDB Atlas or a running local MongoDB instance, and Postman for testing.

```bash
git clone https://github.com/teni-create/101568492_COMP3123_Assignment1.git
cd 101568492_COMP3123_Assignment1
npm ci
cp .env.example .env
```

Edit `.env` locally. Do not publish it.

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port; defaults to `3000` |
| `MONGODB_URI` | Private database connection URI using database `comp3123_assignment1` |
| `JWT_SECRET` | Random secret for signing and verifying JWTs |
| `JWT_EXPIRES_IN` | Token lifetime; example and fallback are `1h` |

Generate a secret locally and paste its output into `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For Atlas, use an available deployment, configure a database user with suitable database permissions, allow the connecting machine through Atlas network access, and obtain the Node.js driver URI. Insert the database user's credentials locally and set the database path to `comp3123_assignment1`. Percent-encode special characters in credentials. The Atlas deployment must be available; no local MongoDB process is required.

Alternatively, start your local MongoDB service and use:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/comp3123_assignment1
```

Start the API from the project root:

```bash
npm start
```

For automatic restarts during development:

```bash
npm run dev
```

When started locally, the application waits for the database connection before listening. API requests also await a shared connection promise, which avoids concurrent duplicate connections on hosted instances. Expected startup messages are `MongoDB connected` and `Server running at http://localhost:3000`. Startup failure reports a generic configuration message. Stop the server with Control+C.

## Health check

`GET http://localhost:3000/health` requires no authentication and returns **200**:

```json
{"status":"ok","message":"API is running"}
```

This endpoint confirms the HTTP server is operational. It does not perform a fresh database connectivity check. On Vercel it can respond before the first database connection; verify login or an employee endpoint as well.

## API endpoints

Default base URL: `http://localhost:3000`. Send request bodies as JSON with `Content-Type: application/json`.

| Method | Endpoint | Authentication | Success |
|---|---|---|---|
| POST | `/api/v1/user/signup` | None | 201 |
| POST | `/api/v1/user/login` | None | 200 |
| GET | `/api/v1/emp/employees` | Bearer token | 200 |
| POST | `/api/v1/emp/employees` | Bearer token | 201 |
| GET | `/api/v1/emp/employees/:eid` | Bearer token | 200 |
| PUT | `/api/v1/emp/employees/:eid` | Bearer token | 200 |
| DELETE | `/api/v1/emp/employees?eid=EMPLOYEE_ID` | Bearer token | 204, empty body |

### Registration and login

Signup example (use a unique username and email):

```json
{"username":"new_test_user","email":"newtest@example.com","password":"AssignmentTest123!"}
```

Username: 3–50 letters, digits or underscores. Email: valid format, maximum 254 characters. Password: at least 8 characters, including lowercase, uppercase and a number, with a maximum of 72 UTF-8 bytes. Passwords are not trimmed. Usernames and emails have unique database indexes; duplicate conflicts return 409.

Login accepts either username or email with a password, but not both identifiers:

```json
{"username":"assignment_user_a","password":"AssignmentTest123!"}
```

```json
{"email":"usera@example.com","password":"AssignmentTest123!"}
```

A successful login returns `status`, `message`, `token` and safe `user` details. Passwords and hashes are excluded from user responses. A wrong password or unknown user returns the same generic 401 response.

Passwords are hashed with bcrypt at cost 12 before storage. Login explicitly retrieves the otherwise excluded hash and compares it with bcrypt. JWTs use HS256, an expiration and a `sub` claim containing the user's database ID. Employee requests must include:

```text
Authorization: Bearer <token>
```

Authentication verifies the signature, allowed algorithm and token validity, then looks up the user identified by `sub`. Missing, malformed, invalid, expired or no-longer-associated user tokens are rejected with 401. Log in again to obtain a fresh token after expiration. Tokens are signed, not encrypted; do not put secrets in their payloads.

### Employee requests and ownership

POST and PUT require the complete validated employee body:

```json
{
  "first_name": "Alex",
  "last_name": "Test",
  "email": "alex.employee@example.com",
  "position": "Developer",
  "salary": 60000,
  "date_of_joining": "2026-10-17",
  "department": "Engineering"
}
```

Names, position and department must contain 1–100 characters after trimming. Email must be valid and at most 254 characters. Salary must be a finite JSON number of at least 0.01. The joining date must be a valid ISO date. Employee IDs must be MongoDB ObjectIds.

Both models maintain `created_at` and `updated_at`. Employee `user` is a required, immutable ObjectId referencing `User`, with an index for owner-based queries. Creating an employee sets this field from the authenticated user; supplying `user` in the body is rejected. Only validated body fields are used for creation and updates; extra unvalidated fields are not persisted.

Listing filters by authenticated owner. Retrieval and updates check the stored owner before returning or changing a record. Deletion checks ownership and also includes owner in its delete query. An existing employee owned by someone else returns 403; a missing employee returns 404. Employee IDs and owner user IDs are different values. Use the employee `_id` in employee URLs.

## Security and errors

Helmet supplies security response headers, including content type, framing, referrer and content security policies. Inspect the response headers on `/health` for evidence.

Rate limiting restricts request frequency by IP. Signup and login share **10 requests per 15-minute window**, including successful and failed requests. Exceeding the limit returns **429** and:

```json
{"status":"error","message":"Too many authentication requests. Try again later."}
```

Responses expose standard rate-limit headers; blocked responses include `Retry-After`. This uses process-memory state, which resets on server restart and is not shared across multiple server processes. Other API routes do not currently have a general traffic limiter.

Validation rejects missing/invalid fields before controller execution. Malformed JSON is handled centrally. Errors use JSON, for example:

```json
{"status":"error","message":"Validation failed","errors":[{"field":"email","message":"Enter a valid email address"}]}
```

| Status | Use |
|---|---|
| 200 | Login, health, retrieval or update succeeded |
| 201 | User or employee created |
| 204 | Employee deleted; no response body |
| 400 | Invalid fields, ID or malformed JSON |
| 401 | Invalid credentials or authentication token |
| 403 | Authenticated user does not own the employee |
| 404 | Employee or route not found |
| 409 | Duplicate username or email |
| 413 | JSON request exceeds the parser's body size limit |
| 429 | Authentication rate limit exceeded |
| 500 | Unexpected error reaching the centralized error handler |

The actual `.env`, database credentials, JWT secret and `node_modules` are excluded by `.gitignore`. `.env.example` contains placeholders. Keep tokens out of exported collections and submission screenshots.

## Local logging

When running locally, Winston creates `logs/app.log` automatically. On Vercel it writes JSON to the console for Runtime Logs instead, because the application filesystem is read-only. It stores timestamped JSON events for startup, database connection, login attempts/results, registration, employee operations, validation failures, authentication/ownership failures and centralized errors. Request entries include method, path, status and duration. Files rotate at approximately 5 MiB, retaining up to three files.

Logging calls deliberately exclude passwords, request bodies, authorization headers, full JWTs and database connection strings. Error handling records error types rather than raw error messages or stack traces. Generated logs are ignored by Git; include the captured logging screenshots as submission evidence. Never publish an unreviewed log file.

### Focused middleware verification

Authentication rejection warnings are emitted only on rejected requests. JWT validation failures return 401; unexpected errors, including database failures, pass to centralized error handling. Request logging is registered before JSON parsing, so malformed JSON also receives a request-completion log entry.

Focused checks passed for valid authentication without a false warning; missing, invalid and expired JWTs; invalid token identity; a missing user; database error forwarding; and a missing signing secret. A temporary loopback server also confirmed the health response remains 200 and malformed JSON returns 400 with both request and centralized error logs. These checks used simulated users and an isolated test secret, without connecting to Atlas or changing database records. They do not replace the full manual endpoint and screenshot review.

## Postman collection and testing

Import `101568492_COMP3123_Assignment1.postman_collection.json` into Postman. It contains 43 requests organized into eight folders with expected-status assertions. The file contains no recorded responses or claims of a completed automated run. Existing screenshots provide the earlier manual test evidence.

1. Collection variable `baseUrl` defaults to the hosted API. Set it to `http://localhost:3000` for local testing; `localBaseUrl` records that alternative.
2. Run User A and User B login requests. Their response scripts populate `tokenA`, `tokenB` and user IDs locally.
3. Set `employeeAId` and `employeeBId` to existing records owned by the respective users, or deliberately run the two creation requests to populate them. Creation requests add records.
4. Test own-record listing, retrieval and updates, invalid fields, missing/invalid tokens, and cross-user GET/PUT/DELETE in both directions.
5. Use a separate disposable employee for the deletion folder. Do not delete ownership-test records.
6. For expiration, set `expiredToken` to a previously valid, now expired token. A blank or malformed token does not prove expiration.
7. Run the rate-limit test last and repeat it manually until 429. Before the threshold, its expected-429 assertion fails because 401 is the correct response.
8. Clear `tokenA`, `tokenB` and `expiredToken` before exporting or publishing a changed collection.

Do not run the whole collection blindly: authentication tests share the 10-request limit. Wait for the indicated reset between groups if necessary. No `npm test` suite is currently configured.

### Non-sensitive marking accounts

These disposable accounts were created during manual testing in the configured assignment database:

| Account | Username | Email | Password |
|---|---|---|---|
| A | `assignment_user_a` | `usera@example.com` | `AssignmentTest123!` |
| B | `assignment_user_b` | `userb@example.com` | `AssignmentTest123!` |

They are test-only application credentials, not Atlas credentials. For a fresh database, register both through signup first. Login returns their current IDs and fresh tokens; locally created IDs may differ from the existing collection values.

## Evidence and submission

Manual results and screenshots cover registration, login, validation, employee CRUD, ownership rejection and unchanged records, Helmet, rate limiting, MongoDB and local logging. Final supplemental HTTP checks also confirmed both cross-user PUT requests return 403, both owned records remain unchanged, a correctly signed expired JWT returns 401, employee creation without a token returns 401, and client-supplied ownership returns 400. Those results were obtained from actual local API requests. The imported collection has not been run as one complete suite, and two cross-user PUT screenshots and the expired-token response screenshot still require replacement/addition in the evidence document. Hosted login, employee-list and health screenshots have now been reviewed and show 200 responses.

Submit the public repository URL, a project ZIP excluding `.env`, `.git`, `node_modules` and private credentials, the Postman collection, README, `.env.example`, configuration/source files, and actual screenshots. Evidence should show health, signup/login, CRUD, validation/errors, MongoDB hashed passwords and ownership, two-user access control, Helmet headers, rate limiting and local logs. D2L also requires hosting on Vercel. Include the verified production URL and deployment evidence; deployment is not complete until the hosted API has been checked.

Retain the original screenshots and verify that each displays the real response status and body. No additional test result should be claimed solely because an expected-status assertion exists in the collection.


## Vercel deployment

D2L submission instructions require Vercel hosting. The app exports Express from `src/server.js`, which is a recognized native Express entry point. No frontend build command or output directory is needed. Node 24 is specified in `package.json`. The normal local `npm start` behavior is preserved.

1. Push these deployment changes to GitHub.
2. In Vercel, import the assignment repository and select the Express framework if it is not detected. Keep the repository root as the root directory.
3. Add private `MONGODB_URI` and `JWT_SECRET`, plus `JWT_EXPIRES_IN=1h`, as Production environment variables. Do not publish their values. The URI must select `comp3123_assignment1`. `PORT` is only needed locally.
4. Ensure Atlas network access permits the deployment using the course-approved networking setup. Do not assume an allowlist containing only your laptop address will permit Vercel.
5. Deploy, then verify the production `/health`, signup/login and protected employee endpoints. Health alone does not prove the database connection. Record the actual production URL only after verification.
6. Keep the deployed API accessible to the marker and capture Ready status plus real Postman requests against its URL. Update the collection `baseUrl` locally when testing the hosted API.

On Vercel, a shared connection promise reuses Mongoose connections within an instance. JSON logs go to Runtime Logs; the required local file logging remains available when running on a laptop. The IP rate limiter trusts one proxy hop only in the Vercel environment. Its in-memory counters are per instance, so the limit is not a global distributed quota across scaled instances. `.vercelignore` keeps local credentials and evidence documents out of the deployment bundle.

Official deployment guidance: https://vercel.com/guides/using-express-with-vercel


### Verified hosted results

Production API: https://101568492comp3123assignment1.vercel.app

On October 18, 2026, direct HTTP checks confirmed `/health` returns 200 and the employee-list endpoint without authentication returns 401. Supplied Postman screenshots show hosted User A login, authenticated employee listing and health each return 200. The initial hosted connection failure was resolved after Atlas network access was updated. Vercel deployment-success and masked configuration captures are included in the evidence document. These checks do not claim that every CRUD operation has been rerun on the hosted deployment.
