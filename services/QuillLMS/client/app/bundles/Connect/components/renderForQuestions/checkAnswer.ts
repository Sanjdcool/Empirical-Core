declare function require(name:string);
import * as _ from 'underscore';
import {checkSentenceCombining, checkDiagnosticQuestion} from 'quill-marking-logic';

import { getParameterByName } from '../../libs/getParameterByName';
import { hashToCollection } from '../../../Shared/index';

export default function checkAnswer(question, response, responses, mode='default') {
  const defaultConceptUID = question.modelConceptUID || question.conceptID
  const fields = {
    responses: responses ? hashToCollection(responses) : [],
    questionUID: question.key,
    focusPoints: question.focusPoints ? hashToCollection(question.focusPoints).sort((a, b) => a.order - b.order) : [],
    incorrectSequences: question.incorrectSequences ? hashToCollection(_.compact(question.incorrectSequences)) : [],
    defaultConceptUID
  };
  const newResponse = checkSentenceCombining(fields.questionUID, response, fields.responses, fields.focusPoints, fields.incorrectSequences, fields.defaultConceptUID)
  return {response: newResponse};
}
