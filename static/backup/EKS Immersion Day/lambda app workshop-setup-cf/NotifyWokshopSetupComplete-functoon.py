import logging
import sys
import json
import urllib3
import os
import boto3
import time

logger = logging.getLogger()
logger.setLevel(logging.INFO)
http = urllib3.PoolManager()
ssmClient = boto3.client('ssm')
lambdaclient = boto3.client('lambda')

def handler(event, context):
  logger.info('lamba event obj: ' + json.dumps(event))
  cfn_response_url = os.environ['CFNURL']
  command_id = os.environ['CommandId']
  instance_id = os.environ['InstanceId']
  #wait for maxiterations minutes before ending loop
  maxiterations = 5
  for iter in range(maxiterations):
    ssmresponse = ssmClient.list_command_invocations(CommandId=command_id,
                    InstanceId=instance_id,
                    MaxResults=2
                  )
    logger.info('Command Exec obj: {0}'.format(ssmresponse))    
    status = ssmresponse['CommandInvocations'][0]['Status']
    response = {}
    response['Reason'] = 'Notification  complete'
    response['UniqueId'] = 'NotificationComplete1234'    
    response['Data'] = 'Notification completed'
    logger.info('Configure CFNURL: {0}'.format(cfn_response_url))
    if status=="Success":
      response['Status'] = 'SUCCESS'
      logger.info('Command Exec return: {0}'.format(json.dumps(response,default=str)))
      http.request('PUT', cfn_response_url, body=json.dumps(response,default=str).encode('utf-8'), headers={'Content-Type': 'application/json'})
      logger.info('Send Sucess CFNURL')
      break
    elif status=="Failed" or  status=="TimedOut" or status=="Cancelled":
      response['Status'] = 'FAILURE'
      logger.info('Command Exec return: {0}'.format(json.dumps(response,default=str)))
      http.request('PUT', cfn_response_url, body=json.dumps(response,default=str).encode('utf-8'), headers={'Content-Type': 'application/json'})
      logger.info('Send Failed CFNURL')
      break
    else:
      logger.info('Sleep for minute before checking')
      time.sleep(60)
  logger.info('Iter count when exiting loop' + str(iter))
  if iter >= (maxiterations - 1):
    logger.info('Before Lambda function invocation')
    lambdaclient.invoke(
      FunctionName='NotifyWokshopSetupComplete',
      InvocationType='Event',
      Payload=bytes(json.dumps({}).encode('utf-8'))
    )
    logger.info('Inovked Lambda function')
  return 'Done'
