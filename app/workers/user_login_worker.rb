class UserLoginWorker
  include Sidekiq::Worker

  def perform(id, ip_address)

    @user = User.find(id)

    @user.update_attributes(ip_address: ip_address)
    @user.save

    data = @user.serialized.as_json(root: false)

    data[:keen] = {
      addons: [{
          name: "keen:ip_to_geo",
          input: {ip: "ip_address"},
          output: "ip_geo_info"
        }]
    }

    Keen.publish(:login, data)

  end
end
