(function (window) {
  'use strict';

  const DEFAULT_FALLBACK =
    '/assets/images/default-place.jpg';

  const processedImages =
    new WeakSet();


  function getFallbackImage(image) {
    return (
      image.dataset.fallback ||
      DEFAULT_FALLBACK
    );
  }


  function markImageLoaded(image) {
    const parent =
      image.closest(
        '.media-frame'
      );

    if (parent) {
      parent.classList.add(
        'image-loaded'
      );
    }

    image.classList.add(
      'image-loaded'
    );
  }


  function handleImageError(image) {
    const fallback =
      getFallbackImage(image);

    if (
      image.dataset.fallbackApplied ===
      'true'
    ) {
      markImageLoaded(image);

      return;
    }

    image.dataset.fallbackApplied =
      'true';

    image.src = fallback;
  }


  function configureImage(image) {
    if (
      !image ||
      processedImages.has(image)
    ) {
      return;
    }

    processedImages.add(image);

    const isPriorityImage =
      image.dataset.priority ===
        'high' ||
      image.getAttribute(
        'fetchpriority'
      ) === 'high';

    if (isPriorityImage) {
      image.loading = 'eager';

      image.setAttribute(
        'fetchpriority',
        'high'
      );
    } else {
      if (
        !image.hasAttribute(
          'loading'
        )
      ) {
        image.loading = 'lazy';
      }

      image.setAttribute(
        'fetchpriority',
        'low'
      );
    }

    if (
      !image.hasAttribute(
        'decoding'
      )
    ) {
      image.decoding = 'async';
    }

    image.addEventListener(
      'load',
      function () {
        markImageLoaded(image);
      },
      {
        once: true
      }
    );

    image.addEventListener(
      'error',
      function () {
        handleImageError(image);
      }
    );

    if (image.complete) {
      if (
        image.naturalWidth > 0
      ) {
        markImageLoaded(image);
      } else {
        handleImageError(image);
      }
    }
  }


  function scanImages(root) {
    const target =
      root || document;

    if (
      target instanceof
      HTMLImageElement
    ) {
      configureImage(target);

      return;
    }

    target
      .querySelectorAll('img')
      .forEach(configureImage);
  }


  function loadBackgroundImage(
    element
  ) {
    const source =
      element.dataset.bg;

    if (!source) {
      return;
    }

    const loader =
      new Image();

    loader.decoding = 'async';

    loader.onload =
      function () {
        element.style.backgroundImage =
          `url("${source}")`;

        element.classList.add(
          'background-loaded'
        );

        delete element.dataset.bg;
      };

    loader.onerror =
      function () {
        const fallback =
          element.dataset.fallbackBg ||
          DEFAULT_FALLBACK;

        element.style.backgroundImage =
          `url("${fallback}")`;

        element.classList.add(
          'background-loaded'
        );

        delete element.dataset.bg;
      };

    loader.src = source;
  }


  function setupLazyBackgrounds() {
    const elements =
      document.querySelectorAll(
        '[data-bg]'
      );

    if (
      !('IntersectionObserver' in window)
    ) {
      elements.forEach(
        loadBackgroundImage
      );

      return;
    }

    const observer =
      new IntersectionObserver(
        function (
          entries,
          instance
        ) {
          entries.forEach(
            function (entry) {
              if (
                !entry.isIntersecting
              ) {
                return;
              }

              loadBackgroundImage(
                entry.target
              );

              instance.unobserve(
                entry.target
              );
            }
          );
        },
        {
          rootMargin: '250px 0px'
        }
      );

    elements.forEach(
      function (element) {
        observer.observe(element);
      }
    );
  }


  function observeDynamicImages() {
    if (
      !document.body ||
      !window.MutationObserver
    ) {
      return;
    }

    const observer =
      new MutationObserver(
        function (mutations) {
          mutations.forEach(
            function (mutation) {
              mutation.addedNodes
                .forEach(
                  function (node) {
                    if (
                      node.nodeType !==
                      Node.ELEMENT_NODE
                    ) {
                      return;
                    }

                    scanImages(node);
                  }
                );
            }
          );
        }
      );

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }


  function initialize() {
    scanImages(document);

    setupLazyBackgrounds();

    observeDynamicImages();
  }


  window.ImageUtils = {
    initialize:
      initialize,

    scan:
      scanImages,

    configure:
      configureImage
  };


  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );
  } else {
    initialize();
  }
})(window);