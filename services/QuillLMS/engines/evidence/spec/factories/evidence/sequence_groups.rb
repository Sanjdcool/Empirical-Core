FactoryBot.define do
  factory :evidence_sequence_group, class: 'Evidence::SequenceGroup' do
    association :rule, factory: :evidence_rule
  end
end
