describe('Teacher Dashboard Subnav', function() {

  before(function() {
    cy.exec('RAILS_ENV=cypress rake find_or_create_cypress_test_data:find_or_create_teacher_with_classroom', {failOnNonZeroExit: false})
    cy.login('teacher', 'password')
    cy.visit('/')
  })

  beforeEach(function() {
    Cypress.Cookies.preserveOnce("_quill_session")
  })

  it('has a link to the Home page', function() {
    cy.get('#teacher-nav-tabs').contains('Home').click({force: true})
    cy.url().should('include', '/teachers/classrooms/dashboard')
  })

  it('has a link to the Classes page', function() {
    cy.get('#teacher-nav-tabs').contains('Classes').click({force: true})
    cy.url().should('include', '/teachers/classrooms')
  })

  it('has a link to the Assign Activity page', function() {
    cy.get('#teacher-nav-tabs').contains('Assign Activity').click({force: true})
    cy.url().should('include', '/teachers/classrooms/assign_activities')
  })

  it('has a link to the My Activities page', function() {
    cy.get('#teacher-nav-tabs').contains('My Activities').click({force: true})
    cy.url().should('include', '/teachers/classrooms/activity_planner')
  })

  it('has a link to the Student Reports page', function() {
    cy.get('#teacher-nav-tabs').contains('Student Reports').click({force: true})
    cy.url().should('include', '/teachers/progress_reports/landing_page')
  })

  it('has a link to the Premium page', function() {
    cy.get('#teacher-nav-tabs').contains('Premium').click({force: true})
    cy.url().should('include', '/premium')
  })

})
