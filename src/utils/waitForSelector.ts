// Helper function to check if an element is visible
const isElementVisible = (element: Element): boolean => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  // Check if element has dimensions, is not hidden by CSS, and is in the viewport
  return (
    rect.width > 0 && 
    rect.height > 0 && 
    style.display !== 'none' && 
    style.visibility !== 'hidden' && 
    style.opacity !== '0'
  );
};

export const waitForElement = (selector: string, options: {
  root?: Element | null;
}) => new Promise<Element>((resolve, fail) => {
  let root = options.root || document;
  
  // First check if element exists and is visible
  const initialElement = root.querySelector(selector);
  if (initialElement && isElementVisible(initialElement)) {
    resolve(initialElement);
    return;
  }
  
  const observer = new MutationObserver(() => {
    const element = root.querySelector(selector);
    if (element && isElementVisible(element)) {
      resolve(element);
      observer.disconnect();
      clearInterval(visibilityCheck);
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,  // Also observe attribute changes which might affect visibility
  });
  
  // Set a periodic check for visibility even if no mutations occur
  // (for CSS animations, transitions, or batched rendering)
  const visibilityCheck = setInterval(() => {
    const element = root.querySelector(selector);
    if (element && isElementVisible(element)) {
      resolve(element);
      observer.disconnect();
      clearInterval(visibilityCheck);
    }
  }, 100);
});

