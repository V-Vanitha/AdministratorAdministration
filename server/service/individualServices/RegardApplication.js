const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
let logicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint')
const HttpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const Regardapplicationcallback = require('./regardapplicationcallback');
const Integerprofile = require('onf-core-model-ap/applicationPattern/onfModel/models/profile/IntegerProfile')
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const operationKeyUpdateNotificationService = require('onf-core-model-ap/applicationPattern/onfModel/services/OperationKeyUpdateNotificationService');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const onfAttributes= require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes')
const INQUIRE_FORWARDING_NAME = "RegardApplicationCausesSequenceForInquiringBasicAuthRequestApprovals.RequestForInquiringBasicAuthApprovals"
const StringProfile=require('onf-core-model-ap/applicationPattern/onfModel/models/profile/StringProfile')

exports.RegardapplicationUpdate = async function (applicationName, releaseNumber, reqheaders) {
    let result = {}
    let responseList;
    var traceIndicatorIncrementer = reqheaders.lengthOftheForwarding + 1;

    return new Promise(async function (resolve) {
        let time = new Date()
        operationKeyUpdateNotificationService.turnONNotificationChannel(time)
        try {
            reqheaders.traceIndicatorIncrementer = traceIndicatorIncrementer;

            let maxwaitingperiod = await Integerprofile.getIntegerValueForTheIntegerProfileNameAsync("maximumWaitTimeToReceiveOperationKey")
            const opclinetUuid = await GetOperationClient(INQUIRE_FORWARDING_NAME, applicationName, releaseNumber)
            result = await Regardapplicationcallback.CreateLinkForInquiringBasicAuthApprovals(applicationName, releaseNumber, reqheaders);
            if (result.status.toString().startsWith('2')) {
                if (result.data["client-successfully-added"] == false) {
                    result = await InquiringOamApprovals(applicationName, releaseNumber, reqheaders)
                } else {

                    let waitUntilOperationKeyIsUpdatedValue = await operationKeyUpdateNotificationService.waitUntilOperationKeyIsUpdated(opclinetUuid, time, maxwaitingperiod);
                    if (!waitUntilOperationKeyIsUpdatedValue) {
                        result["client-successfully-added"] = false
                        result["reason-of-failure"] = "MAXIMUM_WAIT_TIME_TO_RECEIVE_OPERATION_KEY_EXCEEDED"
                    } else {
                        const RequestForInquiringBasicAuthApprovalsreq = await Regardapplicationcallback.RequestForInquiringBasicAuthApprovals(applicationName, releaseNumber, reqheaders)
                        if (!RequestForInquiringBasicAuthApprovalsreq) {
                            result = await InquiringOamApprovals(applicationName, releaseNumber, reqheaders)
                        } else {
                            let attempt = 1;
                            let maximumattemp = await Integerprofile.getIntegerValueForTheIntegerProfileNameAsync("maximumNumberOfAttemptsToCreateLink")
                            let FunctionResult = async function (applicationName, releaseNumber, reqheaders) {
                                let isLinkCreatedDetails = await Regardapplicationcallback.CreateLinkForApprovingBasicAuthRequests(
                                    applicationName,
                                    releaseNumber,
                                    reqheaders)

                                if (isLinkCreatedDetails.status.toString().startsWith('2')) {
                                    if ((attempt <= maximumattemp) &&
                                        (isLinkCreatedDetails["client-successfully-added"] == false)) {
                                        attempt++
                                        await FunctionResult(applicationName, releaseNumber, reqheaders)
                                    } else if (isLinkCreatedDetails["client-successfully-added"] == false) {
                                        result = await InquiringOamApprovals(applicationName, releaseNumber, reqheaders)
                                    }
                                    else {
                                        const operationServerUuidOfApproveBasicAuthRequest = "aa-2-1-2-op-s-is-005";
                                        let waitUntilOperationKeyIsUpdatedValue = await operationKeyUpdateNotificationService.waitUntilOperationKeyIsUpdated(operationServerUuidOfApproveBasicAuthRequest, time, maxwaitingperiod);
                                        if (!waitUntilOperationKeyIsUpdatedValue) {
                                            result['client-successfully-added'] = false
                                            result["reason-of-failure"] = "MAXIMUM_WAIT_TIME_TO_RECEIVE_OPERATION_KEY_EXCEEDED"
                                        } else {
                                            result['client-successfully-added'] = true
                                        }
                                    }
                                }
                                else {
                                    result = isLinkCreatedDetails;
                                }
                                return result
                            }
                            result = await FunctionResult(applicationName, releaseNumber, reqheaders)
                        }
                    }
                }
            }
            operationKeyUpdateNotificationService.turnOFFNotificationChannel(time)
        }
        catch (error) {
            console.log(error);
            result["client-successfully-added"] = false;
            result["reason-of-failure"] = 'UNKNOWN';
        }
        responseList = await FinalResult(result)
        resolve(responseList)

    });
}

