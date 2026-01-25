FROM nginx:alpine

# انسخ ملفات HTML/CSS/JS إلى مجلد nginx
COPY . /usr/share/nginx/html

# افتح البورت 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]