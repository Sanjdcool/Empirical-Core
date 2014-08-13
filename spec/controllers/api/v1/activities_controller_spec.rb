require 'spec_helper'

describe Api::V1::ActivitiesController, :type => :controller do

  context 'GET #show' do
    include_context "an api request"

    before do
      @activity1 = FactoryGirl.create(:activity)

      get :show, format: :json, id: @activity1.uid
      @parsed_body = JSON.parse(response.body)
    end

    it 'responds with 200' do
      expect(response.status).to eq(200)
    end

    it "should have an object at it's root" do
      expect(@parsed_body.keys).to include('object')
    end

    it "should present a uid" do
      expect(@parsed_body['object']['uid']).to eq(@activity1.uid)
    end
  end
end
