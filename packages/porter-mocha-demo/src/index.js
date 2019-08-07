export default class AClass {
  aProperty = 123;

  doThing(arg) {
    const { aProperty } = this;
    return arg + aProperty;
  }
};
