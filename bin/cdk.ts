#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApigwExampleStack } from '../lib/apigw-example-stack';

const app = new cdk.App();
new ApigwExampleStack(app, 'CdkApigatewayExampleStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});