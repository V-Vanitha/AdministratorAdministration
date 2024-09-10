'use strict';
const fileOperation = require('../node_modules/onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');

const stringProfile = require('./individualServices/RegardApplication')
/**
 * Returns the enumeration values of the String
 *
 * uuid String 
 * returns inline_response_200_33
 **/
exports.getStringProfileEnumeration = async function (url) {
  let value = await fileOperation.readFromDatabaseAsync(url);
  if (!value) {
    value = [];
  }
  return {
    "string-profile-1-0:enumeration": value
  };
}


/**
 * Returns the pattern of the String
 *
 * uuid String 
 * returns inline_response_200_34
 **/
exports.getStringProfilePattern = async function (url) {
  let value = await fileOperation.readFromDatabaseAsync(url);
  if (!value) {
    value = "";
  }
  return {
    "string-profile-1-0:pattern": value
  };
}



/**
 * Returns the name of the String
 *
 * uuid String 
 * returns inline_response_200_32
 **/
exports.getStringProfileStringName = async function (url) {

  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "string-profile-1-0:string-name": value
  };
}



/**
 * Returns the configured value of the String
 *
 * uuid String 
 * returns inline_response_200_35
 **/
exports.getStringProfileStringValue = async function (url) {
  const value = await fileOperation.readFromDatabaseAsync(url);
  return {
    "string-profile-1-0:string-value": value
  };

}


/**
 * Configures value of the String
 *
 * body Stringprofileconfiguration_stringvalue_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putStringProfileStringValue = async function (url, body) {
  return new Promise(async function (resolve, reject) {
    try {
      let stringValue = body["string-profile-1-0:string-value"]
      let stringProfileList = await stringProfile.getStringValueAndPattern('NameOfOperationForInquiringApprovals')
      let stringProfilePattern = stringProfileList['StringProfilePattern']
      const result = new RegExp(stringProfilePattern, 'g').test(stringValue)
      if (result) {
        await fileOperation.writeToDatabaseAsync(url, body, false);
      }
      resolve();
    } catch (error) {
      reject();
    }
  });
}

