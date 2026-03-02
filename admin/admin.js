'use strict';

// ── Токен и проверка авторизации ───────────────────────────
var TOKEN = localStorage.getItem('adminToken');

if (!TOKEN) {
  window.location.href = '/admin/';
}

// ── Универсальный fetch с Authorization ───────────────────
async function apiFetch(url, options) {
  options = options || {};
  options.headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  }
  options.headers['Authorization'] = 'Bearer ' + TOKEN;

  var res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/';
    return;
  }
  return res;
}

// ── Алерт ─────────────────────────────────────────────────
function showAlert(containerId, message, type) {
  var el = document.getElementById(containerId);
  if (!el) return;
  type = type || 'error';
  el.innerHTML = '<div class="admin-alert admin-alert--' + type + '">' + escapeHtml(message) + '</div>';
  setTimeout(function() { el.innerHTML = ''; }, 5000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Переключение разделов ──────────────────────────────────
var currentSection = 'products';

var sectionTitles = {
  products: 'Товары',
  subcategories: 'Подразделы',
  categories: 'Категории',
  content: 'Тексты сайта',
};

function switchSection(section) {
  document.querySelectorAll('.section-view').forEach(function(el) {
    el.classList.remove('is-active');
  });
  document.querySelectorAll('.admin-sidebar__nav-item').forEach(function(el) {
    el.classList.remove('is-active');
  });

  var sectionEl = document.getElementById('section-' + section);
  if (sectionEl) sectionEl.classList.add('is-active');

  var navEl = document.querySelector('[data-section="' + section + '"]');
  if (navEl) navEl.classList.add('is-active');

  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = sectionTitles[section] || section;

  currentSection = section;

  // Закрыть sidebar на мобилке
  document.getElementById('sidebar').classList.remove('is-open');

  // Загрузить данные секции
  if (section === 'products') loadProducts();
  if (section === 'subcategories') loadSubcategories();
  if (section === 'categories') loadCategories();
  if (section === 'content') loadContent();
}

document.querySelectorAll('.admin-sidebar__nav-item').forEach(function(btn) {
  btn.addEventListener('click', function() {
    switchSection(this.dataset.section);
  });
});

// ── Мобильный toggle sidebar ───────────────────────────────
var sidebarToggle = document.getElementById('sidebar-toggle');
if (sidebarToggle) {
  sidebarToggle.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('is-open');
  });
}

// ── Logout ─────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', function() {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/';
});

// ── Закрытие модалок ───────────────────────────────────────
document.querySelectorAll('[data-close-modal]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var modalId = this.dataset.closeModal;
    closeModal(modalId);
  });
});

document.querySelectorAll('.admin-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('is-open');
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('is-open');
}

// ── Глобальные данные ──────────────────────────────────────
var allCategories = [];
var allSubcategories = [];

// ── Загрузить мета (email, категории) ─────────────────────
async function loadMeta() {
  try {
    var res = await apiFetch('/admin/api/me');
    if (res && res.ok) {
      var data = await res.json();
      var emailEl = document.getElementById('user-email');
      if (emailEl) emailEl.textContent = data.email || '';
    }
  } catch(e) {}

  try {
    var res2 = await apiFetch('/admin/api/categories');
    if (res2 && res2.ok) {
      allCategories = await res2.json();
    }
  } catch(e) {}

  try {
    var res3 = await apiFetch('/admin/api/subcategories');
    if (res3 && res3.ok) {
      allSubcategories = await res3.json();
    }
  } catch(e) {}
}

// ──────────────────────────────────────────────────────────
// ТОВАРЫ
// ──────────────────────────────────────────────────────────

var productsPage = 1;
var productsSearch = '';

async function loadProducts() {
  var tbody = document.getElementById('products-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

  try {
    var url = '/admin/api/products?page=' + productsPage + '&limit=20&search=' + encodeURIComponent(productsSearch);
    var res = await apiFetch(url);
    if (!res || !res.ok) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Ошибка загрузки</td></tr>';
      return;
    }
    var data = await res.json();
    renderProductsTable(data);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Ошибка: ' + escapeHtml(e.message) + '</td></tr>';
  }
}

