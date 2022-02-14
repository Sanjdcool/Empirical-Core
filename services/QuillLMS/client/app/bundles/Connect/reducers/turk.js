import { SubmitActions } from '../actions/turk.js';
// / make this playLessonsReducer.
const initialState = {
  answeredQuestions: [],
  unansweredQuestions: [],
};

function question(state = initialState, action) {
  let changes = {}
  switch (action.type) {
    case SubmitActions.NEXT_TURK_QUESTION:
      if (state.currentQuestion) {
        changes.answeredQuestions = state.answeredQuestions.concat([state.currentQuestion]);
      }
      changes.currentQuestion = state.unansweredQuestions[0];
      if (changes.currentQuestion) {
        changes.currentQuestion.data.attempts = [];
      }
      if (state.unansweredQuestions.length > 0) {
        changes.unansweredQuestions = state.unansweredQuestions.slice(1);
      }
      return Object.assign({}, state, changes);
    case SubmitActions.NEXT_TURK_QUESTION_WITHOUT_SAVING:
      changes.currentQuestion = state.unansweredQuestions[0];
      if (changes.currentQuestion) {
        changes.currentQuestion.data.attempts = [];
      }
      if (state.unansweredQuestions.length > 0) {
        changes.unansweredQuestions = state.unansweredQuestions.slice(1);
      }
      return Object.assign({}, state, changes);
    case SubmitActions.LOAD_TURK_DATA:
      let changes2 = {
        unansweredQuestions: action.data,
        questionSet: action.data, };
      return Object.assign({}, state, changes2);
    case SubmitActions.CLEAR_TURK_DATA:
      return initialState;
    case SubmitActions.EXIT_TURK:
      return Object.assign({}, state, {
        completedQuestions: undefined,
        answeredQuestions: [],
        unansweredQuestions: [],
      });
    case SubmitActions.SUBMIT_TURK_RESPONSE:
      if (state.currentQuestion && state.currentQuestion.data) {
        changes = { currentQuestion: Object.assign({}, state.currentQuestion, {
          data: Object.assign({},
            state.currentQuestion.data,
            {
              attempts: state.currentQuestion.data.attempts.concat([action.response]),
            }),
        }),
        };
        return Object.assign({}, state, changes);
      }
    case SubmitActions.START_TURK_QUESTION:
      changes = { currentQuestion:
      Object.assign({}, state.currentQuestion, {
        started: true,
      }), };
      return Object.assign({}, state, changes);
    case SubmitActions.UPDATE_TURK_NAME:
      changes = { name: action.data, };
      return Object.assign({}, state, changes);
    case SubmitActions.LOAD_TURK_LANGUAGE:
      changes = { language: action.data, };
      return Object.assign({}, state, changes);
    case SubmitActions.UPDATE_TURK_CURRENT_QUESTION:
      let change = action.data;
      changes = { currentQuestion: Object.assign({}, state.currentQuestion, {
        data: Object.assign({},
          state.currentQuestion.data,
          change
        ),
      }), };
      return Object.assign({}, state, changes);
    case SubmitActions.RESUME_PREVIOUS_TURK_SESSION:
      return Object.assign({}, state, action.data);
    default:
      return state;
  }
}

export default question;
