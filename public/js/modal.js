(function (window) {
  'use strict';

  const TYPE_CONFIG = {
    info: {
      icon: 'i',
      title: 'Thông báo'
    },

    success: {
      icon: '✓',
      title: 'Thành công'
    },

    warning: {
      icon: '!',
      title: 'Xác nhận thao tác'
    },

    danger: {
      icon: '!',
      title: 'Xác nhận thao tác'
    }
  };

  let activeClose = null;


  function ensureRoot() {
    let root =
      document.getElementById(
        'appModalRoot'
      );

    if (root) {
      return root;
    }

    root =
      document.createElement('div');

    root.id = 'appModalRoot';

    root.className =
      'app-modal-root';

    document.body.appendChild(
      root
    );

    return root;
  }


  function normalizeOptions(
    options
  ) {
    if (
      typeof options === 'string'
    ) {
      return {
        message: options
      };
    }

    return options || {};
  }


  function open(options) {
    const settings =
      normalizeOptions(options);

    const type =
      TYPE_CONFIG[settings.type]
        ? settings.type
        : 'info';

    const config =
      TYPE_CONFIG[type];

    const mode =
      settings.mode === 'alert'
        ? 'alert'
        : 'confirm';

    if (activeClose) {
      activeClose(false);
    }

    return new Promise(
      function (resolve) {
        const root =
          ensureRoot();

        root.innerHTML = '';

        root.className =
          'app-modal-root show';

        root.setAttribute(
          'aria-hidden',
          'false'
        );

        const overlay =
          document.createElement(
            'div'
          );

        overlay.className =
          'app-modal-overlay';

        const dialog =
          document.createElement(
            'section'
          );

        dialog.className =
          `app-modal-dialog app-modal-${type}`;

        dialog.setAttribute(
          'role',
          'dialog'
        );

        dialog.setAttribute(
          'aria-modal',
          'true'
        );

        const heading =
          document.createElement(
            'div'
          );

        heading.className =
          'app-modal-heading';

        const icon =
          document.createElement(
            'div'
          );

        icon.className =
          'app-modal-icon';

        icon.textContent =
          settings.icon ||
          config.icon;

        const textBox =
          document.createElement(
            'div'
          );

        const title =
          document.createElement(
            'h2'
          );

        title.className =
          'app-modal-title';

        title.textContent =
          settings.title ||
          config.title;

        const message =
          document.createElement(
            'p'
          );

        message.className =
          'app-modal-message';

        message.textContent =
          settings.message || '';

        textBox.append(
          title,
          message
        );

        heading.append(
          icon,
          textBox
        );

        const actions =
          document.createElement(
            'div'
          );

        actions.className =
          'app-modal-actions';

        const cancelButton =
          document.createElement(
            'button'
          );

        cancelButton.type =
          'button';

        cancelButton.className =
          'app-modal-button app-modal-cancel';

        cancelButton.textContent =
          settings.cancelText ||
          'Hủy';

        const confirmButton =
          document.createElement(
            'button'
          );

        confirmButton.type =
          'button';

        confirmButton.className =
          'app-modal-button app-modal-confirm';

        confirmButton.textContent =
          settings.confirmText ||
          (
            mode === 'alert'
              ? 'Đồng ý'
              : 'Xác nhận'
          );

        if (mode === 'confirm') {
          actions.appendChild(
            cancelButton
          );
        }

        actions.appendChild(
          confirmButton
        );

        dialog.append(
          heading,
          actions
        );

        root.append(
          overlay,
          dialog
        );

        document.body.classList.add(
          'app-modal-open'
        );

        const previousFocus =
          document.activeElement;

        let completed = false;

        function cleanup(result) {
          if (completed) {
            return;
          }

          completed = true;

          document.removeEventListener(
            'keydown',
            handleKeydown
          );

          root.classList.remove(
            'show'
          );

          root.setAttribute(
            'aria-hidden',
            'true'
          );

          root.innerHTML = '';

          document.body.classList.remove(
            'app-modal-open'
          );

          activeClose = null;

          if (
            previousFocus &&
            typeof previousFocus.focus ===
              'function'
          ) {
            previousFocus.focus();
          }

          resolve(result);
        }

        activeClose = cleanup;

        function handleKeydown(
          event
        ) {
          if (
            event.key === 'Escape' &&
            settings.closeOnEscape !==
              false
          ) {
            cleanup(false);

            return;
          }

          if (event.key !== 'Tab') {
            return;
          }

          const buttons =
            Array.from(
              dialog.querySelectorAll(
                'button:not([disabled])'
              )
            );

          if (!buttons.length) {
            return;
          }

          const first =
            buttons[0];

          const last =
            buttons[
              buttons.length - 1
            ];

          if (
            event.shiftKey &&
            document.activeElement ===
              first
          ) {
            event.preventDefault();

            last.focus();
          } else if (
            !event.shiftKey &&
            document.activeElement ===
              last
          ) {
            event.preventDefault();

            first.focus();
          }
        }

        confirmButton.addEventListener(
          'click',
          function () {
            cleanup(true);
          }
        );

        cancelButton.addEventListener(
          'click',
          function () {
            cleanup(false);
          }
        );

        overlay.addEventListener(
          'click',
          function () {
            if (
              settings.closeOnOverlay ===
              false
            ) {
              return;
            }

            cleanup(false);
          }
        );

        document.addEventListener(
          'keydown',
          handleKeydown
        );

        window.setTimeout(
          function () {
            confirmButton.focus();
          },
          20
        );
      }
    );
  }


  function confirm(options) {
    return open({
      ...normalizeOptions(options),
      mode: 'confirm'
    });
  }


  function alert(options) {
    return open({
      ...normalizeOptions(options),
      mode: 'alert'
    });
  }


  function close() {
    if (activeClose) {
      activeClose(false);
    }
  }


  window.AppModal = {
    open: open,
    confirm: confirm,
    alert: alert,
    close: close
  };
})(window);