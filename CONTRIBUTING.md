# Contributing

## Adding and upgrading plugins

When adding or upgrading a plugin, we should see changes in both `package.json`
and `yarn.lock`.

Make sure to run `make image` before running these commands.

Add a plugin:

```
bin/yarn add eslint-config-google
```

Upgrade a plugin:

```
bin/yarn upgrade eslint-config-google
```

## Testing Changes

Changes made to the engine can be tested locally.

1. Install [the CodeClimate CLI](https://github.com/codeclimate/codeclimate).
1. Create the image (customizing the `IMAGE_NAME` as needed):

   ```console
   IMAGE_NAME=codeclimate/codeclimate-eslint-test make image
   ```

1. Add the engine to your test `.codeclimate.yml`:

   ```yaml
   engines:
     eslint-test:
       enabled: true
   ```

1. Run analyze via the CLI:

   ```console
   codeclimate analyze --dev
   ```
