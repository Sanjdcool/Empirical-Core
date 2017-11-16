shared_context 'Student Concept Progress Report' do
  # Create 3 students
  # Create 2 concept tag, one displayed, the other not
  # Create a distribution of concept tag results for each student
  let(:alice) { create(:student, name: "Alice Cool") }
  let(:fred) { create(:student, name: "Fred Kewl") }
  let(:zojirushi) { create(:student, name: "Zojirushi Kewel") }

  let(:concept) { create(:concept) }
  let(:hidden_concept) { create(:concept, name: "Hidden") }

  # Boilerplate
  let(:classroom) { create(:classroom,
    name: "Bacon Weaving",
    students: [alice, fred, zojirushi]) }
  let(:teacher) {classroom.owner}
  let(:activity) { create(:activity) }
  let(:unit) { create(:unit, user: teacher ) }
  let(:classroom_activity) { create(:classroom_activity,
                                          classroom: classroom,
                                          activity: activity,
                                          assign_on_join: true,
                                          unit: unit) }


  # Create 2 activity session for each student, one with the concept tags, one without
  let(:alice_session) { create(:activity_session, 
                                      classroom_activity: classroom_activity,
                                      user: alice,
                                      activity: activity,
                                      percentage: 0.75) }

  let(:fred_session) { create(:activity_session, 
                                      classroom_activity: classroom_activity,
                                      user: fred,
                                      activity: activity,
                                      percentage: 0.75) }

  # Zojirushi has no concept tag results, so should not display
  # in the progress report
  let(:zojirushi_session) { create(:activity_session, 
                                      classroom_activity: classroom_activity,
                                      user: zojirushi,
                                      activity: activity,
                                      percentage: 0.75) }

  let(:visible_students) { [alice, fred] }
  let(:classrooms) { [classroom] }

  before do
    # Incorrect result for Alice
    alice_session.concept_results.create!(
      concept: concept,
      metadata: {
        "correct" => 0
      })

    # Correct result for Alice
    alice_session.concept_results.create!(
      concept: concept,
      metadata: {
        "correct" => 1
      })

    # Incorrect result for Fred
    fred_session.concept_results.create!(
      concept: concept,
      metadata: {
        "correct" => 0
      })

    # Correct result for Fred for hidden tag (not displayed)
    fred_session.concept_results.create!(
      concept: hidden_concept,
      metadata: {
        "correct" => 1
      })
  end
end
