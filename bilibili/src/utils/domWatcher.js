// 参考 https://update.greasyfork.org/scripts/38220/713767/MSCSTSTS-TOOLS.js
export const mscststs = new class {
  sleep(miliseconds) {
    return new Promise(resolve => {
      setTimeout(() => { resolve(); }, miliseconds);
    });
  }
  async _Step(selector, callback, need_content, timeout) {
    while (timeout--) {
      if (document.querySelector(selector) === null) {
        await this.sleep(100);
        continue;
      } else {
        if (need_content) {
          if (document.querySelector(selector).innerText.length === 0) {
            await this.sleep(100);
            continue;
          }
        }
      }
      break;
    }

    if (callback) callback(selector);
  }
  wait(selector, need_content = false, timeout = Infinity) {
    return new Promise(resolve => {
      this._Step(selector, (selector) => { resolve(document.querySelector(selector)); }, need_content, timeout);
    });
  }
}();
