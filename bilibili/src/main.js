import { calVideoPageSize, getVideoLengthPercent } from '@/utils/calcUtils';
import { storageLocal } from '@/utils/localStorage';
import { dateTimeFormatter, debounce } from '@/utils/commonUtils';
import { setDomBySelector, setShadowDomBySelector } from '@/utils/domHandler';
import { mscststs } from '@/utils/domWatcher';
import cleanHistory from '@/utils/history';
import { default as b } from './components/button';
import { containerElement, menu_value as m } from './components/controlPanel';
import { default as oriAdsKeywords } from '@/assets/adsKeywords';
import globalCSS from '@/style/index.scss';

// 覆盖CSS
GM_addStyle(`${globalCSS}`);

// 观察器的配置
const config = { childList: true, subtree: true };

let videoLength = 0;
let videoPercentArr = [];
let videoDurationEle = [];
const biliHelper = {
  // 根据联合投稿的溢出宽度添加按钮
  setUpPanelContainer(ele) {
    if (ele.scrollHeight > ele.offsetHeight || ele.scrollWidth > ele.offsetWidth) {
      if (ele.nextElementSibling) ele.nextElementSibling.remove();
      setTimeout(() => ele.parentElement.appendChild(b.expand(ele)), 500);
    }
  },
  // 根据视频高度修改右侧列表最大高度
  setPlayListHeight(ele) {
    let headEleHeight;
    // 新
    if (ele.classList.contains('video-pod__body')) {
      headEleHeight = ele.parentElement.querySelector('.video-pod__header').offsetHeight + 8;
      if (ele.parentElement.querySelector('.video-pod__slide'))
        headEleHeight += ele.parentElement.querySelector('.video-pod__slide').offsetHeight;
    } else if (ele.classList.contains('action-list'))
      headEleHeight = ele.parentElement.parentElement.previousElementSibling.offsetHeight + 21;

    // 旧
    else headEleHeight = ele.previousElementSibling.offsetHeight;

    ele.style.maxHeight = `calc(${calVideoPageSize().videoHeight}px - 62px - ${headEleHeight}px)`;
  },
  // 视频右键倍速菜单
  videoPlayRateMenu(ele) {
    const parentEle = ele.parentElement;
    if (ele.getAttribute('data-action') === 'info') {
      const newEle = document.createElement('li');
      newEle.className = 'play-rate-menu';
      newEle.addEventListener('mousedown', (event) => event.stopImmediatePropagation());

      const firstChild = parentEle.firstElementChild;
      parentEle.insertBefore(newEle, firstChild);

      b.playRateMenu(parentEle).forEach((child) => {
        newEle.appendChild(child);
      });
    }
  },
  // 视频播放倒序
  videoListReverse(ele) {
    const func = (event) => {
      event.stopImmediatePropagation();
      event.target.innerHTML = event.target.innerHTML === '↓☰' ? '↑☰' : '↓☰';

      const arr = [...ele.children];
      arr.reverse();
      ele.innerHTML = '';
      arr.forEach((child) => ele.appendChild(child));
    };

    const reverseButton = b.reserve(func);
    // 旧-分P选集
    if (ele.parentElement.classList.contains('cur-list')) {
      reverseButton.style.color = '#757575';
      reverseButton.style.fontWeight = 'bold';
      ele.parentElement.previousElementSibling.firstElementChild.appendChild(reverseButton);
    }
    // 旧-合集
    else if (ele.parentElement.classList.contains('video-sections-item')) {
      // 多组
      if (ele.previousElementSibling) {
        reverseButton.style.opacity = '0.4';
        ele.previousElementSibling.firstElementChild.appendChild(reverseButton);
      }
      // 单组
      else
        ele.parentElement.parentElement.previousElementSibling.querySelector('.second-line_left').appendChild(reverseButton);
    }
    // 新
    else if (ele.classList.contains('video-pod__list')) {
      // 多组
      if (ele.parentElement.parentElement.querySelector('.video-pod__slide')) {
        reverseButton.style.color = '#9499a0';
        ele.parentElement.parentElement.querySelector('.header-bottom .left').appendChild(reverseButton);

        document.querySelectorAll('.slide-item:not(.active)').forEach((item) => item.onclick = () => reverseButton.innerHTML = '↓☰');
      }
      // 单组
      else {
        ele.parentElement.previousElementSibling.lastElementChild.firstElementChild.appendChild(reverseButton);
        if (document.querySelector('.video-pod__header .view-mode')) document.querySelector('.video-pod__header .view-mode').onclick = () => reverseButton.innerHTML = '↓☰';
      }
    }
  },
  // 分P显示序号
  pVideoOrder(ele) {
    if (ele.children.length === videoLength) {
      [...ele.children].forEach((child, index) => {
        if (child.firstElementChild.className === 'title' && !child.firstElementChild.lastElementChild.childElementCount)
          child.firstElementChild.lastElementChild.innerHTML = `<span>P${index + 1} ${child.firstElementChild.textContent}</span>`;

        if (child.firstElementChild.className === 'bpx-player-ctrl-eplist-multi-menu-item-text' && !child.firstElementChild.childElementCount)
          child.firstElementChild.innerHTML = `<span>P${index + 1} ${child.firstElementChild.textContent}</span>`;

        if (child.firstElementChild.className === 'bpx-common-svg-icon' && child.firstElementChild.nextElementSibling.className === 'bpx-player-ctrl-eplist-multi-menu-item-text' && !child.firstElementChild.nextElementSibling.childElementCount)
          child.firstElementChild.nextElementSibling.innerHTML = `<span>P${index + 1} ${child.firstElementChild.nextElementSibling.textContent}</span>`;
      }
      );
    }
  },
  // 分P显示时长百分比
  pVideoBoxPercent(ele) {
    videoDurationEle.push(ele);
    if (videoDurationEle.length === videoLength) {
      const lengthArr = videoDurationEle.map(ele => ele.firstElementChild ? ele.lastElementChild.innerHTML : ele.innerHTML);
      videoPercentArr = getVideoLengthPercent(lengthArr);
      videoDurationEle.forEach((child, index) => {
        child.outerHTML = `<div class="stat-item duration" style="display: flex;"><div>${videoPercentArr[index]}%&smid;</div><div">${lengthArr[index]}</div></div>`;
      });
    }
  },
  pVideoSelectPercent(ele) {
    if (ele.children.length === videoDurationEle.length) {
      GM_addStyle(`.bpx-player-ctrl-eplist-menu-wrap{max-width: 360px;}`);
      [...ele.children].forEach((child, index) => {
        if (!child.firstElementChild) {
          child.setAttribute('title', `${child.textContent.trim().replace(/^P\d+\s/, '')}`);
          child.innerHTML = `${child.textContent}<span>${videoPercentArr[index]}%</span>`;
        } else if (child.lastElementChild.className === 'bpx-player-ctrl-eplist-multi-menu-item-text') {
          child.setAttribute('title', `${child.textContent.trim().replace(/^P\d+\s/, '')}`);
          child.innerHTML += `<span class="video-percent">${videoPercentArr[index]}%</span>`;
        }
      });
    }
  },
  // 动态禁止点击跳转
  dynamicStopJump(ele) {
    const func = (event) => event.stopImmediatePropagation();
    ele.parentElement.addEventListener('click', func);
    ele.parentElement.style.cursor = 'auto';
    // 投票 || 查看图片
    const button = ele.querySelector('span[data-type="vote"]') || ele.querySelector('span[data-type="viewpic"]');
    if (button) {
      button.addEventListener('click', () => {
        ele.parentElement.removeEventListener('click', func);
        setTimeout(() => ele.parentElement.addEventListener('click', func), 500);
      });
    }
  },
  // 动态自动展开文本
  dynamicExpand(ele) {
    if (ele.classList.contains('folded')) {
      ele.style.display = 'unset';
      ele.style.lineClamp = 'unset';
      if (ele.nextElementSibling) ele.nextElementSibling.remove();
      // 去掉多余的空行
      if (ele.lastElementChild.tagName.toLowerCase() === 'span' && !ele.lastElementChild.classList.contains('bili-rich-text-link'))
        ele.lastElementChild.innerHTML = ele.lastElementChild.innerHTML.trim();
    }
  },
  // 动态屏蔽广告
  dynamicBlockAds(ele) {
    const { adsKeywords } = GM_getValue('mySettings', { adsKeywords: oriAdsKeywords });
    if (adsKeywords.some(keyword => ele.textContent.includes(keyword)) || ele.innerHTML.includes('data-type="goods"')) {
      const parentEle = ele.closest('.bili-dyn-list__item');
      if (parentEle) parentEle.style.display = 'none';
    }
  },
  // 动态评论区右下添加收起按钮
  commentAddFoldButton(ele) {
    // 动态详情页则返回
    if (location.href.match(/t.bilibili.com\/[0-9]+/) || location.href.match(/bilibili.com\/opus\/[0-9]+/)) return;
    const parentEle = ele.host ? ele.host.parentElement : ele.parentElement;
    const commentToggleEle = parentEle.parentElement.previousElementSibling.lastElementChild.children[1].firstElementChild;

    // 无评论则返回
    if (!Number(commentToggleEle.innerText)) return;

    if (ele.querySelector('.comment-container')) {
      setTimeout(() => {
        const foldButton = b.fold(commentToggleEle, ele.querySelector('.reply-list .view-all-reply'));
        ele.querySelector('.reply-list').appendChild(foldButton);
      }, Number(commentToggleEle.innerText) > 10 ? 1000 : 0);
    }
    // 旧版框架
    if (ele.querySelector('.bottom-page')) {
      setTimeout(() => {
        const foldButton = b.fold(commentToggleEle, ele.querySelector('.bottom-page .more-link'));
        foldButton.setAttribute('style', 'margin-bottom: 20px;');
        ele.appendChild(foldButton);
      }, Number(commentToggleEle.innerText) > 10 ? 1000 : 0);
    }
    // comment-lit框架
    if (ele.host) {
      const style = document.createElement('style');
      style.innerHTML = '#end.limit .bottombar { padding-bottom: 0 !important; }';
      ele.appendChild(style);
      setTimeout(() => {
        const foldButton = b.fold(commentToggleEle, ele.querySelector('#end.limit .bottombar.clickable'));
        foldButton.setAttribute('style', 'margin-bottom: 20px;');
        parentEle.appendChild(foldButton);
      }, Number(commentToggleEle.innerText) > 10 ? 1500 : 0);
    }
  },
  // 评论区移除关键词搜索
  commentRemoveKeywordLit(ele) {
    if (ele.href.match(/search.bilibili.com/)) {
      const newEle = document.createElement('span');
      newEle.innerHTML = ele.textContent;
      ele.replaceWith(newEle);
    }
  },
  // 评论区移除关键词搜索
  commentRemoveKeywordVue(ele) {
    if (ele.childElementCount) {
      [...ele.children].forEach(child => {
        if (child.classList.contains('search-word')) {
          child.addEventListener('click', (event) => event.stopImmediatePropagation());
          if (child.tagName.toLowerCase() === 'a') {
            const newChild = document.createElement('span');
            newChild.innerHTML = child.innerHTML;
            child.replaceWith(newChild);
          } else if (child.tagName.toLowerCase() === 'i')
            ele.removeChild(child);
        }
      });
    }
  },
  // 评论区移除关键词搜索
  commentRemoveKeywordOld(ele) {
    if (ele.href.match(/search.bilibili.com/)) {
      if (ele.nextElementSibling && ele.nextElementSibling.tagName.toLowerCase() === 'i') ele.nextElementSibling.remove();
      const newEle = document.createElement('span');
      newEle.innerHTML = ele.textContent;
      ele.replaceWith(newEle);
    }
  },
  // 评论区显示评论完整时间（失效）
  showCommentFullTime(ele) {
    if (!ele.__vueParentComponent) return;
    const reply = ele.__vueParentComponent.props.reply || ele.__vueParentComponent.props.subReply;
    if (reply && reply.ctime) ele.innerHTML = dateTimeFormatter(reply.ctime * 1e3) || '';
  },
  // 评论区显示评论IP地址（失效，可移步https://greasyfork.org/zh-CN/scripts/448434）
  showIPAdress(ele) {
    if (!ele.__vueParentComponent) return;
    const getLocationSpan = (reply, attrs = '') => {
      if (reply && reply.reply_control && reply.reply_control.location)
        return `<span class="reply-location" ${attrs}>${reply.reply_control.location || ''}</span>`;
      else
        return '';
    };

    const reply = ele.__vueParentComponent.props.reply || ele.__vueParentComponent.props.subReply;
    ele.outerHTML += getLocationSpan(reply, 'style="margin-right:20px;"');
  },
  init() {
    const changePlayViewSize = debounce(async () => {
      if (!location.href.match(/bilibili.com\/video/) && !location.href.match(/bilibili.com\/list/)) return;
      await mscststs.wait('#bilibili-player');
      setDomBySelector([(ele) => (ele.style.width = `${calVideoPageSize().leftContainerWidth}px`)], ['.left-container', '.playlist-container--left'], false);
      setDomBySelector([(ele) => (ele.style.height = `${calVideoPageSize().videoHeight}px`)], ['#playerWrap'], false);
      setDomBySelector([(ele) => {
        ele.style.width = `${calVideoPageSize().videoWidth}px`;
        ele.style.height = `${calVideoPageSize().videoHeight}px`;
      }], ['#bilibili-player'], false);
    }, 100);

    if (m('widerVideoPanelFit')) {
      changePlayViewSize();
      window.addEventListener('resize', changePlayViewSize);
      window.addEventListener('popstate', changePlayViewSize);
    }

    const changePlayListHeight = debounce(async () => {
      if (!location.href.match(/bilibili.com\/video/) && !location.href.match(/bilibili.com\/list/)) return;
      await mscststs.wait('#bilibili-player');
      setDomBySelector([this.setPlayListHeight], ['.multi-page-v1 .cur-list', '.video-sections-content-list', '.video-pod .video-pod__body', '#playlist-video-action-list'], false);
    }, 100);
    changePlayListHeight();
    window.addEventListener('resize', changePlayListHeight);
    window.addEventListener('popstate', changePlayListHeight);

    const changeVideoStaffHeight = debounce(() => {
      if (unsafeWindow.__INITIAL_STATE__ && unsafeWindow.__INITIAL_STATE__.videoData.staff)
        setDomBySelector([this.setUpPanelContainer], ['.up-panel-container .membersinfo-normal .container:not(.init-no-wrap)'], false);
    }, 100);

    if (unsafeWindow.__INITIAL_STATE__ && unsafeWindow.__INITIAL_STATE__.videoData) videoLength = unsafeWindow.__INITIAL_STATE__.videoData.videos;

    const showVideoOrder = debounce(() => {
      setDomBySelector([this.pVideoOrder], ['.video-pod__list.multip', '.bpx-player-ctrl-eplist-episodes-content'], false);
    }, 100);
    const showVideoPercent = debounce(() => {
      videoDurationEle = [];
      setDomBySelector([this.pVideoBoxPercent], ['.multi-page-v1 .cur-list .clickitem .duration', '.video-pod__list.multip .simple-base-item .duration'], false);
      setDomBySelector([this.pVideoSelectPercent], ['.bpx-player-ctrl-eplist-menu', '.bpx-player-ctrl-eplist-episodes-content'], false);
    }, 100);
    const setVideoReverse = debounce(() => {
      setDomBySelector([this.videoListReverse], ['.multi-page-v1 .cur-list .list-box', '.video-sections-content-list .video-section-list', '.video-pod .video-pod__body .video-pod__list']);
    }, 100);

    // comment-lit框架
    m('disableKeywordSearch') && (unsafeWindow.__INITIAL_STATE__?.isModern || document.querySelector('#__next') || location.href.match(/t.bilibili.com/) || location.href.match(/bilibili.com\/opus\/[0-9]+/)) && setInterval(() => {
      setShadowDomBySelector(
        [this.commentRemoveKeywordLit],
        ['bili-comments #feed bili-comment-thread-renderer bili-comment-renderer bili-rich-text p a', 'bili-comments #feed bili-comment-thread-renderer bili-comment-replies-renderer bili-comment-reply-renderer bili-rich-text p a']
      );
      setShadowDomBySelector(
        [(ele) => (ele.style.display = 'none')],
        ['bili-comments #feed bili-comment-thread-renderer bili-comment-renderer bili-comment-user-sailing-card #card', 'bili-comments bili-comments-header-renderer bili-comments-notice #bar']
      );
    }, 1000);

    const callback = mutationsList => {
      for (const mutation of mutationsList) {
        // viedo
        if (mutation.target.className
          && typeof mutation.target.className.includes !== 'undefined'
          && (mutation.target.className === 'list-box' || mutation.target.className === 'bpx-player-ctrl-eplist-menu-wrap' || mutation.target.className === 'video-pod__list multip list' || mutation.target.className === 'video-episode-card')) {
          m('showVideoOrder') && showVideoOrder();
          m('showVidoPercent') && showVideoPercent();
          m('enableVideoReverse') && setVideoReverse();
        }

        if (mutation.target.className
          && typeof mutation.target.className.includes !== 'undefined'
          && (mutation.target.className === 'staff-name'))
          changeVideoStaffHeight();


        setDomBySelector([(ele) => ele.addEventListener('click', changePlayViewSize)], ['.bpx-player-ctrl-wide']);
        m('enableVideoPlayRate') && setDomBySelector([this.videoPlayRateMenu], ['.bpx-player-contextmenu.bpx-player-active li']);

        // space-dynamic
        setDomBySelector(
          [
            m('stopDynamicJump') ? this.dynamicStopJump : e => e,
            m('expandDynamic') ? this.dynamicExpand : e => e,
            m('blockDynamicAds') ? this.dynamicBlockAds : e => e
          ],
          ['.bili-dyn-list .bili-dyn-item .bili-dyn-content .bili-rich-text__content']);

        // comment
        m('foldComment') && setDomBySelector([this.commentAddFoldButton], ['.bili-comment-container .bili-comment', '.dynamic-card-comment .bb-comment']);
        m('foldComment') && setShadowDomBySelector([this.commentAddFoldButton], ['.bili-dyn-comment bili-comments']);
        // comment-pc-vue.next.js
        m('disableKeywordSearch') && setDomBySelector([this.commentRemoveKeywordVue], ['.browser-pc .reply-item .reply-content', '.browser-pc .sub-reply-item .reply-content']);
        // new-comment.min.js
        m('disableKeywordSearch') && setDomBySelector([this.commentRemoveKeywordOld], ['#commentapp .list-item .comment-jump-url']);
        // setDomBySelector([this.showCommentFullTime, this.showIPAdress], ['.browser-pc .reply-item .reply-time', '.browser-pc .sub-reply-item .sub-reply-time']);
      }
    };

    return callback;
  }

};

