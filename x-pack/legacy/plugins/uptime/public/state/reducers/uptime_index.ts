/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { IndexStatus } from '../../../common/runtime_types';
import { FETCH_INDEX_STATUS } from '../actions';

export interface IndexState {
  indexStatus: IndexStatus;
}

const initialState: IndexState = {
  indexStatus: {
    exists: false,
    count: 0,
  },
};

export function indexReducer(state = initialState, action: any) {
  switch (action.type) {
    case FETCH_INDEX_STATUS:
      return {
        ...state,
        loading: true,
      };
  }
}