function renderProductsTable(data) {
  var tbody = document.getElementById('products-tbody');
  var pag = document.getElementById('products-pagination');

  if (!data.products || data.products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Товары не найдены</td></tr>';
    pag.innerHTML = '';
    return;
  }

  tbody.innerHTML = data.products.map(function(p) {
    return '<tr>' +
      '<td><span class="admin-table__number">' + escapeHtml(p.number) + '</span></td>' +
      '<td>' + escapeHtml(p.name) + '</td>' +
      '<td>' + escapeHtml(p.category_name || '') + ' / ' + escapeHtml(p.subcategory_name || '') + '</td>' +
      '<td>' + Number(p.price).toLocaleString('ru-RU') + ' ₽</td>' +
      '<td>' + (p.is_active ? '<span class="badge badge--active">Активен</span>' : '<span class="badge badge--inactive">Скрыт</span>') + '</td>' +
      '<td><div class="admin-table__actions">' +
        '<button class="btn btn--outline btn--xs" onclick="editProduct(' + p.id + ')">Ред.</button>' +
        '<button class="btn btn--danger btn--xs" onclick="deleteProduct(' + p.id + ', \'' + escapeHtml(p.name) + '\')">Удал.</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  // Пагинация
  pag.innerHTML = '';
  if (data.pages > 1) {
    for (var i = 1; i <= data.pages; i++) {
      var btn = document.createElement('button');
      btn.className = 'admin-pagination__btn' + (i === data.page ? ' is-active' : '');
      btn.textContent = i;
      btn.setAttribute('data-page', i);
      btn.addEventListener('click', function() {
        productsPage = parseInt(this.dataset.page);
        loadProducts();
      });
      pag.appendChild(btn);
    }
    var info = document.createElement('span');
    info.className = 'admin-pagination__info';
    info.textContent = 'Всего: ' + data.total;
    pag.appendChild(info);
  }
}

// Поиск
document.getElementById('product-search-btn').addEventListener('click', function() {
  productsSearch = document.getElementById('product-search').value.trim();
  productsPage = 1;
  loadProducts();
});
document.getElementById('product-search').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    productsSearch = this.value.trim();
    productsPage = 1;
    loadProducts();
  }
});

// Добавить товар
document.getElementById('add-product-btn').addEventListener('click', function() {
  openProductModal(null);
});

// Форма товара
var productImages = [];

function openProductModal(product) {
  productImages = [];
  document.getElementById('pf-id').value = '';
  document.getElementById('pf-number').value = '';
  document.getElementById('pf-name').value = '';
  document.getElementById('pf-slug').value = '';
  document.getElementById('pf-subcategory').value = '';
  document.getElementById('pf-shape').value = '';
  document.getElementById('pf-color').value = '';
  document.getElementById('pf-size').value = '';
  document.getElementById('pf-price').value = '';
  document.getElementById('pf-description').value = '';
  document.getElementById('pf-active').checked = true;
  document.getElementById('pf-images').value = '[]';
  document.getElementById('upload-previews').innerHTML = '';
  document.getElementById('product-modal-alert').innerHTML = '';

  // Заполнить список подразделов
  var subSelect = document.getElementById('pf-subcategory');
  subSelect.innerHTML = '<option value="">Выберите подраздел</option>';
  allCategories.forEach(function(cat) {
    var subs = allSubcategories.filter(function(s) { return s.category_id === cat.id; });
    if (subs.length > 0) {
      var optgroup = document.createElement('optgroup');
      optgroup.label = cat.name;
      subs.forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        optgroup.appendChild(opt);
      });
      subSelect.appendChild(optgroup);
    }
  });

  if (product) {
    document.getElementById('product-modal-title').textContent = 'Редактировать товар';
    document.getElementById('pf-id').value = product.id;
    document.getElementById('pf-number').value = product.number || '';
    document.getElementById('pf-name').value = product.name || '';
    document.getElementById('pf-slug').value = product.slug || '';
    document.getElementById('pf-subcategory').value = product.subcategory_id || '';
    document.getElementById('pf-shape').value = product.shape || '';
    document.getElementById('pf-color').value = product.color || '';
    document.getElementById('pf-size').value = product.size || '';
    document.getElementById('pf-price').value = product.price || '';
    document.getElementById('pf-description').value = product.description || '';
    document.getElementById('pf-active').checked = !!product.is_active;

    productImages = Array.isArray(product.images) ? product.images.slice() : [];
    document.getElementById('pf-images').value = JSON.stringify(productImages);
    renderUploadPreviews();
  } else {
    document.getElementById('product-modal-title').textContent = 'Добавить товар';
  }

  openModal('product-modal');
}

