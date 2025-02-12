import request from 'request';

export const receiveStudentProfile = data => ({
  type: 'RECEIVE_STUDENT_PROFILE',
  data
})

export const fetchStudentProfile = (classroomId) => {
  return (dispatch) => {
    request.get({
      url: `${process.env.DEFAULT_URL}/student_profile_data`,
      qs: { current_classroom_id: classroomId, }
    },
    (e, r, body) => {
      const parsedBody = JSON.parse(body)
      dispatch(receiveStudentProfile(parsedBody))
    });
  };
};

export const receiveStudentsClassrooms = (classrooms) => {
  return {
    type: 'RECEIVE_STUDENTS_CLASSROOMS',
    classrooms
  };
};

export const handleClassroomClick = (selectedClassroomId) => {
  return {
    type: 'HANDLE_CLASSROOM_CLICK',
    selectedClassroomId
  };
};

export const updateActiveClassworkTab = (activeClassworkTab) => {
  return {
    type: 'UPDATE_ACTIVE_CLASSWORK_TAB',
    activeClassworkTab
  };
};

export const fetchStudentsClassrooms = () => {
  return (dispatch) => {
    request.get({
      url: `${process.env.DEFAULT_URL}/students_classrooms_json`
    },
    (e, r, body) => {
      const parsedBody = JSON.parse(body)
      dispatch(receiveStudentsClassrooms(parsedBody.classrooms))
    });
  };
};
