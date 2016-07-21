.PHONY: image test citest shrinkwrap

IMAGE_NAME ?= codeclimate/codeclimate-eslint

image:
	docker build --rm -t $(IMAGE_NAME) .

test: image
	docker run --rm $(IMAGE_NAME) sh -c "cd /usr/src/app && npm run test"

citest:
	docker run --rm $(IMAGE_NAME) sh -c "cd /usr/src/app && npm run test"

shrinkwrap: image
	docker run --rm --workdir /usr/src/app $(IMAGE_NAME) sh -c \
	  'npm shrinkwrap >/dev/null && cat npm-shrinkwrap.json' > npm-shrinkwrap.json
