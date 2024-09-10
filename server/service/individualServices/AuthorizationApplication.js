/**
 * @file This module provides functionality to  check  Authorization Status 
 * @module AuthorizationApplication
 **/
const fs = require('fs');
const controlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct'); 
const onfAttributes= require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes')
const administratorList = 'administrator-credential-list';
const allowedSccess = "allowed-access";
const authorizationValue = 'auth-code';
const FileprofileOperation = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/FileProfile')
/**
 * @description This function returns the approval status for the provided application .
 * @param {String} authorization : authorization code of the user , value should be Bse64 Encoding of username and password 
 * @returns {promise} string {approvalStatus}
 **/
exports.isAuthorizationExistAsync = async function (authorization) {
    let isAuthorizationExist = false;
    let isFileExit = false;

    try {
        let applicationDataFile = await FileprofileOperation.getApplicationDataFileContent()
        if (applicationDataFile !== undefined) {
            isFileExit = true;
            let applicationData = JSON.parse(fs.readFileSync(applicationDataFile, 'utf8'));
            if (applicationData[administratorList]) {
                let registeredApplicationList = applicationData[administratorList];
                for (let i = 0; i < registeredApplicationList.length; i++) {
                    let registeredApplication = registeredApplicationList[i];
                    let _authorization = registeredApplication[authorizationValue];
                    if (_authorization == authorization) {
                        isAuthorizationExist = true;
                    }
                }
            }
        }
        return {
            isAuthorizationExist,
            isFileExit
        }
    } catch (error) {
        console.log(error);
    }
}


/**
 * @description This function returns the approval status for the provided application .
 * @param {String} authorization : authorization code of the user , value should be Bse64 Encoding of username and password 
 * @param {String} allowedMethodsValue: allowedMethodsValue allowed methods as per the allowedMethodsEnum.
 * @returns string {approvalStatus}
 **/
exports.isAuthorizedAsync = async function (applicationName, authorization, allowedMethods) {
    try {
        let applicationDataFile = await FileprofileOperation.getApplicationDataFileContent()
        if (applicationDataFile !== undefined) {
            let applicationData = JSON.parse(fs.readFileSync(applicationDataFile, 'utf8'));
            if (applicationData[administratorList]) {
                let registeredApplicationList = applicationData[administratorList];
                for (let i = 0; i < registeredApplicationList.length; i++) {
                    let registeredApplication = registeredApplicationList[i];
                    let _authorization = registeredApplication[authorizationValue];
                    if (_authorization == authorization) {
                        const auth = await isApplicationNameExistAtLoadFile(applicationName, authorization)
                        let _allowedMethodsList = auth["allowed-methods"]
                        for (let _allowedMethods of _allowedMethodsList) {
                            if ((_allowedMethods == allowedMethods || _allowedMethods == "ALL" || _allowedMethods == "*")) {
                                return true;
                            }
                        }

                    }
                }
            }
        }

    } catch (error) {
        console.log(error);
    }
    return false;
}

