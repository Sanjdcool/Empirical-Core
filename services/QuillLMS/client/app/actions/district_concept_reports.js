import request from 'request';
import Pusher from 'pusher-js';

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

export const initializePusherForDistrictConceptReports = (adminId) => {
  return (dispatch) => {
    if (process.env.RAILS_ENV === 'development') {
      Pusher.logToConsole = true;
    }
    const pusher = new Pusher(process.env.PUSHER_KEY, { encrypted: true, });
    const channel = pusher.subscribe(adminId);
    channel.bind('district-concept-reports-found', () => {
      dispatch(getDistrictConceptReports())
    });
  }
}

export const getDistrictConceptReports = () => {
  return (dispatch) => {
    request.get({
      url: "https://quill-lms-sprint-docker.herokuapp.com/api/v1/progress_reports/district_concept_reports"
    },
    (e, r, body) => {
      const parsedBody = JSON.parse(body)
      if (parsedBody.id) {
        dispatch(initializePusherForDistrictConceptReports(String(parsedBody.id)))
      } else {
        dispatch(recieveDistrictConceptReports(parsedBody))
      }
    });
  }
};
