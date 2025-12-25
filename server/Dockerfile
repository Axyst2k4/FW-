FROM node:18-alpine AS base
LABEL org.opencontainers.image.source=https://github.com/luongngocminh/cps-prototype
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN npm install --global corepack@latest
RUN corepack use pnpm@8.6
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY .env.docker /app/.env
EXPOSE 3000
CMD [ "pnpm", "serve" ]

