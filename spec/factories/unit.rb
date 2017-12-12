FactoryBot.define do
  factory :unit do
    sequence(:name) { |i| "Unit #{i}" }
    user_id         { create(:teacher).id }
  end
end
