"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanLoopStack = void 0;
const path = require("path");
const aws_cdk_lib_1 = require("aws-cdk-lib");
class CleanLoopStack extends aws_cdk_lib_1.Stack {
    userPool;
    userPoolClient;
    table;
    mediaBucket;
    api;
    constructor(scope, id, props) {
        super(scope, id, props);
        // ==========================================
        // 1. Amazon Cognito (User Pool & Groups)
        // ==========================================
        this.userPool = new aws_cdk_lib_1.aws_cognito.UserPool(this, 'CleanLoopUserPool', {
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
            accountRecovery: aws_cdk_lib_1.aws_cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // Dev/MVP friendly
        });
        this.userPoolClient = new aws_cdk_lib_1.aws_cognito.UserPoolClient(this, 'CleanLoopUserPoolClient', {
            userPool: this.userPool,
            userPoolClientName: 'cleanloop-web-client',
            generateSecret: false, // SPA Client
            authFlows: {
                userSrp: true,
                userPassword: true,
            },
        });
        // 3 Mandatory Cognito Groups (Section 3)
        const studentGroup = new aws_cdk_lib_1.aws_cognito.CfnUserPoolGroup(this, 'StudentGroup', {
            userPoolId: this.userPool.userPoolId,
            groupName: 'STUDENT',
            description: 'CleanLoop Campus Student Reporters',
        });
        const cleanupGroup = new aws_cdk_lib_1.aws_cognito.CfnUserPoolGroup(this, 'CleanupGroup', {
            userPoolId: this.userPool.userPoolId,
            groupName: 'CLEANUP_TEAM',
            description: 'CleanLoop Field Operations & Sanitation Personnel',
        });
        const adminGroup = new aws_cdk_lib_1.aws_cognito.CfnUserPoolGroup(this, 'AdminGroup', {
            userPoolId: this.userPool.userPoolId,
            groupName: 'ADMIN',
            description: 'CleanLoop Campus Facilities Administrators',
        });
        // ==========================================
        // 2. Amazon DynamoDB (Single-Table Design)
        // ==========================================
        this.table = new aws_cdk_lib_1.aws_dynamodb.Table(this, 'CleanLoopTable', {
            tableName: 'CleanLoopTable',
            partitionKey: { name: 'PK', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            billingMode: aws_cdk_lib_1.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
            },
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        });
        // GSI1: Status & Chronology (Section 17 AP-03)
        this.table.addGlobalSecondaryIndex({
            indexName: 'GSI1',
            partitionKey: { name: 'GSI1PK', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            projectionType: aws_cdk_lib_1.aws_dynamodb.ProjectionType.ALL,
        });
        // GSI2: Reporter / User Audit History (Section 17 AP-11)
        this.table.addGlobalSecondaryIndex({
            indexName: 'GSI2',
            partitionKey: { name: 'GSI2PK', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI2SK', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            projectionType: aws_cdk_lib_1.aws_dynamodb.ProjectionType.ALL,
        });
        // ==========================================
        // 3. Amazon S3 (Private Evidence Bucket)
        // ==========================================
        this.mediaBucket = new aws_cdk_lib_1.aws_s3.Bucket(this, 'CleanLoopMediaBucket', {
            blockPublicAccess: aws_cdk_lib_1.aws_s3.BlockPublicAccess.BLOCK_ALL,
            encryption: aws_cdk_lib_1.aws_s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [
                {
                    allowedOrigins: ['*'],
                    allowedMethods: [
                        aws_cdk_lib_1.aws_s3.HttpMethods.GET,
                        aws_cdk_lib_1.aws_s3.HttpMethods.PUT,
                        aws_cdk_lib_1.aws_s3.HttpMethods.HEAD,
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
        const makeLambda = (name, handlerName) => {
            const fn = new aws_cdk_lib_1.aws_lambda.Function(this, name, {
                runtime: aws_cdk_lib_1.aws_lambda.Runtime.NODEJS_20_X,
                handler: handlerName,
                code: aws_cdk_lib_1.aws_lambda.Code.fromAsset(backendCodePath),
                environment: commonEnv,
                timeout: aws_cdk_lib_1.Duration.seconds(10),
                memorySize: 256,
                logRetention: aws_cdk_lib_1.aws_logs.RetentionDays.TWO_WEEKS,
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
        this.api = new aws_cdk_lib_1.aws_apigateway.RestApi(this, 'CleanLoopApi', {
            restApiName: 'CleanLoop API',
            description: 'REST API for CleanLoop Waste Tracking & Recurrence MVP',
            deployOptions: {
                stageName: 'prod',
                loggingLevel: aws_cdk_lib_1.aws_apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: false,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: aws_cdk_lib_1.aws_apigateway.Cors.ALL_ORIGINS,
                allowMethods: aws_cdk_lib_1.aws_apigateway.Cors.ALL_METHODS,
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
        const auth = new aws_cdk_lib_1.aws_apigateway.CognitoUserPoolsAuthorizer(this, 'CleanLoopCognitoAuthorizer', {
            cognitoUserPools: [this.userPool],
            authorizerName: 'CleanLoopAuthorizer',
        });
        const authOptions = {
            authorizer: auth,
            authorizationType: aws_cdk_lib_1.aws_apigateway.AuthorizationType.COGNITO,
        };
        // --- /incidents ---
        const incidents = this.api.root.addResource('incidents');
        incidents.addMethod('POST', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(incidentsFn), authOptions);
        incidents.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(incidentsFn));
        const incidentDetail = incidents.addResource('{id}');
        incidentDetail.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(incidentsFn));
        incidentDetail.addMethod('PUT', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(incidentsFn), authOptions);
        // --- /cleanups ---
        const cleanups = this.api.root.addResource('cleanups');
        cleanups.addMethod('POST', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(cleanupsFn), authOptions);
        const cleanupDetail = cleanups.addResource('{id}');
        cleanupDetail.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(cleanupsFn), authOptions);
        // --- /followups ---
        const followups = this.api.root.addResource('followups');
        followups.addMethod('POST', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(followupsFn), authOptions);
        const followupDetail = followups.addResource('{id}');
        followupDetail.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(followupsFn));
        // --- /hotspots ---
        const hotspots = this.api.root.addResource('hotspots');
        hotspots.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(hotspotsFn));
        const hotspotDetail = hotspots.addResource('{id}');
        hotspotDetail.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(hotspotsFn));
        const hotspotHistory = hotspotDetail.addResource('history');
        hotspotHistory.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(hotspotsFn));
        const hotspotRecurrence = hotspotDetail.addResource('recurrence');
        hotspotRecurrence.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(hotspotsFn));
        // --- /analytics/overview ---
        const analytics = this.api.root.addResource('analytics');
        const overview = analytics.addResource('overview');
        overview.addMethod('GET', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(analyticsFn));
        // --- /uploads/presign ---
        const uploads = this.api.root.addResource('uploads');
        const presign = uploads.addResource('presign');
        presign.addMethod('POST', new aws_cdk_lib_1.aws_apigateway.LambdaIntegration(uploadsFn), authOptions);
        // ==========================================
        // 6. CloudFormation Outputs
        // ==========================================
        new aws_cdk_lib_1.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: 'CleanLoopUserPoolId',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            description: 'Cognito App Client ID',
            exportName: 'CleanLoopUserPoolClientId',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'ApiGatewayUrl', {
            value: this.api.url,
            description: 'API Gateway Base Endpoint URL',
            exportName: 'CleanLoopApiGatewayUrl',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'TableName', {
            value: this.table.tableName,
            description: 'DynamoDB Single-Table Name',
            exportName: 'CleanLoopTableName',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'BucketName', {
            value: this.mediaBucket.bucketName,
            description: 'Private S3 Media Evidence Bucket',
            exportName: 'CleanLoopBucketName',
        });
    }
}
exports.CleanLoopStack = CleanLoopStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xlYW5sb29wLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xlYW5sb29wLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE2QjtBQUM3Qiw2Q0FZcUI7QUFHckIsTUFBYSxjQUFlLFNBQVEsbUJBQUs7SUFDdkIsUUFBUSxDQUFtQjtJQUMzQixjQUFjLENBQXlCO0lBQ3ZDLEtBQUssQ0FBaUI7SUFDdEIsV0FBVyxDQUFZO0lBQ3ZCLEdBQUcsQ0FBZ0I7SUFFbkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qiw2Q0FBNkM7UUFDN0MseUNBQXlDO1FBQ3pDLDZDQUE2QztRQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUkseUJBQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzlELFlBQVksRUFBRSxxQkFBcUI7WUFDbkMsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO1lBQzlCLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7WUFDM0IsY0FBYyxFQUFFO2dCQUNkLFNBQVMsRUFBRSxDQUFDO2dCQUNaLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixjQUFjLEVBQUUsSUFBSTthQUNyQjtZQUNELGVBQWUsRUFBRSx5QkFBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVO1lBQ25ELGFBQWEsRUFBRSwyQkFBYSxDQUFDLE9BQU8sRUFBRSxtQkFBbUI7U0FDMUQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLHlCQUFPLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUNoRixRQUFR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U0FDbEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdlFELHdDQXVRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge1xuICBTdGFjayxcbiAgU3RhY2tQcm9wcyxcbiAgQ2ZuT3V0cHV0LFxuICBSZW1vdmFsUG9saWN5LFxuICBEdXJhdGlvbixcbiAgYXdzX2NvZ25pdG8gYXMgY29nbml0byxcbiAgYXdzX2R5bmFtb2RiIGFzIGR5bmFtb2RiLFxuICBhd3NfczMgYXMgczMsXG4gIGF3c19sYW1iZGEgYXMgbGFtYmRhLFxuICBhd3NfYXBpZ2F0ZXdheSBhcyBhcGlndyxcbiAgYXdzX2xvZ3MgYXMgbG9ncyxcbn0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBjbGFzcyBDbGVhbkxvb3BTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2xDbGllbnQ6IGNvZ25pdG8uVXNlclBvb2xDbGllbnQ7XG4gIHB1YmxpYyByZWFkb25seSB0YWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBtZWRpYUJ1Y2tldDogczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlndy5SZXN0QXBpO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gMS4gQW1hem9uIENvZ25pdG8gKFVzZXIgUG9vbCAmIEdyb3VwcylcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB0aGlzLnVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ0NsZWFuTG9vcFVzZXJQb29sJywge1xuICAgICAgdXNlclBvb2xOYW1lOiAnY2xlYW5sb29wLXVzZXItcG9vbCcsXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHsgZW1haWw6IHRydWUgfSxcbiAgICAgIGF1dG9WZXJpZnk6IHsgZW1haWw6IHRydWUgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IHRydWUsXG4gICAgICB9LFxuICAgICAgYWNjb3VudFJlY292ZXJ5OiBjb2duaXRvLkFjY291bnRSZWNvdmVyeS5FTUFJTF9PTkxZLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBEZXYvTVZQIGZyaWVuZGx5XG4gICAgfSk7XG5cbiAgICB0aGlzLnVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ0NsZWFuTG9vcFVzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHRoaXMudXNlclBvb2wsXG4gICAgICB1c2VyUG9vbENsaWVudE5hbWU6ICdjbGVhbmxvb3Atd2ViLWNsaWVudCcsXG4gICAgICBnZW5lcmF0ZVNlY3JldDogZmFsc2UsIC8vIFNQQSBDbGllbnRcbiAgICAgIGF1dGhGbG93czoge1xuICAgICAgICB1c2VyU3JwOiB0cnVlLFxuICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gMyBNYW5kYXRvcnkgQ29nbml0byBHcm91cHMgKFNlY3Rpb24gMylcbiAgICBjb25zdCBzdHVkZW50R3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsICdTdHVkZW50R3JvdXAnLCB7XG4gICAgICB1c2VyUG9vbElkOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBncm91cE5hbWU6ICdTVFVERU5UJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xlYW5Mb29wIENhbXB1cyBTdHVkZW50IFJlcG9ydGVycycsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbGVhbnVwR3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsICdDbGVhbnVwR3JvdXAnLCB7XG4gICAgICB1c2VyUG9vbElkOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBncm91cE5hbWU6ICdDTEVBTlVQX1RFQU0nLFxuICAgICAgZGVzY3JpcHRpb246ICdDbGVhbkxvb3AgRmllbGQgT3BlcmF0aW9ucyAmIFNhbml0YXRpb24gUGVyc29ubmVsJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFkbWluR3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsICdBZG1pbkdyb3VwJywge1xuICAgICAgdXNlclBvb2xJZDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZ3JvdXBOYW1lOiAnQURNSU4nLFxuICAgICAgZGVzY3JpcHRpb246ICdDbGVhbkxvb3AgQ2FtcHVzIEZhY2lsaXRpZXMgQWRtaW5pc3RyYXRvcnMnLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gMi4gQW1hem9uIER5bmFtb0RCIChTaW5nbGUtVGFibGUgRGVzaWduKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHRoaXMudGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0NsZWFuTG9vcFRhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAnQ2xlYW5Mb29wVGFibGUnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeVNwZWNpZmljYXRpb246IHtcbiAgICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeUVuYWJsZWQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gR1NJMTogU3RhdHVzICYgQ2hyb25vbG9neSAoU2VjdGlvbiAxNyBBUC0wMylcbiAgICB0aGlzLnRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ0dTSTEnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kxUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMVNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBHU0kyOiBSZXBvcnRlciAvIFVzZXIgQXVkaXQgSGlzdG9yeSAoU2VjdGlvbiAxNyBBUC0xMSlcbiAgICB0aGlzLnRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ0dTSTInLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kyUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMlNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyAzLiBBbWF6b24gUzMgKFByaXZhdGUgRXZpZGVuY2UgQnVja2V0KVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHRoaXMubWVkaWFCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdDbGVhbkxvb3BNZWRpYUJ1Y2tldCcsIHtcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICBjb3JzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLkdFVCxcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLlBVVCxcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLkhFQUQsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICAgICAgbWF4QWdlOiAzNjAwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIDQuIEFXUyBMYW1iZGEgRnVuY3Rpb25zIChTZXJ2ZXJsZXNzIENvbXB1dGUpXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgYmFja2VuZENvZGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2JhY2tlbmQvZGlzdCcpO1xuXG4gICAgY29uc3QgY29tbW9uRW52ID0ge1xuICAgICAgVEFCTEVfTkFNRTogdGhpcy50YWJsZS50YWJsZU5hbWUsXG4gICAgICBCVUNLRVRfTkFNRTogdGhpcy5tZWRpYUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgVVNFUl9QT09MX0lEOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgfTtcblxuICAgIGNvbnN0IG1ha2VMYW1iZGEgPSAobmFtZTogc3RyaW5nLCBoYW5kbGVyTmFtZTogc3RyaW5nKTogbGFtYmRhLkZ1bmN0aW9uID0+IHtcbiAgICAgIGNvbnN0IGZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBuYW1lLCB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICBoYW5kbGVyOiBoYW5kbGVyTmFtZSxcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGJhY2tlbmRDb2RlUGF0aCksXG4gICAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnYsXG4gICAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLlRXT19XRUVLUyxcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShmbik7XG4gICAgICByZXR1cm4gZm47XG4gICAgfTtcblxuICAgIGNvbnN0IGluY2lkZW50c0ZuID0gbWFrZUxhbWJkYSgnSW5jaWRlbnRzRnVuY3Rpb24nLCAnaGFuZGxlcnMvaW5jaWRlbnRzLmhhbmRsZXInKTtcbiAgICBjb25zdCBjbGVhbnVwc0ZuID0gbWFrZUxhbWJkYSgnQ2xlYW51cHNGdW5jdGlvbicsICdoYW5kbGVycy9jbGVhbnVwcy5oYW5kbGVyJyk7XG4gICAgY29uc3QgZm9sbG93dXBzRm4gPSBtYWtlTGFtYmRhKCdGb2xsb3d1cHNGdW5jdGlvbicsICdoYW5kbGVycy9mb2xsb3d1cHMuaGFuZGxlcicpO1xuICAgIGNvbnN0IGhvdHNwb3RzRm4gPSBtYWtlTGFtYmRhKCdIb3RzcG90c0Z1bmN0aW9uJywgJ2hhbmRsZXJzL2hvdHNwb3RzLmhhbmRsZXInKTtcbiAgICBjb25zdCBhbmFseXRpY3NGbiA9IG1ha2VMYW1iZGEoJ0FuYWx5dGljc0Z1bmN0aW9uJywgJ2hhbmRsZXJzL2FuYWx5dGljcy5oYW5kbGVyJyk7XG4gICAgY29uc3QgdXBsb2Fkc0ZuID0gbWFrZUxhbWJkYSgnVXBsb2Fkc0Z1bmN0aW9uJywgJ2hhbmRsZXJzL3VwbG9hZHMuaGFuZGxlcicpO1xuXG4gICAgLy8gR3JhbnQgUzMgcHJlc2lnbiBhbmQgYWNjZXNzIHBlcm1pc3Npb25zXG4gICAgdGhpcy5tZWRpYUJ1Y2tldC5ncmFudFB1dCh1cGxvYWRzRm4pO1xuICAgIHRoaXMubWVkaWFCdWNrZXQuZ3JhbnRSZWFkKGluY2lkZW50c0ZuKTtcbiAgICB0aGlzLm1lZGlhQnVja2V0LmdyYW50UmVhZChjbGVhbnVwc0ZuKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIDUuIEFtYXpvbiBBUEkgR2F0ZXdheSAoUkVTVCBBUEkpXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgdGhpcy5hcGkgPSBuZXcgYXBpZ3cuUmVzdEFwaSh0aGlzLCAnQ2xlYW5Mb29wQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdDbGVhbkxvb3AgQVBJJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUkVTVCBBUEkgZm9yIENsZWFuTG9vcCBXYXN0ZSBUcmFja2luZyAmIFJlY3VycmVuY2UgTVZQJyxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiAncHJvZCcsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ3cuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWd3LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ3cuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZScsXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnWC1BcGktS2V5JyxcbiAgICAgICAgICAnWC1BbXotU2VjdXJpdHktVG9rZW4nLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENvZ25pdG8gQXV0aG9yaXplciBmb3IgUHJvdGVjdGVkIEVuZHBvaW50c1xuICAgIGNvbnN0IGF1dGggPSBuZXcgYXBpZ3cuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0NsZWFuTG9vcENvZ25pdG9BdXRob3JpemVyJywge1xuICAgICAgY29nbml0b1VzZXJQb29sczogW3RoaXMudXNlclBvb2xdLFxuICAgICAgYXV0aG9yaXplck5hbWU6ICdDbGVhbkxvb3BBdXRob3JpemVyJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGF1dGhPcHRpb25zOiBhcGlndy5NZXRob2RPcHRpb25zID0ge1xuICAgICAgYXV0aG9yaXplcjogYXV0aCxcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlndy5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgIH07XG5cbiAgICAvLyAtLS0gL2luY2lkZW50cyAtLS1cbiAgICBjb25zdCBpbmNpZGVudHMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdpbmNpZGVudHMnKTtcbiAgICBpbmNpZGVudHMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGluY2lkZW50c0ZuKSwgYXV0aE9wdGlvbnMpO1xuICAgIGluY2lkZW50cy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihpbmNpZGVudHNGbikpO1xuXG4gICAgY29uc3QgaW5jaWRlbnREZXRhaWwgPSBpbmNpZGVudHMuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBpbmNpZGVudERldGFpbC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihpbmNpZGVudHNGbikpO1xuICAgIGluY2lkZW50RGV0YWlsLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGluY2lkZW50c0ZuKSwgYXV0aE9wdGlvbnMpO1xuXG4gICAgLy8gLS0tIC9jbGVhbnVwcyAtLS1cbiAgICBjb25zdCBjbGVhbnVwcyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2NsZWFudXBzJyk7XG4gICAgY2xlYW51cHMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGNsZWFudXBzRm4pLCBhdXRoT3B0aW9ucyk7XG5cbiAgICBjb25zdCBjbGVhbnVwRGV0YWlsID0gY2xlYW51cHMuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBjbGVhbnVwRGV0YWlsLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGNsZWFudXBzRm4pLCBhdXRoT3B0aW9ucyk7XG5cbiAgICAvLyAtLS0gL2ZvbGxvd3VwcyAtLS1cbiAgICBjb25zdCBmb2xsb3d1cHMgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdmb2xsb3d1cHMnKTtcbiAgICBmb2xsb3d1cHMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGZvbGxvd3Vwc0ZuKSwgYXV0aE9wdGlvbnMpO1xuXG4gICAgY29uc3QgZm9sbG93dXBEZXRhaWwgPSBmb2xsb3d1cHMuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBmb2xsb3d1cERldGFpbC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihmb2xsb3d1cHNGbikpO1xuXG4gICAgLy8gLS0tIC9ob3RzcG90cyAtLS1cbiAgICBjb25zdCBob3RzcG90cyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2hvdHNwb3RzJyk7XG4gICAgaG90c3BvdHMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24oaG90c3BvdHNGbikpO1xuXG4gICAgY29uc3QgaG90c3BvdERldGFpbCA9IGhvdHNwb3RzLmFkZFJlc291cmNlKCd7aWR9Jyk7XG4gICAgaG90c3BvdERldGFpbC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihob3RzcG90c0ZuKSk7XG5cbiAgICBjb25zdCBob3RzcG90SGlzdG9yeSA9IGhvdHNwb3REZXRhaWwuYWRkUmVzb3VyY2UoJ2hpc3RvcnknKTtcbiAgICBob3RzcG90SGlzdG9yeS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihob3RzcG90c0ZuKSk7XG5cbiAgICBjb25zdCBob3RzcG90UmVjdXJyZW5jZSA9IGhvdHNwb3REZXRhaWwuYWRkUmVzb3VyY2UoJ3JlY3VycmVuY2UnKTtcbiAgICBob3RzcG90UmVjdXJyZW5jZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihob3RzcG90c0ZuKSk7XG5cbiAgICAvLyAtLS0gL2FuYWx5dGljcy9vdmVydmlldyAtLS1cbiAgICBjb25zdCBhbmFseXRpY3MgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdhbmFseXRpY3MnKTtcbiAgICBjb25zdCBvdmVydmlldyA9IGFuYWx5dGljcy5hZGRSZXNvdXJjZSgnb3ZlcnZpZXcnKTtcbiAgICBvdmVydmlldy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihhbmFseXRpY3NGbikpO1xuXG4gICAgLy8gLS0tIC91cGxvYWRzL3ByZXNpZ24gLS0tXG4gICAgY29uc3QgdXBsb2FkcyA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3VwbG9hZHMnKTtcbiAgICBjb25zdCBwcmVzaWduID0gdXBsb2Fkcy5hZGRSZXNvdXJjZSgncHJlc2lnbicpO1xuICAgIHByZXNpZ24uYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKHVwbG9hZHNGbiksIGF1dGhPcHRpb25zKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIDYuIENsb3VkRm9ybWF0aW9uIE91dHB1dHNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogJ0NsZWFuTG9vcFVzZXJQb29sSWQnLFxuICAgIH0pO1xuXG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xDbGllbnRJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gQXBwIENsaWVudCBJRCcsXG4gICAgICBleHBvcnROYW1lOiAnQ2xlYW5Mb29wVXNlclBvb2xDbGllbnRJZCcsXG4gICAgfSk7XG5cbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdBcGlHYXRld2F5VXJsJywge1xuICAgICAgdmFsdWU6IHRoaXMuYXBpLnVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgQmFzZSBFbmRwb2ludCBVUkwnLFxuICAgICAgZXhwb3J0TmFtZTogJ0NsZWFuTG9vcEFwaUdhdGV3YXlVcmwnLFxuICAgIH0pO1xuXG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCAnVGFibGVOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMudGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdEeW5hbW9EQiBTaW5nbGUtVGFibGUgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiAnQ2xlYW5Mb29wVGFibGVOYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5tZWRpYUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdQcml2YXRlIFMzIE1lZGlhIEV2aWRlbmNlIEJ1Y2tldCcsXG4gICAgICBleHBvcnROYW1lOiAnQ2xlYW5Mb29wQnVja2V0TmFtZScsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==