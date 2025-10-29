import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import Expense, { IExpense, ExpenseCategory } from '../models/Expense';
import jwt from 'jsonwebtoken';
import { GraphQLContext } from '../types/context';
import '../types/env';

export interface SummaryItem {
  category: string;
  total: number;
  count: number;
}

interface ExpenseArgs {
  startDate?: string;
  endDate?: string;
  category?: string;
}

interface MonthlySummaryArgs {
  year: number;
  month: number;
}

interface RegisterArgs {
  username: string;
  email: string;
  password: string;
}

interface LoginArgs {
  email: string;
  password: string;
}

interface CreateExpenseArgs {
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
}

interface UpdateExpenseArgs {
  id: string;
  amount?: number;
  description?: string;
  category?: ExpenseCategory;
  date?: string;
}

interface DeleteExpenseArgs {
  id: string;
}

const resolvers = {
  Query: {
    expenses: async (_parent: unknown, args: ExpenseArgs, context: GraphQLContext): Promise<IExpense[]> => {
      const user = context.user;
      if (!user) throw new Error('Authentication required');

      interface QueryFilter {
        userId: mongoose.Types.ObjectId;
        date?: {
          $gte?: Date;
          $lte?: Date;
        };
        category?: string;
      }

      const query: QueryFilter = { userId: user._id };
      
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

    expense: async (_parent: unknown, args: { id: string }, context: GraphQLContext): Promise<IExpense> => {
      const user = context.user;
      if (!user) throw new Error('Authentication required');

      const expense = await Expense.findById(args.id);
      if (!expense || expense.userId.toString() !== user._id.toString()) {
        throw new Error('Expense not found');
      }
      return expense;
    },

    monthlySummary: async (_parent: unknown, args: MonthlySummaryArgs, context: GraphQLContext) => {
      const user = context.user;
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
      const summary: Record<string, SummaryItem> = expenses.reduce((acc: Record<string, SummaryItem>, expense: IExpense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { category, total: 0, count: 0 };
        }
        acc[category].total += expense.amount;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { category: string; total: number; count: number }>);

      return Object.values(summary);
    },

    me: async (_parent: unknown, _args: unknown, context: GraphQLContext): Promise<IUser> => {
      const user = context.user;
      if (!user) throw new Error('Authentication required');
      return user;
    },
  },

  Mutation: {
    register: async (_parent: unknown, args: RegisterArgs) => {
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
      const jwtSecret = process.env.JWT_SECRET || '';
      const token = jwt.sign(
        { userId: user._id },
        jwtSecret,
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

    login: async (_parent: unknown, args: LoginArgs) => {
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
      const jwtSecret = process.env.JWT_SECRET || '';
      const token = jwt.sign(
        { userId: user._id },
        jwtSecret,
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

    createExpense: async (_parent: unknown, args: CreateExpenseArgs, context: GraphQLContext): Promise<IExpense> => {
      const user = context.user;
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

    updateExpense: async (_parent: unknown, args: UpdateExpenseArgs, context: GraphQLContext): Promise<IExpense> => {
      const user = context.user;
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

    deleteExpense: async (_parent: unknown, args: DeleteExpenseArgs, context: GraphQLContext): Promise<boolean> => {
      const user = context.user;
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

export default resolvers;
