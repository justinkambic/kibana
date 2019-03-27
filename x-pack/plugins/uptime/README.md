# Uptime Monitoring

## Purpose

The purpose of this plugin is to provide users of Heartbeat more visibility of what's happening
in their infrasturcture. It's primarily built using React and Apollo's GraphQL tools.

## Layout

There are three sections to the app, `common`, `public`, and `server`.

### common

Contains GraphQL types, constants and a few other files.

### public

Components come in two main types, queries and functional. Queries are extended from Apollo's queries
type which abstracts a lot of the GraphQL connectivity away. Functional are dumb components that
don't store any state.

The `lib` directory controls bootstrapping code and adapter types.

There is a `pages` directory; each view gets its own page component.

The principal structure of the app is stored in `uptime_app.tsx`.

### server

There is a `graphql` directory which contains the resolvers, schema files, and constants.

The `lib` directory contains `adapters`, which are connections to external resources like Kibana
Server, Elasticsearch, etc. In addition, it contains domains, which are libraries that provide
functionality via adapters.

There's also a `rest_api` folder that defines the structure of the RESTful API endpoints.

## Testing

### Unit tests

From `~/kibana/x-pack`, run `node scripts/jest.js`.

### Functional tests

In one shell, from **~/kibana/x-pack**:
`node scripts/functional_tests-server.js`

In another shell, from **~kibana/x-pack**:
`node ../scripts/functional_test_runner.js --grep="{TEST_NAME}"`.

### API tests

In one shell, from **~/kibana/x-pack**:
`node scripts/functional_tests-server.js`

In another shell, from **~kibana/x-pack**:
`node ../scripts/functional_test_runner.js --config test/api_integration/config.js --grep="{TEST_NAME}"`.

## Contributing

There are a number of tasks one should complete before attempting to run a patch against Kibana's continuous integration process.
If you perform the tasks below, it will greatly increase your chances of passing CI in your first run, which could potentially save
you time getting your code merged.

### Type check

From the `~/kibana` directory, run `node scripts/type_check.js`. This will check all the types in the project. If it looks like any
of the files you have added or edited are highlighted by this script, fix them and re-run the script. These failures will not pass CI.

### Unit test check

Make sure that your edits haven't broken any unit tests. To check this, go to `~/kibana/x-pack` and run:

`node scripts/jest.js plugins/uptime`

If you encounter failures, before attempting to edit the tests themselves, try to ensure that you haven't injected a bug. If a test
is failing because of an intentional change or out of date snapshot, edit the test and re-run the suite.

### API test check

If you've modified server code, or edited any GraphQL queries, it's possible you've induced a change to the values that the server
will supply to the client. We try to catch code changes that cause the expected return data to be different, while ignoring
code changes that do not modify the data shape/values we're returning. Refer to the _API tests_ section above for instructions
on running these tests.

### Functional test check


