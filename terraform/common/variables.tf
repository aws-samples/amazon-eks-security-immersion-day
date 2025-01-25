variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  #default     = "10.0.0.0/16"
  default     = "10.254.0.0/16"
}

variable "project_context_prefix" {
  description = "Prefix for project"
  type        = string
  default     = "eks-security-workshop"
}