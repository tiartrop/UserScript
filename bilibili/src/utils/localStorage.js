// https://stackoverflow.com/questions/50767241/observe-localstorage-changes-in-js
const localStore = Object.getPrototypeOf(localStorage).setItem;

Object.getPrototypeOf(localStorage).setItem = function (key, value) {
  const event = new CustomEvent('localUpdated', {
    detail: { key, value }
  });

  document.dispatchEvent(event);
  // eslint-disable-next-line prefer-rest-params
  localStore.apply(this, arguments);
};

class SessionStorageProxy {

  constructor(storageModel) {
    this.storage = storageModel;
  }

  setItem(key, value) {
    this.storage.setItem(key, value);
  }

  getItem(key) {
    return JSON.parse(this.storage.getItem(key));
  }

  removeItem(key) {
    this.storage.removeItem(key);
  }

  clear() {
    this.storage.clear();
  }
}

class LocalStorageProxy extends SessionStorageProxy {
  constructor(localStorage) {
    super(localStorage);
  }
}

export const storageSession = new SessionStorageProxy(sessionStorage);

export const storageLocal = new LocalStorageProxy(localStorage);
