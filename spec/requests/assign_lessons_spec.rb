require 'spec_helper'

describe 'assignments', :type => :request do
  def assign_activity attrs = {}, activity = @activity
    sign_in(@teacher)

    params = {
      unit_id: @unit.id,
      choose_everyone: true,
      due_date: 2.weeks.from_now
    }.merge(attrs)

    put teachers_classroom_activity_path(@classroom, activity), classroom_activity: params
    expect(response).to redirect_to(teachers_classroom_lesson_planner_path(@classroom))
  end

  before do
    @student   = create(:student)
    @classroom = @student.classroom
    @teacher   = @classroom.teacher
    @activity  = create(:activity)
    @unit      = @classroom.units.first
  end

  describe 'Teacher assigns new lessons to student' do
    it 'shows up in the student account' do
      assign_activity
      activity_session = @classroom.classroom_activity_for(@activity).session_for(@student)

      sign_in(@student)
      expect(response).to redirect_to(profile_path)
      follow_redirect!

      expect(response.body).to include(activity_path(@activity, session: activity_session.id))
    end

    it 'shows up in the scorebook' do
      assign_activity
      get teachers_classroom_scorebook_path(@classroom)
      expect(response.body).to include(@activity.name)
    end

    it 'doesn\'t show up if the teacher didn\'t select the student' do
      other = create(:student, classroom: @classroom)
      activity = create(:activity)
      expect(@classroom.students.count).to be(2)
      assign_activity({choose_everyone: false, assigned_student_ids: [other.id]}, activity)

      activity_session = @classroom.classroom_activity_for(activity).session_for(other)
      sign_in(other)
      follow_redirect!
      expect(response.body).to include(activity_path(activity, session: activity_session.id))

      activity_session = @classroom.classroom_activity_for(activity).session_for(@student)
      sign_in(@student)
      follow_redirect!
      expect(response.body).to_not include(activity_path(activity, session: activity_session.id))
    end
  end

  describe 'Teacher edits the details of the lesson' do
    pending "this test is implemented incorrectly, but not yet able to review"

    # it 'reflects changes in student profile' do
    #   two_weeks   = 2.weeks.from_now
    #   three_weeks = 3.weeks.from_now
    #   assign_activity(due_date: two_weeks)
    #   classroom_activity = @classroom.classroom_activity_for(@activity)
    #   sign_in(@student)
    #
    #   get profile_path
    #   expect(response.body).to include(two_weeks.strftime('%m/%d'))
    #
    #   classroom_activity.due_date = three_weeks
    #   classroom_activity.save
    #
    #   get profile_path
    #   expect(response.body).to include(three_weeks.strftime('%m/%d'))
    # end
  end

  describe 'Student retries a lesson after completing it' do
    it 'creates a new session' do

    end
  end

  describe 'Student reenters incomplete lesson' do
  end
end
