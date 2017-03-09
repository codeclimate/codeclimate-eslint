.PHONY: image test citest

IMAGE_NAME ?= codeclimate/codeclimate-eslint

NPM_TEST_TARGET ?= test

image:
	docker build --rm -t $(IMAGE_NAME) .

test: image
	docker run -ti --rm \
		--volume $(PWD):/code \
		--workdir /code \
		$(IMAGE_NAME) npm run $(NPM_TEST_TARGET)

citest:
	docker run --rm \
		--workdir /usr/src/app \
		$(IMAGE_NAME) npm run test
