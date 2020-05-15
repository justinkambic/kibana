/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { renderWithIntl, shallowWithIntl } from 'test_utils/enzyme_helpers';
import { getDefaultValue, TimeExpressionSelect } from '../time_expression_select';

describe('TimeExpressionSelect', () => {
  describe('getDefaultValue', () => {
    it('returns null for falsy value', () => {
      expect(getDefaultValue(undefined)).toBeNull();
    });
    it('returns null if array length not equal to 2', () => {
      expect(getDefaultValue('missing_split_chars')).toBeNull();
    });
    it('returns null if no unit present', () => {
      expect(getDefaultValue('now-h')).toBeNull();
    });
    it('returns null if unit unrecognized', () => {
      expect(getDefaultValue('now-11X')).toBeNull();
    });
    it('returns null if quantity is NaN', () => {
      expect(getDefaultValue('now-gahd')).toBeNull();
    });
    it('parses the unit and quantity of a valid value', () => {
      expect(getDefaultValue('now-11m')).toMatchInlineSnapshot(`
        Object {
          "quantity": 11,
          "unit": "m",
        }
      `);
    });
  });

  describe('TimeExpressionSelect component', () => {
    it('should shallow renders against props', function() {
      const component = shallowWithIntl(<TimeExpressionSelect setAlertParams={jest.fn()} />);
      expect(component).toMatchSnapshot();
    });

    it('should renders against props', function() {
      const component = renderWithIntl(<TimeExpressionSelect setAlertParams={jest.fn()} />);
      expect(component).toMatchSnapshot();
    });
  });
});
