import React from 'react'
import request from 'request'
import getAuthToken from '../modules/get_auth_token'

export default class DeleteLastActivitySession extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      studentIdentifier: '',
      activityName: ''
    }
  }

  submitData = () => {
    const that = this
    request.post({
      url: `${process.env.DEFAULT_URL}/teacher_fix/delete_last_activity_session`,
      json: {activity_name: that.state.activityName, student_identifier: that.state.studentIdentifier, authenticity_token: getAuthToken()}
    },
    (e, r, response) => {
      if (response.error) {
        that.setState({error: response.error})
      } else if (r.statusCode === 200){
        window.alert('Activity session has been deleted!')
      } else {
        // to do, use Sentry to capture error
      }
    })
  };

  updateActivityName = (e, activityName) => {
    this.setState({activityName: e.target.value})
  };

  updateStudentIdentifier = e => {
    this.setState({studentIdentifier: e.target.value})
  };

  renderError() {
    if (this.state.error) {
      return <p className="error">{this.state.error}</p>
    }
  }

  render() {
    return (
      <div>
        <h1><a href="/teacher_fix">Teacher Fixes</a></h1>
        <h2>Delete Last Activity Session</h2>
        <p>This method will delete the last activity session a student has completed for a given activity.</p>
        <p>Please make sure this student has only been assigned this activity once (so not in multiple classes, or multiple activity packs) or this method could delete the wrong activity session.</p>
        <div>
          <div className="input-row">
            <label>Activity Name:</label>
            <input onChange={(e) => this.updateActivityName(e, 1)} type="text" value={this.state.activityName} />
          </div>
          <div className="input-row">
            <label>Student Username or Email:</label>
            <input onChange={this.updateStudentIdentifier} type="text" value={this.state.studentIdentifier} />
          </div>
          <button onClick={this.submitData}>Delete Activity Session</button>
          {this.renderError()}
        </div>

      </div>
    )
  }
}
