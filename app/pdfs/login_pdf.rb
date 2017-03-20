class LoginPdf < Prawn::Document
  include Prawn::Table::Interface

  def initialize(classroom)
    super(margin: [22, 24, 22, 24])
    @classroom = classroom
    render_login_pdf
  end

  def render_cover_page_header
    render_text "<b>#{@classroom.teacher.name} - <color rgb='777777'>#{@classroom.name}</color></b>", 20
    move_down 14
    float do
      bounding_box([273, cursor], width: 279, height: 120) do
        render_text "<u>Instructions for New Students:</u>", 12
        move_down 14
        render_text "1. Visit <b>quill.org</b>", 12
        move_down 7
        render_text "2. Click <b>Sign up</b> (at the top of the page)", 12
        move_down 7
        render_text "3. Create <b>username</b> and <b>password</b>", 12
        move_down 7
        render_text "4. Enter the class code: <b>#{@classroom.code}</b>", 12
      end
    end
    stroke_color 'CCCCCC'
    stroke do
      vertical_line cursor, cursor - 106, at: 242
    end
    stroke_color '000000'
    render_text "<u>Instructions For Invited Students:</u>", 12
    move_down 14
    render_text "1. Visit <b>quill.org</b>", 12
    move_down 7
    render_text "2. Click <b>Login</b> (at the top of the page)", 12
    move_down 7
    render_text "3. Enter <b>username</b> and <b>password</b>", 12
    move_down 7
    render_text "4. Click the <b>Login</b> button", 12
    move_down 40
    render_text "Student List:", 12
    move_down 12
  end

  def render_cover_page_table
    header = [["<b><font size='12'>Name</font></b>", "<b><font size='12'>Username</font></b>", "<b><font size='12'>Password</font></b>"]]
    body = []
    @classroom.students.each do |student|
      body << [student.name, render_username_or_email_for_student(student), render_password_for_student(student)]
    end
    table(header, cell_style: {
      inline_format: true,
      padding: 10,
      background_color: 'EFEFEF',
      borders: [:top],
      border_color: 'DDDDDD'
    }, column_widths: [182, 262, 120])
    table(body, cell_style: {
      padding: 10,
      size: 10,
      border_color: 'DDDDDD',
      borders: [:top, :bottom]
    }, column_widths: [182, 262, 120])
  end

  def render_section_for_one_student(student)
    font("Helvetica", size: 18, style: :bold) do
      text_box(
        student.name,
        at: [0, cursor],
        height: 18,
        width: 564,
        overflow: :shrink_to_fit
      )
    end
    move_down 28
    float do
      fill_color 'EEEEEE'
      fill_rectangle [252, cursor], 312, 80
      bounding_box([260, cursor - 8], width: 296, height: 64) do
        move_down 2
        fill_color '000000'
        render_text "Username:", 10
        move_down 2
        font("Helvetica", style: :bold) do
          text_box(
            render_username_or_email_for_student(student),
            at: [0, cursor],
            height: 12,
            width: 312,
            overflow: :shrink_to_fit
          )
        end
        move_down 20
        render_text "Password: (First letter is <b>Capitalized</b>)", 10
        move_down 2
        font("Helvetica", style: :bold) do
          text_box(
            render_password_for_student(student),
            at: [0, cursor],
            height: 12,
            width: 312,
            overflow: :shrink_to_fit
          )
        end
      end
    end
    render_text "1. Visit <b>quill.org</b>"
    move_down 8
    render_text "2. Click <b>Login</b> (at the top of the page)"
    move_down 8
    render_text "3. Enter your <b>username</b> and <b>password</b>"
    move_down 8
    render_text "4. Click the <b>Login</b> button"
  end

  def render_username_or_email_for_student(student)
    if student.clever_id.present? || student.signed_up_with_google?
      student.email
    else
      student.username
    end
  end

  def render_password_for_student(student)
    student.last_name.capitalize
  end

  def render_login_pdf
    font("Helvetica")
    render_cover_page_header
    render_cover_page_table
    start_new_page
    student_count = 0
    @classroom.students.each do |student|
      render_section_for_one_student(student)
      student_count += 1
      if student_count % 5 > 0 && student_count != @classroom.students.length
        move_down 20
        stroke_color 'CCCCCC'
        dash(4)
        stroke_horizontal_line 0, 564
        move_down 24
      elsif student_count % 5 == 0
        start_new_page
      end
    end
  end

  def render_text(content, size = nil)
    size ||= 12
    font_size size do
      text content, inline_format: true
    end
  end

end
