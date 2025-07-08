import { default as oriAdsKeywords } from '@/assets/adsKeywords';
import { download, drag } from '@/utils/commonUtils';

const menus = [
  ['视频', 'widerVideoPanelFit', '加宽视频布局', GM_getValue('widerVideoPanelFit', true)],
  ['视频', 'enableVideoPlayRate', '右键小窗倍速', GM_getValue('enableVideoPlayRate', true)],
  ['视频', 'enableVideoReverse', '播放列表倒序', GM_getValue('enableVideoReverse', true)],
  ['视频', 'showVideoOrder', '显示分P序号', GM_getValue('showVideoOrder', true)],
  ['视频', 'showVidoPercent', '显示分P百分比时长', GM_getValue('showVidoPercent', true)],
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
  for (const menu of menus)
    if (menu[1] === key) return menu[3];
};

const groupedMenus = menus.reduce((groups, [group, key, title, status]) => {
  if (!groups[group])
    groups[group] = []; // 如果该组不存在，创建一个新组

  groups[group].push({ key, title, status });
  return groups;
}, {});

const generateMenuHTML = () => {
  return Object.entries(groupedMenus).map(([group, items]) => `
    <div class="config-panel-option-group" data-key="${group}" style="display: none">
      ${items.map(({ key, title, status }) => {
    const statusClass = status ? 'on' : 'off';
    return `
          <div class="config-panel-option-item">
            <span class="config-panel-option-item-title">${title}</span>
            <span class="config-panel-option-item-switch" data-key="${key}" data-status="${statusClass}"></span>
          </div>
        `;
  }).join('')}
    </div>
  `).join('');
};

const generateAboutHTML = () => {
  return `
    <div class="config-panel-option-group" data-key="关于" style="display: none">
      <div class="config-panel-option-item">
        <button class="import-btn">导入</button>
        <button class="export-btn">导出</button>
        <button class="reset-btn">重置</button>
      </div>
    </div>
  `;
};

const containerElement = document.createElement('div');
containerElement.id = 'config-panel-container';
containerElement.innerHTML = `
<div class="config-panel-wrapper">
  <span id="close-btn" class='bp-icon-font icon-group-dynamic'></span>
  <div class="config-panel-title">自定义设置</div>
  <div class="config-panel-option-main">
    <div class="config-panel-option-header">
      <ul class="config-panel-tab-nav">
        ${Object.keys(groupedMenus).map((group) => `<li><button>${group}</button></li>`).join('')}
        <li><button>关于</button></li>
      </ul>
    </div>
    <div class="config-panel-option-body">
      ${generateMenuHTML()}
      ${generateAboutHTML()}
    </div>
  </div>
  <div id="config-panel-note">
    <span style="display: inline-block; transform: translateY(-1.5px);">⚠️</span>
    <span style="color: #AAAAAA;">所有改动将在页面刷新后生效</span>
  </div>
</div>
`;

drag(containerElement.querySelector('.config-panel-title'), containerElement.querySelector('.config-panel-wrapper'), containerElement);
containerElement.querySelector('.config-panel-tab-nav li').classList.add('tab-active');
containerElement.querySelector('.config-panel-option-group').style.display = 'block';

const listItems = containerElement.querySelectorAll('.config-panel-tab-nav li');
listItems.forEach((tab) => {
  tab.onclick = function () {
    listItems.forEach(item => item.classList.remove('tab-active'));
    this.classList.add('tab-active');

    containerElement.querySelectorAll('.config-panel-option-group').forEach(group => {
      const groupKey = group.getAttribute('data-key');
      group.style.display = groupKey === tab.textContent.trim() ? 'block' : 'none';
    });
  };
});

containerElement.querySelectorAll('.config-panel-option-item-switch').forEach(switchElement => {
  switchElement.onclick = function () {
    const { key, status } = this.dataset;
    this.dataset.status = status === 'off' ? 'on' : 'off';
    GM_setValue(key, this.dataset.status === 'on');
  };
});

GM_getValue('mySettings', { adsKeywords: oriAdsKeywords });

// 导入
containerElement.querySelector('.import-btn').onclick = () => {
  // 创建隐藏的文件输入框
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';

  // 添加文件选择事件监听器
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        GM_setValue('mySettings', importedData);
      } catch (error) {
      }
    };
    reader.readAsText(file);
  });

  // 触发文件选择对话框
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
};

// 导出
containerElement.querySelector('.export-btn').onclick = () => {
  const dataToExport = GM_getValue('mySettings', { adsKeywords: oriAdsKeywords });
  const text = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const date = new Date();
  const dateStr = date.toISOString().replace(/-|T.*/g, '');
  const filename = `${dateStr}.json`;
  download(blob, filename);
};

// 重置
containerElement.querySelector('.reset-btn').onclick = () => {
  GM_setValue('mySettings', { adsKeywords: oriAdsKeywords });
};

containerElement.querySelector('#close-btn').onclick = () => containerElement.style.display = 'none';

GM_registerMenuCommand('自定义设置', () => containerElement.style.display = 'block');

export { menu_value, containerElement };
