#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CleanLoopStack } from '../lib/cleanloop-stack';

const app = new cdk.App();

new CleanLoopStack(app, 'CleanLoopStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  description: 'CleanLoop Serverless MVP Infrastructure Stack (Cognito, DynamoDB, S3, Lambdas, API Gateway)',
});

app.synth();
