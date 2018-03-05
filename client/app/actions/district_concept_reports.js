import request from 'request';

export const recieveDistrictConceptReports = (body) => {
  return { type: 'RECIEVE_DISTRICT_CONCEPT_REPORTS', body, };
};

export const switchClassroom = (classroom) => {
  return { type: 'SWITCH_CLASSROOM', classroom, };
};

export const switchSchool = (school) => {
  return { type: 'SWITCH_SCHOOL', school, };
};

export const switchTeacher = (teacher) => {
  return { type: 'SWITCH_TEACHER', teacher, };
}

export const getDistrictConceptReports = () => {
  console.log('making request for dist act scores');
  return (dispatch) => {
    request.get({
      url: `${process.env.DEFAULT_URL}/api/v1/progress_reports/district_concept_reports`
    },
    (e, r, body) => {
      console.log('successful request of dist act scores');
      dispatch(recieveDistrictConceptReports(body))
    });
  }
};
