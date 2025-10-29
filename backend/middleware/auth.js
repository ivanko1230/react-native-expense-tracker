const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Extract user from token and add to context
const getUserFromToken = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.userId);
  } catch (error) {
    return null;
  }
};

// GraphQL context middleware
const createContext = async ({ req }) => {
  const user = await getUserFromToken(req);
  return { req, user };
};

module.exports = {
  getUserFromToken,
  createContext,
};
