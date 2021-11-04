module DiagnosticReports
  extend ActiveSupport::Concern

  NOT_PRESENT = 'Not present'
  NOT_CORRECT = 'Not correct'
  FULLY_CORRECT = 'Fully correct'
  PARTIALLY_CORRECT = 'Partially correct'

  NO_PROFICIENCY = 'No proficiency'
  PARTIAL_PROFICIENCY = 'Partial proficiency'
  PROFICIENCY = 'Proficiency'
  GAINED_PROFICIENCY = 'Gained proficiency'
  MAINTAINED_PROFICIENCY = 'Maintained proficiency'

  def data_for_skill_by_activity_session(activity_session_id, skill)
    concept_results = ConceptResult.where(activity_session_id: activity_session_id, concept_id: [skill.concept_ids])
    number_correct = concept_results.select(&:correct?).length
    number_incorrect = concept_results.reject { |cr| cr.correct? }.length
    {
      id: skill.id,
      skill: skill.name,
      number_correct: number_correct,
      number_incorrect: number_incorrect,
      summary: summarize_correct_skills(number_correct, number_incorrect)
    }
  end

  def summarize_correct_skills(number_correct, number_incorrect)
    if number_correct == 0 && number_incorrect == 0
      NOT_PRESENT
    elsif number_correct == 0
      NOT_CORRECT
    elsif number_incorrect == 0
      FULLY_CORRECT
    else
      PARTIALLY_CORRECT
    end
  end

  private def set_activity_sessions_and_assigned_students_for_activity_classroom_and_unit(current_user, activity_id, classroom_id, unit_id)
    if unit_id
      classroom_unit = ClassroomUnit.find_by(unit_id: unit_id, classroom_id: classroom_id)
      @assigned_students = User.where(id: classroom_unit.assigned_student_ids).sort_by { |u| u.last_name }
      @activity_sessions = ActivitySession.where(classroom_unit: classroom_unit, state: 'finished')
    else
      units = current_user.units.joins("JOIN unit_activities ON unit_activities.activity_id = #{activity_id}")
      classroom_units = ClassroomUnit.where(unit_id: units, classroom_id: classroom_id)
      assigned_student_ids = classroom_units.map { |cu| cu.assigned_student_ids }.flatten.uniq
      @assigned_students = User.where(id: assigned_student_ids).sort_by { |u| u.last_name }
      @activity_sessions = ActivitySession.where(activity_id: activity_id, classroom_unit_id: classroom_units.ids, state: 'finished').order(completed_at: :desc).uniq { |activity_session| activity_session.user_id }
    end
  end

  private def summarize_student_proficiency_for_skill_per_activity(present_skill_number, correct_skill_number)
    if correct_skill_number == 0
      NO_PROFICIENCY
    elsif present_skill_number == correct_skill_number
      PROFICIENCY
    else
      PARTIAL_PROFICIENCY
    end
  end

end
