require 'spec_helper'

describe ActivitiesController, :type => :controller do
  
  
  let(:teacher) { FactoryGirl.create(:teacher)}
  let(:activity) {FactoryGirl.create(:activity)}
  let(:classroom) {FactoryGirl.create(:classroom)}
  let(:classroom_activity) {ClassroomActivity.create activity: activity, classroom: classroom}

  before do
    
    session[:user_id] = teacher.id

    
  end


  it 'retry works' do    

    get :retry, id: activity.id, classroom_activity_id: classroom_activity.id

    expect(response.status).to eq(200)





    
  end

end


=begin

require 'spec_helper'

describe Teachers::ClassroomsController, type: :controller do 
  describe 'creating a classroom' do
    render_views
    let(:teacher) { FactoryGirl.create(:teacher) }

    before do
      session[:user_id] = teacher.id # sign in, is there a better way to do this in test?
    end

    it 'kicks off a background job' do
      expect {
        post :create, classroom: {name: 'My Class', grade: '8', code: 'whatever-whatever'}
        expect(response.status).to eq(302) # Redirects after success
      }.to change(ClassroomCreationWorker.jobs, :size).by(1)
    end

    it 'displays the form' do
      get :new
      expect(response.status).to eq(200)
    end
  end
end



=end