async function editProduct(id) {
  try {
    var res = await apiFetch('/admin/api/products?page=1&limit=1000');
    if (!res || !res.ok) return;
    var data = await res.json();
    var product = data.products.find(function(p) { return p.id === id; });
    if (product) openProductModal(product);
  } catch(e) {}
}

async function deleteProduct(id, name) {
  if (!confirm('Удалить товар "' + name + '"?')) return;
  try {
    var res = await apiFetch('/admin/api/products/' + id, { method: 'DELETE' });
    if (res && res.ok) {
      showAlert('products-alert', 'Товар удалён', 'success');
      loadProducts();
    } else {
      var data = await res.json();
      showAlert('products-alert', data.error || 'Ошибка удаления', 'error');
    }
  } catch(e) {
    showAlert('products-alert', e.message, 'error');
  }
}

// Сохранение формы товара
document.getElementById('product-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('product-form-submit');
  btn.disabled = true;
  btn.textContent = 'Сохраняем...';
  document.getElementById('product-modal-alert').innerHTML = '';

  var id = document.getElementById('pf-id').value;
  var shapeMap = { oval: 'Овальный', round: 'Круглый', rectangular: 'Прямоугольный', heart: 'Сердце', tear: 'Слеза', arch: 'Арка', cross: 'Крест' };
  var colorMap = { white: 'Белый', red: 'Красный', burgundy: 'Бордовый', pink: 'Розовый', yellow: 'Жёлтый', mix: 'Микс' };
  var sizeMap = { small: 'Маленький', medium: 'Средний', large: 'Большой', xl: 'Очень большой' };

  var shape = document.getElementById('pf-shape').value;
  var color = document.getElementById('pf-color').value;
  var size = document.getElementById('pf-size').value;

  var body = {
    subcategory_id: parseInt(document.getElementById('pf-subcategory').value),
    number: document.getElementById('pf-number').value.trim(),
    name: document.getElementById('pf-name').value.trim(),
    slug: document.getElementById('pf-slug').value.trim(),
    shape: shape,
    shape_label: shapeMap[shape] || shape,
    color: color,
    color_label: colorMap[color] || color,
    size: size,
    size_label: sizeMap[size] || size,
    price: parseInt(document.getElementById('pf-price').value) || 0,
    description: document.getElementById('pf-description').value.trim(),
    images: productImages,
    is_active: document.getElementById('pf-active').checked ? 1 : 0,
  };

  try {
    var url = id ? '/admin/api/products/' + id : '/admin/api/products';
    var method = id ? 'PUT' : 'POST';
    var res = await apiFetch(url, { method: method, body: JSON.stringify(body) });
    var data = await res.json();
    if (res.ok) {
      closeModal('product-modal');
      showAlert('products-alert', 'Товар сохранён', 'success');
      loadProducts();
    } else {
      document.getElementById('product-modal-alert').innerHTML =
        '<div class="admin-alert admin-alert--error">' + escapeHtml(data.error || 'Ошибка') + '</div>';
    }
  } catch(err) {
    document.getElementById('product-modal-alert').innerHTML =
      '<div class="admin-alert admin-alert--error">' + escapeHtml(err.message) + '</div>';
  }

  btn.disabled = false;
  btn.textContent = 'Сохранить';
});

// Авто-генерация slug из номера
document.getElementById('pf-number').addEventListener('input', function() {
  var num = this.value;
  var slug = num
    .replace('В-', 'v-').replace('К-', 'k-').replace('П-', 'p-').replace('Г-', 'g-')
    .toLowerCase().replace(/[^a-z0-9-]/g, '-');
  document.getElementById('pf-slug').value = slug;
});

// ── Загрузка фото ────────────────────────────────────────

var uploadZone = document.getElementById('upload-zone');
var uploadInput = document.getElementById('pf-image-file');

uploadZone.addEventListener('click', function(e) {
  if (e.target !== uploadInput) uploadInput.click();
});

uploadZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  uploadZone.classList.add('is-dragover');
});

uploadZone.addEventListener('dragleave', function() {
  uploadZone.classList.remove('is-dragover');
});

uploadZone.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadZone.classList.remove('is-dragover');
  if (e.dataTransfer.files.length) {
    uploadFiles(e.dataTransfer.files);
  }
});

