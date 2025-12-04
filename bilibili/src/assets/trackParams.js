// 参考 https://greasyfork.org/scripts/471831
const trackUrlParams = [
  'broadcast_type',
  'buvid',
  'is_room_feed',
  'is_story_h5',
  'launch_id',
  'liteVersion',
  'live_from',
  'mid',
  'plat_id',
  'search_source',
  'session_id',
  'timestamp',
  'trackid',
  'unique_k',
  'up_id',
  'vd_source',
  /^from/,
  /^share/,
  /^spm/
];

export default trackUrlParams;
