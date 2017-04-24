module Creators::StudentCreator

  def self.check_names(params)
    name_validator = FirstLastNameValidator.new(params[:user]).check_names
    if name_validator[:status] == 'failure'
      return name_validator[:notice]
    else
      student_attributes = name_validator
      student_attributes
    end
  end

  def self.create_student(user_params, classroom_id)
    @student = User.new(user_params)
    @student.generate_student(classroom_id)
    @student.save!
    buildClassroomRelation(classroom_id)
    @student
  end

  def self.buildClassroomRelation(classroom_id)
    sc  = StudentsClassrooms.unscoped.find_or_create_by(student_id: @student.id, classroom_id: classroom_id)
    sc.update(visible: true)
    sc
  end

end
