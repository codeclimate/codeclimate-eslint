.PHONY: image test citest integration yarn.lock release

IMAGE_NAME ?= codeclimate/codeclimate-eslint
RELEASE_REGISTRY ?= codeclimate
RELEASE_TAG ?= latest

NPM_TEST_TARGET ?= test
NPM_INTEGRATION_TARGET ?= integration

DEBUG ?= false
ifeq ($(DEBUG),true)
	NPM_TEST_TARGET = test.debug
	NPM_INTEGRATION_TARGET = integration.debug
endif

image:
	docker build --rm -t $(IMAGE_NAME) .

integration: yarn.lock
	docker run -ti --rm \
		-v $(PWD):/usr/src/app \
		--workdir /usr/src/app \
		$(IMAGE_NAME) npm run $(NPM_INTEGRATION_TARGET)

test: yarn.lock
	docker run -ti --rm \
		-v $(PWD):/usr/src/app \
		--workdir /usr/src/app \
		$(IMAGE_NAME) npm run $(NPM_TEST_TARGET)

citest:
	docker run --rm \
		--workdir /usr/src/app \
		$(IMAGE_NAME) sh -c "npm run test && npm run integration"

yarn.lock: package.json Dockerfile
	$(MAKE) image
	./bin/yarn install
	touch yarn.lock

release:
	docker tag $(IMAGE_NAME) $(RELEASE_REGISTRY)/codeclimate-eslint:$(RELEASE_TAG)
	docker push $(RELEASE_REGISTRY)/codeclimate-eslint:$(RELEASE_TAG)
