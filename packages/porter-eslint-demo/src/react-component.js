import React, { Component } from "react";

export default class MyComponent extends Component {




  constructor(props) {
    super(props);
    this.state = { name: "hello" };
    if (this.state === -0) {
      console.log('deliberately triggered a lint error by comparing with -0');
    }
  }

  render() {
    const { name } = this.state;
    
    return (
      <div className="main-container">
        The name is {name}
      </div>);
  }
}