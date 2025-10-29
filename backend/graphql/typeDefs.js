const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
  }

  type Expense {
    id: ID!
    userId: ID!
    amount: Float!
    description: String!
    category: String!
    date: String!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # Expense queries
    expenses(startDate: String, endDate: String, category: String): [Expense!]!
    expense(id: ID!): Expense
    monthlySummary(year: Int!, month: Int!): [CategorySummary!]!
    
    # User queries
    me: User
  }

  type CategorySummary {
    category: String!
    total: Float!
    count: Int!
  }

  type Mutation {
    # Auth mutations
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # Expense mutations
    createExpense(amount: Float!, description: String!, category: String!, date: String!): Expense!
    updateExpense(id: ID!, amount: Float, description: String, category: String, date: String): Expense!
    deleteExpense(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;
