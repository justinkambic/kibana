/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { formatAge } from './common';

describe('formatAge', () => {
  it('should return -- when age is not provided', () => {
    expect(formatAge()).toBe('--');
  });

  it('should return formatted age when age is provided', () => {
    expect(formatAge('5d')).toBe('5 days + rollover');
  });
});
