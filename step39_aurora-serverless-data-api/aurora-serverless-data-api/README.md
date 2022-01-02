# Aurora serverless data api

For code that access a relational database, you open a connection, use it to process one or more SQL queries or other statements, and then close the connection. You probably used a client library that was specific to your operating system, programming language, and your database. At some point you realized that creating connections took a lot of clock time and consumed memory on the database engine, and soon after found out that you could (or had to) deal with connection pooling and other tricks.For serverless functions that are frequently invoked and that run for time intervals that range from milliseconds to minutes there is no long-running server, there’s no place to store a connection identifier for reuse.

By using the Data API for Aurora Serverless, you can work with a web-services interface to your Aurora Serverless DB cluster. The Data API doesn't require a persistent connection to the DB cluster. Instead, it provides a secure HTTP endpoint and integration with AWS SDKs. You can use the endpoint to run SQL statements without managing connections.

All calls to the Data API are synchronous. By default, a call times out if it's not finished processing within 45 seconds. However, you can continue running a SQL statement if the call times out by using the continueAfterTimeout parameter. Users don't need to pass credentials with calls to the Data API, because the Data API uses database credentials stored in AWS Secrets Manager. To store credentials in Secrets Manager, users must be granted the appropriate permissions to use Secrets Manager, an AWS managed policy, AmazonRDSDataFullAccess, includes permissions for the RDS Data API. You can enable the Data API when you create the Aurora Serverless cluster. After you enable the Data API, you can also use the query editor for Aurora Serverless. For more information, see Using the query editor for Aurora Serverless. There is no charge for the API, but you will pay the usual price for data transfer out of AWS.

we would then use RDSDataService API for connecting to a Data API enabled Aurora Serverless database from lambda.

## Reading Material

- [Calling Data Api](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html#data-api.calling)
- [Using the Data API for Aurora Serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html)
- [RDS Data Service](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html)

## Steps to code

1. Create new directory using `mkdir aurora-serverless-data-api`
2. Navigate to newly created directory using `cd aurora-serverless-data-api`
3. Create cdk app using `cdk init app --language typescript`
4. use `npm run watch` to auto transpile the code
5. Install ec2 module using `npm i @aws-cdk/aws-ec2`. Update "./lib/aurora-serverless-data-api-stack.ts" to define virtual private cloud for the database instance.

   ```js
   import * as ec2 from '@aws-cdk/aws-ec2';
   const vpc = new ec2.Vpc(this, 'vpc');
   ```

6. Install rds module using `npm i @aws-cdk/aws-rds`. Update "./lib/aurora-serverless-data-api-stack.ts" to define a database cluster and get cluster secret

   ```js
   import * as rds from '@aws-cdk/aws-rds';
   const cluster = new rds.ServerlessCluster(this, 'Database', {
     engine: rds.DatabaseClusterEngine.aurora({
       version: rds.AuroraEngineVersion.VER_1_22_2,
     }),
     vpc,
     scaling: {
       minCapacity: rds.AuroraCapacityUnit.ACU_8,
       maxCapacity: rds.AuroraCapacityUnit.ACU_32,
     },
     enableDataApi: true,
     deletionProtection: false,
     defaultDatabaseName: 'mydb',
   });
   const dbsarn = cluster.secret?.secretArn || 'kk';
   ```

7. Install iam module using `npm i @aws-cdk/aws-iam`. Update "./lib/aurora-serverless-data-api-stack.ts" to define a role for lambda function so rds cluster can be assessed

   ```js
   import * as iam from '@aws-cdk/aws-iam';
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
   ```

8. Install lambda module using `npm i @aws-cdk/aws-lambda`. Update "./lib/aurora-serverless-data-api-stack.ts" to define a lambda function and define to create lambda once database is created. Also define access for cluster

   ```js
   import * as lambda from '@aws-cdk/aws-lambda';
   const hello = new lambda.Function(this, 'RecordsHandler', {
     role: lambdaRole,
     vpc,
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('lambda'),
     handler: 'index.handler',
     environment: {
       CLUSTER_ARN: cluster.clusterArn,
       SECRET_ARN: dbsarn,
     },
   });
   hello.node.addDependency(cluster);
   cluster.grantDataApiAccess(hello);
   cluster.connections.allowDefaultPortFromAnyIpv4();
   ```

9. Create and navigate to new folder using `mkdir lambda` and `cd lambda` and make it a npm directory using `npm init --yes`. Isntall sdk using `npm i aws-sdk`

10. Create "lambda/index.ts" to define lambda handler code

    ```js
    import { env } from 'process';
    import * as AWS from 'aws-sdk';
    var rdsdataservice = new AWS.RDSDataService();

    interface QueryParams {
      resourceArn: string;
      secretArn: string;
      database: string;
      sql: string;
    }

    export async function handler(event: any, context: any) {
      try {
        const dbcarn = env.CLUSTER_ARN || '';
        const dbsarn = env.SECRET_ARN || '';
        var params: QueryParams = {
          resourceArn: dbcarn,
          secretArn: dbsarn,
          database: 'mydb',
          sql: '',
        };
        params['sql'] =
          'CREATE TABLE IF NOT EXISTS records (recordid INT PRIMARY KEY, title VARCHAR(255) NOT NULL, release_date DATE);';
        const data = await rdsdataservice.executeStatement(params).promise();
        var body = {
          records: data,
        };
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(body),
        };
      } catch (error) {
        console.log(error, 'error');
        return {
          statusCode: 400,
          headers: {},
          body: `Error creating table`,
        };
      }
    }
    ```

11. Deploy the app using `cdk deploy`
12. Test the lambda function
13. Destroy the app using `cdk destroy`
