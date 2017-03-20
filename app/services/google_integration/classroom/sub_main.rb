module GoogleIntegration::Classroom::SubMain

  def self.pull_and_save_data(user, course_response, access_token)
    if user.role == 'teacher'
      GoogleIntegration::Classroom::Teacher.run(user, self.courses(course_response), access_token)
    elsif user.role == 'student'
      GoogleIntegration::Classroom::Student.run(user, self.courses(course_response))
    end
  end

  private

  # this module should be the only one which knows about the requesters in GoogleIntegration::Classroom::Requesters
  # this way we dont have to worry about making real requests in specs

  def self.courses(course_response)
    GoogleIntegration::Classroom::Parsers::Courses.run(course_response)
  end

end
