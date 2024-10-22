// 参考 https://greasyfork.org/scripts/471831
const trackUrlParams = [
  'buvid',
  'from_spmid',
  'is_story_h5',
  'launch_id',
  'live_from',
  'mid',
  'session_id',
  'spm_id_from',
  'timestamp',
  'up_id',
  'vd_source',
  /^share/,
  /^spm/
];

export default trackUrlParams;
