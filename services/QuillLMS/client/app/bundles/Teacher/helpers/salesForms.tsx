import * as React from 'react';
import SelectSearch from 'react-select-search';
import Fuse from 'fuse.js';

import { Input } from '../../Shared';
import { requestFailed } from "../../Staff/helpers/evidence/routingHelpers";
import { SCHOOL, DISTRICT, SCHOOL_NOT_LISTED, DISTRICT_NOT_LISTED, PROPERTIES, PROPERTY_LABELS } from '../../../constants/salesForm';

const fetchDefaults = require("fetch-defaults");
const baseUrl = process.env.DEFAULT_URL;
const headerHash = {
  headers: {
    "Accept": "application/JSON",
    "Content-Type": "application/json"
  }
};
const apiFetch = fetchDefaults(fetch, baseUrl, headerHash);

export const getSchoolsAndDistricts = async (type: string) => {
  const url = `/get_options_for_sales_form?type=${type}`;
  const response = await apiFetch(url);
  const { status } = response;

  if(requestFailed(status)) {
    return { error: 'Failed to fetch school and districts. Please refresh the page.' };
  } else {
    const schoolOrDistrictOptions = await response.json();
    const { options } = schoolOrDistrictOptions;
    return { options: options };
  }
}

export const submitSalesForm = async (salesFormSubmission: any) => {
  const url = `/submit_sales_form`;
  const response = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify({ sales_form_submission: salesFormSubmission })
  });
  const { status } = response;

  if(requestFailed(status)) {
    return { error: 'Failed to submit form. Please try again.' };
  } else {
    return { success: true };
  }
}

export function schoolSearch(options) {
  const fuse = new Fuse(options, {
      keys: ['name', 'groupName', 'items.name'],
      threshold: 0.3,
  });

  return (value) => {
    if (!value.length) {
      return options;
    }
    const results = fuse.search(value)
    if(value && !results.length) {
      return [{ name: SCHOOL_NOT_LISTED, value: SCHOOL_NOT_LISTED}];
    }
    return fuse.search(value);
  };
}

export const districtSearch = (options) => {
  const fuse = new Fuse(options, {
      keys: ['name', 'groupName', 'items.name'],
      threshold: 0.3,
  });

  return (value) => {
    if (!value.length) {
      return options;
    }
    const results = fuse.search(value)
    if(value && !results.length) {
      return [{ name: DISTRICT_NOT_LISTED, value: DISTRICT_NOT_LISTED}];
    }
    return fuse.search(value);
  };
}

export const renderSchoolAndDistrictSelect = ({
  errors,
  schoolNotListed,
  districtNotListed,
  selectedSchool,
  selectedDistrict,
  schools,
  districts,
  handleUpdateField,
  handleSchoolSearchChange,
  handleDistrictSearchChange
}) => {
  const schoolSearchInput = (
    <SelectSearch
      filterOptions={schoolSearch}
      onChange={handleSchoolSearchChange}
      options={schools}
      placeholder="Search for your school"
      search={true}
    />
  );
  const districtSearchInput = (
    <SelectSearch
      filterOptions={districtSearch}
      onChange={handleDistrictSearchChange}
      options={districts}
      placeholder="Search for your district"
      search={true}
    />
  );
  const schoolCustomInput = (
    <Input
      className="school"
      handleChange={handleUpdateField}
      id={SCHOOL}
      label={SCHOOL}
      placeholder=""
      value={selectedSchool}
    />
  );
  const districtCustomInput = (
    <Input
      className="district"
      handleChange={handleUpdateField}
      id={DISTRICT}
      label={DISTRICT}
      placeholder=""
      value={selectedDistrict}
    />
  );
  return(
    <div>
      {!schoolNotListed && schoolSearchInput}
      {!districtNotListed && districtSearchInput}
      {schoolNotListed && schoolCustomInput}
      {districtNotListed && districtCustomInput}
      {errors[SCHOOL] && <p className="error-text">{errors[SCHOOL]}</p>}
      {errors[DISTRICT] && <p className="error-text">{errors[DISTRICT]}</p>}
    </div>
  );
}

export const validateSalesForm = (submission: any) => {
  let errors = {};
  PROPERTIES.map((property, i) => {
    if(!submission[property]) {
      const inputType = PROPERTY_LABELS[i];
      errors[PROPERTY_LABELS[i]] = `${inputType} cannot be blank.`
    }
  });
  return errors;
}
