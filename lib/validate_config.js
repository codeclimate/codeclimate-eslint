function validateConfig(config) {
  if (config.rules) {
    return config
  }

  console.error(
    "No rules are configured. Make sure you have added a config file with rules enabled."
  )
  console.error(
    "See our documentation at https://docs.codeclimate.com/docs/eslint for more information."
  )

  return false
}

module.exports = validateConfig
