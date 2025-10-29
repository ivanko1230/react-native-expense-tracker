import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory = 
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Travel'
  | 'Other';

export interface IExpenseLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  location?: IExpenseLocation;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Food',
      'Transport',
      'Shopping',
      'Bills',
      'Entertainment',
      'Healthcare',
      'Education',
      'Travel',
      'Other',
    ] as ExpenseCategory[],
    default: 'Other' as ExpenseCategory,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
}, {
  timestamps: true,
});

// Index for efficient date queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
