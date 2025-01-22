import { drag } from '@/utils/commonUtils';

const menus = [
  ['视频', 'widerVideoPanelFit', '加宽视频布局', GM_getValue('widerVideoPanelFit', true)],
  ['视频', 'enableVideoPlayRate', '右键小窗倍速', GM_getValue('enableVideoPlayRate', true)],
  ['视频', 'enableVideoReverse', '播放列表倒序', GM_getValue('enableVideoReverse', true)],
  ['视频', 'showVidoPercent', '分P视频显示百分比时长', GM_getValue('showVidoPercent', true)],
  ['动态', 'stopDynamicJump', '动态禁止点击跳转', GM_getValue('stopDynamicJump', true)],
  ['动态', 'expandDynamic', '动态自动展开文本', GM_getValue('expandDynamic', true)],
  ['动态', 'blockDynamicAds', '动态屏蔽广告', GM_getValue('blockDynamicAds', true)],
  ['评论', 'foldComment', '快速收起评论', GM_getValue('foldComment', true)],
  ['评论', 'disableKeywordSearch', '移除蓝色搜索词', GM_getValue('disableKeywordSearch', true)],
  ['界面', 'cleanUrlTrack', '清除地址栏追踪参数', GM_getValue('cleanUrlTrack', true)],
  ['视频', 'closeRecommendAutoPlay', '默认关闭自动连播', GM_getValue('closeRecommendAutoPlay', true)],
  ['视频', 'closeMinPlayWindow', '默认关闭小窗播放', GM_getValue('closeMinPlayWindow', false)],
  ['实验室', 'rollbackCommentVer', '退回旧版评论区', GM_getValue('rollbackCommentVer', false)],
  ['实验室', 'closeAiSummary', '关闭AI视频总结功能', GM_getValue('closeAiSummary', false)],
  ['实验室', 'disableDanmukuAiBlock', '禁用弹幕智能云屏蔽', GM_getValue('disableDanmukuAiBlock', true)]
];

const menu_value = (key) => {
  for (const menu of menus) {
    if (menu[1] === key)
      return menu[3];

  }
};

const groupedMenus = menus.reduce((groups, [group, key, title, status]) => {
  if (!groups[group])
    groups[group] = []; // 如果该组不存在，创建一个新组

  groups[group].push({ key, title, status });
  return groups;
}, {});

const generateMenuHTML = () => {
  return Object.entries(groupedMenus).map(([group, items]) => `
    <div class="setting-panel-option-group" data-key="${group}" style="display: none">
      ${items.map(({ key, title, status }) => {
    const statusClass = status ? 'on' : 'off';
    return `
          <div class="setting-panel-option-item">
            <span class="setting-panel-option-item-title">${title}</span>
            <span class="setting-panel-option-item-switch" data-key="${key}" data-status="${statusClass}"></span>
          </div>
        `;
  }).join('')}
    </div>
  `).join('');
};

const containerElement = document.createElement('div');
containerElement.id = 'setting-panel-container';
containerElement.innerHTML = `
<div class="setting-panel-wrapper">
  <span id="setting-panel-close-btn" class='bp-icon-font icon-group-dynamic'></span>
  <div class="setting-panel-title">自定义设置</div>
  <div class="setting-panel-option-main">
    <div class="setting-panel-option-header">
      <ul class="setting-panel-tab-nav">
        ${Object.keys(groupedMenus).map((group) => `<li><button>${group}</button></li>`).join('')}
      </ul>
    </div>
    <div class="setting-panel-option-body">
      ${generateMenuHTML()}
    </div>
  </div>
  <div id="setting-panel-note">
    <span style="display: inline-block; transform: translateY(-1.5px);">⚠️</span>
    <span style="color: #AAAAAA;">所有改动将在页面刷新后生效</span>
  </div>
</div>
`;

drag(containerElement.querySelector('.setting-panel-title'), containerElement.querySelector('.setting-panel-wrapper'), containerElement);
containerElement.querySelector('.setting-panel-tab-nav li').classList.add('tab-active');
containerElement.querySelector('.setting-panel-option-group').style.display = 'block';

const listItems = containerElement.querySelectorAll('.setting-panel-tab-nav li');
listItems.forEach((tab) => {
  tab.onclick = function () {
    listItems.forEach(item => item.classList.remove('tab-active'));
    this.classList.add('tab-active');

    containerElement.querySelectorAll('.setting-panel-option-group').forEach(group => {
      const groupKey = group.getAttribute('data-key');
      group.style.display = groupKey === tab.textContent.trim() ? 'block' : 'none';
    });
  };
});

containerElement.querySelectorAll('.setting-panel-option-item-switch').forEach(switchElement => {
  switchElement.onclick = function () {
    const { key, status } = this.dataset;
    this.dataset.status = status === 'off' ? 'on' : 'off';
    GM_setValue(key, this.dataset.status === 'on');
  };
});

containerElement.querySelector('#setting-panel-close-btn').onclick = () => containerElement.style.display = 'none';

GM_registerMenuCommand('自定义设置', () => containerElement.style.display = 'block');

export { menu_value, containerElement };