uploadInput.addEventListener('change', function() {
  if (this.files.length) {
    uploadFiles(this.files);
    this.value = '';
  }
});

async function uploadFiles(files) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var formData = new FormData();
    formData.append('image', file);
    try {
      var res = await apiFetch('/admin/api/upload', { method: 'POST', body: formData });
      if (res && res.ok) {
        var data = await res.json();
        productImages.push(data.url);
        document.getElementById('pf-images').value = JSON.stringify(productImages);
        renderUploadPreviews();
      }
    } catch(e) {
      console.error('Upload error:', e);
    }
  }
}

function renderUploadPreviews() {
  var container = document.getElementById('upload-previews');
  container.innerHTML = productImages.map(function(url, idx) {
    return '<div class="upload-preview">' +
      '<img src="' + escapeHtml(url) + '" alt="Фото ' + (idx + 1) + '">' +
      '<button type="button" class="upload-preview__remove" data-idx="' + idx + '" title="Удалить">&times;</button>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.upload-preview__remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(this.dataset.idx);
      productImages.splice(idx, 1);
      document.getElementById('pf-images').value = JSON.stringify(productImages);
      renderUploadPreviews();
    });
  });
}

// ──────────────────────────────────────────────────────────
// ПОДРАЗДЕЛЫ
// ──────────────────────────────────────────────────────────

async function loadSubcategories() {
  var tbody = document.getElementById('subcategories-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

  try {
    var res = await apiFetch('/admin/api/subcategories');
    if (!res || !res.ok) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Ошибка загрузки</td></tr>';
      return;
    }
    var data = await res.json();
    allSubcategories = data;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Подразделы не найдены</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(function(s) {
      return '<tr>' +
        '<td>' + s.id + '</td>' +
        '<td>' + escapeHtml(s.category_name || s.category_id) + '</td>' +
        '<td>' + escapeHtml(s.name) + '</td>' +
        '<td><code>' + escapeHtml(s.slug) + '</code></td>' +
        '<td>' + s.order_idx + '</td>' +
        '<td><div class="admin-table__actions">' +
          '<button class="btn btn--outline btn--xs" onclick="editSubcategory(' + s.id + ')">Ред.</button>' +
          '<button class="btn btn--danger btn--xs" onclick="deleteSubcategory(' + s.id + ', \'' + escapeHtml(s.name) + '\')">Удал.</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Ошибка: ' + escapeHtml(e.message) + '</td></tr>';
  }
}

document.getElementById('add-sub-btn').addEventListener('click', function() {
  openSubModal(null);
});

function openSubModal(sub) {
  document.getElementById('sf-id').value = '';
  document.getElementById('sf-category').value = '';
  document.getElementById('sf-name').value = '';
  document.getElementById('sf-slug').value = '';
  document.getElementById('sf-description').value = '';
  document.getElementById('sf-order').value = '0';
  document.getElementById('sub-modal-alert').innerHTML = '';

  var catSelect = document.getElementById('sf-category');
  catSelect.innerHTML = '<option value="">Выберите категорию</option>';
  allCategories.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    catSelect.appendChild(opt);
  });

  if (sub) {
    document.getElementById('sub-modal-title').textContent = 'Редактировать подраздел';
    document.getElementById('sf-id').value = sub.id;
    document.getElementById('sf-category').value = sub.category_id;
    document.getElementById('sf-name').value = sub.name || '';
    document.getElementById('sf-slug').value = sub.slug || '';
    document.getElementById('sf-description').value = sub.description || '';
    document.getElementById('sf-order').value = sub.order_idx || 0;
  } else {
    document.getElementById('sub-modal-title').textContent = 'Добавить подраздел';
  }

  openModal('sub-modal');
}

function editSubcategory(id) {
  var sub = allSubcategories.find(function(s) { return s.id === id; });
  if (sub) openSubModal(sub);
}

async function deleteSubcategory(id, name) {
  if (!confirm('Удалить подраздел "' + name + '"? Все товары в нём также будут удалены.')) return;
  try {
    var res = await apiFetch('/admin/api/subcategories/' + id, { method: 'DELETE' });
    if (res && res.ok) {
      showAlert('subcategories-alert', 'Подраздел удалён', 'success');
      loadSubcategories();
    } else {
      var data = await res.json();
      showAlert('subcategories-alert', data.error || 'Ошибка удаления', 'error');
    }
  } catch(e) {
    showAlert('subcategories-alert', e.message, 'error');
  }
}

