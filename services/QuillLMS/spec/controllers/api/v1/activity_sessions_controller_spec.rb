# frozen_string_literal: true

require 'rails_helper'

describe Api::V1::ActivitySessionsController, type: :controller do
  describe '#update' do

    let(:token) { double :acceptable? => true, resource_owner_id: user.id }
    let(:user) { create(:student) }
    let(:activity_classification) { create(:activity_classification) }
    let(:activity) { create(:activity, classification: activity_classification) }
    let!(:activity_session) { create(:activity_session, state: 'started', user: user, completed_at: nil, activity: activity) }

    before { allow(controller).to receive(:doorkeeper_token) { token } }

    context 'default behavior' do
      include_context "calling the api"

      before { put :update, params: { id: activity_session.uid }, as: :json }

      it 'responds with 200' do
        expect(response.status).to eq(200)
      end

      it 'responds with the updated activity session' do
        parsed_body = JSON.parse(response.body)
        expect(parsed_body['activity_session']['uid']).to eq(activity_session.uid)
      end
    end

    context 'user_activity_classification counts increment when they should' do
      it 'should count_for if the state of the session is "finished"' do
        expect(UserActivityClassification).to receive(:count_for).with(user, activity_classification)
        put :update, params: { id: activity_session.uid, state: 'finished' }, as: :json
      end

      it 'should not count_for if the state of the session is not "finished"' do
        expect(UserActivityClassification).not_to receive(:count_for)
        put :update, params: { id: activity_session.uid }, as: :json
      end
    end

    context 'concept results are included' do
      let(:writing_concept) { create(:concept, name: 'Creative Writing') }

      let(:concept_result1) do
        create(:concept_result,
          activity_session_id: activity_session.id,
          concept: writing_concept,
          metadata: { foo: 'bar' }
        )
      end

      let(:concept_result2) do
        create(:concept_result,
          activity_session_id: activity_session.id,
          metadata: { baz: 'foo' }
        )
      end

      let(:concept_result3) do
        create(:concept_result,
          activity_session_id: activity_session.id
        )
      end

      let(:concept_results) do
        results = JSON.parse([concept_result1, concept_result2, concept_result3].to_json)

        results[0] = results[0].merge('concept_uid' => concept_result1.concept.uid)
        results[1] = results[1].merge('concept_uid' => concept_result2.concept.uid)
        results[2] = results[2].merge('concept_uid' => concept_result3.concept.uid)

        results
      end

      before { put :update, params: { id: activity_session.uid, concept_results: concept_results }, as: :json }

      it 'succeeds' do
        expect(response.status).to eq(200)
      end

      it 'stores the concept results' do
        activity_session.reload
        expect(activity_session.concept_results.size).to eq 7
      end

      it 'saves the arbitrary metadata for the results' do
        activity_session.reload
        expect(activity_session.concept_results.find{|x| x.metadata == {"foo"=>"bar"}}).to be
      end

      it 'saves the concept tag relationship (ID) in the result' do
        expect(ConceptResult.where(activity_session_id: activity_session, concept_id: writing_concept.id).count).to eq 2
      end
    end

    context 'result is assigned to a non-existent concept tag' do
      def subject
        results = [
          {
            concept_uid: 'Non-existent UID',
            metadata: {
              foo: 'bar',
            }
          }
        ]
        put :update, params: { id: activity_session.uid, concept_results: results }, as: :json
      end

      # this is no longer the case, as results should not be saved with nonexistent concept tag
      it 'does not save the concept result' do
        activity_session.concept_results.destroy_all
        response = subject
        expect(activity_session.concept_results).to eq([])
      end
    end

    context 'the active activity session exists and the activity session is completed' do
      it 'the active activity session gets deleted' do
        active_activity_session = create(:active_activity_session, uid: activity_session.uid)

        put :update, params: { id: activity_session.uid, state: 'finished' }, as: :json
        expect(ActiveActivitySession.find_by_uid(activity_session.uid)).not_to be
      end
    end

    context 'data time_tracking is included' do

      it 'updates timespent on activity session' do
        data = {
          'time_tracking' => {
            'so' => 1,
            'but' => 2,
            'because' => 3
          }
        }

        put :update, params: { id: activity_session.uid, data: data }, as: :json
        activity_session.reload

        expect(activity_session.timespent).to eq 6
        expect(activity_session.data['time_tracking']).to include(data['time_tracking'])
      end

      it 'should discard outlier, adjust time_tracking, and record edits' do
        data = {
          'time_tracking' => {
            'so' => 9999999,
            'but' => 10,
            'because' => 9
          }
        }

        modified_data = {
          'time_tracking' => {
            'so' => 10,
            'but' => 10,
            'because' => 9
          },
          'time_tracking_edits' => {
            'so' => 9999999
          }
        }

        expect(Raven).to_not receive(:capture_exception)

        put :update, params: { id: activity_session.uid, data: data }, as: :json
        activity_session.reload

        expect(activity_session.timespent).to eq 29
        expect(activity_session.data['time_tracking']).to include(modified_data['time_tracking'])
        expect(activity_session.data['time_tracking_edits']).to include(modified_data['time_tracking_edits'])
      end

      it 'should log long session' do
        data = {
          'time_tracking' => {
            'so' => 9999,
            'but' => 9999,
            'because' => 9999
          }
        }

        expect(ErrorNotifier).to receive(:report).with(ActivitySession::LongTimeTrackingError).once

        put :update, params: { id: activity_session.uid, data: data }, as: :json
      end

      describe 'the total time tracking value is larger than the maximum 4-byte integer size' do
        it 'saves timespent with the maximum 4-byte integer size' do
          data = {
            'time_tracking' => {
              'so' => 2147483648
            }
          }

          put :update, params: { id: activity_session.uid, data: data }, as: :json
          activity_session.reload

          expect(activity_session.timespent).to eq 2147483647
        end
      end
    end

    context 'a finished session' do
      let(:token) { double :acceptable? => true, resource_owner_id: user.id }
      let(:user) { create(:student) }
      let!(:activity_session) do
        create(:activity_session, state: 'finished', user: user, percentage: 1.0, completed_at: Time.current)
      end

      before { allow(controller).to receive(:doorkeeper_token) {token} }

      it 'returns a 422 error if activity session is already saved' do
        put :update, params: { id: activity_session.uid }, as: :json
        parsed_body = JSON.parse(response.body)
        expect(parsed_body["meta"]["message"]).to eq("Activity Session Already Completed")
      end

      it 'returns a 200 if the activity session is not already finished and can be updated' do
        activity_session.update(completed_at: nil, state: 'started')
        put :update, params: { id: activity_session.uid }, as: :json
        parsed_body = JSON.parse(response.body)
        expect(parsed_body["meta"]["message"]).to eq("Activity Session Updated")
      end

      it 'returns a 422 error if activity session update method fails' do
        # create a double
        activity_session = create(:activity_session, state: 'started', user: user)
        allow(activity_session).to receive(:update).and_return(false)

        put :update, params: { id: activity_session.uid }, as: :json
        parsed_body = JSON.parse(response.body)
        expect(parsed_body["meta"]["message"]).to eq("Activity Session Already Completed")
      end
    end
  end

  describe '#show' do
    let!(:session) { create(:activity_session) }

    it 'renders the correct json' do
      get :show, params: { id: session.uid }, as: :json

      expect(JSON.parse(response.body)["meta"]).to eq({
          "status" => "success",
          "message" => nil,
          "errors" => nil
        })
      expect(JSON.parse(response.body)["activity_session"]["uid"]).to eq session.uid
      expect(JSON.parse(response.body)["activity_session"]["percentage"]).to eq session.percentage
      expect(JSON.parse(response.body)["activity_session"]["state"]).to eq session.state
      expect(JSON.parse(response.body)["activity_session"]["data"]).to eq session.data
      expect(JSON.parse(response.body)["activity_session"]["temporary"]).to eq session.temporary
      expect(JSON.parse(response.body)["activity_session"]["activity_uid"]).to eq session.activity_uid
      expect(JSON.parse(response.body)["activity_session"]["anonymous"]).to eq session.anonymous
    end
  end

  describe '#create' do
    let(:classroom_unit) { create(:classroom_unit) }
    let(:activity_session) { create(:proofreader_activity_session, classroom_unit: classroom_unit) }
    let(:params) { activity_session.attributes.except('id', 'classroom_unit_id') }

    it 'creates the activity session' do
      post :create, params: params, as: :json

      expect(JSON.parse(response.body)["meta"]).to eq({
        "status" => "success",
        "message" => "Activity Session Created",
        "errors" => {}
      })
    end
  end

  describe '#destroy' do
    include_context "calling the api" #bypass doorkeeper
    let!(:session) { create(:proofreader_activity_session) }

    it 'destroys the activity session' do
      delete :destroy, params: { id: session.uid }, as: :json
      expect(JSON.parse(response.body)["meta"]).to eq({
        "status" => "success",
        "message" => "Activity Session Destroy Successful",
        "errors" => nil
      })
    end
  end
end
