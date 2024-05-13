FROM envoyproxy/envoy:distroless-v1.30.0 as envoy

FROM public.ecr.aws/amazonlinux/amazonlinux:latest
RUN yum -y update && \
    yum clean all && \
    rm -rf /var/cache/yum

COPY --from=envoy /usr/local/bin/envoy /usr/local/bin/envoy
RUN yum install -y python3 jq tar bind-utils procps gettext which unzip tar less util-linux
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

COPY envoy.yaml.in /etc/envoy/envoy.yaml.in
COPY launch_envoy.sh /usr/local/bin/launch_envoy.sh

RUN chmod 755 /usr/local/bin/launch_envoy.sh
ENTRYPOINT ["launch_envoy.sh"]
