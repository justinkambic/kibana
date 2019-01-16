/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { KibanaFunctionalTestDefaultProviders } from '../../types/providers';

export const UptimeProvider = ({ getService }: KibanaFunctionalTestDefaultProviders) => {
  const testSubjects = getService('testSubjects');
  const testStuff = 'testStuff';

  return {
    async assertExists() {
      const key = 'xpack.uptime.filterBar';
      await new Promise(resolve => setTimeout(resolve, 12000000));
      if (!(await testSubjects.exists(key))) {
        throw new Error(`Couldn't find expected element with key "${key}".`);
      }
    },
  };
};
