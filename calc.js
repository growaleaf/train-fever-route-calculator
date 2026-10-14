// Train Fever route math. Two independent checks:
// 1) the game's fixed 20-minute passenger rule (station-to-station distance/speed + an
//    explicit average-wait approximation of frequency/2 — see README/page for sourcing).
// 2) public-domain locomotive tractive-effort-vs-grade physics (not a game-specific constant).
(function (root) {
  "use strict";

  var G = 9.80665; // standard gravity, m/s^2

  // Standard 20-minute-rule inputs: station-to-station distance (km), vehicle top speed (km/h),
  // and line frequency (minutes between departures). Wait time is approximated as frequency/2 —
  // a standard queueing approximation (average wait for a uniformly-random arrival between
  // departures), not a number the game itself publishes. This tool states that explicitly rather
  // than presenting it as a game-documented constant.
  function checkTwentyMinuteRule(input) {
    var distanceKm = input.distanceKm;
    var topSpeedKmh = input.topSpeedKmh;
    var frequencyMin = input.frequencyMin;

    var travelMinutes = (distanceKm / topSpeedKmh) * 60;
    var avgWaitMinutes = frequencyMin / 2;
    var totalMinutes = travelMinutes + avgWaitMinutes;

    return {
      travelMinutes: travelMinutes,
      avgWaitMinutes: avgWaitMinutes,
      totalMinutes: totalMinutes,
      clears: totalMinutes <= 20,
      marginMinutes: 20 - totalMinutes
    };
  }

  // Tractive-effort / grade-climb estimator. Required tractive effort is the gravity component of
  // train weight along the slope: force(N) = mass(kg) * g * sin(theta), approximated for the small
  // angles used as track gradients by sin(theta) ~= grade fraction (gradientPercent/100). This is
  // the standard railway-engineering grade-resistance formula (commonly stated as "20 lbf per ton
  // of train weight per 1% of grade", which is the same formula in imperial units) — see README for
  // the two independent sources. Rolling/aerodynamic/curve resistance are NOT included; this is a
  // stated simplification, not an unsourced add-on.
  function tractiveEffortCheck(input) {
    var availableKN = input.availableKN;
    var trainWeightTonnes = input.trainWeightTonnes;
    var gradientPercent = input.gradientPercent;

    var requiredKN = trainWeightTonnes * G * (gradientPercent / 100);

    return {
      requiredKN: requiredKN,
      canClimb: availableKN >= requiredKN,
      marginKN: availableKN - requiredKN
    };
  }

  var API = {
    checkTwentyMinuteRule: checkTwentyMinuteRule,
    tractiveEffortCheck: tractiveEffortCheck,
    GRAVITY: G
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    root.TFCALC = API;
  }
})(typeof window !== "undefined" ? window : this);
