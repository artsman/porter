const assert = require('assert');

import AClass from '../src';

describe('porter mocha demo tests', () => {
  it('runs a passing test', () => {
    const a = new AClass();
    assert.equal(a.doThing("abc"), "abc123");
  });
});