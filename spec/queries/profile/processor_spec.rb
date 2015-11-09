require 'rails_helper'

describe 'Profile::Processor' do
  let(:teacher) { FactoryGirl.create(:user, role: 'teacher') }
  let(:classroom) { FactoryGirl.create(:classroom, teacher: teacher) }
  let(:student) { FactoryGirl.create(:user, role: 'student', classroom: classroom) }

  let(:game1) { FactoryGirl.create(:activity_classification, id: 1) }
  let(:game2) { FactoryGirl.create(:activity_classification, id: 2) }

  let(:activity) { FactoryGirl.create(:activity, classification: game2) }
  let(:activity_1a) { FactoryGirl.create(:activity, classification: game1) }
  let(:activity_1aa) { FactoryGirl.create(:activity, classification: game2) }
  let!(:activity_1b) { FactoryGirl.create(:activity, classification: game2) }
  let(:unit1) { FactoryGirl.create(:unit) }
  let!(:classroom_activity) { FactoryGirl.create(:classroom_activity,
                                                  classroom: classroom,
                                                  activity: activity,
                                                  unit: unit1) }

  let!(:classroom_activity_1a) { FactoryGirl.create(:classroom_activity,
                                                    classroom: classroom,
                                                    activity: activity_1a,
                                                    unit: unit1)}


  let!(:classroom_activity_1aa) { FactoryGirl.create(:classroom_activity,
                                                    classroom: classroom,
                                                    activity: activity_1aa,
                                                    unit: unit1)}

  let!(:classroom_activity_1b) { FactoryGirl.create(:classroom_activity,
                                                    classroom: classroom,
                                                    activity: activity_1b,
                                                    unit: unit1)}

  let(:activity2) { FactoryGirl.create(:activity, classification: game2) }
  let(:activity_2a) { FactoryGirl.create(:activity, classification: game1) }
  let(:activity_2aa) { FactoryGirl.create(:activity, classification: game2) }
  let(:activity_2b) { FactoryGirl.create(:activity, classification: game2) }

  let!(:unit2) { FactoryGirl.create(:unit) }
  let!(:classroom_activity2) { FactoryGirl.create(:classroom_activity,
                                                  classroom: classroom,
                                                  activity: activity2,
                                                  unit: unit2,
                                                  due_date: Date.today + 3) }

  let!(:classroom_activity_2a) { FactoryGirl.create(:classroom_activity,
                                                    classroom: classroom,
                                                    activity: activity_2a,
                                                    unit: unit2,
                                                    due_date: Date.today + 100)}

  let!(:classroom_activity_2aa) { FactoryGirl.create(:classroom_activity,
                                                    classroom: classroom,
                                                    activity: activity_2aa,
                                                    unit: unit2,
                                                    due_date: Date.today + 100)}


  let!(:classroom_activity_2b) { FactoryGirl.create(:classroom_activity,
                                                    classroom: classroom,
                                                    activity: activity_2b,
                                                    unit: unit2,
                                                    due_date: Date.today + 1)}


  let!(:as1) { classroom_activity.session_for(student) }
  let!(:as_1a) { classroom_activity_1a.session_for(student) }
  let!(:as_1aa) { classroom_activity_1aa.session_for(student) }
  let!(:as_1b) { classroom_activity_1b.session_for(student) }

  let!(:as2) { classroom_activity2.session_for(student) }
  let!(:as_2a) { classroom_activity_2a.session_for(student) }
  let!(:as_2aa) { classroom_activity_2aa.session_for(student) }
  let!(:as_2b) { classroom_activity_2b.session_for(student) }


  def subject
    Profile::Processor.new.query(student)
  end

  before do
    as1.update_attributes(percentage: 0.8, state: 'finished')
    as_1a.update_attributes(percentage: 0.5, state: 'finished')
    as_1aa.update_attributes(percentage: 0.5, state: 'finished')
    as_1b.update_attributes(percentage: 1, state: 'finished')
  end

  it 'groups by unit' do
    results = subject
    expect(results.keys).to contain_exactly(unit1.id, unit2.id)
  end

  it 'groups by state within unit' do
    results = subject
    x = results[unit1.id]['finished']
    expect(x).to contain_exactly(as1, as_1a, as_1aa, as_1b)
  end

  it 'sorts finished activities by percentage, then activity.activity_classification_id' do
    results = subject
    x = results[unit1.id]['finished']
    expect(x).to eq([as_1b, as1, as_1a, as_1aa])
  end

  it 'sorts unstarted activities by due_date, then activity.activity_classification_id' do
    results = subject
    x = results[unit2.id]['unstarted']
    expect(x).to eq([as_2b, as2, as_2a, as_2aa])
  end
end