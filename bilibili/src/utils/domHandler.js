export const setDomBySelector = (nodeHandlers, selectorList, disposable = true) => {
  const selected = selectorList.reduce((acc, selector) => [...acc, ...document.querySelectorAll(selector)], []);

  selected.forEach((node) => {
    if (node.settled && disposable) return;
    if (disposable) node.settled = true;

    nodeHandlers.forEach((handler) => {
      handler(node);
    });
  });
};

export const setShadowDomBySelector = (nodeHandlers, selectorList, disposable = true) => {
  const traverser = (ele, selector) => {
    const found = [...ele.querySelectorAll(selector)];
    if (found.length)
      return found[0].shadowRoot ? found.map(child => child.shadowRoot) : found;
    else return false;
  };

  const selected = selectorList.map((selector) =>
    selector.split(' ').reduce((acc, cur) => {
      let foundArr = [];

      [...acc].forEach(ele => {
        const found = traverser(ele, cur);
        if (found) foundArr = foundArr.concat(traverser(ele, cur));
      });
      return foundArr;
    }, [document])
  ).flat();


  selected.forEach((node) => {
    if (node.settled && disposable) return;
    if (disposable) node.settled = true;

    nodeHandlers.forEach((handler) => {
      handler(node);
    });
  });
};
