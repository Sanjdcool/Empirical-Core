class AccountCreatedEmailWorker
  include Sidekiq::Worker

  def perform(id, temp_password, admin_name)
    if id
      @user = User.find_by(id: id)
      @user.send_account_created_email(temp_password, admin_name) if @user
    end
  end
end
