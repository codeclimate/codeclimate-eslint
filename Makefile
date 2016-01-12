.PHONY: image

IMAGE_NAME ?= codeclimate/codeclimate-eslint

image:
	docker build --rm -t $(IMAGE_NAME) .