document.getElementById('sub-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('sub-form-submit');
  btn.disabled = true;
  btn.textContent = 'Сохраняем...';

  var id = document.getElementById('sf-id').value;
  var body = {
    category_id: document.getElementById('sf-category').value,
    name: document.getElementById('sf-name').value.trim(),
    slug: document.getElementById('sf-slug').value.trim(),
    description: document.getElementById('sf-description').value.trim(),
    order_idx: parseInt(document.getElementById('sf-order').value) || 0,
  };

  try {
    var url = id ? '/admin/api/subcategories/' + id : '/admin/api/subcategories';
    var method = id ? 'PUT' : 'POST';
    var res = await apiFetch(url, { method: method, body: JSON.stringify(body) });
    var data = await res.json();
    if (res.ok) {
      closeModal('sub-modal');
      showAlert('subcategories-alert', 'Подраздел сохранён', 'success');
      await loadSubcategories();
    } else {
      document.getElementById('sub-modal-alert').innerHTML =
        '<div class="admin-alert admin-alert--error">' + escapeHtml(data.error || 'Ошибка') + '</div>';
    }
  } catch(err) {
    document.getElementById('sub-modal-alert').innerHTML =
      '<div class="admin-alert admin-alert--error">' + escapeHtml(err.message) + '</div>';
  }

  btn.disabled = false;
  btn.textContent = 'Сохранить';
});

// ──────────────────────────────────────────────────────────
// КАТЕГОРИИ
// ──────────────────────────────────────────────────────────