exports.isOpeartionisExistAsync = async function (applicationName, operationName, authorization) {
    let isoperationExit = false;

    try {
        let applicationDataFile = await FileprofileOperation.getApplicationDataFileContent()
        if (applicationDataFile !== undefined) {
            let applicationData = JSON.parse(fs.readFileSync(applicationDataFile, 'utf8'));
            if (applicationData[administratorList]) {
                let registeredApplicationList = applicationData[administratorList];
                for (let i = 0; i < registeredApplicationList.length; i++) {
                    let registeredApplication = registeredApplicationList[i];
                    let _authorization = registeredApplication[authorizationValue]
                    if (_authorization == authorization) {
                        const auth = await isApplicationNameExistAtLoadFile(applicationName, authorization)
                        let _allowedOperationList = auth["allowed-operations"]
                        for (let _allowedOperation of _allowedOperationList) {
                            let isallowedOperationNameStartswithnewtwork = _allowedOperation.match(/(network-control-domain)+/g)
                            let isOperationNameStartswithnewtwork = operationName.match(/(network-control-domain)+/g)
                            let isallowedOperationNameStartswithCore = operationName.match(/(:control-construct)+/g)
                            let isOperationNameStartswithcore = _allowedOperation.match(/(:control-construct)+/g)
                            if (isOperationNameStartswithnewtwork && isallowedOperationNameStartswithnewtwork) {
                                let stringarray = []
                                let mountname = operationName.match(/(?<=construct=)(\w)+/g);
                                if (mountname) {
                                    stringarray.push(mountname[0])
                                }
                                let regFormatchingequal = operationName.match(/(?<==)[a-zA-Z0-9\-]+/g);
                                if (regFormatchingequal) {
                                    for (let i = 0; i <= regFormatchingequal.length - 1; i++) {
                                        let values = regFormatchingequal[i].match(/[a-zA-Z0-9]+(-[a-zA-Z0-9]+)+/g);
                                        if (values) {
                                            stringarray.push(values)
                                        }
                                    }
                                }
                                stringarray.flat(stringarray.length)
                                let pathParamMatches = _allowedOperation.match(/\{(.*?)\}/g);
                                for (let i = 0; i < pathParamMatches.length; i++) {
                                    _allowedOperation = _allowedOperation.replace(pathParamMatches[i], stringarray[i])
                                }
                                let starval = _allowedOperation.match(/([*])/g);
                                if (operationName == _allowedOperation) {
                                    isoperationExit = true;
                                    break;
                                } else if (starval) {
                                    let newval = _allowedOperation.split(starval[0])
                                    let lengthofval = newval[0].length
                                    let finalstr = operationName.substring(0, lengthofval)
                                    if (finalstr == newval[0]) {
                                        isoperationExit = true;
                                        break;
                                    } else {
                                        isoperationExit = false;
                                    }
                                } else {
                                    isoperationExit = false;
                                }
                            } else if (isOperationNameStartswithcore && isallowedOperationNameStartswithCore) {
                                let uuid = []
                                let uuidList;
                                uuidList = operationName.match(/(?<=profile=)[a-zA-Z0-9\-]+/g);
                                if (!uuidList) {
                                    uuidList = operationName.match(/(?<=point=)[a-zA-Z0-9\-]+/g);
                                }
                                uuid.push(uuidList);
                                uuid.flat(1);

                                let allowedoperation = _allowedOperation.match(/(:control-construct)+/g)

                                if (allowedoperation) {
                                    let pathParamMatches = _allowedOperation.match(/\{(.*?)\}/g);
                                    if (pathParamMatches) {
                                        for (let i = 0; i < pathParamMatches.length; i++) {
                                            _allowedOperation = _allowedOperation.replace(pathParamMatches[i], uuid[i])
                                        }
                                    }
                                    console.log(typeof operationName, typeof _allowedOperation)
                                    let starval = _allowedOperation.match(/([*])/g)
                                    if (operationName == _allowedOperation) {
                                        isoperationExit = true;
                                        break;
                                    } else if (starval) {
                                        let newval = _allowedOperation.split(starval[0])
                                        let lengthofval = newval[0].length
                                        let finalstr = operationName.substring(0, lengthofval)
                                        if (finalstr == newval[0]) {
                                            isoperationExit = true;
                                            break

                                        } else {
                                            isoperationExit = false;

                                        }

                                    } else {
                                        isoperationExit = false;
                                    }

                                }

                            } else {

                                let starval = _allowedOperation.match(/([*])/g)
                                if (operationName == _allowedOperation) {
                                    isoperationExit = true;
                                    break;
                                } else if (starval) {
                                    let newval = _allowedOperation.split(starval[0])
                                    let lengthofval = newval[0].length
                                    let finalstr = operationName.substring(0, lengthofval)
                                    if (finalstr == newval[0]) {
                                        isoperationExit = true;
                                        break;
                                    } else {
                                        isoperationExit = false;

                                    }

                                }
                            }


                        }
                    }


                }
            }
        }
        return isoperationExit;
    } catch (error) {
        console.log(error);
    }
}

