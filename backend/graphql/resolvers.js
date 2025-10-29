const User = require('../models/User');
const Expense = require('../models/Expense');
const jwt = require('jsonwebtoken');

// Helper function to get user from token
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

const resolvers = {
  Query: {
    expenses: async (parent, args, context) => {
      const user = await getUserFromToken(context.req);
      if (!user) throw new Error('Authentication required');

      const query = { userId: user._id };
      
      // Add date filters if provided
      if (args.startDate || args.endDate) {
        query.date = {};
        if (args.startDate) {
          query.date.$gte = new Date(args.startDate);
        }
        if (args.endDate) {
          query.date.$lte = new Date(args.endDate);
        }
      }
      
      // Add category filter if provided
      if (args.category) {
        query.category = args.category;
      }

      return await Expense.find(query).sort({ date: -1 });
    },

    expense: async (parent, args, context) => {
      const user = await getUserFromToken(context.req);
      if (!user) throw new Error('Authentication required');

      const expense = await Expense.findById(args.id);
      if (!expense || expense.userId.toString() !== user._id.toString()) {
        throw new Error('Expense not found');
      }
      return expense;
    },

    monthlySummary: async (parent, args, context) => {
      const user = await getUserFromToken(context.req);
      if (!user) throw new Error('Authentication required');

      const startDate = new Date(args.year, args.month - 1, 1);
      const endDate = new Date(args.year, args.month, 0, 23, 59, 59);

      const expenses = await Expense.find({
        userId: user._id,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      // Group by category
      const summary = expenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { category, total: 0, count: 0 };
        }
        acc[category].total += expense.amount;
        acc[category].count += 1;
        return acc;
      }, {});

      return Object.values(summary);
    },

    me: async (parent, args, context) => {
      const user = await getUserFromToken(context.req);
      if (!user) throw new Error('Authentication required');
      return user;
    },
  },

  Mutation: {
    register: async (parent, args) => {
      const { username, email, password } = args;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        throw new Error('User already exists with this email or username');
      }

      // Create new user
      const user = new User({ username, email, password });
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    },

    login: async (parent, args) => {
      const { email, password } = args;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    },

    createExpense: async (parent, args, context) => {
      const user = await getUserFromToken(context.req);
      if (!user) throw new Error('Authentication required');

      const expense = new Expense({
        userId: user._id,
        amount: args.amount,
        description: args.description,
        category: args.category,
        date: args.date ? new Date(args.date) : new Date(),
      });

      await expense.save();
      return expense;
    },

    updateExpense: async (parent, args, context) => {
      const user = await getUserFromToken(context.req);
      if (!user) throw new Error('Authentication required');

      const expense = await Expense.findById(args.id);
      if (!expense || expense.userId.toString() !== user._id.toString()) {
        throw new Error('Expense not found');
      }

      // Update only provided fields
      if (args.amount !== undefined) expense.amount = args.amount;
      if (args.description !== undefined) expense.description = args.description;
      if (args.category !== undefined) expense.category = args.category;
      if (args.date !== undefined) expense.date = new Date(args.date);

      await expense.save();
      return expense;
    },

    deleteExpense: async (parent, args, context) => {
      const user = await getUserFromToken(context.req);
      if (!user) throw new Error('Authentication required');

      const expense = await Expense.findById(args.id);
      if (!expense || expense.userId.toString() !== user._id.toString()) {
        throw new Error('Expense not found');
      }

      await Expense.findByIdAndDelete(args.id);
      return true;
    },
  },
};

module.exports = resolvers;
