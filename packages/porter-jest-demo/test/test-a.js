const expect = require('expect');

import AClass from '../src';

describe('porter jest demo tests', () => {
  it('runs a passing test', () => {
    const a = new AClass();
    expect(a.doThing("abc")).toBe("abc123");
  });
});