import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as SM from '@aws-cdk/aws-secretsmanager';

export class Step38AuroraServerlessStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  create vpc for the databace instance
    const vpc = new ec2.Vpc(this, 'myrdsvpc');

    //  create database cluster and get cluster secret
    const myServerlessDB = new rds.ServerlessCluster(this, 'ServerlessDB', {
      vpc,
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_5_7_12,
      }),
      scaling: {
        autoPause: cdk.Duration.minutes(10), // default is to pause after 5 minutes of idle time
        minCapacity: rds.AuroraCapacityUnit.ACU_8, // default is 2 Aurora capacity units (ACUs)
        maxCapacity: rds.AuroraCapacityUnit.ACU_32, // default is 16 Aurora capacity units (ACUs)
      },
      deletionProtection: false,
      defaultDatabaseName: 'mysqldb',
    });
    const secarn = myServerlessDB.secret?.secretArn || 'secret-arn';

    //  for lambda RDS and VPC access
    const role = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSDataFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    //  create a function to access database
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode('lambdas'),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(1),
      vpc,
      role,
      environment: {
        INSTANCE_CREDENTIALS: `${
          SM.Secret.fromSecretAttributes(this, 'sec-arn', {
            secretArn: secarn,
          }).secretValue
        }`,
      },
    });
    //  create lambda once database is created
    hello.node.addDependency(myServerlessDB);

    // To control who can access the cluster or instance, use the .connections attribute. RDS databases have a default port: 3306

    myServerlessDB.connections.allowFromAnyIpv4(ec2.Port.tcp(3306));
  }
}
