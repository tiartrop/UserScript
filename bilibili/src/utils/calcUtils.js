import { menu_value as m } from '../components/controlPanel';

// 计算分p时长占比
export function getVideoLengthPercent (arr) {
  // 将时间转换为秒的数组
  const timeArr = arr.map((length) => {
    if (typeof length === 'string') {
      const timeComponents = length.split(':').map(Number);
      if (timeComponents.length === 3) {
        // 格式为时:分:秒
        const [hours, minutes, seconds] = timeComponents;
        return hours * 3600 + minutes * 60 + seconds;
      } else if (timeComponents.length === 2) {
        // 格式为分:秒
        const [minutes, seconds] = timeComponents;
        return minutes * 60 + seconds;
      } else if (timeComponents.length === 1) {
        // 格式为秒
        return timeComponents[0];
      } else return 0;
    } else if (typeof length === 'number')
      return length;
    else return 0;
  });

  const totalSeconds = timeArr.reduce((total, seconds) => total + seconds, 0);
  let cumulativeSeconds = 0;
  const percentages = timeArr.map((seconds) => {
    cumulativeSeconds += seconds;
    const percentage = (cumulativeSeconds / totalSeconds) * 100;
    return percentage.toFixed(2);
  });
  return percentages;
}

// 计算视频页面宽高
export function calVideoPageSize() {
  const widerMode = m('widerVideoPanelFit');
  const isWide = document.querySelector('.bpx-player-ctrl-wide.bpx-state-entered');
  const windowWidth = window.innerWidth;

  // 计算容器宽度和侧边填充宽度
  const containerWidth = Math.max(document.body?.clientWidth || windowWidth, 1100);
  const sidePadding = windowWidth > 1680 ? 451 : 390;

  let maxAspectHeight, finalVideoWidth;
  // 计算基于窗口高度的最大视频高度
  if (!widerMode)
    maxAspectHeight = parseInt((16 * (window.innerHeight - (windowWidth > 1690 ? 318 : 308))) / 9);

  // 最大视频宽度限制
  const maxVideoWidth = containerWidth - 112 - sidePadding;
  finalVideoWidth = widerMode ? maxVideoWidth : Math.min(maxVideoWidth, maxAspectHeight);

  // 限制视频宽度在 668 到 1694 之间
  if (finalVideoWidth < 668) finalVideoWidth = 668;
  if (finalVideoWidth > 1694) finalVideoWidth = 1694;

  // 计算总容器宽度
  let totalContainerWidth = finalVideoWidth + sidePadding;

  // 如果是宽屏模式，减少宽度以适配布局
  if (isWide) {
    totalContainerWidth -= widerMode ? 225 : 125;
    finalVideoWidth -= widerMode ? 200 : 100;
  }

  // 计算视频高度
  const videoHeight = Math.round(
    (finalVideoWidth + (isWide ? sidePadding : 0)) * (9 / 16)
  ) + (windowWidth > 1680 ? 56 : 46);

  document.querySelector('#danmukuBox').style.marginTop = isWide ? `${videoHeight + 2}px` : '0px';

  return {
    videoWidth: totalContainerWidth - (isWide ? -30 : sidePadding),
    videoHeight,
    leftContainerWidth: totalContainerWidth - sidePadding
  };
}
