class Subscription < ActiveRecord::Base
  has_many :user_subscriptions
  has_many :school_subscriptions
  validates :expiration, presence: true
  validates :account_limit, presence: true

  def self.start_premium user_id
    user_sub = UserSubscription.find_or_initialize_by(user_id: user_id)
    # if a subscription already exists, we just update it by adding an additional 365 days to the expiration
    if user_sub.new_record?
      new_sub = Subscription.create!(expiration: self.set_expiration, account_limit: 1000, account_type: 'paid')
      user_sub.update!(subscription_id: new_sub.id)
      user_sub.save!
    else
      user_sub.subscription.update!(expiration: self.set_expiration(user_sub.subscription), account_limit: 1000, account_type: 'paid')
    end
    PremiumAnalyticsWorker.perform_async(user_sub.user_id, 'paid')
  end

  def self.update_or_create_with_school_join school_id, attributes
    self.create_with_school_or_user_join school_id, 'School', attributes
  end

  def self.update_or_create_with_user_join user_id, attributes
    self.create_with_school_or_user_join user_id, 'User', attributes
  end

  def is_not_paid?
    self.account_type == 'trial'
  end

  def trial_or_paid
    is_not_paid? ? 'trial' : 'paid'
  end

  private

  def self.set_expiration(sub = nil)
    if sub
      [sub.expiration + 365, Date.new(2018, 7, 1)].max
    else
      [Date.today + 365, Date.new(2018, 7, 1)].max
    end
  end

  def self.create_with_school_or_user_join school_or_user_id, type, attributes
    new_sub = Subscription.create(attributes)
    if new_sub.persisted?
      "#{type}Subscription".constantize.update_or_create(school_or_user_id, new_sub.id)
    end
    new_sub
  end


end
