import * as path from 'path';
import {
  Stack,
  StackProps,
  CfnOutput,
  RemovalPolicy,
  Duration,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_apigateway as apigw,
  aws_logs as logs,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CleanLoopStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly table: dynamodb.Table;
  public readonly mediaBucket: s3.Bucket;
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ==========================================
    // 1. Amazon Cognito (User Pool & Groups)
    // ==========================================
    this.userPool = new cognito.UserPool(this, 'CleanLoopUserPool', {
      userPoolName: 'cleanloop-user-pool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY, // Dev/MVP friendly
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'CleanLoopUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'cleanloop-web-client',
      generateSecret: false, // SPA Client
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
    });

    // 3 Mandatory Cognito Groups (Section 3)
    const studentGroup = new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'STUDENT',
      description: 'CleanLoop Campus Student Reporters',
    });

    const cleanupGroup = new cognito.CfnUserPoolGroup(this, 'CleanupGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'CLEANUP_TEAM',
      description: 'CleanLoop Field Operations & Sanitation Personnel',
    });

    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'ADMIN',
      description: 'CleanLoop Campus Facilities Administrators',
    });

    // ==========================================
    // 2. Amazon DynamoDB (Single-Table Design)
    // ==========================================
    this.table = new dynamodb.Table(this, 'CleanLoopTable', {
      tableName: 'CleanLoopTable',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // GSI1: Status & Chronology (Section 17 AP-03)
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Reporter / User Audit History (Section 17 AP-11)
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ==========================================
    // 3. Amazon S3 (Private Evidence Bucket)
    // ==========================================
    this.mediaBucket = new s3.Bucket(this, 'CleanLoopMediaBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // ==========================================
    // 4. AWS Lambda Functions (Serverless Compute)
    // ==========================================
    const backendCodePath = path.join(__dirname, '../../backend/dist');

    const commonEnv = {
      TABLE_NAME: this.table.tableName,
      BUCKET_NAME: this.mediaBucket.bucketName,
      USER_POOL_ID: this.userPool.userPoolId,
    };

    const makeLambda = (name: string, handlerName: string): lambda.Function => {
      const fn = new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: handlerName,
        code: lambda.Code.fromAsset(backendCodePath),
        environment: commonEnv,
        timeout: Duration.seconds(10),
        memorySize: 256,
        logRetention: logs.RetentionDays.TWO_WEEKS,
      });

      this.table.grantReadWriteData(fn);
      return fn;
    };

    const incidentsFn = makeLambda('IncidentsFunction', 'handlers/incidents.handler');
    const cleanupsFn = makeLambda('CleanupsFunction', 'handlers/cleanups.handler');
    const followupsFn = makeLambda('FollowupsFunction', 'handlers/followups.handler');
    const hotspotsFn = makeLambda('HotspotsFunction', 'handlers/hotspots.handler');
    const analyticsFn = makeLambda('AnalyticsFunction', 'handlers/analytics.handler');
    const uploadsFn = makeLambda('UploadsFunction', 'handlers/uploads.handler');

    // Grant S3 presign and access permissions
    this.mediaBucket.grantPut(uploadsFn);
    this.mediaBucket.grantRead(incidentsFn);
    this.mediaBucket.grantRead(cleanupsFn);

    // ==========================================
    // 5. Amazon API Gateway (REST API)
    // ==========================================
    this.api = new apigw.RestApi(this, 'CleanLoopApi', {
      restApiName: 'CleanLoop API',
      description: 'REST API for CleanLoop Waste Tracking & Recurrence MVP',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Cognito Authorizer for Protected Endpoints
    const auth = new apigw.CognitoUserPoolsAuthorizer(this, 'CleanLoopCognitoAuthorizer', {
      cognitoUserPools: [this.userPool],
      authorizerName: 'CleanLoopAuthorizer',
    });

    const authOptions: apigw.MethodOptions = {
      authorizer: auth,
      authorizationType: apigw.AuthorizationType.COGNITO,
    };

    // --- /incidents ---
    const incidents = this.api.root.addResource('incidents');
    incidents.addMethod('POST', new apigw.LambdaIntegration(incidentsFn), authOptions);
    incidents.addMethod('GET', new apigw.LambdaIntegration(incidentsFn));

    const incidentDetail = incidents.addResource('{id}');
    incidentDetail.addMethod('GET', new apigw.LambdaIntegration(incidentsFn));
    incidentDetail.addMethod('PUT', new apigw.LambdaIntegration(incidentsFn), authOptions);

    // --- /cleanups ---
    const cleanups = this.api.root.addResource('cleanups');
    cleanups.addMethod('POST', new apigw.LambdaIntegration(cleanupsFn), authOptions);

    const cleanupDetail = cleanups.addResource('{id}');
    cleanupDetail.addMethod('GET', new apigw.LambdaIntegration(cleanupsFn), authOptions);

    // --- /followups ---
    const followups = this.api.root.addResource('followups');
    followups.addMethod('POST', new apigw.LambdaIntegration(followupsFn), authOptions);

    const followupDetail = followups.addResource('{id}');
    followupDetail.addMethod('GET', new apigw.LambdaIntegration(followupsFn));

    // --- /hotspots ---
    const hotspots = this.api.root.addResource('hotspots');
    hotspots.addMethod('GET', new apigw.LambdaIntegration(hotspotsFn));

    const hotspotDetail = hotspots.addResource('{id}');
    hotspotDetail.addMethod('GET', new apigw.LambdaIntegration(hotspotsFn));

    const hotspotHistory = hotspotDetail.addResource('history');
    hotspotHistory.addMethod('GET', new apigw.LambdaIntegration(hotspotsFn));

    const hotspotRecurrence = hotspotDetail.addResource('recurrence');
    hotspotRecurrence.addMethod('GET', new apigw.LambdaIntegration(hotspotsFn));

    // --- /analytics/overview ---
    const analytics = this.api.root.addResource('analytics');
    const overview = analytics.addResource('overview');
    overview.addMethod('GET', new apigw.LambdaIntegration(analyticsFn));

    // --- /uploads/presign ---
    const uploads = this.api.root.addResource('uploads');
    const presign = uploads.addResource('presign');
    presign.addMethod('POST', new apigw.LambdaIntegration(uploadsFn), authOptions);

    // ==========================================
    // 6. CloudFormation Outputs
    // ==========================================
    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'CleanLoopUserPoolId',
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID',
      exportName: 'CleanLoopUserPoolClientId',
    });

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway Base Endpoint URL',
      exportName: 'CleanLoopApiGatewayUrl',
    });

    new CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB Single-Table Name',
      exportName: 'CleanLoopTableName',
    });

    new CfnOutput(this, 'BucketName', {
      value: this.mediaBucket.bucketName,
      description: 'Private S3 Media Evidence Bucket',
      exportName: 'CleanLoopBucketName',
    });
  }
}
