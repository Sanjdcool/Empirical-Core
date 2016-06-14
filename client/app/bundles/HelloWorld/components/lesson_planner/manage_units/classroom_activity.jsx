'use strict'

 import React from 'react'
 import $ from 'jquery'
 import DatePicker from 'react-datepicker';
 import moment from 'moment';

 export default  React.createClass({

  getInitialState: function(){
    return {startDate: moment(this.props.data.due_date)}
  },


	deleteClassroomActivity: function () {
		var x = confirm("Are you sure you want do delete this assignment?");
		if (x) {
			this.props.deleteClassroomActivity(this.props.data.id, this.props.data.unit_id);
		}
	},




    handleChange: function(date) {
        this.setState({startDate: date});
        // months are an array that start at index 0;
        var formattedDate = date.year() + '-' + (date.month() + 1) + '-' + date.date();
        this.props.updateDueDate(this.props.data.id, formattedDate);
    },




	render: function () {
		return (
			<div className="row">
				<div className="cell col-md-1">
					<div className={"pull-left icon-gray icon-wrapper  " + this.props.data.activity.classification.scorebook_icon_class} />
				</div>
				<div className="cell col-md-8" >
					<a href={this.props.data.activity.anonymous_path} target="_new">
						{this.props.data.activity.name}
					</a>
				</div>
				<div className="cell col-md-2">
          <DatePicker selected={this.state.startDate} onChange={this.handleChange}/>
				</div>
				<div className="cell col-md-1">
				</div>
			</div>

		);
		// to restore buttons
		// return (
		// 	<div className="row">
		// 		<div className="cell col-md-1">
		// 			<div className={"pull-left icon-gray icon-wrapper  " + this.props.data.activity.classification.scorebook_icon_class} />
		// 		</div>
		// 		<div className="cell col-md-8" >
		// 			<a href={this.props.data.activity.anonymous_path} target="_new">
		// 				{this.props.data.activity.name}
		// 			</a>
		// 		</div>
		// 		<div className="cell col-md-2">
		// 			<input type="text" value={this.props.data.formatted_due_date} ref="dueDate" className="datepicker-input" placeholder="Optional Due Date" />
		// 			<input type="text"  className="railsFormatDate" id={"railsFormatDate" + this.props.data.id} ref="railsFormatDate" />
		// 		</div>
		// 		<div className="cell col-md-1">
		// 			<div className="pull-right icon-x-gray" onClick={this.deleteClassroomActivity}>
		// 			</div>
		// 		</div>
		// 	</div>
		//
		// );
	}
});
