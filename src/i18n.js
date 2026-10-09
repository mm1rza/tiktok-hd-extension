(function () {
  var STORAGE_KEY = 'senzeyn_lang';
  var DEFAULT_LANG = 'en';

  var dict = {
    en: {
      notif_checking: 'Checking...',
      notif_wait: 'Please wait',
      notif_active_title: 'System Active',
      notif_active_sub: 'Ready to Upload ↗',
      notif_ready_title: 'System Ready',
      notif_ready_sub: 'Open TikTok Upload Page ↗',
      subtitle: 'Tools For High Quality TikTok Upload',
      features: 'System Features',
      f1: 'High Quality Upload Tiktok',
      f2: 'Full Quality Video Resolution',
      f3: 'Lossless Upload 0 Compression',
      f4: 'Promote/Tag Song & Music Support',
      f5: 'Support Mobile & PC',
      bypass_sub: 'Full High Quality Uploads',
      watermark_title: 'Watermark',
      watermark_sub: 'Add watermark in Caption',
      upload_page: 'Tiktok Upload Page',
      more_info: 'More Information'
    },
    id: {
      notif_checking: 'Memeriksa...',
      notif_wait: 'Harap tunggu',
      notif_active_title: 'Sistem Aktif',
      notif_active_sub: 'Siap Upload ↗',
      notif_ready_title: 'Sistem Siap',
      notif_ready_sub: 'Buka Halaman Upload TikTok ↗',
      subtitle: 'Alat Upload TikTok Kualitas Tinggi',
      features: 'Fitur Sistem',
      f1: 'Upload TikTok Kualitas Tinggi',
      f2: 'Resolusi Video Kualitas Penuh',
      f3: 'Upload Lossless, Tanpa Kompresi',
      f4: 'Dukungan Promosi/Tag Lagu & Musik',
      f5: 'Mendukung Mobile & PC',
      bypass_sub: 'Upload Kualitas Tinggi Penuh',
      watermark_title: 'Watermark',
      watermark_sub: 'Tambah watermark di Caption',
      upload_page: 'Halaman Upload TikTok',
      more_info: 'Informasi Lainnya'
    }
  };

  var lang = DEFAULT_LANG;
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && dict[saved]) lang = saved;
  } catch (e) {}

  function t(key) {
    return (dict[lang] && dict[lang][key]) || dict[DEFAULT_LANG][key] || key;
  }

  function apply() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    var label = document.getElementById('langBtnLabel');
    if (label) label.textContent = lang.toUpperCase();
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
  }

  function setLang(next) {
    if (!dict[next]) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    apply();
  }

  window.i18n = {
    t: t,
    getLang: function () { return lang; },
    setLang: setLang
  };

  document.addEventListener('DOMContentLoaded', function () {
    apply();
    var btn = document.getElementById('langBtn');
    if (btn) btn.addEventListener('click', function () {
      setLang(lang === 'en' ? 'id' : 'en');
    });
  });
})();