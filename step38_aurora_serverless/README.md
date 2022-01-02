# AMAZON AURORA

Amazon Aurora is a MySQL and PostgreSQL-compatible relational database built for the cloud, that combines the performance and availability of traditional enterprise databases with the simplicity and cost-effectiveness of open source databases. Its up to 5 times faster than standard MySQL databases and 3 times faster than standard PostgreSQL databases. It provides the security, availability, and reliability of commercial databases at 1/10th the cost and is fully managed by Amazon Relational Database Service (RDS). Amazon Aurora features a distributed, fault-tolerant, self-healing storage system that auto-scales up to 128TB per database instance. It delivers high performance and availability with up to 15 low-latency read replicas, point-in-time recovery, continuous backup to Amazon S3, and replication across three Availability Zones (AZs).

## AMAZON AURORA SERVERLESS

Amazon Aurora Serverless is an on-demand, auto-scaling configuration for Amazon Aurora. It automatically starts up, shuts down, and scales capacity up or down based on your application's needs. It enables you to run your database in the cloud without managing any database capacity. Manually managing database capacity can take up valuable time and can lead to inefficient use of database resources. With Aurora Serverless, you simply create a database endpoint, optionally specify the desired database capacity range, and connect your applications. You pay on a per-second basis for the database capacity you use when the database is active, and migrate between standard and serverless configurations with a few clicks in the Amazon RDS Management Console.

Aurora Serverless v1 is available for both Amazon Aurora with MySQL compatibility and Amazon Aurora with PostgreSQL compatibility. It's easy to get started: choose `Serverless` when creating your Aurora database cluster, optionally specify the desired range of database capacity, and connect your applications.

## Amazon RDS for MySql

MySQL is the world's most popular open source relational database and Amazon RDS makes it easy to set up, operate, and scale MySQL deployments in the cloud. With Amazon RDS, you can deploy scalable MySQL servers in minutes with cost-efficient and resizable hardware capacity.

Amazon RDS for MySQL frees you up to focus on application development by managing time-consuming database administration tasks including backups, software patching, monitoring, scaling and replication. Amazon RDS supports DB instances running several versions of MySQL.

## DB Cluster

The basic building block of Amazon RDS is the DB instance. A database cluster means more than one database instances working together.

## Amazon VPC

You can run a DB instance on a virtual private cloud (VPC) using the Amazon Virtual Private Cloud (Amazon VPC) service. When you use a VPC, you have control over your virtual networking environment.

## Engine

Amazon Aurora is a MySQL and PostgreSQL-compatible relational database.

## Scaling

Aurora Serverless clusters can specify scaling properties which will be used to automatically scale the database cluster seamlessly based on the workload.

## Reading Material

- [What is AWS Aurora](https://aws.amazon.com/rds/aurora/?aurora-whats-new.sort-by=item.additionalFields.postDateTime&aurora-whats-new.sort-order=desc)
- [Amazon Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/)
- [Serverless ClusterProps](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-rds.ServerlessClusterProps.html)
- [BUILD SERVERLESS APPLICATIONS USING AURORA SERVERLESS, THE DATA API AND CDK VIDEO TUTORIAL](https://www.youtube.com/watch?v=kU8nwAbA8No&ab_channel=FooBarServerless)
- [How to use serverless-mysql](https://github.com/jeremydaly/serverless-mysql)

## Steps to code

1. Create new directory using `mkdir step38_aurora_serverless`
2. Navigate to newly created directory using `cd step38_aurora_serverless`
3. Create cdk app using `cdk init app --language typescript`
4. use `npm run watch` to auto transpile the code
5. Install ec2 module using `npm i @aws-cdk/aws-ec2`. Update "./lib/step38_aurora_serverless-stack.ts" to define virtual private cloud for the database instance.

   ```js
   import * as ec2 from '@aws-cdk/aws-ec2';
   const vpc = new ec2.Vpc(this, 'myrdsvpc');
   ```

6. Install rds module using `npm i @aws-cdk/aws-rds`. Update "./lib/step38_aurora_serverless-stack.ts" to define a database cluster and get cluster secret

   ```js
   import * as rds from '@aws-cdk/aws-rds';
   const myServerlessDB = new rds.ServerlessCluster(this, 'ServerlessDB', {
     vpc,
     engine: rds.DatabaseClusterEngine.auroraMysql({
       version: rds.AuroraMysqlEngineVersion.VER_5_7_12,
     }),
     scaling: {
       autoPause: cdk.Duration.minutes(10),
       minCapacity: rds.AuroraCapacityUnit.ACU_8,
       maxCapacity: rds.AuroraCapacityUnit.ACU_32,
     },
     deletionProtection: false,
     defaultDatabaseName: 'mysqldb',
   });
   const secarn = myServerlessDB.secret?.secretArn || 'secret-arn';
   ```

7. Install iam module using `npm i @aws-cdk/aws-iam`. Update "./lib/step38_aurora_serverless-stack.ts" to define a role for lambda function so rds cluster can be assessed

   ```js
   import * as iam from '@aws-cdk/aws-iam';
   const role = new iam.Role(this, 'LambdaRole', {
     assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
     managedPolicies: [
       iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSDataFullAccess'),
       iam.ManagedPolicy.fromAwsManagedPolicyName(
         'service-role/AWSLambdaVPCAccessExecutionRole'
       ),
     ],
   });
   ```

8. Install lambda module using `npm i @aws-cdk/aws-lambda` and secret manager using `npm i @aws-cdk/aws-secretsmanager` Update "./lib/step38_aurora_serverless-stack.ts" to define a lambda function and define to create lambda once database is created. Also define access for cluster

   ```js
   import * as lambda from '@aws-cdk/aws-lambda';
   const hello = new lambda.Function(this, 'HelloHandler', {
     runtime: lambda.Runtime.NODEJS_14_X,
     code: new lambda.AssetCode('lambda'),
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
   hello.node.addDependency(myServerlessDB);
   myServerlessDB.connections.allowFromAnyIpv4(ec2.Port.tcp(3306));
   ```

9.
