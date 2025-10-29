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

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
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
}, {
  timestamps: true,
});

// Index for efficient date queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
