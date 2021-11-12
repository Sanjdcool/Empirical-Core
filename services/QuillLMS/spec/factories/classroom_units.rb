FactoryBot.define do
  factory :classroom_unit do
    unit            { create(:unit) }
    classroom       { create(:classroom) }
    assign_on_join  false

    factory :classroom_unit_with_activity_sessions do
      after(:create) do |classroom_unit|
        unit_activity = create(:unit_activity, unit: classroom_unit.unit)
        create(:activity_session, percentage: 19, classroom_unit_id: classroom_unit.id, activity: unit_activity.activity)
        create(:activity_session, percentage: 21, classroom_unit_id: classroom_unit.id, activity: unit_activity.activity)
      end
    end

    factory :lesson_classroom_unit_with_activity_sessions do
      after(:create) do |classroom_unit|
        unit_activity = create(:lesson_unit_activity, unit: classroom_unit.unit)
        create_list(:activity_session, 2, classroom_unit: classroom_unit, activity: unit_activity.activity)
      end
    end
  end
end
