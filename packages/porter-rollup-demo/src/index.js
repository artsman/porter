import { getConstant } from './foo/bar';

const foo = "bar";

class FooClass {
  fooClass() {
    return getConstant() + " hello";
  }
}

let result = new FooClass().fooClass;

export default function doThing() {
  return foo + result;
}