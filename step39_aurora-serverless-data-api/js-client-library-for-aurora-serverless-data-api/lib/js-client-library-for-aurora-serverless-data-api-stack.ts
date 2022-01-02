import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';

export class JsClientLibraryForAuroraServerlessDataApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  create vpc for the databace instance
    const vpc = new ec2.Vpc(this, 'vpc');

    //  create database cluster
    const cluster = new rds.ServerlessCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.aurora({
        version: rds.AuroraEngineVersion.VER_1_22_2,
      }),
      vpc,
      scaling: {
        minCapacity: rds.AuroraCapacityUnit.ACU_8, // default is 2 Aurora capacity units (ACUs)
        maxCapacity: rds.AuroraCapacityUnit.ACU_32, // default is 16 Aurora capacity units (ACUs)
      },
      // enable data api
      enableDataApi: true,
      deletionProtection: false,
      defaultDatabaseName: 'mydb',
    });
    // database cluster's secret arn
    const dbsarn = cluster.secret?.secretArn || 'kk';

    //  for lambda RDS and VPC access
    const lambdaRole = new iam.Role(this, 'AuroraServerlessambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        // iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSDataFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    //  create a function to access database

    const hello = new lambda.Function(this, 'RecordsHandler', {
      role: lambdaRole,
      runtime: lambda.Runtime.NODEJS_14_X, // So we can use async in widget.js
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        CLUSTER_ARN: cluster.clusterArn,
        SECRET_ARN: dbsarn,
      },
    });
    //  create lambda once database is created
    hello.node.addDependency(cluster);

    // either use "enable-data-api" in cluster construct or this
    // cluster.grantDataApiAccess(hello);
    cluster.connections.allowDefaultPortFromAnyIpv4();
  }
}
