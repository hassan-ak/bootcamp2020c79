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

## Steps to code
