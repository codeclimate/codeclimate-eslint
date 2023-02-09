.PHONY: image test citest release

IMAGE_NAME ?= codeclimate/codeclimate-eslint
RELEASE_REGISTRY ?= codeclimate
RELEASE_TAG ?= latest

image:
	docker build --rm -t $(IMAGE_NAME) .

test: image
	docker run --rm $(IMAGE_NAME) sh -c "cd /usr/src/app && npm run test"

citest:
	docker run --rm $(IMAGE_NAME) sh -c "cd /usr/src/app && npm run test"

release:
	docker tag $(IMAGE_NAME) $(RELEASE_REGISTRY)/codeclimate-eslint:$(RELEASE_TAG)
	docker push $(RELEASE_REGISTRY)/codeclimate-eslint:$(RELEASE_TAG)
