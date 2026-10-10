import { Stack, StackProps, aws_cognito as cognito, aws_dynamodb as dynamodb, aws_s3 as s3, aws_apigateway as apigw } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare class CleanLoopStack extends Stack {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly table: dynamodb.Table;
    readonly mediaBucket: s3.Bucket;
    readonly api: apigw.RestApi;
    constructor(scope: Construct, id: string, props?: StackProps);
}
