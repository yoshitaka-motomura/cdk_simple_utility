import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as pyhonLambda  from '@aws-cdk/aws-lambda-python-alpha'
import { ApplyRestApiCustomDomain} from '../utils'
import * as path from 'path';

export class ApigwExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new pyhonLambda.PythonFunction(this, 'LambdaFunctionHandler', {
      entry: path.join(__dirname, '..', 'src', 'lambda_functions'),
      index: 'home.py',
      handler: 'lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_12,
      functionName: 'HomeLambdaFunction',
    })

    const apigw = new apigateway.RestApi(this, 'ApigwExample', {
        restApiName: 'ApigwExample',
        description: 'This is an example of API Gateway',
    });

    const homeResource = apigw.root.addResource('home');
    const homeLambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);
    homeResource.addMethod('GET', homeLambdaIntegration);

    new ApplyRestApiCustomDomain({
      scope: this,
      restApi: apigw,
      hostedZone: 'cristallum.io',
      domainName: 'example.cristallum.io'
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
        value: apigw.url || 'Something went wrong with the deployment',
        description: 'This is the URL of the API Gateway'
    });
  }
}