// 清除地址栏追踪参数
m('cleanUrlTrack') && cleanHistory();

// 默认关闭自动连播
m('closeRecommendAutoPlay') && storageLocal.setItem('recommend_auto_play', 'close');

// 默认关闭小窗播放
m('closeMinPlayWindow') && storageLocal.setItem('b_miniplayer', '0');

// __INITIAL_STATE__ 只在首次赋值时拦截和处理
let initialSet = false;
let rawState;
Object.defineProperty(unsafeWindow, '__INITIAL_STATE__', {
  configurable: true,
  get() {
    return rawState;
  },
  set(value) {
    // 只拦截第一次赋值
    if (!initialSet) {
      // 退回new-comment.min.js版评论区（笔记功能不全且预计未来失效）
      if (m('rollbackCommentVer')) value.isModern = false;
      // 退回comment-pc-vue.next.js版评论区（已失效）
      // value.abtest.comment_next_version = '';
      // 关闭Ai视频总结功能
      if (m('closeAiSummary') && value.abtest) value.abtest.ai_summary_version = '';
      initialSet = true;
      // 解除劫持，恢复正常属性
      Object.defineProperty(unsafeWindow, '__INITIAL_STATE__', {
        configurable: true,
        writable: true,
        enumerable: true,
        value
      });
    }
    rawState = value;
  }
});

// 禁用弹幕智能云屏蔽
// 参考https://github.com/the1812/Bilibili-Evolved/discussions/4920
if (m('disableDanmukuAiBlock')) {
  const danmukuBlock = setInterval(() => {
    if (unsafeWindow.player) {
      unsafeWindow.player.on(
        unsafeWindow.nano.EventType.Player_Play,
        () => {
          unsafeWindow.webAbTest.danmuku_block_version = 'OLD'; // 针对版本 2
          const dmSetting = storageLocal.getItem('bpx_player_profile').dmSetting;
          dmSetting.aiSwitch = false; // 针对版本 2
          dmSetting.dmarea = 100; // 针对版本 3
          dmSetting.dmdensity = 0; // 针对版本 3
          unsafeWindow.player.setDanmakuSetting(dmSetting);
        }
      );
      clearInterval(danmukuBlock);
    }
  }, 100);
}

async function StartObservePage() {
  await mscststs.wait('#app') || await mscststs.wait('#__next');
  const observer = new MutationObserver(biliHelper.init());
  observer.observe(document.body, config);

  // 控制面板
  document.body.appendChild(containerElement);
}

StartObservePage();
