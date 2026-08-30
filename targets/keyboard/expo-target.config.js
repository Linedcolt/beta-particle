/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "keyboard",
  entitlements: {
    // Mirror the same App Group declared in app.json. Kept around even
    // though it turned out not to be shared under AltStore/SideStore free
    // sideloading (confirmed via canary test) - harmless to leave in case
    // a future paid-account build wants to fall back to it.
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
    // Mirror the same Keychain Sharing group as the main app. Unlike App
    // Groups, this doesn't require a capability to be registered in the
    // Apple Developer portal - it's just a matching entitlement pair, so
    // it stands a better chance of surviving AltStore/SideStore re-signing
    // on a free Apple ID.
    "keychain-access-groups":
      config.ios.entitlements["keychain-access-groups"],
  },
});
