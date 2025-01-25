#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CentralAccountStack, TeamStack } from "../lib";

const app = new cdk.App();
new TeamStack(app, "eks-security-workshop");
new CentralAccountStack(app, "CentralAccountStack");
