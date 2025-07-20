# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia los archivos de dependencias
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Instala dependencias (usa el lockfile que exista)
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm install; fi

# Copia el resto del código
COPY . .

# Construye la app Next.js
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia los archivos necesarios desde la etapa de build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
