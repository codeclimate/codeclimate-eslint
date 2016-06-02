.PHONY: image test citest

IMAGE_NAME ?= codeclimate/codeclimate-eslint

image:
	docker build --rm -t $(IMAGE_NAME) .

test: image
	docker run --rm $(IMAGE_NAME) sh -c "cd /usr/src/app && npm run test"

citest:
	docker run --rm $(IMAGE_NAME) sh -c "cd /usr/src/app && npm run test"
