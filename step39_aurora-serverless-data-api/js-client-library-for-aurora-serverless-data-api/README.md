# JS client library for aurora serverless data api

The Data API Client is a lightweight wrapper that simplifies working with the Amazon Aurora Serverless Data API by abstracting away the notion of field values. This abstraction annotates native JavaScript types supplied as input parameters, as well as converts annotated response data to native JavaScript types. It's basically a DocumentClient for the Data API. It also promisifies the AWS.RDSDataService client to make working with async/await or Promise chains easier AND dramatically simplifies transactions.

The Data API requires you to specify data types when passing in parameters. Specifying all of those data types in the parameters is a bit clunky. In addition to requiring types for parameters, it also returns each field as an object with its value assigned to a key that represents its data type.

## Reading Material

- [Calling Data Api](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html#data-api.calling)
- [Data Api Client](https://github.com/jeremydaly/data-api-client)

## Steps to code

1. Create new directory using `mkdir js-client-library-for-aurora-serverless-data-api`
2. Navigate to newly created directory using `cd js-client-library-for-aurora-serverless-data-api`
3. Create cdk app using `cdk init app --language typescript`
4. use `npm run watch` to auto transpile the code
5. Install ec2 module using `npm i @aws-cdk/aws-ec2`. Update "./lib/js-client-library-for-aurora-serverless-data-api-stack.ts" to define virtual private cloud for the database instance.

   ```js
   import * as ec2 from '@aws-cdk/aws-ec2';
   const vpc = new ec2.Vpc(this, 'vpc');
   ```

6. Install rds module using `npm i @aws-cdk/aws-rds`. Update "./lib/js-client-library-for-aurora-serverless-data-api-stack.ts" to define a database cluster and get cluster secret

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

7. Install iam module using `npm i @aws-cdk/aws-iam`. Update "./lib/js-client-library-for-aurora-serverless-data-api-stack.ts" to define a role for lambda function so rds cluster can be assessed

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

8. Install lambda module using `npm i @aws-cdk/aws-lambda`. Update "./lib/js-client-library-for-aurora-serverless-data-api-stack.ts" to define a lambda function and define to create lambda once database is created. Also define access for cluster

   ```js
   import * as lambda from '@aws-cdk/aws-lambda';

   const hello = new lambda.Function(this, 'RecordsHandler', {
     role: lambdaRole,
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('lambda'),
     handler: 'index.handler',
     environment: {
       CLUSTER_ARN: cluster.clusterArn,
       SECRET_ARN: dbsarn,
     },
   });
   hello.node.addDependency(cluster);
   cluster.connections.allowDefaultPortFromAnyIpv4();
   ```

9. Create and navigate to new folder using `mkdir lambda` and `cd lambda` and make it a npm directory using `npm init --yes`. Isntall data-api-client using `npm i data-api-client`

10. Create "lambda/index.ts" to define lambda handler code

    ```js
    import { env } from 'process';
    const dbcarn = env.CLUSTER_ARN || '';
    const dbsarn = env.SECRET_ARN || '';
    const data = require('data-api-client')({
      secretArn: dbsarn,
      resourceArn: dbcarn,
      database: 'mydb',
    });
    export async function handler(event: any, context: any) {
      try {
        const result = await data.query(
          'CREATE TABLE IF NOT EXISTS records (recordid INT PRIMARY KEY, title VARCHAR(255) NOT NULL, release_date DATE);'
        );
        var body = {
          records: result,
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
