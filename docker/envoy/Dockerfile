FROM public.ecr.aws/appmesh/aws-appmesh-envoy:v1.26.4.0-prod as envoy

FROM public.ecr.aws/amazonlinux/amazonlinux:latest
RUN yum -y update && \
    yum clean all && \
    rm -rf /var/cache/yum

COPY --from=envoy /usr/bin/envoy /usr/bin/envoy
RUN yum install -y python3 jq tar bind-utils procps gettext which unzip tar less util-linux
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

COPY envoy.yaml.in /etc/envoy/envoy.yaml.in
COPY launch_envoy.sh /usr/local/bin/launch_envoy.sh

COPY envoy /tmp
RUN chmod 755 /usr/local/bin/launch_envoy.sh
ENTRYPOINT ["launch_envoy.sh"]
