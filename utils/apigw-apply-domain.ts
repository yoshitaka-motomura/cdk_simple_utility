import { RestApi } from "aws-cdk-lib/aws-apigateway";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import * as dotenv from "dotenv";
import { CfnOutput } from "aws-cdk-lib";

dotenv.config();

/**
 * Represents the properties required to add a custom domain to a REST API.
 * @interface ApplyRestApiCustomDomainProps
 * @property {Construct} scope The scope of the construct.
 * @property {RestApi} restApi The REST API to which the custom domain will be added.
 * @property {string} hostedZone The hosted zone of the domain.
 * @property {string} domainName The domain name to be added to the REST API.
 * @property {string} certificateArn The ARN of the certificate to be used for the custom domain.
 */
export interface ApplyRestApiCustomDomainProps {
  scope: Construct; // The scope of the construct.
  restApi: RestApi; // The REST API to which the custom domain will be added.
  hostedZone: string; // The hosted zone of the domain.
  domainName: string; // The domain name to be added to the REST API.
  certificateArn?: string; // The ARN of the certificate to be used for the custom domain.
}

/**
 * Represents a class for adding a custom domain to a REST API.
 */
export class ApplyRestApiCustomDomain {
  private readonly certificateArn: string;
  private apigwDomain: apigateway.DomainName;

    /**
     * Constructor
     * @param props {ApplyRestApiCustomDomainProps} The properties required to add a custom domain to the REST API.
     */
  constructor(private props: ApplyRestApiCustomDomainProps) {
    this.certificateArn = props.certificateArn || process.env.CERTIFICATE_ARN || '';

    if (!this.certificateArn) {
      throw new Error("Certificate ARN is required");
    }

    this.apply();

    new CfnOutput(this.props.scope, 'APIGatewayCustomDomainURL', {
        value: `https://${this.props.domainName}`,
      description: 'This is the URL of the API Gateway'
    })
  }

    /**
     * Applies the configurations to add a custom domain to the REST API.
     *
     * @return {void}
     */
  private apply(): void {

      const apigwDomain = new apigateway.DomainName(this.props.scope, "DomainName", {
        domainName:this.props.domainName,
        certificate: acm.Certificate.fromCertificateArn(this.props.scope, 'Certificate', this.certificateArn),
        endpointType: apigateway.EndpointType.REGIONAL,
      })

      apigwDomain.addBasePathMapping(this.props.restApi);

      this.apigwDomain = apigwDomain;
      this.createRecordSet();
  }

    /**
     * Creates a record set in AWS Route53 for the provided hosted zone and domain configuration.
     *
     * @return {void} This method does not return any value.
     */
  private createRecordSet(): void {
    const zone = route53.HostedZone.fromLookup(this.props.scope, 'Zone', {
      domainName: this.props.hostedZone
    });

    new route53.ARecord(this.props.scope, 'AliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(this.apigwDomain)
      ),
      recordName: this.props.domainName
    });
  }
}