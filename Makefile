.PHONY: image test citest integration

IMAGE_NAME ?= codeclimate/codeclimate-eslint

NPM_TEST_TARGET ?= test
NPM_INTEGRATION_TARGET ?= integration

DEBUG ?= false
ifeq ($(DEBUG),true)
	NPM_TEST_TARGET = test.debug
	NPM_INTEGRATION_TARGET = integration.debug
endif

image:
	docker build --rm -t $(IMAGE_NAME) .

integration: image
	docker run -ti --rm \
		--volume $(PWD):/code \
		--workdir /code \
		$(IMAGE_NAME) npm run $(NPM_INTEGRATION_TARGET)

test: image
	docker run -ti --rm \
		--volume $(PWD):/code \
		--workdir /code \
		$(IMAGE_NAME) npm run $(NPM_TEST_TARGET)

citest:
	docker run --rm \
		--workdir /usr/src/app \
		$(IMAGE_NAME) npm run test integration
