FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
        git unzip libzip-dev libpng-dev libonig-dev libxml2-dev libpq-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql zip gd mbstring xml bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Node, for the Vite frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN npm install && npm run build && rm -rf node_modules

RUN php artisan config:clear

EXPOSE 10000

# Render sets $PORT; runs migrations on boot, bootstraps an admin if ADMIN_EMAIL/
# ADMIN_PASSWORD are set (no-op otherwise), then serves the app.
CMD php artisan migrate --force && php artisan storage:link --force && \
    php artisan app:ensure-admin-user && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
