ARG BUILD_FROM
FROM $BUILD_FROM

# Install Node.js (Alpine-based base image)
RUN apk add --no-cache nodejs npm

# Copy application
COPY app/ /app/
WORKDIR /app
RUN npm install --production

# Copy entry point
COPY run.sh /
RUN chmod a+x /run.sh

CMD ["/run.sh"]
