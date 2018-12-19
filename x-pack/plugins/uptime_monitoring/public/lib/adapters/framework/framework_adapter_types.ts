/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { NormalizedCacheObject } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';

export type GraphQLClient = ApolloClient<NormalizedCacheObject>;

// TODO: re-evaluate this type to more explicitly define what
// a resource initializer for GQL clients should be.
export type CreateGraphQLClient = (url: string, xsrfHeader: string) => GraphQLClient;
