import { storageLocal } from '@/utils/localStorage';
import { dateTimeFormatter, debounce } from '@/utils/commonUtils';
import { setDomBySelector, setShadowDomBySelector } from '@/utils/domHandler';
import { mscststs } from '@/utils/domWatcher';
import cleanHistory from '@/utils/history';
import { default as b } from './components/button';
import { containerElement, menu_value as m } from './components/controlPanel';
import adsKeywords from '@/assets/adsKeywords';
import globalCSS from '@/style/index.scss';

// 覆盖CSS
GM_addStyle(`${globalCSS}`);

// 根据关键词屏蔽广告图文
const findAds = (text) => {
  return adsKeywords.some(keyword => text.includes(keyword));
};

// 计算分p时长占比
const getVideoLengthPercent = (arr) => {
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
};

function calVideoPageSize() {
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

// 观察器的配置
const config = { childList: true, subtree: true };

let videoLength = 0;
let videoPercentArr = [];
let videoDurationEle = [];
const biliHelper = {
  // 根据联合投稿的溢出宽度添加按钮
  setUpPanelContainer(ele) {
    if (ele.scrollHeight > ele.offsetHeight || ele.scrollWidth > ele.offsetWidth)
      setTimeout(() => ele.parentElement.appendChild(b.expand(ele)), 1000);
  },
  // 根据视频高度修改右侧列表最大高度
  setPlayListHeight(ele) {
    let headEleHeight;
    // 新
    if (ele.classList.contains('video-pod__body')) {
      headEleHeight = ele.parentElement.querySelector('.video-pod__header').offsetHeight + 8;
      if (ele.parentElement.querySelector('.video-pod__slide'))
        headEleHeight += ele.parentElement.querySelector('.video-pod__slide').offsetHeight;
    }
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
      if (ele.nextElementSibling)
        ele.nextElementSibling.remove();
      // 去掉多余的空行
      if (ele.lastElementChild.tagName.toLowerCase() === 'span' && !ele.lastElementChild.classList.contains('bili-rich-text-link'))
        ele.lastElementChild.innerHTML = ele.lastElementChild.innerHTML.trim();
    }
  },
  // 动态屏蔽广告
  dynamicBlockAds(ele) {
    if (findAds(ele.textContent) || ele.innerHTML.includes('data-type="goods"')) {
      let parentEle = ele.parentElement;
      while (parentEle) {
        if (parentEle.classList.contains('bili-dyn-list__item')) {
          parentEle.style.display = 'none';
          break;
        }
        parentEle = parentEle.parentElement;
      }
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
    const foldButton = b.fold(commentToggleEle);

    if (ele.querySelector('.comment-container')) ele.querySelector('.reply-list').appendChild(foldButton);
    if (ele.querySelector('.bottom-page')) {
      foldButton.setAttribute('style', 'margin-bottom: 20px;');
      ele.appendChild(foldButton);
    }
    if (ele.host) {
      const style = document.createElement('style');
      style.innerHTML = '#end.limit .bottombar { padding-bottom: 0 !important; }';
      ele.appendChild(style);
      foldButton.setAttribute('style', 'margin-bottom: 20px;');
      parentEle.appendChild(foldButton);
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
      if (ele.nextElementSibling && ele.nextElementSibling.tagName.toLowerCase() === 'i')
        ele.nextElementSibling.remove();
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
      if (!location.href.match(/bilibili.com\/video/)) return;
      await mscststs.wait('#bilibili-player', false, 10);
      setDomBySelector([(ele) => (ele.style.width = `${calVideoPageSize().leftContainerWidth}px`)], ['.left-container'], false);
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
      if (!location.href.match(/bilibili.com\/video/)) return;
      await mscststs.wait('#bilibili-player', false, 10);
      setDomBySelector([this.setPlayListHeight], ['.multi-page-v1 .cur-list', '.video-sections-content-list', '.video-pod .video-pod__body'], false);
    }, 100);
    changePlayListHeight();
    window.addEventListener('resize', changePlayListHeight);
    window.addEventListener('popstate', changePlayListHeight);

    if (unsafeWindow.__INITIAL_STATE__ && unsafeWindow.__INITIAL_STATE__.videoData) videoLength = unsafeWindow.__INITIAL_STATE__.videoData.videos;

    const showVideoOrder = debounce(() => {
      setDomBySelector([this.pVideoOrder], ['.video-pod__list.multip', '.bpx-player-ctrl-eplist-episodes-content'], false);
    }, 300);
    const showVideoPercent = debounce(() => {
      videoDurationEle = [];
      setDomBySelector([this.pVideoBoxPercent], ['.multi-page-v1 .cur-list .clickitem .duration', '.video-pod__list.multip .simple-base-item .duration'], false);
      setDomBySelector([this.pVideoSelectPercent], ['.bpx-player-ctrl-eplist-menu', '.bpx-player-ctrl-eplist-episodes-content'], false);
    }, 300);
    const setVideoReverse = debounce(() => {
      setDomBySelector([this.videoListReverse], ['.multi-page-v1 .cur-list .list-box', '.video-sections-content-list .video-section-list', '.video-pod .video-pod__body .video-pod__list']);
    }, 300);

    // comment-lit框架
    m('disableKeywordSearch') && (unsafeWindow.__INITIAL_STATE__?.isModern || document.querySelector('#__next') || location.href.match(/t.bilibili.com/) || location.href.match(/bilibili.com\/opus\/[0-9]+/)) && setInterval(() => {
      setShadowDomBySelector(
        [this.commentRemoveKeywordLit],
        ['bili-comments #feed bili-comment-thread-renderer bili-comment-renderer bili-rich-text p a', 'bili-comments #feed bili-comment-thread-renderer bili-comment-replies-renderer bili-comment-reply-renderer bili-rich-text p a']
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

        setDomBySelector([this.setUpPanelContainer], ['.up-panel-container .membersinfo-normal .container']);
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
        m('foldComment') && setShadowDomBySelector([this.commentAddFoldButton], ['bili-comments']);
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

// __INITIAL_STATE__
let rawState;
Object.defineProperty(unsafeWindow, '__INITIAL_STATE__', {
  get() {
    return rawState;
  },
  set(value) {
    // 退回new-comment.min.js版评论区（笔记功能不全且预计未来失效）
    if (m('rollbackCommentVer')) value.isModern = false;
    // 退回comment-pc-vue.next.js版评论区（已失效）
    // value.abtest.comment_next_version = '';
    // 关闭Ai视频总结功能
    if (m('closeAiSummary') && value.abtest) value.abtest.ai_summary_version = '';
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
  await mscststs.wait('#app', false, 5) || await mscststs.wait('#__next', false, 5);
  const observer = new MutationObserver(biliHelper.init());
  observer.observe(document.body, config);

  // 控制面板
  document.body.appendChild(containerElement);
}

StartObservePage();
