FactoryBot.define do
  factory :evidence_sequence, class: 'Evidence::Sequence' do
    association :sequence_group, factory: :evidence_sequence_group
    regex_text { "MyString" }
    case_sensitive { false }
    sequence_type { "incorrect" }
  end
end
