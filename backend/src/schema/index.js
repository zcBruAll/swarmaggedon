import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { gql } from 'graphql-tag';

import { userTypeDefs, userResolvers } from './user.js';
import { statsResolvers, statsTypeDefs } from './stats.js';
import { authResolvers, authTypeDefs } from './auth.js';
import { runResolvers, runTypeDefs } from './runs.js';

const baseTypeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  userTypeDefs,
  statsTypeDefs,
  authTypeDefs,
  runTypeDefs,
]);

export const resolvers = mergeResolvers([
  userResolvers,
  statsResolvers,
  authResolvers,
  runResolvers,
]);
