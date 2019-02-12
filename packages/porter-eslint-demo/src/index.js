import { getConstant } from './foo/bar';

const foo = "bar";

class FooClass {
  fooClass() {
    return getConstant() + " hello";
  }
}

let result = new FooClass().fooClass;