async function InquiringOamApprovals(applicationName, releaseNumber, reqheaders) {
    const CreateLinkForInquiringOamApprovalsrequest = await Regardapplicationcallback.CreateLinkForInquiringOamApprovals(applicationName, releaseNumber, reqheaders)
    if (CreateLinkForInquiringOamApprovalsrequest.status.toString().startsWith('2') && CreateLinkForInquiringOamApprovalsrequest['client-successfully-added'] == true) {
        const CreateLinkForInquiringOamApprovalsrequest = await Regardapplicationcallback.RequestForInquiringOamApprovals(applicationName, releaseNumber, reqheaders)
        let responseCode = CreateLinkForInquiringOamApprovalsrequest.status;
        if (responseCode.toString().startsWith("2")) {
            const CreateLinkForInquiringOamApprovalsrquest = await Regardapplicationcallback.CreateLinkForApprovingOamRequests(applicationName, releaseNumber, reqheaders)
            return (CreateLinkForInquiringOamApprovalsrquest)
        } else {
            return (CreateLinkForInquiringOamApprovalsrequest)
        }
    } else {
        return CreateLinkForInquiringOamApprovalsrequest
    }
}



async function FinalResult(Response) {
    let result = {};
    let responseCode = Response.status;
    if (responseCode == undefined) {
        if (Response["client-successfully-added"]) {
            result.success = Response["client-successfully-added"]
        } else {
            result.success = Response["client-successfully-added"],
            result.reasonForFailure = `AA_${Response['reason-of-failure']}`;
        }

    }
    else if (responseCode.toString().startsWith("2")) {
        let responseData = Response.data
        if (responseData['client-successfully-added'] == true) {
            result.success = true
        } else {
            result.success = false,
            result.reasonForFailure = `AA_${responseData['reason-of-failure']}`;
        }
    }
    else if (responseCode.toString() == "408") {
        let Url = Response.url.split("/")
        let operationName = Url[Url.length - 1]

        if (operationName == "add-operation-client-to-link") {
            result.success = false;
            result.reasonForFailure = "AA_DID_NOT_REACH_ALT";
        }
        else {
            result.success = false;
            result.reasonForFailure = "AA_DID_NOT_REACH_ALT";
        }

    }
    else if (responseCode.toString().startsWith("5") || responseCode.toString().startsWith("4")) {
        result.success = false,
        result.reasonForFailure = "AA_UNKNOWN";
    }
    return result;
}





async function GetOperationClient(forwardingName, applicationName, releaseNumber) {
    let forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(
        forwardingName);
    let fcPortList = forwardingConstruct["fc-port"];
    for (let fcPort of fcPortList) {
        let fcPortDirection = fcPort["port-direction"];
        if (fcPortDirection == FcPort.portDirectionEnum.OUTPUT) {
            let fcLogicalTerminationPoint = fcPort["logical-termination-point"];
            let serverLtpList = await logicalTerminationPoint.getServerLtpListAsync(fcLogicalTerminationPoint);
            let httpClientUuid = serverLtpList[0];
            let applicationNameOfClient = await HttpClientInterface.getApplicationNameAsync(httpClientUuid);
            let releaseNumberOfClient = await HttpClientInterface.getReleaseNumberAsync(httpClientUuid);
            if (applicationNameOfClient == applicationName && releaseNumberOfClient == releaseNumber) {
                return fcLogicalTerminationPoint;
            }
        }
    }
    return undefined;
}



exports.getStringValueAndPattern = async function(stringProfilename) {
    let StringValue ;
    let StringProfilePattern;
    let profileList = await ProfileCollection.getProfileListForProfileNameAsync(StringProfile.profileName);
    if (profileList === undefined) {
        return undefined;
    }
  for(let profile of profileList){
    let  StringProfilePac = profile[onfAttributes.STRING_PROFILE.PAC]
    let StringProfileCapability = StringProfilePac[onfAttributes.STRING_PROFILE.CAPABILITY]
    let StringName=StringProfileCapability[onfAttributes.STRING_PROFILE.STRING_NAME]
   StringProfilePattern=StringProfileCapability[onfAttributes.STRING_PROFILE.PATTERN]
  let StringProfileConfiguration = StringProfilePac[onfAttributes.STRING_PROFILE.CONFIGURATION]
   StringValue = StringProfileConfiguration[onfAttributes.STRING_PROFILE.STRING_VALUE]
    if(StringName == stringProfilename){
  return {
  StringValue,
  StringProfilePattern
  
  }
  }
  }
  
  }