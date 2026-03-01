########################################
# Build stage
########################################
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
ENV DISABLE_CODEGEN=true
RUN npm install

ARG API_BASE_URL=http://localhost:8080
ENV API_BASE_URL=${API_BASE_URL}
ENV NUXT_GRAPHQL_ENDPOINT=${API_BASE_URL}/graphql
ENV NUXT_GRAPHQL_WS_ENDPOINT=${API_BASE_URL}/graphql
ENV NUXT_AUTH_BASE_URL=${API_BASE_URL}
ENV NUXT_AUTH_LOGIN_URL=${API_BASE_URL}/oauth/login
ENV NUXT_AUTH_REGISTER_URL=${API_BASE_URL}/oauth/register

COPY . .
RUN npm run build

########################################
# Runtime stage (minimal image)
########################################
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache dumb-init \
 && adduser -S -u 10001 appuser

COPY --from=builder /app/.output ./.output

USER 10001
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]
