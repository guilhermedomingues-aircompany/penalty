FROM 289208114389.dkr.ecr.us-east-1.amazonaws.com/moonlight-images/node:20.16.0-alpine-701d23a19424f3fa07fe059451ee1cf4525e48dc AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app
ARG ARTIFACT_MANAGER_PASSWORD
ARG ARTIFACT_MANAGER_USER
ARG ARTIFACT_MANAGER_URL
ENV ARTIFACT_MANAGER_PASSWORD=${ARTIFACT_MANAGER_PASSWORD}
ENV ARTIFACT_MANAGER_USER=${ARTIFACT_MANAGER_USER}
ENV ARTIFACT_MANAGER_URL=${ARTIFACT_MANAGER_URL}
RUN echo //${ARTIFACT_MANAGER_URL}/repository/picpay-npm-hosted/:_auth="$(echo -n "${ARTIFACT_MANAGER_USER}:${ARTIFACT_MANAGER_PASSWORD}" | base64)" >>~/.npmrc
RUN echo //${ARTIFACT_MANAGER_URL}/repository/picpay-npm-group/:_auth="$(echo -n "${ARTIFACT_MANAGER_USER}:${ARTIFACT_MANAGER_PASSWORD}" | base64)" >>~/.npmrc

COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build the source code
FROM base AS builder
WORKDIR /app
ARG MOONLIGHT_ENV=production
ENV MOONLIGHT_ENV=${MOONLIGHT_ENV}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 3. Production image — serve the Vite static build
FROM base AS runner
WORKDIR /app

RUN npm install -g serve

RUN addgroup -g 1001 -S appgroup
RUN adduser -S appuser -u 1001 -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

USER appuser

EXPOSE 3000

ENV PORT=3000
ENTRYPOINT ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
