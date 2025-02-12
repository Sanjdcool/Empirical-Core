# frozen_string_literal: true

# == Schema Information
#
# Table name: schools
#
#  id                    :integer          not null, primary key
#  charter               :string
#  city                  :string
#  ethnic_group          :string
#  free_lunches          :integer
#  fte_classroom_teacher :integer
#  latitude              :decimal(9, 6)
#  longitude             :decimal(9, 6)
#  lower_grade           :integer
#  magnet                :string
#  mail_city             :string
#  mail_state            :string
#  mail_street           :string
#  mail_zipcode          :string
#  name                  :string
#  nces_status_code      :string
#  nces_type_code        :string
#  phone                 :string
#  ppin                  :string
#  school_level          :integer
#  state                 :string
#  street                :string
#  total_students        :integer
#  ulocal                :integer
#  upper_grade           :integer
#  zipcode               :string
#  created_at            :datetime
#  updated_at            :datetime
#  authorizer_id         :integer
#  clever_id             :string
#  coordinator_id        :integer
#  district_id           :bigint
#  nces_id               :string
#
# Indexes
#
#  index_schools_on_district_id     (district_id)
#  index_schools_on_mail_zipcode    (mail_zipcode)
#  index_schools_on_name            (name)
#  index_schools_on_nces_id         (nces_id)
#  index_schools_on_state           (state)
#  index_schools_on_zipcode         (zipcode)
#  unique_index_schools_on_nces_id  (nces_id) UNIQUE WHERE ((nces_id)::text <> ''::text)
#  unique_index_schools_on_ppin     (ppin) UNIQUE WHERE ((ppin)::text <> ''::text)
#
require 'rails_helper'

describe School, type: :model do
  it { should belong_to(:district) }

  let!(:bk_school) { create :school, name: "Brooklyn Charter School", zipcode: '11206'}
  let!(:queens_school) { create :school, name: "Queens Charter School", zipcode: '11385'}
  let!(:bk_teacher) { create(:teacher, school: bk_school) }
  let!(:bk_teacher_colleague) { create(:teacher, school: bk_school) }
  let!(:queens_teacher) { create(:teacher, school: queens_school) }

  describe('#subscription') do
    let!(:subscription) { create(:subscription, expiration: Date.tomorrow) }
    let!(:school_subscription) {create(:school_subscription, school: bk_school, subscription: subscription)}

    it "returns a subscription if a valid one exists" do
      expect(bk_school.reload.subscription).to eq(subscription)
    end

    it "returns the subscription with the latest expiration date multiple valid ones exists" do
      later_subscription = create(:subscription, expiration: 365.days.from_now.to_date)
      later_user_sub = create(:school_subscription, school: bk_school, subscription: later_subscription)
      expect(bk_school.reload.subscription).to eq(later_subscription)
    end

    it "returns nil if a valid subscription does not exist" do
      subscription.update(expiration: Date.yesterday)
      expect(bk_school.reload.subscription).to eq(nil)
    end
  end

  describe('#present_and_future_subscriptions') do
    let!(:subscription) { create(:subscription, expiration: Date.tomorrow) }
    let!(:next_subscription) { create(:subscription, expiration: Date.tomorrow + 1.year, start_date: Date.tomorrow) }
    let!(:school_subscription) {create(:school_subscription, school: bk_school, subscription: subscription)}
    let!(:next_school_subscription) {create(:school_subscription, school: bk_school, subscription: next_subscription)}
    let!(:expired_subscription) {create(:subscription, expiration: Date.yesterday, de_activated_date: Date.yesterday)}
    let!(:expired_school_subscription) {create(:school_subscription, school: bk_school, subscription: expired_subscription)}

    it "returns all subscriptions even if they have not started yet" do
      expect(bk_school.present_and_future_subscriptions.size).to eq(2)
    end

    it "returns in ascending order of expiration date" do
      expect(bk_school.present_and_future_subscriptions.first).to eq(subscription)
      expect(bk_school.present_and_future_subscriptions.last).to eq(next_subscription)
    end

    it "does not return deactivated subscriptions" do
      expect(bk_school.present_and_future_subscriptions).not_to include(expired_subscription)
    end
  end


  describe 'validations' do
    before do
      @school = School.new
    end

    it 'lower grade is within bounds' do
      @school.lower_grade = 5

      expect(@school.valid?).to eq(true)
    end

    it 'lower grade is out of bounds' do
      @school.lower_grade = -1

      expect(@school.valid?).to eq(false)
      expect(@school.errors[:lower_grade]).to eq(['must be between 0 and 12'])
    end

    it 'upper grade is within bounds' do
      @school.upper_grade = 8

      expect(@school.valid?).to eq(true)
    end

    it 'upper grade is out of bounds' do
      @school.upper_grade = 14

      expect(@school.valid?).to eq(false)
      expect(@school.errors[:upper_grade]).to eq(['must be between 0 and 12'])
    end

    it 'lower grade is below upper grade' do
      @school.lower_grade = 2
      @school.upper_grade = 8

      expect(@school.valid?).to eq(true)
    end

    it 'lower grade is above upper grade' do
      @school.lower_grade = 6
      @school.upper_grade = 3

      expect(@school.valid?).to eq(false)
      expect(@school.errors[:lower_grade]).to eq(['must be less than or equal to upper grade'])
    end

  end

  describe('school_year_start method') do
    it 'fetches 07-01 of this year if the date is after 07-01' do
      time = Date.parse('2020-07-01')
      expect(School.school_year_start(time)).to eq(time.beginning_of_day)
    end

    it 'fetches 07-01 of last year if the date is before 07-01' do
      time = Date.parse('2020-06-01')
      expect(School.school_year_start(time)).to eq(Date.parse('2019-07-01').beginning_of_day)
    end
  end

  describe('district admin behavior') do
    let(:school) { create(:school) }
    let(:district) { create(:district) }
    let(:admin) { create(:user)}

    it 'creates new school admin record if a school is attached to a new district' do
      create(:district_admin, user: admin, district: district)
      expect(SchoolsAdmins.find_by(school: school, user: admin)).not_to be
      school.update(district_id: district.id)
      expect(SchoolsAdmins.find_by(school: school, user: admin)).to be
    end

    it 'does not create new school admin record if a school is attached to a new district and the district admin is already admin for the school' do
      create(:schools_admins, user: admin, school: school)
      expect(SchoolsAdmins.where(school: school, user: admin).count).to eq 1

      school.update(district_id: district.id)
      expect(SchoolsAdmins.where(school: school, user: admin).count).to eq 1
    end

    it 'destroys school admin record if a school is detached from a district' do
      create(:district_admin, user: admin, district: district)
      school.update(district_id: district.id)
      expect(SchoolsAdmins.find_by(school: school, user: admin)).to be

      school.update(district_id: nil)
      expect(SchoolsAdmins.find_by(school: school, user: admin)).not_to be
    end
  end
end
