FROM public.ecr.aws/amazonlinux/amazonlinux:latest
RUN yum -y update && \
    yum install -y iptables && \
    yum clean all && \
    rm -rf /var/cache/yum

CMD ["/bin/bash"]
