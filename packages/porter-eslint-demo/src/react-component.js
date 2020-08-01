import React, { Component } from "react";

export default class MyComponent extends Component {




  constructor(props) {
    super(props);
    this.state = { name: "hello", otherA: "Other A", otherB: "Other B" };
    if (this.state === -0) {
      console.log('deliberately triggered a lint error by comparing with -0');
    }
  }

  render() {
    const { name, ...rest } = this.state;
    
    const keys = Object.keys(rest);
    const restString = keys.reduce((s, k) => {
      s.push(`${k}: ${rest[k]}`);
    }, []).join(", ");

    return (
      <div className="main-container">
        <span>The name is {name}</span>
        <span>The rest is {restString}</span>
      </div>);
  }
}