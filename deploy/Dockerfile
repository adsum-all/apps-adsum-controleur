# ADSUM controller PWA - serve the pre-built static site with nginx.
# The dist/ directory is produced by the CI build step (npm run build, which has
# the private registry token) before this image is built, so no npm or private
# registry auth runs inside the image build.
FROM nginx:1.27-alpine
ARG BUILD_DATE
ARG VERSION
ARG VCS_REF
LABEL org.opencontainers.image.title="adsum-controleur" \
      org.opencontainers.image.description="ADSUM controller scan PWA (static, served by nginx)" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
