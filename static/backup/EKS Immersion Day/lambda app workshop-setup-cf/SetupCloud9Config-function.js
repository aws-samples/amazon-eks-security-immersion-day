var AWS = require('aws-sdk');
var ssm = new AWS.SSM();
var ec2 = new AWS.EC2();
exports.handler =  function(event, context, callback) {
  if (event.RequestType == "Delete") {
    sendResponse(event, context, "SUCCESS");
    return;
   }
  var params = {
    Filters: [
      {
        Name: 'tag:platform:type',
        Values: [
          "Cloud9"
        ]
      },
      {
        Name: 'instance-state-name',
        Values: ['running']
      }
    ]
  };
  ec2.describeInstances(params,function(err, data) {
    if (err) {
      console.log(err, err.stack);
    }
    else {
      runCommand(event, context,data);
    }
  });
};
function runCommand(event, context,data) {
  try {
        var instanceId = data.Reservations[0].Instances[0].InstanceId;
        var assocInstanceProfile = data.Reservations[0].Instances[0].IamInstanceProfile;
        console.log("Instances Identified " + instanceId);
        associateIamInstanceProfile(event, context,assocInstanceProfile,instanceId);
      }catch (Error) {
         console.log("Error while executing workshop setuo " + Error);
         setTimeout(function() {sendResponse(event, context, "FAILED");},process.env.Timeout2);
      }
}
function waitTillIAMProfileAssociate(event, context,iamInstanceProfileId,instanceId,timeout,maxretries) {
  if(maxretries > 0) {
      var params = {
         AssociationIds: [iamInstanceProfileId]
      };
      ec2.describeIamInstanceProfileAssociations(params, function(err, data) {
        if (err) {
            setTimeout(function() { waitTillIAMProfileAssociate(event, context,iamInstanceProfileId,instanceId,timeout,--maxretries); },timeout);
        } else {
            console.log("Instance Profile State " + data.IamInstanceProfileAssociations[0].State);
            if(data.IamInstanceProfileAssociations[0].State !== "associated") {
              setTimeout(function() { waitTillIAMProfileAssociate(event, context,iamInstanceProfileId,instanceId,timeout,--maxretries); },timeout);
            } else {
              console.log("Instance Profile successfully associated");
              rebootInstances(event, context,instanceId);
              //return resolve("Instance Profile successfully associated");
            }
        }
      });
    } else {
      console.log("Maximum retries exceeded for assocInstanceProfile API call");
      throw new Error("Maximum retries exceeded for assocInstanceProfile API call");
    } 
}
function associateIamInstanceProfile(event, context,assocInstanceProfile,instanceId) {
    console.log("Info : Calling associateIamInstanceProfile with " + assocInstanceProfile, + ", " + instanceId);
    if(!assocInstanceProfile) {
        var params = {
          IamInstanceProfile: {
            Name: 'AllowAllAccessToCloud9EC2'
          },
          InstanceId: instanceId
        };
        ec2.associateIamInstanceProfile(params, function(err, data) {
          if (err) {
            console.log(err, err.stack);
            //reject(new Error("Unable to associated instance profile to the instance"));
            throw new Error("Unable to associated instance profile to the instance");
          }
          else {
            console.log("Started associating iam instance profile");
            waitTillIAMProfileAssociate(event, context,data.AssociationId,instanceId,process.env.Timeout1,12);
          }
        });
      } else {
        waitTillSSMDocActive(event, context,process.env.Timeout2,10,instanceId);
      }
  }
  function rebootInstances(event, context,instanceId) {
    console.log("Info : Calling rebootInstances with " + instanceId);
      var params = { InstanceIds: [ instanceId ] };
      ec2.rebootInstances(params, function(err, data) {
        if (err) {
          console.log(err, err.stack);
          throw new Error("Rebooting instance failed");
        }
        else {
          console.log("Issued reboot instance api call...");
          ec2.waitFor('instanceStatusOk', params, function(err, data) {
            if (err) {
              console.log(err,err.stack); 
              throw new Error("Instance reboot failure, instance status not ok");
            } else {
              console.log(data);
              //resolve("Successfully rebooted the intances")
              waitTillSSMDocActive(event, context,process.env.Timeout2,10,instanceId);
            }
          });
        }
      });
  }
  function waitTillSSMDocActive(event, context,timeout,maxretries,instanceId) {
    console.log("Info : Calling waitTillSSMDocActive with " + instanceId + ", maxretries");
      if(maxretries > 0) {
        var params = {
          Name: 'workshop-tools',
          DocumentFormat: 'JSON'
        };
        ssm.getDocument(params, function(err, data) {
          if(err) {
            console.log(err,err.stack);
            setTimeout(function() { waitTillSSMDocActive(event, context,timeout,--maxretries,instanceId); },timeout);
          } else {
            console.log("Info getDocument " + JSON.stringify(data));
            if(data.Status !== 'Active') {
              setTimeout(function() { waitTillSSMDocActive(event, context,timeout,--maxretries,instanceId); },timeout);
            } else {
              console.log("SSM Document status active, ready to run commands");
              execInstallScripts(event, context,instanceId,5);
            }
          }
        });
      } else {
        console.log("Maximum retries exceeded for getDocument API call");
        throw(new Error("Maximum retries exceeded for getDocument API call"));
      }
  }
  function execInstallScripts(event, context,instanceId, maxretries) {
    console.log("Info : Calling execInstallScripts with " + instanceId + "," + maxretries);
    if(maxretries > 0) {
      var params = {
        DocumentName: 'AWS-ConfigureAWSPackage',
        DocumentVersion: '1',
        CloudWatchOutputConfig: {
            CloudWatchOutputEnabled: true
        },
        Parameters: {
          action: ['Install'],
          installationType:["Uninstall and reinstall"],
          name: ["workshop-tools"],
          version:[""]
        },
        InstanceIds: [instanceId],
        TimeoutSeconds: 60
      };
      
      ssm.sendCommand(params,function(err, data) {
        if (err) {
          console.log(err, err.stack);
          setTimeout(function() { execInstallScripts(event, context,instanceId,--maxretries);}, process.env.Timeout2);
        } else {
          console.log("Successfully executed the install scripts " + JSON.stringify(data));
          setTimeout(function() {
            var responseData = {
              'CommandId': data.Command.CommandId,
              'InstanceId': instanceId
            };
            sendResponse(event, context, "SUCCESS",responseData);
          },10);
        }
      });
    } else {
      console.log("Maximum retries exceeded for sendCommand API call");
      throw new Error("Maximum retries exceeded for sendCommand API call");
    }
  }
  // Send response to the pre-signed S3 URL 
  function sendResponse(event, context, responseStatus) {
    var responseData = {};
    sendResponse(event, context, responseStatus,responseData);
  }
  // Send response to the pre-signed S3 URL 
  function sendResponse(event, context, responseStatus,responseData) {
      var responseBody = JSON.stringify({
          Status: responseStatus,
          Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
          PhysicalResourceId: context.logStreamName,
          StackId: event.StackId,
          RequestId: event.RequestId,
          LogicalResourceId: event.LogicalResourceId,
          Data: responseData
      });
   
      console.log("RESPONSE BODY:\n", responseBody);
   
      var https = require("https");
      var url = require("url");
   
      var parsedUrl = url.parse(event.ResponseURL);
      var options = {
          hostname: parsedUrl.hostname,
          port: 443,
          path: parsedUrl.path,
          method: "PUT",
          headers: {
              "content-type": "",
              "content-length": responseBody.length
          }
      };
   
      console.log("SENDING RESPONSE...\n");
   
      var request = https.request(options, function(response) {
          console.log("STATUS: " + response.statusCode);
          console.log("HEADERS: " + JSON.stringify(response.headers));
          // Tell AWS Lambda that the function execution is done  
          context.done();
      });
   
      request.on("error", function(error) {
          console.log("sendResponse Error:" + error);
          // Tell AWS Lambda that the function execution is done  
          context.done();
      });
    
      // write data to request body
      request.write(responseBody);
      request.end();
  }
