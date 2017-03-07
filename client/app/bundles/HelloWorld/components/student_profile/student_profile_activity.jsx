'use strict';
import React from 'react'
import ActivityIconWithTooltip from '../general_components/activity_icon_with_tooltip.jsx'

export default React.createClass({
  propTypes: {
    data: React.PropTypes.object.isRequired
  },

  renderStartButton: function () {
    let linkText
    if (!this.props.data.activity.repeatable && this.props.finished) {
      return (<p className="title-v-centered text-right">Completed</p>)
    } else if (this.props.finished) {
      linkText = 'Replay Lesson'
    } else if (this.props.data.state == 'started'){
      linkText = 'Resume Lesson'
    } else {
      linkText = 'Start Lesson'
    }
    return <a href={this.props.data.link}>{linkText}</a>
  },

  renderDueDate: function() {
    return this.props.data.due_date ? <span className="due-date">{this.props.data.due_date}</span> : <span/>
  },

  render: function () {
    return (
      <div className="line">
        <div className="row">
          <div className="col-xs-8 col-sm-9 col-xl-9 pull-left">
            <ActivityIconWithTooltip data={this.props.data} context={'studentProfile'} />
            <div className="icons-description-wrapper">
              <p className="title title-v-centered">{this.props.data.activity.name}</p>
            </div>
          </div>
          <span className="row-list-end">
            {this.renderDueDate()}
            {this.renderStartButton()}
          </span>
        </div>
      </div>
    );
  }
})
