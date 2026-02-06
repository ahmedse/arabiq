FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build Strapi admin
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=base /app /app

ENV NODE_ENV=production
EXPOSE 1337

CMD ["npm", "run", "start"]
