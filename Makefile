.PHONY: image test citest

IMAGE_NAME ?= codeclimate/codeclimate-eslint

run_interactively := docker run -ti --volume $(PWD):/usr/src/app --rm $(IMAGE_NAME) sh -c

image:
	docker build --rm -t $(IMAGE_NAME) .

test:
	$(run_interactively) "cd /usr/src/app && npm run test"

test.debug:
	$(run_interactively) "cd /usr/src/app && npm run test.debug"


citest:
	docker run --rm $(IMAGE_NAME) sh -c "cd /usr/src/app && npm run test"
