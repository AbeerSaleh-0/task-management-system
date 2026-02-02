FROM nginx:alpine

# انسخ ملفات HTML/CSS/JS إلى مجلد nginx
COPY . /usr/share/nginx/html

# افتح البورت 3000
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]