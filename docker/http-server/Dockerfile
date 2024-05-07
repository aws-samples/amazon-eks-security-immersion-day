FROM public.ecr.aws/x2j8p8w7/http-server:latest

RUN yum -y update && \
    yum install python3 jq tar bind-utils procps gettext which unzip tar less util-linux -y && \
    pip3 install awscli && \
    yum clean all && \
    rm -rf /var/cache/yum

# WORKDIR /app
# RUN yum install awscli wget cmake gettext python3 jq tar bind-utils -y
# RUN wget https://rpm.nodesource.com/setup_20.x -O /tmp/setup.sh
# RUN bash /tmp/setup.sh
# RUN yum install -y nodejs
# COPY index.js.in /app/index.js.in
# COPY package.json /app/package.json

COPY launch_app.sh /app/launch_app.sh
RUN chmod 755 /app/launch_app.sh

# RUN npm install
# ENV HTTP_PORT=80
# EXPOSE $HTTP_PORT

ENTRYPOINT ["sh","/app/launch_app.sh"]