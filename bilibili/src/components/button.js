const Button = new class {
  // 视频倒序按钮
  reserve = (func) => {
    const button = document.createElement('button');
    button.innerHTML = '↓☰';
    button.className = 'reverse-button';
    button.addEventListener('click', func, false);

    return button;
  };

  // 视频倍速菜单
  playRateMenu = (ele) => {
    const rateArr = ['0.75', '1.0', '1.25', '1.5', '1.75', '2.0'];
    const curPlayRate = document.querySelector('video').playbackRate;

    return rateArr.map((r) => {
      const menuItem = document.createElement('div');
      menuItem.innerHTML = r;
      menuItem.className = 'play-rate-menu-item';
      if (curPlayRate === Number(r))
        menuItem.classList.add('active');

      menuItem.addEventListener('click', () => {
        document.querySelector('video').playbackRate = Number(r);
        setTimeout(() => {
          ele.classList.remove('bpx-player-active');
        }, 100);
      }, false);

      return menuItem;
    });
  };

  // 评论收起按钮
  fold = (ele) => {
    const button = document.createElement('button');
    button.innerHTML = '收起评论';
    button.className = 'comment-fold-button';
    button.addEventListener('click', () => ele.click(), false);

    return button;
  };

  // 联合投稿折叠收起按钮
  expand = (ele) => {
    const button = document.createElement('i');
    button.className = 'members-button';
    button.setAttribute('style', 'top:24px;right:-20px;transform:rotate(45deg)');
    button.addEventListener('click', () => {
      if (unsafeWindow.getComputedStyle(ele).getPropertyValue('max-height') === '86px') {
        button.style.transform = 'rotate(-135deg)';
        ele.style.maxHeight = 'unset';
      } else {
        button.style.transform = 'rotate(45deg)';
        ele.style.maxHeight = '86px';
      }
    }, false);

    return button;
  };
};

export default Button;
