/**
 * 格式化时间
 * @param date 日期
 * @param format 需要转出的格式
 * @returns {*}
 */
export function dateTimeFormatter(date, format = 'yyyy-MM-dd hh:mm:ss') {
  if (!date || date === '')
    return '';

  if (typeof date === 'string') {
    const mts = date.match(/(\/Date\((\d+)\)\/)/);
    if (mts && mts.length >= 3)
      date = parseInt(mts[2]);
  }
  date = new Date(date);
  if (!date || date.toUTCString() === 'Invalid Date')
    return '';

  const map = {
    M: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds(),
    q: Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds()
  };

  format = format.replace(/([yMdhmsqS])+/g, (all, t) => {
    let v = map[t];
    if (v !== undefined) {
      if (all.length > 1) {
        v = `0${v}`;
        v = v.slice(v.length - 2);
      }
      return v;
    }
    else if (t === 'y') return (`${date.getFullYear()}`).slice(4 - all.length);

    return all;
  });

  return format;
}

/**
 * 防抖
 * @param func
 * @param wait
 * @returns {(function(): void)|*}
 */
export function debounce(func, wait) {
  let timeout;

  return function () {
    clearTimeout(timeout);
    timeout = setTimeout((...args) => {
      func.apply(this, [...args]);
    }, wait);
  };
}

/**
 * 拖拽
 * @param clickEle 选中元素
 * @param moveEle 移动元素
 * @param parentEle 父元素
 * @returns
 */
export function drag(clickEle, moveEle, parentEle = document.body) {
  if (!clickEle) return;
  if (!moveEle) moveEle = clickEle;

  function dragEnd() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchstart = null;
    document.ontouchmove = null;
    document.ontouchend = null;
  }

  function onMove(e, moveEle) {
    const moveX = Math.max(Math.min(e.clientX - moveEle.startX, parentEle.offsetWidth - moveEle.offsetWidth), 0);
    const moveY = Math.max(Math.min(e.clientY - moveEle.startY, parentEle.offsetHeight - moveEle.offsetHeight), 0);

    moveEle.style.left = `${moveX - parentEle.getBoundingClientRect().left}px`;
    moveEle.style.top = `${moveY - parentEle.getBoundingClientRect().top}px`;
  }

  let eleRect, clickX, clickY;
  moveEle.startX = 0;
  moveEle.startY = 0;

  function eleMouseMove(e) {
    onMove(e, moveEle);
  }

  clickEle.onmousedown = clickEle.ontouchstart = function (e) {
    if (e.changedTouches && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      clickX = touch.clientX;
      clickY = touch.clientY;
    } else {
      clickX = e.clientX;
      clickY = e.clientY;
    }


    eleRect = moveEle.getBoundingClientRect();
    moveEle.startX = clickX - eleRect.left;
    moveEle.startY = clickY - eleRect.top;

    moveEle.style.opacity = 0.7;

    let disposable;
    document.onmousemove = document.ontouchmove = function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        e.clientX = touch.clientX;
        e.clientY = touch.clientY;
      }

      if (!disposable) {
        moveEle.style.transform = 'unset';
        disposable = true;
      }

      eleMouseMove(e);
    };

    document.onmouseup = document.ontouchend = function () {
      dragEnd();
      moveEle.style.opacity = 1;
    };
  };

  clickEle.onmouseover = function () {
    clickEle.style.cursor = 'move';
  };

  clickEle.onmouseout = function () {
    clickEle.style.cursor = 'unset';
  };

  clickEle.ondragstart = function () {
    return false;
  };

}

/**
 * 下载
 * @param blob
 * @param filename
 * @returns
 */
export async function download(blob, filename, time = 10e3) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  const revoke = function () {
    URL.revokeObjectURL(url);
    window.removeEventListener('unload', revoke);
  };
  setTimeout(revoke, time);
  window.addEventListener('unload', revoke);
}
