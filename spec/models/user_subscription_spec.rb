require 'rails_helper'

describe UserSubscription, type: :model do
let!(:user_1) {create(:user)}
let!(:user_2) {create(:user)}
let!(:new_sub) { create(:subscription)}
let!(:old_sub) { create(:subscription)}
let!(:user_sub) {create(:user_subscription, user_id: user_1.id, subscription_id: old_sub.id)}

  context "validates" do

    describe "presence of" do
      it "subscription_id" do
        expect{user_sub.update!(user_id: nil)}.to raise_error
      end

      it "user_id" do
        expect{user_sub.update!(subscription_id: nil)}.to raise_error
      end
    end

  end

  context "UserSubscription.update_or_create" do

    it "updates existing UserSubscriptions to the new subscription_id" do
      # TODO: figure out why this fails inconsistently
      expect(user_sub.subscription_id).to eq(old_sub.id)
      UserSubscription.update_or_create(user_1.id, new_sub.id)
      expect(user_sub.reload.subscription_id).to eq(new_sub.id)
    end

    it "creates new UserSubscriptions with the passed subscription_id and user_id" do
      UserSubscription.update_or_create(99, 11)
      new_user_sub = UserSubscription.last
      expect([new_user_sub.user_id, new_user_sub.subscription_id]).to eq([99,11])
    end
  end

end
