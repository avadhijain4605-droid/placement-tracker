import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const TOKEN_COOKIE = "pt_session";

export function signToken(studentId, role) {
  return jwt.sign({ sub: String(studentId), role: role || "student" }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

/**
 * Reads and verifies the JWT from the pt_session HTTP-only cookie.
 * On success, attaches `req.studentId` and `req.studentRole`.
 * Returns 401 when there is no cookie or the token is invalid/expired.
 *
 * Security notes:
 *  - The token is NEVER read or stored by the browser JS. It lives only in an
 *    HttpOnly, Secure, SameSite=Strict cookie that the browser attaches to
 *    every same-site request automatically.
 *  - The role in the payload is set by the SERVER (from the DB) at sign time
 *    and is never taken from the client request body.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies[TOKEN_COOKIE] : undefined;
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.studentId = payload.sub;
    req.studentRole = payload.role || "student";
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

/**
 * Middleware factory that restricts a route to one or more roles.
 * Must be mounted AFTER requireAuth so that req.studentRole is set.
 * The role is taken from the verified JWT (which the server signed from
 * the DB value at login/signup time), never from the client request body.
 */
export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const role = req.studentRole || "student";
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

export { TOKEN_COOKIE };
