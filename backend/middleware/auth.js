const jwt = require("jsonwebtoken");

// Verifies the token sent in the "Authorization: Bearer <token>" header
// and attaches the logged-in user's id to req.user
module.exports = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
};