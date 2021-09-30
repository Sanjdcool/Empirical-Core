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
class Standard < ApplicationRecord
  include Uid

  belongs_to :standard_level
  belongs_to :standard_category

  has_many :activities, dependent: :nullify
  has_many :change_logs, as: :changed_record

  default_scope -> { order(:name) }

  validates :standard_level, presence: true
  validates :name, presence: true, uniqueness: true

  accepts_nested_attributes_for :change_logs

  after_commit { Activity.clear_activity_search_cache }

  def name_prefix
    name.split(' ').first
  end
end
