/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "keyboard",
  entitlements: {
    // Mirror the same App Group declared in app.json so the extension
    // can read the theme JSON written by the host RN app.
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
