.PHONY: image test test.unit test.integration test.system citest.base citest integration yarn.lock yarn.add release

IMAGE_NAME ?= codeclimate/codeclimate-eslint
RELEASE_REGISTRY ?= codeclimate

ifndef RELEASE_TAG
override RELEASE_TAG = latest
endif

NPM_TEST_TARGET ?= test
NPM_INTEGRATION_TARGET ?= integration

DEBUG ?= false
ifeq ($(DEBUG),true)
	NPM_TEST_TARGET = test.debug
	NPM_INTEGRATION_TARGET = integration.debug
endif

image:
	docker build --rm -t $(IMAGE_NAME) .

test.integration: yarn.lock
	docker run -ti --rm \
		-v $(PWD):/usr/src/app \
		--workdir /usr/src/app \
		$(IMAGE_NAME) npm run $(NPM_INTEGRATION_TARGET)

test.unit:
	docker run -ti --rm \
		-v $(PWD):/usr/src/app \
		--workdir /usr/src/app \
		$(IMAGE_NAME) npm run $(NPM_TEST_TARGET)

test.system:
	bash run-system-tests.sh

test: yarn.lock test.unit test.integration test.system

yarn.add:
	docker run -ti --rm \
		-v $(PWD):/usr/src/app \
		--workdir /usr/src/app \
		$(IMAGE_NAME) yarn add $(ARGS)

citest.base:
	docker run --rm \
		--workdir /usr/src/app \
		$(IMAGE_NAME) sh -c "npm run test && npm run integration"

citest: citest.base test.system

yarn.lock: package.json Dockerfile
	$(MAKE) image
	./bin/yarn install
	touch yarn.lock

release:
	docker tag $(IMAGE_NAME) $(RELEASE_REGISTRY)/codeclimate-eslint:$(RELEASE_TAG)
	docker push $(RELEASE_REGISTRY)/codeclimate-eslint:$(RELEASE_TAG)
