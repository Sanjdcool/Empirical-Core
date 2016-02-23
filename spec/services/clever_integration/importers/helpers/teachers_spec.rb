require 'rails_helper'

describe 'CleverIntegration::Importers::Helpers::Teachers' do

  let!(:district) {
    FactoryGirl.create(:district, name: 'district1', clever_id: '1', token: '1')
  }

  let!(:teachers_response) {
    [
      {id: '1',
       email: 'teacher@gmail.com',
       name: {
        first: 'john',
        last: 'smith'
       }
     }
    ]
  }

  let!(:district_requester) {

    Response = Struct.new(:teachers)
    response = Response.new(teachers_response)

    lambda do |clever_id, district_token|
      response
    end
  }


  def subject
    CleverIntegration::Importers::Helpers::Teachers.run(district, district_requester)
    User.find_by(name: 'John Smith', email: 'teacher@gmail.com', clever_id: '1')
  end

  it 'creates a teacher' do
    expect(subject).to_not be_nil
  end

  it 'associates teacher to district' do
    expect(subject.districts.first).to eq(district)
  end
end