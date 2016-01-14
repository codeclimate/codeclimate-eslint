.PHONY: image test

IMAGE_NAME ?= codeclimate/codeclimate-eslint

image:
	docker build --rm -t $(IMAGE_NAME) .

test: image
	docker run --rm --workdir="/usr/src/app" $(IMAGE_NAME) npm run test
