'use strict'
import React from 'react'
import $ from 'jquery'
import ClassroomsWithStudents from '../components/lesson_planner/create_unit/stage2/ClassroomsWithStudents.jsx'
import LoadingIndicator from '../components/general_components/loading_indicator.jsx'

export default class extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			classrooms: null,
			loading: true,
			studentsChanged: false,
			newUnit: !!this.props.params.activityIdsArray
		}
		this.getClassroomsAndStudentsData()
	}


	findTargetClassIndex(classroomId) {
		return this.state.classrooms.findIndex((classy)=>{
			return classy.id === classroomId
		})
	}

	findTargetStudentIndex(studentId, targetClassIndex) {
		return this.state.classrooms[targetClassIndex].students.findIndex(
			(stud)=>{
				return stud.id===studentId
		})
	}

	// Emilia and Ryan discussed that it may make more sense for the AJAX
	// call to return a data structure like:
	// {
	//   classrooms: [{
	//     id: 23,
	//     name: 'English 2',
	//     students: {
	//       12323: {
	//         'Ryan'
	//       }
	//     }
	//   }]
	// ]
	// units: [
	//   id: 1232,
	//   name: 'Adjectives',
	//   classroom_activities: [{
	//     classroom: 23,
	//     assigned_student_ids: [23]
	//   }]
	// ]
	// }
	// this would allow us to iterate over the assigned_student_ids
	// and then change the students to selected/not selected based off of the results
	//
	toggleStudentSelection = (studentIndex, classIndex) => {
		const newState = Object.assign({}, this.state);
		const classy = newState.classrooms[classIndex]
	  let selectedStudent = classy.students[studentIndex]
		selectedStudent.isSelected = !selectedStudent.isSelected;
		// we check to see if something has changed because this method gets called when the page loads
		// as well as when a student's checkbox is clicked
		if (newState.studentsChanged) {
			const selectedCount = this.countAssigned(classy)
			this.updateAllOrNoneAssigned(classy, selectedCount)
			}
		this.setState(newState)
	}

	handleStudentCheckboxClick = (studentId, classroomId) =>{
		const newState = Object.assign({}, this.state);
		const classIndex = this.findTargetClassIndex(classroomId)
		const studentIndex = this.findTargetStudentIndex(studentId, classIndex)
		newState.classrooms[classIndex].edited = this.classroomUpdated(newState.classrooms[classIndex]);
		newState.studentsChanged = true;
		this.setState(newState, () => this.toggleStudentSelection(studentIndex, classIndex));
	}

	toggleClassroomSelection = (classy) => {
		const newState = Object.assign({}, this.state);
		const classIndex = this.findTargetClassIndex(classy.id);
		const classroom = newState.classrooms[classIndex];
		classroom.edited = !classroom.edited;
		classroom.allSelected = !classroom.allSelected;
		classroom.noneSelected = !classroom.allSelected
		classroom.students.forEach((stud)=>stud.isSelected=classroom.allSelected);
		newState.studentsChanged = true;
		this.setState(newState);
	}

	selectPreviouslyAssignedStudents() {
	// 	// @TODO if (window.location.pathname.includes('edit')) {
		const that = this;
		const newState = Object.assign({}, this.state);
			newState.classrooms.forEach((classy, classroomIndex) => {
				const ca = classy.classroom_activity
				let selectedCount = 0;
				if (ca) {
						if (ca.assigned_student_ids && ca.assigned_student_ids.length > 0) {
							ca.assigned_student_ids.forEach((studId) => {
								let studIndex = that.findTargetStudentIndex(studId, classroomIndex);
								// only do this if the student is still in the classroom
								// otherwise, we may have assigned students that have left the classroom
								if (studIndex !== -1) {
									that.toggleStudentSelection(studIndex, classroomIndex)
									selectedCount += 1;
								}
							})
						} else {
							classy.students.forEach((stud, studIndex) => {
								that.toggleStudentSelection(studIndex, classroomIndex)
								selectedCount += 1;
						})
					}
				}
				that.updateAllOrNoneAssigned(classy, selectedCount)
			})
			this.setState(newState)
	}

	updateAllOrNoneAssigned(classy, selectedCount) {
		if (selectedCount === classy.students.length) {
			classy.allSelected = true
			classy.noneSelected = false
		} else if (selectedCount === 0) {
			classy.noneSelected = true
			classy.allSelected = false
		} else {
			classy.allSelected = false
			classy.noneSelected = false
		}
	}

	countAssigned = classy => classy.students.filter((student) => student.isSelected).length

	getAssignedIds = classy => classy.students.filter((student) => student.isSelected).map((stud) => stud.id)

	classroomUpdated(classy) {
		const assignedStudentIds = getAssignedIds(classy)
		let updated
		if (assignedStudentIds.length > 0 && classy.classroomActivity) {
			if (assignedStudentIds == classy.classroomActivity.assigned_student_ids) {
				updated = false
			}
		} else if (assignedStudentIds.length == 0) {
			updated = false
		} else {
			updated = true
		}
		return updated
	}

	studentsChanged() {
		let changed
		this.state.classrooms.forEach((classy) => {
			if (this.classroomUpdated(classy)) {
				changed = true
			}
		})
		return changed
	}

	getClassroomsAndStudentsData() {
		const that = this;
		let url, unitName
		if (this.state.newUnit) {
			url = '/teachers/classrooms_i_teach_with_students'
			unitName = () => this.props.params.unitName
		} else {
			url = `/teachers/units/${that.props.params.unitId}/classrooms_with_students_and_classroom_activities`
			unitName = (data) => data.unit_name
		}
		$.ajax({
			type: 'GET',
			url,
			dataType: 'json',
			statusCode: {
				200: function(data) {
					that.setState({loading: false, classrooms: data.classrooms, unitName: unitName(data)})
					that.state.newUnit ? null : that.selectPreviouslyAssignedStudents()
				},
				422: function(response) {
					that.setState({errors: response.responseJSON.errors,
					loading: false})
				}
			}
		})
	}

	noClassroomsSelected(){
		const classes = this.state.classrooms
		return (classes.filter((cl)=>cl.noneSelected).length === classes.length)
	}

	isSaveButtonEnabled(){
		const s = this.state
		if (!s.studentsChanged || this.noClassroomsSelected()) {
			return false
		} else {
			return true
		}
	}

	render() {
		if (this.state.loading) {
			return <LoadingIndicator/>
		} else if (this.state.classrooms) {
			return (
				<div>
						<div className='container edit-assigned-students-container'>
								<ClassroomsWithStudents
									unitId={this.props.params.unitId}
									unitName={this.state.unitName}
									classrooms={this.state.classrooms}
									activityIds={this.props.params.activityIdsArray}
									createOrEdit={this.state.newUnit ? 'create' : 'edit'}
									handleStudentCheckboxClick={this.handleStudentCheckboxClick.bind(this)}
									toggleClassroomSelection={this.toggleClassroomSelection}
									isSaveButtonEnabled={this.isSaveButtonEnabled.bind(this)}
									/>
							</div>
						</div>)
		} else {
			return <div>You must first add a classroom.</div>
		}
	}

}
