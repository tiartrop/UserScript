const Button = new class {
  // 视频倒序按钮
  reserve = (func) => {
    const button = document.createElement('button');
    button.innerHTML = '↓☰';
    button.className = 'reverse-button';
    button.setAttribute('data-show', 'on');
    button.addEventListener('click', func, false);

    return button;
  };

  // 视频自动连播按钮
  continuous = (player) => {
    const continuousElement = document.createElement('div');
    continuousElement.className = 'continuous-btn';
    continuousElement.innerHTML = `
    <div class="txt">
      自动连播
    </div>
    <div class="switch-btn">
      <div class="switch-block">
      </div>
    </div>
    `;
    continuousElement.addEventListener('click', function () {
      const btn = this.querySelector('.switch-btn');
      if (btn.classList.contains('on')) {
        btn.classList.remove('on');
        player.setHandoff(2);
      } else {
        btn.classList.add('on');
        player.setHandoff(0);
      }
    }, false);

    return continuousElement;
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
  fold = (ele, link) => {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'comment-fold-button';

    if (link) {
      const linkButton = document.createElement('button');
      linkButton.className = 'bp-icon-font icon-link';
      linkButton.setAttribute('style', 'margin-right: 10px;');
      linkButton.addEventListener('click', () => link.click(), false);
      buttonGroup.appendChild(linkButton);
    }

    const foldButton = document.createElement('button');
    foldButton.innerHTML = '收起评论';
    foldButton.addEventListener('click', () => ele.click(), false);
    buttonGroup.appendChild(foldButton);

    return buttonGroup;
  };

  // 联合投稿折叠收起按钮
  expand = (ele) => {
    const button = document.createElement('i');
    button.className = 'members-button';
    button.setAttribute('style', 'top:24px;right:-20px;transform:rotate(45deg)');
    button.addEventListener('click', () => {
      if (unsafeWindow.getComputedStyle(ele).getPropertyValue('max-height') === '86px') {
        button.style.transform = 'rotate(-135deg)';
        ele.setAttribute('style', 'max-height: unset !important');
      } else {
        button.style.transform = 'rotate(45deg)';
        ele.setAttribute('style', 'max-height: 86px !important');
      }
    }, false);

    return button;
  };
};

export default Button;
