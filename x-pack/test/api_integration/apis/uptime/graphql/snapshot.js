/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from 'expect.js';
import { getSnapshotQueryString } from '../../../../../plugins/uptime/public/components/queries/snapshot/get_snapshot';
import snapshot from './fixtures/snapshot';
import snapshotFilteredByDown from './fixtures/snapshot_filtered_by_down';
import snapshotFilteredByUp from './fixtures/snapshot_filtered_by_up';

export default function ({ getService }) {
  describe('snapshot query', () => {
    const supertest = getService('supertest');
    const esArchiver = getService('esArchiver');
    const archive = 'uptime/full_heartbeat';
    before('load heartbeat data', () => esArchiver.load(archive));
    after('unload heartbeat index', () => esArchiver.unload(archive));

    it('will fetch a monitor snapshot summary', async () => {
      const getSnapshotQuery = {
        operationName: 'Snapshot',
        query: getSnapshotQueryString,
        variables: {
          dateRangeStart: 1547805782000,
          dateRangeEnd: 1547852582000,
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
          dateRangeStart: 1547805782000,
          dateRangeEnd: 1547852582000,
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
          dateRangeStart: 1547805782000,
          dateRangeEnd: 1547852582000,
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

    // TODO: test for host, port, etc.
  });
}
