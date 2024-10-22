// 参考 https://greasyfork.org/scripts
import trackUrlParams from '@/assets/trackParams';

const removeTracking = (url) => {
  if (!url) return url;
  try {
    const [base, search] = url.split('?');
    if (!search) return url;
    const searchParams = new URLSearchParams(`?${search}`);
    const keys = Array.from(searchParams.keys());
    for (const key of keys) {
      trackUrlParams.forEach(item => {
        if (typeof item === 'string') {
          if (item === key) searchParams.delete(key);
        } else if (item instanceof RegExp)
          if (item.test(key)) searchParams.delete(key);
      });
    }
    if (location.pathname === base && !searchParams.size) return;
    return [base, searchParams.toString()].filter(Boolean).join('?');
  } catch (e) {
    return url;
  }
};

export default function cleanHistory() {
  unsafeWindow.history.replaceState(undefined, undefined, removeTracking(location.href));
  const originalPushState = unsafeWindow.history.pushState;
  const originalReplaceState = unsafeWindow.history.replaceState;

  unsafeWindow.history.pushState = function (state, unused, url) {
    originalPushState.apply(this, [state, unused, removeTracking(url)]);
  };

  unsafeWindow.history.replaceState = function (state, unused, url) {
    originalReplaceState.apply(this, [state, unused, removeTracking(url)]);
  };
}
