/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';
import { getSnapshotQueryString } from '../../../../../plugins/uptime/public/components/queries/snapshot/get_snapshot';
import snapshot from './fixtures/snapshot';
import snapshotFilteredByDown from './fixtures/snapshot_filtered_by_down';
import snapshotFilteredByUp from './fixtures/snapshot_filtered_by_up';
import snapshotEmpty from './fixtures/snapshot_empty';
import snapshotSimpleQueryString from './fixtures/snapshot_simple_query_string';

export default function ({ getService }) {
  describe('snapshot query', () => {
    const supertest = getService('supertest');

    it('will fetch a monitor snapshot summary', async () => {
      const getSnapshotQuery = {
        operationName: 'Snapshot',
        query: getSnapshotQueryString,
        variables: {
          dateRangeStart: '2019-01-28T17:40:08.078Z',
          dateRangeEnd: '2019-01-28T19:00:16.078Z',
        },
      };
      const {
        body: { data },
      } = await supertest
        .post('/api/uptime/graphql')
        .set('kbn-xsrf', 'foo')
        .send({ ...getSnapshotQuery });
      expect(data).to.eql(snapshot);
    });

    it('will fetch a monitor snapshot filtered by down status', async () => {
      const getSnapshotQuery = {
        operationName: 'Snapshot',
        query: getSnapshotQueryString,
        variables: {
          dateRangeStart: '2019-01-28T17:40:08.078Z',
          dateRangeEnd: '2019-01-28T19:00:16.078Z',
          filters: `{"bool":{"must":[{"match":{"monitor.status":{"query":"down","operator":"and"}}}]}}`,
        },
      };
      const {
        body: { data },
      } = await supertest
        .post('/api/uptime/graphql')
        .set('kbn-xsrf', 'foo')
        .send({ ...getSnapshotQuery });
      expect(data).to.eql(snapshotFilteredByDown);
    });

    it('will fetch a monitor snapshot filtered by up status', async () => {
      const getSnapshotQuery = {
        operationName: 'Snapshot',
        query: getSnapshotQueryString,
        variables: {
          dateRangeStart: '2019-01-28T17:40:08.078Z',
          dateRangeEnd: '2019-01-28T19:00:16.078Z',
          filters: `{"bool":{"must":[{"match":{"monitor.status":{"query":"up","operator":"and"}}}]}}`,
        },
      };
      const {
        body: { data },
      } = await supertest
        .post('/api/uptime/graphql')
        .set('kbn-xsrf', 'foo')
        .send({ ...getSnapshotQuery });
      expect(data).to.eql(snapshotFilteredByUp);
    });

    it('returns null histogram data when no data present', async () => {
      const getSnapshotQuery = {
        operationName: 'Snapshot',
        query: getSnapshotQueryString,
        variables: {
          dateRangeStart: '2019-01-25T04:30:54.740Z',
          dateRangeEnd: '2019-01-28T04:50:54.740Z',
          filters: `{"bool":{"must":[{"match":{"monitor.status":{"query":"down","operator":"and"}}}]}}`,
        },
      };
      const {
        body: { data },
      } = await supertest
        .post('/api/uptime/graphql')
        .set('kbn-xsrf', 'foo')
        .send({ ...getSnapshotQuery });
      expect(data).to.eql(snapshotEmpty);
    });

    it('will fetch results for simple_query_string filters', async () => {
      const filters = JSON.stringify({
        bool: {
          must: [
            {
              simple_query_string: { query: 'http' },
            },
            { match: { 'monitor.status': { query: 'up', operator: 'and' } } },
            { range: { 'monitor.duration.us': { lt: 20000000 } } },
          ],
          must_not: [{ simple_query_string: { query: 'production' } }, { term: { down: true } }],
        },
      });
      const getSnapshotQuery = {
        operationName: 'Snapshot',
        query: getSnapshotQueryString,
        variables: {
          dateRangeStart: '2019-01-28T17:40:08.078Z',
          dateRangeEnd: '2019-01-28T19:00:16.078Z',
          filters,
        },
      };
      const {
        body: { data },
      } = await supertest
        .post('/api/uptime/graphql')
        .set('kbn-xsrf', 'foo')
        .send({ ...getSnapshotQuery });
      expect(data).to.eql(snapshotSimpleQueryString);
    });
    // TODO: test for host, port, etc.
  });
}