async function loadCategories() {
  var tbody = document.getElementById('categories-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Загрузка...</td></tr>';

  try {
    var res = await apiFetch('/admin/api/categories');
    if (!res || !res.ok) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Ошибка загрузки</td></tr>';
      return;
    }
    var data = await res.json();
    allCategories = data;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Категории не найдены</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(function(c) {
      return '<tr>' +
        '<td><code>' + escapeHtml(c.id) + '</code></td>' +
        '<td>' + escapeHtml(c.name) + '</td>' +
        '<td><code>' + escapeHtml(c.slug) + '</code></td>' +
        '<td>' + escapeHtml(c.description || '—') + '</td>' +
        '<td>' + c.order_idx + '</td>' +
        '<td><div class="admin-table__actions">' +
          '<button class="btn btn--outline btn--xs" onclick="editCategory(\'' + escapeHtml(c.id) + '\')">Ред.</button>' +
          '<button class="btn btn--danger btn--xs" onclick="deleteCategory(\'' + escapeHtml(c.id) + '\', \'' + escapeHtml(c.name) + '\')">Удал.</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Ошибка: ' + escapeHtml(e.message) + '</td></tr>';
  }
}

document.getElementById('add-cat-btn').addEventListener('click', function() {
  openCatModal(null);
});

function openCatModal(cat) {
  document.getElementById('cf-id').value = '';
  document.getElementById('cf-id-field').value = '';
  document.getElementById('cf-name').value = '';
  document.getElementById('cf-slug').value = '';
  document.getElementById('cf-description').value = '';
  document.getElementById('cf-order').value = '0';
  document.getElementById('cat-modal-alert').innerHTML = '';

  var idField = document.getElementById('cf-id-field');

  if (cat) {
    document.getElementById('cat-modal-title').textContent = 'Редактировать категорию';
    document.getElementById('cf-id').value = cat.id;
    idField.value = cat.id;
    idField.disabled = true; // ID нельзя менять после создания
    document.getElementById('cf-name').value = cat.name || '';
    document.getElementById('cf-slug').value = cat.slug || '';
    document.getElementById('cf-description').value = cat.description || '';
    document.getElementById('cf-order').value = cat.order_idx || 0;
  } else {
    document.getElementById('cat-modal-title').textContent = 'Добавить категорию';
    idField.disabled = false;
  }

  openModal('cat-modal');
}

function editCategory(id) {
  var cat = allCategories.find(function(c) { return c.id === id; });
  if (cat) openCatModal(cat);
}

async function deleteCategory(id, name) {
  if (!confirm('Удалить категорию "' + name + '"?\nВсе подразделы и товары в ней тоже будут удалены!')) return;
  try {
    var res = await apiFetch('/admin/api/categories/' + id, { method: 'DELETE' });
    if (res && res.ok) {
      showAlert('categories-alert', 'Категория удалена', 'success');
      loadCategories();
    } else {
      var data = await res.json();
      showAlert('categories-alert', data.error || 'Ошибка удаления', 'error');
    }
  } catch(e) {
    showAlert('categories-alert', e.message, 'error');
  }
}

document.getElementById('cat-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('cat-form-submit');
  btn.disabled = true;
  btn.textContent = 'Сохраняем...';
  document.getElementById('cat-modal-alert').innerHTML = '';

  var existingId = document.getElementById('cf-id').value;
  var body = {
    id:          document.getElementById('cf-id-field').value.trim(),
    name:        document.getElementById('cf-name').value.trim(),
    slug:        document.getElementById('cf-slug').value.trim(),
    description: document.getElementById('cf-description').value.trim(),
    order_idx:   parseInt(document.getElementById('cf-order').value) || 0,
  };

  try {
    var url    = existingId ? '/admin/api/categories/' + existingId : '/admin/api/categories';
    var method = existingId ? 'PUT' : 'POST';
    var res    = await apiFetch(url, { method: method, body: JSON.stringify(body) });
    var data   = await res.json();
    if (res.ok) {
      closeModal('cat-modal');
      showAlert('categories-alert', 'Категория сохранена', 'success');
      loadCategories();
    } else {
      document.getElementById('cat-modal-alert').innerHTML =
        '<div class="admin-alert admin-alert--error">' + escapeHtml(data.error || 'Ошибка') + '</div>';
    }
  } catch(err) {
    document.getElementById('cat-modal-alert').innerHTML =
      '<div class="admin-alert admin-alert--error">' + escapeHtml(err.message) + '</div>';
  }

  btn.disabled = false;
  btn.textContent = 'Сохранить';
});

// ──────────────────────────────────────────────────────────
// ТЕКСТЫ САЙТА
// ──────────────────────────────────────────────────────────

async function loadContent() {
  var container = document.getElementById('content-editor');
  container.innerHTML = '<div class="loading">Загрузка...</div>';

  try {
    var res = await apiFetch('/admin/api/content');
    if (!res || !res.ok) {
      container.innerHTML = '<div class="empty-msg">Ошибка загрузки</div>';
      return;
    }
    var items = await res.json();

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-msg">Записи не найдены</div>';
      return;
    }

    container.innerHTML = items.map(function(item) {
      var isLong = item.value && item.value.length > 80;
      var inputHtml = isLong
        ? '<textarea class="content-textarea" data-key="' + escapeHtml(item.key) + '" rows="3">' + escapeHtml(item.value) + '</textarea>'
        : '<input type="text" class="content-input" data-key="' + escapeHtml(item.key) + '" value="' + escapeHtml(item.value || '') + '">';
      return '<div class="content-editor__item">' +
        '<div class="content-editor__label">' + escapeHtml(item.label || item.key) + '</div>' +
        '<div class="content-editor__key">' + escapeHtml(item.key) + '</div>' +
        inputHtml +
        '<div class="content-editor__actions">' +
          '<button class="btn btn--primary btn--sm" data-save-key="' + escapeHtml(item.key) + '">Сохранить</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Привязка кнопок сохранения
    container.querySelectorAll('[data-save-key]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var key = this.dataset.saveKey;
        var inputEl = container.querySelector('[data-key="' + key + '"]');
        if (!inputEl) return;
        var value = inputEl.value;
        this.disabled = true;
        this.textContent = 'Сохраняем...';
        try {
          var res2 = await apiFetch('/admin/api/content/' + encodeURIComponent(key), {
            method: 'PUT',
            body: JSON.stringify({ value: value })
          });
          if (res2 && res2.ok) {
            showAlert('content-alert', 'Сохранено: ' + key, 'success');
          } else {
            var d = await res2.json();
            showAlert('content-alert', d.error || 'Ошибка', 'error');
          }
        } catch(err) {
          showAlert('content-alert', err.message, 'error');
        }
        this.disabled = false;
        this.textContent = 'Сохранить';
      });
    });

  } catch(e) {
    container.innerHTML = '<div class="empty-msg">Ошибка: ' + escapeHtml(e.message) + '</div>';
  }
}

// ── Инициализация ──────────────────────────────────────────
(async function init() {
  await loadMeta();
  loadProducts();
})();
