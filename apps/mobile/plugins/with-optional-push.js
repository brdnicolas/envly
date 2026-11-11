// The push entitlement (aps-environment) is refused by free Apple "Personal Team" signing.
// Keep it out of the build unless ENVLY_PUSH=1 (set it once the paid Apple Developer account is active).
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withOptionalPush(config) {
  return withEntitlementsPlist(config, (cfg) => {
    if (process.env.ENVLY_PUSH !== '1') delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
