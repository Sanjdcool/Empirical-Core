FactoryBot.define do

  factory :activity do

    sequence(:name) { |i| "activity #{i}" }
    description { 'placeholder description' }
    data { {
      body: "In 1914, Ernest Shackleton set {+off-of|1} on an exploration across the Antarctic. In 1915 his ship, Endurance, became trapped in the ice, and {+its-it's|2} crew was stuck.",
      instructions: "There are **two errors** in this passage. *To edit a word, click on it and re-type it.*"
    } }

    topic { Topic.first || FactoryBot.create(:topic) }
    classification { ActivityClassification.first || FactoryBot.create(:classification) }
    activity_categories { [ActivityCategory.first || FactoryBot.create(:activity_category)]}
  end

end
