FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build arguments for Next.js build-time env
ARG STRAPI_URL
ARG STRAPI_API_TOKEN
ARG NEXT_PUBLIC_MATTERPORT_SDK_KEY

ENV STRAPI_URL=$STRAPI_URL
ENV STRAPI_API_TOKEN=$STRAPI_API_TOKEN
ENV NEXT_PUBLIC_MATTERPORT_SDK_KEY=$NEXT_PUBLIC_MATTERPORT_SDK_KEY

# Build Next.js
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built app
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
