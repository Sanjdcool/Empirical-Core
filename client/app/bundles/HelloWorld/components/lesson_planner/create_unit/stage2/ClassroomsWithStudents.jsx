import React from 'react'
import Classroom from './classroom.jsx'
import EditStudentsButton from './EditStudentsButton.jsx'

export default class extends React.Component {

	constructor(){
		super()
		this.ajaxData = this.ajaxData.bind(this)
		this.classroomActivityUpdates = this.classroomActivityUpdates.bind(this)
		this.sendToSuccess = this.sendToSuccess.bind(this)
		this.resetPage = this.resetPage.bind(this)
	}

	resetPage() {
		window.location = `/teachers/classrooms/lesson_planner#${this.props.unitId}`
	}

	sendToSuccess() {
		window.location = `/teachers/classrooms/activity_planner/featured-activity-packs/${this.props.unitTemplateId}/assigned`
	}

	classroomActivityUpdates() {
		const classrooms_data = []
		let classroomsWithNoAssignedStudents = 0
		this.props.classrooms.forEach((classy) => {
			if (classy.edited) {
				const class_data = {id: classy.id}
				if (classy.allSelected) {
					class_data.student_ids = []
				} else {
					const student_ids_arr = []
					classy.students.forEach((stud) => {
						if (stud.isSelected) {
							student_ids_arr.push(stud.id)
						}
					})
					if (student_ids_arr.length > 0) {
						class_data.student_ids = student_ids_arr
					} else {
						class_data.student_ids = false
						classroomsWithNoAssignedStudents += 1
					}
				}
				classrooms_data.push(class_data)
			}
			else if (classy.noneSelected) {
				classroomsWithNoAssignedStudents += 1
			}
		}
	)
		if (classroomsWithNoAssignedStudents === this.props.classrooms.length) {
			return {errors:
				[<p key="no assigned students error">A unit must have assigned students. To delete a unit, <a href="/teachers/classrooms/lesson_planner">click here</a> and select 'Delete' next to your unit.</p>]}
			}
		return classrooms_data
	}

	ajaxData = () => {
		const data = {classrooms: JSON.stringify(this.classroomActivityUpdates())}
		if (this.props.createOrEdit === 'create') {
			data.create = true,
			data.name = this.props.unitName,
			data.activities = JSON.stringify(this.props.activityIds.map((actId)=>{return {id: actId, due_date: null}}))
			data.unit_template_id = this.props.unitTemplateId
		}
		return data
	}


	createButton(){
		return(
			<EditStudentsButton enabled={this.props.isSaveButtonEnabled}
												disabledText={'Add Students Before Assigning'}
												requestType={'POST'}
												url={'/teachers/units'}
												successCallback={this.sendToSuccess}
												buttonText={'Assign Activity Pack'}
												dataFunc={this.ajaxData}
												/>
		)
	}

	updateButton(){
		return (
			<EditStudentsButton enabled={this.props.isSaveButtonEnabled}
											disabledText={'Edit Students Before Saving'}
											requestType={'PUT'}
											url={`/teachers/units/${this.props.unitId}/update_classroom_activities_assigned_students`}
											successCallback={this.resetPage}
											buttonText={'Update Students'}
											dataFunc={this.ajaxData}
											/>
									)
	}

	createOrUpdateButton(){
	 	return this.props.createOrEdit === 'create' ? this.createButton() : this.updateButton()
	}

	render() {
		let classroomList, warningBlurb;
		if (this.props.classrooms) {
			let that = this;
			classroomList = this.props.classrooms.map((el)=> {
				return <Classroom    key = {el.id}
														 classroom={el}
														 students={el.students}
														 allSelected={el.allSelected}
														 toggleClassroomSelection={that.props.toggleClassroomSelection}
														 handleStudentCheckboxClick={that.props.handleStudentCheckboxClick}
														 />;

			})
		} else {
			classroomList = []
		}
		if (this.props.createOrEdit === 'edit') {
			warningBlurb = <p>Please note that unselecting a student on this page will delete all of their assignments associated with this pack, even if those assignments have already been completed.</p>
		}
    return (
			<div>
				<h2 className='edit-students-h2'>Edit Students for {this.props.unitName}</h2>
				{warningBlurb}
				{classroomList}
				{this.createOrUpdateButton()}
			</div>
    );
	}

}
