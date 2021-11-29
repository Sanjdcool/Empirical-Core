# frozen_string_literal: true

require 'rails_helper'

describe DiagnosticReports do
  include DiagnosticReports

  describe '#data_for_skill_by_activity_session' do
    let!(:activity_session) { create(:activity_session) }
    let!(:concept) { create(:concept) }
    let!(:skill_concept) { create(:skill_concept, concept: concept) }
    let!(:correct_concept_result) { create(:concept_result_with_correct_answer, concept: concept, activity_session: activity_session) }
    let!(:incorrect_concept_result) { create(:concept_result_with_incorrect_answer, concept: concept, activity_session: activity_session) }

    it 'should return data with the name of the skill, number of correct concept results, number of incorrect concept results, and a summary' do
      expect(data_for_skill_by_activity_session(activity_session.id, skill_concept.skill)).to eq({
        id: skill_concept.skill.id,
        skill: skill_concept.skill.name,
        number_correct: 1,
        number_incorrect: 1,
        summary: PARTIALLY_CORRECT
      })
    end
  end

  describe '#summarize_correct_skills' do
    it 'should return NOT_PRESENT if both number_correct and number_incorrect are 0' do
      expect(summarize_correct_skills(0, 0)).to eq(NOT_PRESENT)
    end

    it 'should return NOT_CORRECT if number_correct is 0 and number_incorrect is not 0' do
      expect(summarize_correct_skills(0, 1)).to eq(NOT_CORRECT)
    end

    it 'should return FULLY_CORRECT if number_correct is 0 and number_incorrect is not 0' do
      expect(summarize_correct_skills(1, 0)).to eq(FULLY_CORRECT)
    end

    it 'should return PARTIALLY_CORRECT if neither number_correct nor number_incorrect is 0' do
      expect(summarize_correct_skills(1, 1)).to eq(PARTIALLY_CORRECT)
    end
  end

  describe '#set_activity_sessions_and_assigned_students_for_activity_classroom_and_unit' do
    describe 'if there is a unit_id' do
      let!(:unit) { create(:unit) }
      let!(:classroom) { create(:classroom) }
      let!(:student1) { create(:student, name: 'Alphabetical A')}
      let!(:student2) { create(:student, name: 'Alphabetical B')}
      let!(:student3) { create(:student, name: 'Alphabetical C')}
      let!(:students_classroom1) { create(:students_classrooms, classroom: classroom, student: student1)}
      let!(:students_classroom2) { create(:students_classrooms, classroom: classroom, student: student2)}
      let!(:students_classroom3) { create(:students_classrooms, classroom: classroom, student: student3)}
      let!(:classroom_unit) { create(:classroom_unit, unit: unit, classroom: classroom, assigned_student_ids: [student1.id, student2.id, student3.id]) }
      let!(:unit_activity) { create(:unit_activity, unit: unit) }
      let!(:activity_session1) { create(:activity_session, :finished, user: student1, classroom_unit: classroom_unit, activity: unit_activity.activity) }
      let!(:activity_session2) { create(:activity_session, :finished, user: student2, classroom_unit: classroom_unit, activity: unit_activity.activity) }

      it 'should set the variables for all the final score activity sessions for that activity, classroom, and unit' do
        set_activity_sessions_and_assigned_students_for_activity_classroom_and_unit(unit.user, unit_activity.activity_id, classroom.id, unit.id)
        expect(@assigned_students).to eq([student1, student2, student3])
        expect(@activity_sessions).to eq([activity_session1, activity_session2])
      end
    end

    describe 'if there is no unit_id' do
      let!(:unit1) { create(:unit) }
      let!(:unit2) { create(:unit, user: unit1.user) }
      let!(:classroom) { create(:classroom) }
      let!(:student1) { create(:student, name: 'Alphabetical A')}
      let!(:student2) { create(:student, name: 'Alphabetical B')}
      let!(:student3) { create(:student, name: 'Alphabetical C')}
      let!(:students_classroom1) { create(:students_classrooms, classroom: classroom, student: student1)}
      let!(:students_classroom2) { create(:students_classrooms, classroom: classroom, student: student2)}
      let!(:students_classroom3) { create(:students_classrooms, classroom: classroom, student: student3)}
      let!(:classroom_unit1) { create(:classroom_unit, unit: unit1, classroom: classroom, assigned_student_ids: [student1.id, student2.id]) }
      let!(:classroom_unit2) { create(:classroom_unit, unit: unit2, classroom: classroom, assigned_student_ids: [student2.id, student3.id]) }
      let!(:unit_activity1) { create(:unit_activity, unit: unit1) }
      let!(:unit_activity2) { create(:unit_activity, unit: unit2, activity: unit_activity1.activity) }
      let!(:activity_session1) { create(:activity_session, :finished, user: student1, classroom_unit: classroom_unit1, activity: unit_activity1.activity) }
      let!(:activity_session2) { create(:activity_session, :finished, user: student2, classroom_unit: classroom_unit1, activity: unit_activity1.activity) }
      let!(:activity_session3) { create(:activity_session, :finished, user: student2, classroom_unit: classroom_unit2, activity: unit_activity1.activity) }

      it 'should set the variables for all the final score activity sessions for that activity, classroom, and unit, with only one per student' do
        set_activity_sessions_and_assigned_students_for_activity_classroom_and_unit(unit1.user, unit_activity1.activity_id, classroom.id, nil)
        expect(@assigned_students).to eq([student1, student2, student3])
        expect(@activity_sessions).to eq([activity_session3, activity_session1])
      end
    end
  end

  describe '#summarize_student_proficiency_for_skill_per_activity' do
    it 'should return NO_PROFICIENCY if the correct skill number is 0' do
      expect(summarize_student_proficiency_for_skill_per_activity(1, 0)).to eq(NO_PROFICIENCY)
    end

    it 'should return PROFICIENCY if the correct skill number equals the present skill number' do
      expect(summarize_student_proficiency_for_skill_per_activity(1, 1)).to eq(PROFICIENCY)
    end

    it 'should return PARTIAL_PROFICIENCY if the correct skill number is between 0 and the present skill number' do
      expect(summarize_student_proficiency_for_skill_per_activity(2, 1)).to eq(PARTIAL_PROFICIENCY)
    end
  end

end
