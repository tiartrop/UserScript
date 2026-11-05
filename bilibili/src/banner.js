if (location.href.match(/live.bilibili.com\/[0-9]+/) && unsafeWindow.__BILIACT_ENV__) {
  GM_setValue('biliact_env_detected', Date.now());
  return;
}

if (Date.now() - GM_getValue('biliact_env_detected', 0) < 5000) return;
