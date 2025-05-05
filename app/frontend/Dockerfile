FROM node:18-alpine

WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Установка serve для раздачи статических файлов
RUN npm install -g serve

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["serve", "-s", "build", "-l", "3000"] 