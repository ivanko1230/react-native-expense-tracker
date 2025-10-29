import { gql } from '@apollo/client';

export const GET_EXPENSES = gql`
  query GetExpenses($startDate: String, $endDate: String, $category: String) {
    expenses(startDate: $startDate, endDate: $endDate, category: $category) {
      id
      amount
      description
      category
      date
      createdAt
    }
  }
`;

export const CREATE_EXPENSE = gql`
  mutation CreateExpense(
    $amount: Float!
    $description: String!
    $category: String!
    $date: String!
  ) {
    createExpense(
      amount: $amount
      description: $description
      category: $category
      date: $date
    ) {
      id
      amount
      description
      category
      date
      createdAt
    }
  }
`;

export const UPDATE_EXPENSE = gql`
  mutation UpdateExpense(
    $id: ID!
    $amount: Float
    $description: String
    $category: String
    $date: String
  ) {
    updateExpense(
      id: $id
      amount: $amount
      description: $description
      category: $category
      date: $date
    ) {
      id
      amount
      description
      category
      date
      updatedAt
    }
  }
`;

export const DELETE_EXPENSE = gql`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id)
  }
`;

export const GET_MONTHLY_SUMMARY = gql`
  query GetMonthlySummary($year: Int!, $month: Int!) {
    monthlySummary(year: $year, month: $month) {
      category
      total
      count
    }
  }
`;
