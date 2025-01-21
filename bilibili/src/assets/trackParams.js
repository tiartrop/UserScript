// 参考 https://greasyfork.org/scripts/471831
const trackUrlParams = [
  'broadcast_type',
  'buvid',
  'from_source',
  'from_spmid',
  'is_room_feed',
  'is_story_h5',
  'launch_id',
  'liteVersion',
  'live_from',
  'mid',
  'search_source',
  'session_id',
  'timestamp',
  'up_id',
  'vd_source',
  /^share/,
  /^spm/
];

export default trackUrlParams;
