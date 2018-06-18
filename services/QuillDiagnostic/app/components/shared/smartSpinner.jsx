import React, { Component } from 'react';
import spinner from '../../img/loader_still.svg';
export default class SmartSpinner extends Component {
  constructor(props) {
    super();
  }

  componentWillMount() {
    if (this.props.onMount) {
      this.props.onMount();
    }
  }

  render() {
    return (
      <div className="loading-spinner">
        <div className="spinner-container">
          <img className="spinner" src={spinner} />
          <p className="spinner-message">{this.props.message}</p>
        </div>
      </div>
    );
  }

}
