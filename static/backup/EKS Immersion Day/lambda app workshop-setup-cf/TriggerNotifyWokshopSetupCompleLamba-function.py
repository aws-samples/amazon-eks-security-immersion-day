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
lambdaclient = boto3.client('lambda')

def handler(event, context):
  logger.info('lamba event obj: ' + json.dumps(event))
  if event['RequestType'] != 'Delete':
    lambdaclient.invoke(
      FunctionName='NotifyWokshopSetupComplete',
      InvocationType='Event',
      Payload=bytes(json.dumps({}).encode('utf-8'))
    )
    logger.info('Inovked Lambda')
  responseBody = json.dumps({
    'Status': 'SUCCESS',
    'Reason': 'See the details in CloudWatch Log Stream: ' + context.log_stream_name,
    'PhysicalResourceId': context.log_stream_name,
    'StackId': event['StackId'],
    'RequestId': event['RequestId'],
    'LogicalResourceId': event['LogicalResourceId'],
    'Data': {}
    },default=str)
  logger.info('Completing customer resource creation: ' + responseBody)
  http.request('PUT',event['ResponseURL'],body=responseBody.encode('utf-8'),headers={'Content-Type': 'application/json', 'Content-Length': len(responseBody)})
  return "Done"
