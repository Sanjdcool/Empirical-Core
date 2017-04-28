class Auth::GoogleController < ApplicationController

  def google
    access_token = request.env['omniauth.auth']['credentials']['token']
    session[:google_access_token] = access_token
    name, email, google_id = GoogleIntegration::Profile.fetch_name_email_and_google_id(access_token)
    puts request.referer
    puts 'there is the request referer'
    if redirect_request(request)
      # If we are here it is simply to get a new access token. Ultimately, we should
      # set this up for refresh tokens at which point, this will no longer be necessary.
      return redirect_to URI(request.referer).path
    end
    if (session[:role].present? && User.where(google_id: google_id).none?) || (current_user && !current_user.signed_up_with_google)
      # If the above is true, the user is either currently signing up and has session[:role] or
      # the user is extant and is about to register with google for the first time
      register_with_google(name, email, session[:role], access_token, google_id)
    else
      # This is only being accessed by when a user logs in with google
      google_login(email, access_token, google_id)
    end
  end

  private

  def redirect_request(request)
    request.referer &&
    URI(request.referer).path &&
    URI(request.referer).host != "accounts.google.com" &&
    ['/session/new', '/account/new', '/teachers/classrooms/dashboard'].exclude?(URI(request.referer).path)
  end

  def google_login(email, access_token, google_id)
    user = User.find_by(email: email.downcase)
    if user.present?
      user.google_id ? nil : user.update(google_id: google_id)
      sign_in(user)
      TestForEarnedCheckboxesWorker.perform_async(user.id)
      GoogleStudentImporterWorker.perform_async(current_user.id, session[:google_access_token])
      redirect_to profile_path
    else
      redirect_to new_account_path
    end
  end


  def register_with_google(name, email, role, access_token, google_id)
    user = User.find_or_initialize_by(email: email.downcase)
    if user.new_record?
      user.attributes = {signed_up_with_google: true, name: name, role: role, google_id: google_id}
      user.save
      sign_in(user)
      ip = request.remote_ip
      AccountCreationCallbacks.new(user, ip).trigger
      user.subscribe_to_newsletter
      if user.role == 'teacher'
        @js_file = 'session'
        @teacherFromGoogleSignUp = true
        render 'accounts/new'
        return
      else
        GoogleIntegration::Classroom::Main.join_existing_google_classrooms(user, access_token)
      end
    end
    if user.errors.any?
      redirect_to new_account_path
      return
    else
      user.update(signed_up_with_google: true)
      if request.referer && URI(request.referer) && URI(request.referer).path == '/teachers/classrooms/dashboard'
        # if they are hitting this route through the dashboard, they should be brought to the google sync page
        redirect_to '/teachers/classrooms/google_sync'
        return
      end
      redirect_to profile_path
      return
    end
  end

end
