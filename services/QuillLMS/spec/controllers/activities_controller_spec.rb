require 'rails_helper'

describe ActivitiesController, type: :controller, redis: true do
  let(:student) { create(:student) }

  before { session[:user_id] = student.id }

  describe '#count' do
    let!(:activity) { create(:activity, flags: [:production]) }
    let!(:activity1) { create(:activity, flags: [:production]) }
    let!(:activity2) { create(:activity, flags: [:test]) }

    it 'should give the production activities count' do
      get :count
      expect(assigns(:count)).to eq 2
      expect(response.body).to eq({count: 2}.to_json)
    end
  end

  describe '#preview_lesson' do
    let!(:activity) { create(:activity) }
    let(:preview_url) { "#{activity.classification_form_url}teach/class-lessons/#{activity.uid}/preview" }
    let(:tutorial_lesson_preview_url) { "#{ENV['DEFAULT_URL']}/tutorials/lessons?url=#{URI.encode_www_form_component(preview_url)}" }

    context 'when current user' do
      context 'when milestone is completed for user' do
        let!(:milestone) { create(:milestone, name: "View Lessons Tutorial", users: [student]) }

        it 'should redirect to the preview url' do
          get :preview_lesson, params: { lesson_id: activity.id }
          expect(response).to redirect_to preview_url
        end
      end

      context 'when milestone is not completed for the user' do
        let!(:milestone) { create(:milestone, name: "View Lessons Tutorial", users: []) }

        it 'should redirect to the tutorials/lessons/preview url' do
          get :preview_lesson, params: { lesson_id: activity.id }
          expect(response).to redirect_to tutorial_lesson_preview_url
        end
      end
    end

    context 'when no current user' do

      before do
        allow(controller).to receive(:current_user) { nil }
      end

      it 'should redirect to preview url' do
        get :preview_lesson, params: { lesson_id: activity.id }
        expect(response).to redirect_to preview_url
      end
    end
  end

  describe '#customize_lesson' do
    let!(:activity) { create(:activity) }

    it 'should redirect to the correct url' do
      get :customize_lesson, params: { id: activity.id }
      expect(response).to redirect_to "#{activity.classification_form_url}customize/#{activity.uid}"
    end
  end

  describe '#activity_session' do
    let!(:classroom_unit) { create(:classroom_unit_with_activity_sessions).reload }
    let!(:activity) { classroom_unit.unit.unit_activities.first.activity }

    context 'no student is logged in' do
      before { session.delete(:user_id) }

      it 'redirects to login path' do
        get :activity_session, params: { id: activity.id, classroom_unit_id: classroom_unit.id }
        expect(response).to redirect_to new_session_path
      end
    end

    context 'student is assigned to classroom_unit' do
      before { classroom_unit.update(assigned_student_ids: [student.id]) }

      it '' do
        get :activity_session, params: { id: activity.id, classroom_unit_id: classroom_unit.id }

        expect(response)
          .to redirect_to activity_session_from_classroom_unit_and_activity_path(classroom_unit, activity)
      end
    end

    context 'student is not assigned to classroom_unit' do
      it '' do
        get :activity_session, params: { id: activity.id, classroom_unit_id: classroom_unit.id }
        expect(response).to redirect_to profile_path
      end
    end

    context 'unit activity does not exist' do
      let(:another_activity) { create(:activity) }

      it '' do
        get :activity_session, params: { id: another_activity.id, classroom_unit_id: classroom_unit.id }
        expect(response).to redirect_to profile_path
      end
    end
  end
end
