/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '../../../../../utils/testing/rtl_helpers';
import { MetricItem } from './metric_item';
import * as ReactRedux from 'react-redux';

jest.spyOn(ReactRedux, 'useSelector').mockImplementation((param1, param2) => {
  return {
    ['abc123']: {
      max: 10,
      min: 2,
      median: 5,
      avg: 5,
    },
  };
});

describe('MetricItem', () => {
  it('renders an element with an ID that matches the aria-describedby rendered by elastic charts', () => {
    const { getByText } = render(
      <MetricItem
        monitor={{ configId: 'abc', locationId: '123', name: 'test', monitorQueryId: '1' }}
        onClick={() => {}}
      />
    );
    expect(getByText('faili plz'));
  });
});
