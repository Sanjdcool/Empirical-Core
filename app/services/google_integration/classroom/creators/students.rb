module GoogleIntegration::Classroom::Creators::Students

  def self.run(classrooms, students_requester)
    students_requester_and_parser = self.students_requester_and_parser(students_requester)
    student_data = self.get_student_data_for_all_classrooms(classrooms, students_requester_and_parser)
    students = self.create_students(classrooms, student_data)
    students
  end

  private

  def self.students_requester_and_parser(students_requester)
    lambda do |course_id|
      response = students_requester.call(course_id)
      parsed_response = GoogleIntegration::Classroom::Parsers::Students.run(response)
      parsed_response
    end
  end

  def self.get_student_data_for_all_classrooms(classrooms, students_requester_and_parser)
    #use string keys as the classrooms are coming through sidekiq and don't have symbols
    puts 'HEEEEEEEY here are your classrooms'
    puts classrooms.to_s
    puts 'classrooms are above me'
    puts classrooms[1]["google_classroom_id"]
    course_ids = classrooms.map{|classroom| classroom["google_classroom_id"] ? classroom["google_classroom_id"] : classroom["id"]}
    student_data = course_ids.map.with_index do |course_id, i|
      array = students_requester_and_parser.call(course_id)
      array.map{|ele| ele.merge({classroom: Classroom.unscoped.find(classrooms[i]['id'])})}
    end
    student_data.flatten
  end

  def self.create_students(classrooms, student_data)
    students = student_data.map do |sd|
      self.create_student(sd)
    end
    students.compact
  end

  def self.create_student(data)
    if data[:email]
      student = ::User.where(email: data[:email].downcase).first_or_initialize
      if student.new_record?
        username = UsernameGenerator.run(data[:first_name], data[:last_name], data[:classroom].code)
        student.update(name: data[:name],
                       role: 'student',
                       password: data[:last_name],
                       username: username,
                       signed_up_with_google: true)
      end
      self.student_log(student, data)
      if student.errors.any?
        puts "Error: Could not save google classroom student."
      else
        Associators::StudentsToClassrooms.run(student, data[:classroom])
      end
      student
    end
  end

  def self.student_log(student, data)
    puts "Google Student"
    puts student.attributes
    puts student.errors.first
    puts student.valid?
    puts data[:email]
    puts data[:classroom].attributes
    puts "End Google Student"
  end

end
