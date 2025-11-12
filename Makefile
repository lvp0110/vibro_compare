build:
	sudo docker build -t vibro-compare:latest -f Dockerfile .. --no-cache
run:
	sudo docker run -p 3002:3000 -p 3444:3445 \
		-e VITE_API_URL=https://constrtodo.ru:3005 \
		-e USE_HTTPS=true \
		-e HTTP_PORT=3000 \
		-e HTTPS_PORT=3445 \
		-d vibro-compare:latest