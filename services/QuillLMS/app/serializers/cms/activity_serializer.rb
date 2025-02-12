# frozen_string_literal: true

class Cms::ActivitySerializer < ActiveModel::Serializer
  attributes :uid, :id, :name, :description, :flags, :data, :created_at, :updated_at, :supporting_info, :activity_category, :readability_grade_level, :unit_template_names

  has_one :classification, serializer: ClassificationSerializer

  def activity_category
    return unless object.id

    ActivityCategory
      .joins("JOIN activity_category_activities ON activity_categories.id = activity_category_activities.activity_category_id")
      .where("activity_category_activities.activity_id = #{object.id}")
      .limit(1)
      .to_a
      .first
  end

  def unit_template_names
    object.unit_templates.map {|ut| ut.name}
  end
end
