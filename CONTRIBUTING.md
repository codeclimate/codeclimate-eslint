# Contributing

## Testing Changes
Changes made to the engine can be tested locally.

1. Install [the CodeClimate CLI](https://github.com/codeclimate/codeclimate).
1. Create the image (customizing the `IMAGE_NAME` as needed):
```bash
IMAGE_NAME=codeclimate/codeclimate-eslint-test make image
```
1. Add the engine to your test `.codeclimate.yml`:
```bash
eslint-test:
  enabled: true
```
1. Run analyze via the CLI:
```bash
codeclimate analyze --dev
```
