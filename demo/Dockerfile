FROM fedora:22

RUN dnf install -y nodejs npm
RUN mkdir -p /opt/impera-dashboard
ADD . /opt/impera-dashboard/
#RUN sed -i "s/localhost/server/g" /opt/impera-dashboard/front-end/app/components/config.js
CMD (cd /opt/impera-dashboard/front-end; npm start)
EXPOSE 8000
