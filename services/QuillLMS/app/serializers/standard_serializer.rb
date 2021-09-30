# == Schema Information
#
# Table name: standards
#
#  id                   :bigint           not null, primary key
#  name                 :string
#  uid                  :string
#  visible              :boolean          default(TRUE)
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  standard_category_id :bigint
#  standard_level_id    :bigint
#
# Indexes
#
#  index_standards_on_standard_category_id  (standard_category_id)
#  index_standards_on_standard_level_id     (standard_level_id)
#
# Foreign Keys
#
#  fk_rails_...  (standard_category_id => standard_categories.id)
#  fk_rails_...  (standard_level_id => standard_levels.id)
#
class StandardSerializer < ActiveModel::Serializer
  attributes :id, :name, :created_at, :updated_at

  has_one :standard_level
  has_one :standard_category
end
