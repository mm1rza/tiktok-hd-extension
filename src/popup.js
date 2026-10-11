(function () {

  const STATES = {
    ready:   { cls: '',        title: 'SYSTEM READY',    sub: 'Waiting for status' },
    active:  { cls: 'active',  title: 'SYSTEM ACTIVE',   sub: ''                   },
    off:     { cls: '',        title: 'SYSTEM OFF',      sub: 'Bypass is disabled' },
    blocked: { cls: 'blocked', title: 'UPDATE REQUIRED', sub: 'Please update now'  }
  };

  let _state = 'ready';
  let _expandTimer = null;

  function getEl(id) { return document.getElementById(id); }

  function applyState(badge) {
    if (!badge) return;
    const s = STATES[_state] || STATES.ready;

    badge.classList.remove('active', 'blocked');
    if (s.cls) badge.classList.add(s.cls);

    badge.classList.toggle('is-active', _state === 'active');
    badge.classList.toggle('is-blocked', _state === 'blocked');

    const title = badge.querySelector('.notif-title');
    const sub = badge.querySelector('.notif-sub');
    if (title) title.textContent = s.title;
    if (sub) sub.textContent = s.sub;

    badge.classList.remove('ring');
    void badge.offsetWidth;
    badge.classList.add('ring');
  }

  window._badge_update = function (status) {
    const badge = getEl('fps-badge');
    if (!badge) return;
    _state = status === 'active' ? 'active' : 'off';
    badge.dataset.status = status;
    applyState(badge);
  };

  window.setBadgeBlocked = function () {
    const badge = getEl('fps-badge');
    if (!badge) return;
    _state = 'blocked';
    badge.dataset.status = 'blocked';
    applyState(badge);
  };

  window.showBadge = function () {
    const badge = getEl('fps-badge');
    if (!badge) return;
    applyState(badge);
    badge.style.display = '';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        badge.classList.add('show', 'by-visible');
        clearTimeout(_expandTimer);
        _expandTimer = setTimeout(() => badge.classList.add('expanded'), 300);
      });
    });
  };

  window.hideBadge = function () {
    const badge = getEl('fps-badge');
    if (!badge) return;
    clearTimeout(_expandTimer);
    badge.classList.remove('expanded');
    setTimeout(() => badge.classList.remove('show', 'by-visible'), 400);
  };

  window.setBadgeLanguage = function () { };

  window.addEventListener('senzeyn:blocked', function () {
    window.createBadge && window.createBadge();
    window.showBadge && window.showBadge();
    window.setBadgeBlocked && window.setBadgeBlocked();
  }, { once: true });

  window.createBadge = function () {
    if (getEl('fps-badge')) return;

    const style = document.createElement('style');
    style.id = 'senzeyn-badge-style';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

      #fps-badge {
        --dot: #7c828f;
        --notif-ease: cubic-bezier(0.22, 1, 0.36, 1);
        --green: #00FF6A;
        --red: #fe2c55;

        position: fixed;
        top: 14px;
        left: 50%;
        z-index: 2147483647;
        font-family: 'Space Grotesk', sans-serif;
        user-select: none;
        pointer-events: auto;

        box-sizing: border-box;
        width: fit-content;
        height: 38px;
        padding: 0 10px;
        background: rgba(10, 10, 11, 0.92);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(200, 210, 225, 0.1);
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        outline: none;

        opacity: 0;
        visibility: hidden;
        transform: translateX(-50%) translateY(-8px) scale(0.8);
        transition:
          background 0.25s ease,
          border-color 0.25s ease,
          opacity 0.5s ease,
          transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
          visibility 0s;
      }

      #fps-badge.show {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0) scale(1);
      }

      #fps-badge:hover {
        background: rgba(30, 30, 33, 0.95);
        border-color: rgba(200, 210, 225, 0.22);
      }

      #fps-badge.active  { --dot: var(--green); }
      #fps-badge.blocked { --dot: var(--red); border-color: rgba(254, 44, 85, 0.35); }

      #fps-badge .notif-bell {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        color: rgba(255, 255, 255, 0.651);
        transform: scale(1);
        transform-origin: 50% 20%;
        transition: color 0.2s;
      }

      #fps-badge:hover .notif-bell { color: #fff; }

      #fps-badge.ring .notif-bell { animation: by-notif-ring 0.7s ease-in-out; }

      @keyframes by-notif-ring {
        0%, 100% { transform: scale(1) rotate(0deg);  }
        15%      { transform: scale(1) rotate(14deg); }
        30%      { transform: scale(1) rotate(-12deg);}
        45%      { transform: scale(1) rotate(8deg);  }
        60%      { transform: scale(1) rotate(-6deg); }
        75%      { transform: scale(1) rotate(3deg);  }
      }

      #fps-badge .notif-text {
        display: grid;
        grid-template-columns: 0fr;
        margin-left: 0;
        margin-right: 0;
        opacity: 0;
        transition:
          grid-template-columns 0.4s var(--notif-ease),
          margin-left 0.4s var(--notif-ease),
          margin-right 0.4s var(--notif-ease),
          opacity 0.2s ease;
      }

      #fps-badge.expanded .notif-text {
        grid-template-columns: 1fr;
        margin-left: 10px;
        margin-right: 6px;
        opacity: 1;
        transition:
          grid-template-columns 0.5s var(--notif-ease),
          margin-left 0.5s var(--notif-ease),
          margin-right 0.5s var(--notif-ease),
          opacity 0.4s ease 0.15s;
      }

      #fps-badge .notif-text-inner {
        min-width: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        text-align: left;
        white-space: nowrap;
      }

      #fps-badge .notif-title {
        color: #f5f5f5;
        font-size: 0.68rem;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0.05px;
        transition: color 0.35s ease;
      }

      #fps-badge.active  .notif-title { color: var(--green); }
      #fps-badge.blocked .notif-title { color: var(--red); }

      #fps-badge .notif-sub {
        color: #7c828f;
        font-size: 0.54rem;
        font-weight: 400;
        margin-top: 2px;
        letter-spacing: 0.1px;
        line-height: 1;
      }

      #fps-badge .notif-sub:empty { display: none; }

      #fps-badge .notif-point {
        position: absolute;
        bottom: 8px;
        left: 8px;
        width: 5px;
        height: 5px;
        background-color: var(--dot);
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease;
      }

      #fps-badge .notif-point::before {
        content: "";
        position: absolute;
        width: 1px;
        height: 1px;
        background-color: var(--dot);
        border-radius: 25px;
        animation: by-notif-loop 1.2s ease-out infinite;
      }

      @keyframes by-notif-loop {
        0%   { width: 1px;  height: 1px;  opacity: 1; }
        100% { width: 22px; height: 22px; opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    const s = STATES[_state];
    const badge = document.createElement('div');
    badge.id = 'fps-badge';
    badge.setAttribute('role', 'status');
    badge.innerHTML = `
      <svg class="notif-bell" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z"
              stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke="currentColor"></path>
      </svg>
      <div class="notif-text">
        <div class="notif-text-inner">
          <div class="notif-title" id="by-status-text">${s.title}</div>
          <div class="notif-sub">${s.sub}</div>
        </div>
      </div>
      <div class="notif-point"></div>
    `;
    document.body.appendChild(badge);
  };

  if (document.body) {
    window.createBadge();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      window.createBadge();
    });
  }

})();