.PHONY: image test

IMAGE_NAME ?= codeclimate/codeclimate-eslint

image:
	docker build --rm -t $(IMAGE_NAME) .

test: image
	docker run $(IMAGE_NAME) npm run test
