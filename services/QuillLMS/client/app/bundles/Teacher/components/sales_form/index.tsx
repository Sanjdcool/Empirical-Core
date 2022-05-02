import * as React from 'react';

import LowerFormFields from './lowerFormFields';
import SchoolOrDistrictFields from './schoolOrDistrictFields';
import UpperFormFields from './upperFormFields';

import { getSchoolsAndDistricts, validateSalesForm } from '../../helpers/salesForms';
import { InputEvent } from '../../../Staff/interfaces/evidenceInterfaces';
import {
  FIRST_NAME, LAST_NAME, EMAIL, PHONE_NUMBER, ZIPCODE, SCHOOL_PREMIUM_ESTIMATE, TEACHER_PREMIUM_ESTIMATE,
  STUDENT_PREMIUM_ESTIMATE, COMMENTS, SCHOOL, DISTRICT, SCHOOL_OR_DISTRICT, SCHOOL_NOT_LISTED, DISTRICT_NOT_LISTED
} from '../../../../constants/salesForm';

export const SalesForm = ({ type }) => {
  const [errors, setErrors] = React.useState<any>({});
  const [firstName, setFirstName] = React.useState<string>('');
  const [lastName, setLastName] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [phoneNumber, setPhoneNumber] = React.useState<string>('');
  const [zipcode, setZipcode] = React.useState<string>('');
  const [schoolPremimumEstimate, setSchoolPremiumEstimate] = React.useState<string>('');
  const [teacherPremimumEstimate, setTeacherPremiumEstimate] = React.useState<string>('');
  const [studentPremimumEstimate, setStudentPremiumEstimate] = React.useState<string>('');
  const [comments, setComments] = React.useState<string>('');
  const [schools, setSchools] = React.useState<any[]>([]);
  const [districts, setDistricts] = React.useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = React.useState<string>('');
  const [schoolNotListed, setSchoolNotListed] = React.useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('');
  const [districtNotListed, setDistrictNotListed] = React.useState<boolean>(false);
  const [schoolOrDistrict, setSchoolOrDistrict] = React.useState<any>('');

  React.useEffect(() => {
    if(!schools.length) {
      getSchoolsAndDistricts('school').then((response) => {
        if(response && response.options) {
          setSchools(response.options)
        }
      });
    }
    if(!districts.length) {
      getSchoolsAndDistricts('district').then((response) => {
        if(response && response.options) {
          setDistricts(response.options)
        }
      });
    }
  }, []);

  const stateSetters = {
    [FIRST_NAME]: setFirstName,
    [LAST_NAME]: setLastName,
    [EMAIL]: setEmail,
    [PHONE_NUMBER]: setPhoneNumber,
    [ZIPCODE]: setZipcode,
    [SCHOOL_PREMIUM_ESTIMATE]: setSchoolPremiumEstimate,
    [TEACHER_PREMIUM_ESTIMATE]: setTeacherPremiumEstimate,
    [STUDENT_PREMIUM_ESTIMATE]: setStudentPremiumEstimate,
    [COMMENTS]: setComments,
    [SCHOOL]: setSelectedSchool,
    [DISTRICT]: setSelectedDistrict,
    [SCHOOL_OR_DISTRICT]: setSchoolOrDistrict
  }
  const schoolIsSelected = schoolOrDistrict === SCHOOL;
  const districtIsSelected = schoolOrDistrict === DISTRICT;

  function handleUpdateField(e: InputEvent | React.ChangeEvent<HTMLTextAreaElement>) {
    const { target } = e;
    const { value, id } = target;
    const setterFunction = stateSetters[id];
    if(id === SCHOOL_OR_DISTRICT) {
      setSchoolNotListed(false);
      setDistrictNotListed(false);
    }
    setterFunction(value);
  }

  function handleSchoolSearchChange(value) {
    if(value === SCHOOL_NOT_LISTED) {
      setSchoolNotListed(true);
      setSelectedSchool('');
    } else {
      setSelectedSchool(value);
    }
  };

  function handleDistrictSearchChange(value) {
    if(value === DISTRICT_NOT_LISTED) {
      setDistrictNotListed(true);
      setSelectedDistrict('');
    } else {
      setSelectedDistrict(value);
    }
  };

  function handleFormSubmission(e) {
    e.preventDefault();
    const salesFormSubmission = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phoneNumber,
      zipcode: zipcode,
      collection_type: schoolOrDistrict,
      school_name: selectedSchool,
      district_name: selectedDistrict,
      school_premium_count_estimate: schoolPremimumEstimate,
      teacher_premium_count_estimate: teacherPremimumEstimate,
      student_premium_count_estimate: studentPremimumEstimate,
      submission_type: type,
      comment: comments,
    }
    const formErrors = validateSalesForm(salesFormSubmission);
    if(Object.keys(formErrors).length) {
      setErrors(formErrors)
    } else {
      setErrors({});
      console.log('success!')
    }
  }

  return(
    <div className="sales-form-container">
      <form className="container">
        <UpperFormFields
          email={email}
          errors={errors}
          firstName={firstName}
          handleUpdateField={handleUpdateField}
          lastName={lastName}
          phoneNumber={phoneNumber}
          type={type}
          zipcode={zipcode}
        />
        <SchoolOrDistrictFields
          districtIsSelected={districtIsSelected}
          districtNotListed={districtNotListed}
          districts={districts}
          errors={errors}
          handleDistrictSearchChange={handleDistrictSearchChange}
          handleSchoolSearchChange={handleSchoolSearchChange}
          handleUpdateField={handleUpdateField}
          schoolIsSelected={schoolIsSelected}
          schoolNotListed={schoolNotListed}
          schools={schools}
          selectedDistrict={selectedDistrict}
          selectedSchool={selectedSchool}
        />
        <LowerFormFields
          comments={comments}
          errors={errors}
          handleUpdateField={handleUpdateField}
          schoolPremimumEstimate={schoolPremimumEstimate}
          studentPremimumEstimate={studentPremimumEstimate}
          teacherPremimumEstimate={teacherPremimumEstimate}
        />
        <button className="submit-button quill-button contained primary medium" onClick={handleFormSubmission}>Submit</button>
      </form>
    </div>
  )
}

export default SalesForm