exports.IsApplicationExists = async function (applicationName, releaseNumber,authorization) {
    let isApplicationNameExist = false
    let  isReleaseNumberExist = false

    try {
        let applicationDataFile = await FileprofileOperation.getApplicationDataFileContent()
        if (applicationDataFile !== undefined) {
            let applicationData = JSON.parse(fs.readFileSync(applicationDataFile, 'utf8'));
            const isApplicationExistsInTheConfigFile= await getApplicationandReleaseNumberAtConfigFile(applicationName,releaseNumber)
            if (applicationData[administratorList]) {
                let registeredApplicationList = applicationData[administratorList];
                for (let i = 0; i < registeredApplicationList.length; i++) {
                    let registeredApplication = registeredApplicationList[i];
                    let _authorization = registeredApplication[authorizationValue]
                    let allowAcees = registeredApplication[allowedSccess]
                    for (let ApplicationNameandreleaseList of allowAcees) {
                        let _applicationName = ApplicationNameandreleaseList["application-name"]
                        if (_authorization == authorization && (_applicationName == applicationName || _applicationName == "*") && isApplicationExistsInTheConfigFile.isApplicationNameExist == true) {
                            isApplicationNameExist = true
                            if (isApplicationExistsInTheConfigFile.isReleaseNumberExist) {
                                isReleaseNumberExist = true

                            }
                        }
                    }
                }
            }
        }
        return {
            isApplicationNameExist,
            isReleaseNumberExist
        }
    } catch (err) {
        console.log(err);
    }
}

async function isApplicationNameExistAtLoadFile(applicationName, authorization) {
    let isApplicationNameExist = {};
    try {
        let applicationDataFile = await FileprofileOperation.getApplicationDataFileContent();
        if (applicationDataFile !== undefined) {
            let applicationData = JSON.parse(fs.readFileSync(applicationDataFile, 'utf8'));
            if (applicationData[administratorList]) {
                let registeredApplicationList = applicationData[administratorList];
                for (let i = 0; i < registeredApplicationList.length; i++) {
                    let registeredApplication = registeredApplicationList[i];
                    let _authorization = registeredApplication[authorizationValue]
                    let  allowAccess = registeredApplication[allowedSccess]
                    for (let ApplicationNameandreleaseList of  allowAccess) {
                        let _applicationName = ApplicationNameandreleaseList["application-name"]
                        if (_authorization == authorization && (_applicationName == applicationName || _applicationName == "*" || _applicationName == "ALL") ) {
                            isApplicationNameExist = ApplicationNameandreleaseList;
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }    
    return isApplicationNameExist;
}


async function  getApplicationandReleaseNumberAtConfigFile(applicationName, releaseNumber) {
    try{
    let isApplicationNameExist = false
    let isReleaseNumberExist = false
    let logicalTerminationPointList = await controlConstruct.getLogicalTerminationPointListAsync(
        layerProtocol.layerProtocolNameEnum.HTTP_CLIENT);
    if (logicalTerminationPointList != undefined) {
        for (let i = 0; i < logicalTerminationPointList.length; i++) {
            let logicalTerminationPoint = logicalTerminationPointList[i];
            let layerProtocol = logicalTerminationPoint[
                onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL][0];
            let httpClientPac = layerProtocol[
                onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
            if (httpClientPac != undefined) {
                let httpClientConfiguration = httpClientPac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
                let _applicationName = httpClientConfiguration[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
                let _releaseNumber = httpClientConfiguration[onfAttributes.HTTP_CLIENT.RELEASE_NUMBER];
                if (_applicationName != undefined && _applicationName == applicationName) {
                     isApplicationNameExist = true
                    if (_releaseNumber != undefined &&
                        (releaseNumber == undefined || _releaseNumber == releaseNumber)) {
                            isReleaseNumberExist=true
                    }
                }
            }
        }
    }
    return {
        isApplicationNameExist,
        isReleaseNumberExist
    }
}
catch(err){
    console.log(err);
}
}