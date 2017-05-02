'use strict'

 import React from 'react'
 import SelectedActivity from './selected_activity'

 export default  React.createClass({
	propTypes: {
		selectedActivities: React.PropTypes.array.isRequired,
		toggleActivitySelection: React.PropTypes.func.isRequired
	},

	render: function () {
		var rows, buttonClassName;

		rows = this.props.selectedActivities.map((ele) => <SelectedActivity key={ele.id} toggleActivitySelection={this.props.toggleActivitySelection} data={ele} />);

		return (
			<section className="selected-activities-section">
				<h3 className="section-header">Selected Activities</h3>
				<table className="table activity-table selected-activities headless-rounded-table">
					<tbody>
						{rows}
					</tbody>
				</table>
			</section>
		);
	}
});
