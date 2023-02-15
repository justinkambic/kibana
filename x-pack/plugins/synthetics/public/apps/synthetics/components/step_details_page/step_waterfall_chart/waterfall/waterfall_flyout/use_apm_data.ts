/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useKibana } from '@kbn/kibana-react-plugin/public';
import { useEffect, useState } from 'react';

export function useApmData(): any | undefined {
  const [apmData, setApmData] = useState<any | undefined>(undefined);
  const kibana = useKibana();
  console.log(kibana);

  useEffect(() => {
    async function run() {
      try {
        const resp = await fetch(
          '/internal/apm/services/heartbeat/service_overview_instances/detailed_statistics?environment=ENVIRONMENT_ALL&kuery=&latencyAggregationType=avg&start=2023-02-15T18%3A57%3A00.000Z&end=2023-02-15T19%3A00%3A00.000Z&numBuckets=20&transactionType=output&serviceNodeIds=%5B%2235779bc9bd1b0c406dc3f143f8d858e766609e6044e9fa498bef4ec091971897%22%2C%22b104bea043e9047651989e2a86c28778f2530a5bd6f8b26e9aa71725a2148e91%22%2C%223f188c1fc5e41212b7301a44063e1318c10248678ba58a9ec542905e7ce49160%22%2C%2272b6c520801e1e9969a647e663aa2b309341b98639d9236c266ae74b4a10207b%22%2C%22b0a598e16703ce7c3e86748c22051e9d757864735d96881c87b33e79771da7ea%22%5D&offset=1d'
        );
        console.log('response', resp);
        const body = await resp.json();
        setApmData(body);
      } catch (e) {
        console.log('error', e);
      }
      // try {
      //   const data = await apiService.get(
      //     '/internal/apm/services/heartbeat/transactions/groups/detailed_statistics?transactionNames=publish&environment=ENVIRONMENT_ALL&transactionType=output&latencyAggregationType=avg&offset=1d',
      //     {}
      //   );
      //   console.log('got data', data);
      //   setApmData(data);
      // } catch (e) {
      //   console.log(e);
      // } finally {
      //   console.log('fetch concluded');
      // }
    }
    run();
  }, []);
  return apmData;
}
// ?environment=ENVIRONMENT_ALL&kuery=&start=2023-02-15T18%3A57%3A00.000Z&end=2023-02-15T19%3A00%3A00.000Z&numBuckets=20&transactionType=output&latencyAggregationType=avg&transactionNames=%5B%22publish%22%5D&offset=1d'
