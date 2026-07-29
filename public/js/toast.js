(function (window) {
  'use strict';

  const DEFAULT_DURATION = 3500;

  const TYPE_CONFIG = {
    success: {
      title: 'Thành công',
      icon: '✓'
    },

    error: {
      title: 'Có lỗi xảy ra',
      icon: '×'
    },

    warning: {
      title: 'Cảnh báo',
      icon: '!'
    },

    info: {
      title: 'Thông báo',
      icon: 'i'
    }
  };


  function ensureContainer() {
    let container =
      document.getElementById(
        'appToastContainer'
      );

    if (container) {
      return container;
    }

    container =
      document.createElement('div');

    container.id =
      'appToastContainer';

    container.className =
      'app-toast-container';

    container.setAttribute(
      'aria-live',
      'polite'
    );

    container.setAttribute(
      'aria-atomic',
      'false'
    );

    document.body.appendChild(
      container
    );

    return container;
  }


  function normalizeOptions(
    options,
    defaultType
  ) {
    if (
      typeof options === 'string'
    ) {
      return {
        message: options,
        type:
          defaultType || 'info'
      };
    }

    return {
      ...(options || {}),

      type:
        options &&
        options.type
          ? options.type
          : defaultType || 'info'
    };
  }


  function removeToast(toast) {
    if (
      !toast ||
      toast.dataset.removing ===
        'true'
    ) {
      return;
    }

    toast.dataset.removing =
      'true';

    toast.classList.add(
      'is-leaving'
    );

    window.setTimeout(
      function () {
        toast.remove();
      },
      220
    );
  }


  function show(options) {
    const settings =
      normalizeOptions(
        options,
        'info'
      );

    const type =
      TYPE_CONFIG[settings.type]
        ? settings.type
        : 'info';

    const config =
      TYPE_CONFIG[type];

    const message =
      String(
        settings.message || ''
      ).trim();

    if (!message) {
      return null;
    }

    const duration =
      Number.isFinite(
        Number(settings.duration)
      )
        ? Number(settings.duration)
        : DEFAULT_DURATION;

    const closable =
      settings.closable !== false;

    const toast =
      document.createElement(
        'article'
      );

    toast.className =
      `app-toast app-toast-${type}`;

    toast.setAttribute(
      'role',
      type === 'error'
        ? 'alert'
        : 'status'
    );

    const icon =
      document.createElement(
        'span'
      );

    icon.className =
      'app-toast-icon';

    icon.textContent =
      settings.icon ||
      config.icon;

    const content =
      document.createElement(
        'div'
      );

    content.className =
      'app-toast-content';

    const title =
      document.createElement(
        'strong'
      );

    title.className =
      'app-toast-title';

    title.textContent =
      settings.title ||
      config.title;

    const description =
      document.createElement('p');

    description.className =
      'app-toast-message';

    description.textContent =
      message;

    content.append(
      title,
      description
    );

    const closeButton =
      document.createElement(
        'button'
      );

    closeButton.type = 'button';

    closeButton.className =
      'app-toast-close';

    closeButton.setAttribute(
      'aria-label',
      'Đóng thông báo'
    );

    closeButton.textContent = '×';

    closeButton.style.display =
      closable ? '' : 'none';

    closeButton.addEventListener(
      'click',
      function () {
        removeToast(toast);
      }
    );

    toast.append(
      icon,
      content,
      closeButton
    );

    let timerId = null;
    let startedAt = null;
    let remaining = duration;

    const progress =
      document.createElement(
        'span'
      );

    progress.className =
      'app-toast-progress';

    if (duration > 0) {
      progress.style.animationDuration =
        `${duration}ms`;

      toast.appendChild(progress);
    }

    function startTimer() {
      if (duration <= 0) {
        return;
      }

      startedAt = Date.now();

      timerId =
        window.setTimeout(
          function () {
            removeToast(toast);
          },
          remaining
        );
    }

    function pauseTimer() {
      if (
        duration <= 0 ||
        !timerId
      ) {
        return;
      }

      window.clearTimeout(
        timerId
      );

      timerId = null;

      remaining -=
        Date.now() - startedAt;

      progress.style.animationPlayState =
        'paused';
    }

    function resumeTimer() {
      if (
        duration <= 0 ||
        timerId ||
        remaining <= 0
      ) {
        return;
      }

      progress.style.animationPlayState =
        'running';

      startTimer();
    }

    toast.addEventListener(
      'mouseenter',
      pauseTimer
    );

    toast.addEventListener(
      'mouseleave',
      resumeTimer
    );

    const container =
      ensureContainer();

    container.appendChild(toast);

    startTimer();

    return {
      element: toast,

      close: function () {
        removeToast(toast);
      }
    };
  }


  function clear() {
    const container =
      document.getElementById(
        'appToastContainer'
      );

    if (!container) {
      return;
    }

    container
      .querySelectorAll(
        '.app-toast'
      )
      .forEach(removeToast);
  }


  window.Toast = {
    show: show,

    success: function (options) {
      return show(
        normalizeOptions(
          options,
          'success'
        )
      );
    },

    error: function (options) {
      return show(
        normalizeOptions(
          options,
          'error'
        )
      );
    },

    warning: function (options) {
      return show(
        normalizeOptions(
          options,
          'warning'
        )
      );
    },

    info: function (options) {
      return show(
        normalizeOptions(
          options,
          'info'
        )
      );
    },

    clear: clear
  };
})(window);