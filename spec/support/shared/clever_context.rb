shared_context 'clever' do
  let!(:teacher_response) {
    Response = Struct.new(:sections, :school)
    sections = [
      {
        id: 'section_id_1',
        name: 'section1',
        grade: '2'
      }
    ]
    school = {name: 'school1'}
    x = Response.new(sections, school)
    x
  }

  let!(:section_response) {
    Response = Struct.new(:students)
    students = [
      {
        id: 'student_id_1',
        name: {
          first: 'studentjohn',
          last: 'studentsmith'
        },
        email: 'student@gmail.com',
        credentials: {
          district_username: 'student_username'
        }
      }
    ]
    x = Response.new(students)
    x
  }

  def helper(response)
    lambda do |clever_id, district_token|
      response
    end
  end

  let!(:requesters) {
    {
      teacher_requester: helper(teacher_response),
      section_requester: helper(section_response)
    }
  }

  def teacher
    User.find_by(clever_id: 'teacher_id_1',
                 name: "Teacherjohn Teachersmith",
                 email: 'teacher@gmail.com',
                 role: 'teacher')
  end

  def classroom
    Classroom.find_by(name: 'section1', clever_id: 'section_id_1')
  end

  def student
    User.find_by(clever_id: 'student_id_1',
                 name: 'Studentjohn Studentsmith',
                 email: 'student@gmail.com',
                 username: 'student_username',
                 role: 'student')
  end

  def school
    School.find_by(name: 'school1')
  end
end