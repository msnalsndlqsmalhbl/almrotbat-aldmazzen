// ============================================
// 🏭 مصنع الصندل - Main App (الإصدار 3.3)
// الجزء 1: الأساسيات + الشعار + الموظفون + الأقسام + الحضور
// ============================================

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

// ============================================
// دوال مساعدة
// ============================================
function toast(msg, type='success') {
  const c = $('#toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function fmt(n, currency='SDG') {
  if (n == null || isNaN(n)) n = 0;
  const num = Number(n).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2});
  return currency === 'USD' ? `$ ${num}` : `${num} ج.س`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', {year:'numeric',month:'2-digit',day:'2-digit'});
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function getWarningLevel(count, max = 3) {
  if (!count || count === 0) return { level: 'none', color: 'gray', icon: '✅', label: 'نظيف' };
  if (count >= max + 1) return { level: 'critical', color: 'danger', icon: '⛔', label: 'خطر' };
  if (count >= max) return { level: 'max', color: 'danger', icon: '🔴', label: 'إنذار نهائي' };
  if (count >= max - 1) return { level: 'high', color: 'warning', icon: '🟠', label: 'تحذير كتابي' };
  return { level: 'low', color: 'warning', icon: '🟡', label: 'تحذير شفهي' };
}

// ============================================
// ✅ تحديث الشعار واسم المصنع
// ============================================
function updateBrandUI() {
  const logoUrlRaw = Cache.getSetting('factory_logo_url', '');
  const logoUrl = (logoUrlRaw || '').trim();
  const factoryName = (Cache.getSetting('factory_name', 'مصنع الصندل') || 'مصنع الصندل').trim();
  
  console.log('🎨 updateBrandUI:');
  console.log('   Logo URL (raw):', logoUrl || '(فارغ)');
  console.log('   Factory Name:', factoryName);
  
  // ✅ حساب المسار الكامل إذا كان رابطاً نسبياً
  let fullUrl = logoUrl;
  if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
    const basePath = window.location.pathname.replace(/\/[^\/]*$/, '');
    fullUrl = basePath + '/' + logoUrl.replace(/^\//, '');
  }
  
  console.log('   Full URL:', fullUrl || '(فارغ)');
  
  // ✅ الشريط الجانبي
  const sidebarLogo = document.getElementById('sidebarLogo');
  const sidebarName = document.getElementById('sidebarFactoryName');
  
  if (sidebarLogo) {
    if (fullUrl) {
      sidebarLogo.innerHTML = `<img src="${fullUrl}" alt="logo" 
        style="width:44px;height:44px;border-radius:10px;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,.15);display:block"
        onerror="this.onerror=null; this.parentElement.innerHTML='🏭'; this.parentElement.style.fontSize='34px';">`;
      sidebarLogo.style.fontSize = '0';
      sidebarLogo.style.display = 'grid';
      sidebarLogo.style.placeItems = 'center';
    } else {
      sidebarLogo.innerHTML = '🏭';
      sidebarLogo.style.fontSize = '34px';
      sidebarLogo.style.display = '';
      sidebarLogo.style.placeItems = '';
    }
  }
  
  if (sidebarName) {
    sidebarName.textContent = factoryName;
  }
  
  // ✅ عنوان الصفحة
  document.title = `${factoryName} — نظام المرتبات`;
  
  // ============================================
  // ✅ Favicon (طريقة موثوقة)
  // ============================================
  console.log('   🎨 Updating favicon...');
  
  // احذف كل الـ favicons القديمة
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(el => el.remove());
  
  if (fullUrl) {
    // ✅ أيقونة PNG
    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    newFavicon.type = 'image/png';
    newFavicon.href = fullUrl + '?v=' + Date.now();
    document.head.appendChild(newFavicon);
    
    // ✅ أيقونة Apple
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = fullUrl;
    document.head.appendChild(appleIcon);
    
    console.log('   ✅ Favicon set to:', fullUrl);
  } else {
    // ✅ أيقونة افتراضية 🏭
    const defaultFavicon = document.createElement('link');
    defaultFavicon.rel = 'icon';
    defaultFavicon.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏭</text></svg>';
    document.head.appendChild(defaultFavicon);
    
    console.log('   ℹ️ Using default favicon');
  }
  
  console.log('   ✅ Brand UI updated');
}

// ============================================
// Modal Manager
// ============================================
const Modal = {
  open(title, bodyHtml, footerHtml='', opts={}) {
    const root = $('#modalRoot');
    root.innerHTML = `
      <div class="modal-backdrop" id="mb">
        <div class="modal ${opts.size==='lg'?'lg':''}">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" id="modalClose">✕</button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>`;
    $('#modalClose').onclick = () => Modal.close();
    $('#mb').onclick = (e) => { if (e.target.id === 'mb') Modal.close(); };
    document.addEventListener('keydown', escClose);
  },
  close() {
    $('#modalRoot').innerHTML = '';
    document.removeEventListener('keydown', escClose);
  }
};
function escClose(e){ if (e.key === 'Escape') Modal.close(); }

function confirmModal(title, message, onConfirm, danger=true) {
  Modal.open(title, `<p style="line-height:1.7">${message}</p>`, `
    <button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button>
    <button class="btn ${danger?'btn-danger':'btn-primary'}" id="cfmBtn">تأكيد</button>
  `);
  $('#cfmBtn').onclick = async () => { Modal.close(); await onConfirm(); };
}

function stat(icon, label, value, cls='primary') {
  return `<div class="stat ${cls}"><div class="ico">${icon}</div><div><div class="label">${label}</div><div class="value">${value}</div></div></div>`;
}

// ============================================
// Theme Manager
// ============================================
const Theme = {
  init() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = $('#themeBtn');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  },
  toggle() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    $('#themeBtn').textContent = next === 'dark' ? '☀️' : '🌙';
  }
};

// ============================================
// Cache Manager
// ============================================
const Cache = {
  departments: null, employeeTypes: null, earningTypes: null, deductionTypes: null, settings: null,
  async load() {
    const [d, et, ea, de, st] = await Promise.all([
      sb.from('departments').select('*').order('name'),
      sb.from('employee_types').select('*').order('name'),
      sb.from('earning_types').select('*').order('sort_order'),
      sb.from('deduction_types').select('*').order('sort_order'),
      sb.from('system_settings').select('*')
    ]);
    this.departments = d.data || [];
    this.employeeTypes = et.data || [];
    this.earningTypes = ea.data || [];
    this.deductionTypes = de.data || [];
    const settings = {};
    (st.data || []).forEach(r => settings[r.key] = r.value);
    this.settings = settings;
  },
  getSetting(k, def='') { return this.settings?.[k] ?? def; }
};

// ============================================
// Dashboard
// ============================================
const Dashboard = {
  async render() {
    const page = $('#pageContent');
    page.innerHTML = `<div class="page-header"><h1>🏠 الرئيسية</h1><p>جاري التحميل...</p></div>`;
    
    const profile = Auth.currentProfile || { full_name: 'مستخدم', role: 'dept_manager' };
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'صباح الخير' : 'مساء الخير';
    const today = new Date().toISOString().slice(0,10);
    
    const [
      empCount, presentToday, absentToday, payrollMonth,
      loansActive, treasuries, openFiles, warnsActive, unreadNotif
    ] = await Promise.all([
      sb.from('employees').select('id', {count:'exact', head:true}).is('deleted_at', null).eq('status','active'),
      sb.from('attendance_records').select('id',{count:'exact',head:true}).eq('attendance_date', today).eq('status','present'),
      sb.from('attendance_records').select('id',{count:'exact',head:true}).eq('attendance_date', today).eq('status','absent'),
      sb.from('payroll_files').select('total_net').eq('status','paid').gte('paid_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      sb.from('loans').select('remaining_amount').eq('status','active'),
      sb.from('treasuries').select('type,current_balance'),
      sb.from('payroll_files').select('id', {count:'exact', head:true}).in('status',['draft','approved']),
      sb.from('employee_warnings').select('id',{count:'exact',head:true}).eq('is_active', true),
      sb.from('notifications').select('id',{count:'exact',head:true}).eq('user_id', Auth.currentUser.id).eq('is_read', false)
    ]);
    
    const monthSalaries = (payrollMonth.data || []).reduce((a,b) => a + Number(b.total_net||0), 0);
    const loansRemaining = (loansActive.data || []).reduce((a,b) => a + Number(b.remaining_amount||0), 0);
    const cashBalance = (treasuries.data||[]).filter(t=>t.type==='cash').reduce((a,b)=>a+Number(b.current_balance||0),0);
    const bankBalance = (treasuries.data||[]).filter(t=>t.type==='bank').reduce((a,b)=>a+Number(b.current_balance||0),0);
    
    const badge = $('#notifBadge');
    if (badge) {
      if (unreadNotif.count > 0) { badge.textContent = unreadNotif.count; badge.style.display = 'inline-block'; }
      else badge.style.display = 'none';
    }
    
    page.innerHTML = `
      <div class="page-header"><h1>${greet}، ${esc(profile.full_name || 'مستخدم')} 👋</h1><p>نظرة عامة على حالة المصنع</p></div>
      <div class="grid grid-4">
        ${stat('👥','عدد الموظفين', empCount.count ?? 0, 'primary')}
        ${stat('🟢','حضور اليوم', presentToday.count ?? 0, 'success')}
        ${stat('🔴','الغياب اليوم', absentToday.count ?? 0, 'danger')}
        ${stat('🚨','الإنذارات النشطة', warnsActive.count ?? 0, 'danger')}
        ${stat('💰','رواتب الشهر', fmt(monthSalaries), 'info')}
        ${stat('💳','السلف المتبقية', fmt(loansRemaining), 'warning')}
        ${stat('🏦','رصيد الكاش', fmt(cashBalance), 'success')}
        ${stat('🏛️','رصيد البنك', fmt(bankBalance), 'purple')}
      </div>
      <div class="card" style="margin-top:24px">
        <h3 style="margin-bottom:16px">⚡ إجراءات سريعة</h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="Router.go('employees');setTimeout(()=>Employees.openForm(),200)">👤 + موظف</button>
          <button class="btn btn-info" onclick="Router.go('attendance')">📅 + حضور</button>
          <button class="btn btn-danger" onclick="Router.go('warnings')">🚨 الإنذارات</button>
          <button class="btn btn-success" onclick="Router.go('payroll')">💵 + ملف راتب</button>
          <button class="btn btn-warning" onclick="Router.go('loans')">💳 + سلفة</button>
          <button class="btn btn-purple" onclick="Router.go('treasuries')">🏦 الخزائن</button>
          <button class="btn btn-ghost" onclick="Router.go('reports')">📊 التقارير</button>
          <button class="btn btn-purple" onclick="Router.go('attendance-report')">📋 كشوف رسمية</button>
        </div>
      </div>
    `;
  }
};

// ============================================
// Employees
// ============================================
const Employees = {
  _cache: [],
  
  async render() {
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>👥 الموظفون</h1><p>إدارة بيانات الموظفين</p>
        <div class="page-actions"><button class="btn btn-primary" onclick="Employees.openForm()">➕ إضافة موظف</button></div>
      </div>
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="grow" id="empSearch" placeholder="🔎 ابحث بالاسم أو الرقم...">
          <select id="empDeptFilter"><option value="">كل الأقسام</option>${Cache.departments.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select>
          <select id="empTypeFilter">
            <option value="">كل الأنواع</option>
            <option value="monthly">📅 شهري</option>
            <option value="weekly">📊 أسبوعي</option>
            <option value="daily">📆 يومي</option>
          </select>
          <select id="empStatusFilter"><option value="active">نشط</option><option value="">الكل</option><option value="terminated">منتهي</option></select>
        </div>
        <div class="table-scroll" id="empTableWrap"></div>
      </div>`;
    await this.load();
    $('#empSearch').oninput = () => this.renderTable();
    $('#empDeptFilter').onchange = () => this.renderTable();
    $('#empTypeFilter').onchange = () => this.renderTable();
    $('#empStatusFilter').onchange = () => this.renderTable();
  },
  
  async load() {
    let q = sb.from('employees').select('*, departments(name), employee_types(name)').is('deleted_at', null).order('employee_number');
    if (!Auth.isAdmin() && Auth.currentProfile?.department_id) {
      q = q.eq('department_id', Auth.currentProfile.department_id);
    }
    const { data, error } = await q;
    if (error) { toast('خطأ: ' + error.message, 'error'); return; }
    this._cache = data || [];
    this.renderTable();
  },
  
  renderTable() {
    const search = $('#empSearch')?.value.toLowerCase().trim() || '';
    const dept = $('#empDeptFilter')?.value || '';
    const typeFilter = $('#empTypeFilter')?.value || '';
    const status = $('#empStatusFilter')?.value ?? 'active';
    const maxW = Number(Cache.getSetting('max_warnings','3'));
    
    let list = this._cache;
    if (search) list = list.filter(e => 
      (e.full_name||'').toLowerCase().includes(search) || 
      (e.employee_number||'').toLowerCase().includes(search) || 
      (e.phone||'').includes(search)
    );
    if (dept) list = list.filter(e => e.department_id === dept);
    if (typeFilter) list = list.filter(e => e.salary_type === typeFilter);
    if (status) list = list.filter(e => e.status === status);
    
    const wrap = $('#empTableWrap');
    if (!list.length) {
      wrap.innerHTML = `<div class="empty"><div class="ico">👥</div><h3>لا يوجد موظفون مطابقون</h3><button class="btn btn-primary" onclick="Employees.openForm()">➕ إضافة</button></div>`;
      return;
    }
    
    wrap.innerHTML = `
      <table class="data">
        <thead><tr>
          <th>الرقم</th><th>الاسم</th><th>المسمى</th><th>القسم</th><th>الأساسي</th><th>النوع</th><th>الإنذارات</th><th>إجراءات</th>
        </tr></thead>
        <tbody>${list.map(e => {
          const lvl = getWarningLevel(e.warnings_count || 0, maxW);
          const salaryTypeMap = {
            'monthly': '📅 شهري',
            'weekly': '📊 أسبوعي',
            'daily': '📆 يومي'
          };
          const salaryType = salaryTypeMap[e.salary_type] || '📅 شهري';
          return `<tr>
            <td><b>${esc(e.employee_number)}</b></td>
            <td>${esc(e.full_name)}</td>
            <td>${esc(e.job_title||'—')}</td>
            <td>${esc(e.departments?.name||'—')}</td>
            <td class="num">${fmt(e.base_salary, e.currency)}</td>
            <td><span class="badge info">${salaryType}</span></td>
            <td><span class="badge ${lvl.color}">${lvl.icon} ${e.warnings_count||0}</span></td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="Employees.view('${e.id}')">👁</button>
              <button class="btn btn-ghost btn-sm" onclick="Employees.openForm('${e.id}')">✏️</button>
              ${Auth.isAdmin()?`<button class="btn btn-ghost btn-sm" onclick="Employees.del('${e.id}')">🗑</button>`:''}
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
  },
  
  async openForm(id) {
    let emp = null;
    if (id) ({data: emp} = await sb.from('employees').select('*').eq('id', id).single());
    const deptOpts = Cache.departments.map(d => `<option value="${d.id}" ${emp?.department_id===d.id?'selected':''}>${esc(d.name)}</option>`).join('');
    const typeOpts = Cache.employeeTypes.map(t => `<option value="${t.id}" ${emp?.employee_type_id===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
    let allowances = [];
    if (id) {
      const { data } = await sb.from('employee_allowances').select('*').eq('employee_id', id).order('sort_order');
      allowances = data || [];
    }
    
    Modal.open(id?'✏️ تعديل موظف':'➕ إضافة موظف', `
      <form id="empForm" class="form-grid">
        <label class="field"><span>الرقم</span><input value="${emp?esc(emp.employee_number):'تلقائي'}" disabled></label>
        <label class="field"><span>الاسم *</span><input name="full_name" required value="${esc(emp?.full_name||'')}"></label>
        <label class="field"><span>المسمى</span><input name="job_title" value="${esc(emp?.job_title||'')}"></label>
        <label class="field"><span>الهاتف</span><input name="phone" value="${esc(emp?.phone||'')}"></label>
        <label class="field"><span>السكن</span><input name="residence" value="${esc(emp?.residence||'')}"></label>
        <label class="field"><span>تاريخ التعيين</span><input type="date" name="hire_date" value="${emp?.hire_date||''}"></label>
        <label class="field"><span>نوع الموظف</span><select name="employee_type_id"><option value="">— اختر —</option>${typeOpts}</select></label>
        <label class="field"><span>القسم *</span><select name="department_id" required><option value="">— اختر —</option>${deptOpts}</select></label>
        <label class="field"><span>نوع الراتب *</span><select name="salary_type" required>
          <option value="monthly" ${emp?.salary_type==='monthly'||!emp?'selected':''}>📅 شهري (راتب ثابت)</option>
          <option value="weekly" ${emp?.salary_type==='weekly'?'selected':''}>📊 أسبوعي (راتب أسبوعي)</option>
          <option value="daily" ${emp?.salary_type==='daily'?'selected':''}>📆 يومي (حسب الحضور)</option>
        </select></label>
        <label class="field"><span>الراتب الأساسي *</span><input type="number" step="0.01" name="base_salary" required value="${emp?.base_salary||0}"></label>
        <label class="field"><span>العملة</span><select name="currency">
          <option value="SDG" ${emp?.currency==='SDG'?'selected':''}>جنيه سوداني</option>
          <option value="USD" ${emp?.currency==='USD'?'selected':''}>دولار</option>
        </select></label>
      </form>
      <div style="margin-top:24px;padding-top:20px;border-top:2px solid var(--border)">
        <h4 style="margin-bottom:14px">📋 البنود الثابتة</h4>
        <div id="allowancesList"></div>
        <button type="button" class="btn btn-success btn-sm" onclick="Employees.addAllowance()" style="margin-top:10px">➕ إضافة بند</button>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button>
      <button class="btn btn-primary" id="saveEmp">💾 حفظ</button>
    `, {size: 'lg'});
    
    window._empAllowances = allowances;
    this.renderAllowances();
    
    $('#saveEmp').onclick = async () => {
      const form = $('#empForm');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.base_salary = Number(payload.base_salary || 0);
      ['employee_type_id','department_id'].forEach(k => { if (!payload[k]) payload[k] = null; });
      
      const btn = $('#saveEmp');
      btn.disabled = true;
      let empId = id;
      
      if (id) {
        const { error } = await sb.from('employees').update(payload).eq('id', id);
        if (error) { toast('❌ ' + error.message, 'error'); btn.disabled = false; return; }
      } else {
        const { data, error } = await sb.from('employees').insert(payload).select().single();
        if (error) { toast('❌ ' + error.message, 'error'); btn.disabled = false; return; }
        empId = data.id;
      }
      
      await sb.from('employee_allowances').delete().eq('employee_id', empId);
      const validAllowances = (window._empAllowances || []).filter(a => a.name && a.amount > 0);
      if (validAllowances.length) {
        await sb.from('employee_allowances').insert(validAllowances.map((a, i) => ({
          employee_id: empId, allowance_type: a.type, allowance_name: a.name, amount: a.amount, sort_order: i
        })));
      }
      
      toast(id ? '✅ تم التعديل' : '✅ تمت الإضافة');
      Modal.close();
      Employees.load();
    };
  },
  
  renderAllowances() {
    const list = $('#allowancesList');
    if (!list) return;
    const allowances = window._empAllowances || [];
    if (!allowances.length) {
      list.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text-2);font-size:13px">لا توجد بنود</div>`;
      return;
    }
    list.innerHTML = allowances.map((a, i) => `
      <div style="display:flex;gap:8px;align-items:center;padding:10px;background:var(--bg-3);border-radius:10px;margin-bottom:6px">
        <select onchange="Employees.editAllowance(${i},'type',this.value)" style="width:110px;padding:6px;border-radius:6px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text);font-weight:700;font-size:12px">
          <option value="earning" ${a.type==='earning'?'selected':''}>➕ استحقاق</option>
          <option value="deduction" ${a.type==='deduction'?'selected':''}>➖ استقطاع</option>
        </select>
        <input value="${esc(a.name)}" placeholder="اسم البند" onchange="Employees.editAllowance(${i},'name',this.value)" style="flex:1;padding:6px 10px;border-radius:6px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text);font-weight:700;font-size:13px">
        <input type="number" value="${a.amount}" onchange="Employees.editAllowance(${i},'amount',this.value)" style="width:120px;padding:6px 10px;border-radius:6px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text);font-weight:700;font-size:13px;text-align:right">
        <button type="button" class="btn btn-ghost btn-sm" onclick="Employees.removeAllowance(${i})" style="padding:6px 9px">🗑</button>
      </div>
    `).join('');
  },
  
  addAllowance() { 
    window._empAllowances = window._empAllowances || []; 
    window._empAllowances.push({ type: 'earning', name: '', amount: 0 }); 
    this.renderAllowances(); 
  },
  
  removeAllowance(i) { 
    window._empAllowances.splice(i, 1); 
    this.renderAllowances(); 
  },
  
  editAllowance(i, field, value) { 
    if (field === 'amount') value = Number(value || 0); 
    window._empAllowances[i][field] = value; 
  },
  
  async view(id) {
    const { data: e } = await sb.from('employees').select('*, departments(name), employee_types(name)').eq('id', id).single();
    if (!e) return toast('غير موجود', 'error');
    
    const [att, pays, loans, warns, allowances] = await Promise.all([
      sb.from('attendance_records').select('status, absence_type').eq('employee_id', id),
      sb.from('payroll_records').select('net_salary, is_paid').eq('employee_id', id),
      sb.from('loans').select('total_amount, paid_amount, remaining_amount, currency').eq('employee_id', id),
      sb.from('employee_warnings').select('*').eq('employee_id', id).order('warning_date', {ascending:false}),
      sb.from('employee_allowances').select('*').eq('employee_id', id).order('sort_order')
    ]);
    
    const attData = att.data || [];
    const presentDays = attData.filter(a => a.status === 'present').length;
    const absentDays = attData.filter(a => a.status === 'absent').length;
    const unexcusedAbsent = attData.filter(a => a.status === 'absent' && a.absence_type === 'unexcused').length;
    const totalPaid = (pays.data || []).filter(p => p.is_paid).reduce((s, p) => s + Number(p.net_salary || 0), 0);
    const totalLoans = (loans.data || []).reduce((s, l) => s + Number(l.total_amount || 0), 0);
    const remainingLoans = (loans.data || []).reduce((s, l) => s + Number(l.remaining_amount || 0), 0);
    const maxW = Number(Cache.getSetting('max_warnings','3'));
    const lvl = getWarningLevel(e.warnings_count || 0, maxW);
    const salaryTypeMap = { 'monthly': '📅 شهري', 'weekly': '📊 أسبوعي', 'daily': '📆 يومي' };
    const salaryType = salaryTypeMap[e.salary_type] || '📅 شهري';
    
    Modal.open(`👤 ${esc(e.full_name)}`, `
      <div class="grid grid-3" style="margin-bottom:20px">
        ${stat('🏢','القسم', esc(e.departments?.name||'—'), 'primary')}
        ${stat('💼','المسمى', esc(e.job_title||'—'), 'info')}
        ${stat('📞','الهاتف', esc(e.phone||'—'), 'purple')}
        ${stat('💰','الأساسي', fmt(e.base_salary, e.currency), 'success')}
        ${stat('📅','التعيين', fmtDate(e.hire_date), 'warning')}
        ${stat('⏰','نوع الراتب', salaryType, 'info')}
        ${stat(lvl.icon,'الإنذارات', e.warnings_count||0, lvl.color)}
        ${stat('✅','الأيام المستلمة', (pays.data||[]).filter(p=>p.is_paid).length, 'success')}
        ${stat('📁','عدد الرواتب', (pays.data||[]).length, 'primary')}
      </div>
      
      ${(allowances.data||[]).length ? `
        <h4 style="margin:20px 0 10px">📋 البنود الثابتة</h4>
        <div style="background:var(--bg-3);border-radius:12px;padding:14px">
          ${(allowances.data||[]).map(a => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
              <span>${a.allowance_type==='earning'?'➕':'➖'} ${esc(a.allowance_name)}</span>
              <b>${fmt(a.amount, e.currency)}</b>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <h4 style="margin:20px 0 10px">📅 ملخص الحضور (كل الفترات)</h4>
      <div class="grid grid-3">
        ${stat('🟢','حضور', presentDays, 'success')}
        ${stat('🔴','غياب', absentDays, 'danger')}
        ${stat('⚠️','بدون عذر', unexcusedAbsent, 'warning')}
      </div>
      
      ${(warns.data||[]).length ? `
        <h4 style="margin:20px 0 10px">🚨 الإنذارات</h4>
        <div style="background:var(--bg-3);border-radius:12px;padding:14px;max-height:200px;overflow-y:auto">
          ${(warns.data||[]).map(w=>`
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
              <div><b style="font-size:13px">${esc(w.description || w.reason)}</b><div style="font-size:11px;color:var(--text-2)">${fmtDate(w.warning_date)}</div></div>
              <span class="badge ${w.is_active?'danger':'gray'}">${w.is_active?'نشط':'ملغى'}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <h4 style="margin:20px 0 10px">💵 الرواتب</h4>
      <div class="grid grid-3">
        ${stat('✅','المستلم', fmt(totalPaid, e.currency), 'success')}
        ${stat('📁','عدد الرواتب', (pays.data||[]).length, 'info')}
      </div>
      
      <h4 style="margin:20px 0 10px">💳 السلف</h4>
      <div class="grid grid-3">
        ${stat('📊','الإجمالي', fmt(totalLoans, e.currency), 'warning')}
        ${stat('🔻','المتبقي', fmt(remainingLoans, e.currency), 'danger')}
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>
      <button class="btn btn-primary" onclick="Reports.employeeStatement('${id}')">🖨 طباعة الكشف</button>
    `, {size:'lg'});
  },
  
  async del(id) {
    confirmModal('🗑 حذف موظف', 'هل أنت متأكد؟', async () => {
      await sb.from('employees').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      toast('✅ تم الحذف');
      Employees.load();
    });
  }
};

// ============================================
// Departments
// ============================================
const Departments = {
  async render() {
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>🏢 الأقسام</h1><p>إدارة أقسام المصنع</p>
        ${Auth.isAdmin()?`<div class="page-actions"><button class="btn btn-primary" onclick="Departments.openForm()">➕ إضافة قسم</button></div>`:''}
      </div>
      <div class="table-wrap"><div class="table-scroll" id="deptTable"></div></div>`;
    await this.load();
  },
  
  async load() {
    const { data } = await sb.from('departments').select('*').order('name');
    if (!data?.length) {
      $('#deptTable').innerHTML = `<div class="empty"><div class="ico">🏢</div><h3>لا توجد أقسام</h3><button class="btn btn-primary" onclick="Departments.openForm()">➕ إضافة</button></div>`;
      return;
    }
    
    const deptIds = data.map(d => d.id);
    const { data: empCounts } = await sb.from('employees').select('department_id').is('deleted_at', null).eq('status', 'active').in('department_id', deptIds);
    const countMap = {};
    (empCounts || []).forEach(e => {
      countMap[e.department_id] = (countMap[e.department_id] || 0) + 1;
    });
    
    $('#deptTable').innerHTML = `<table class="data"><thead><tr><th>الاسم</th><th>عدد الموظفين</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${data.map(d => `<tr>
        <td><b>${esc(d.name)}</b></td>
        <td><span class="badge info">👥 ${countMap[d.id] || 0} موظف</span></td>
        <td><span class="badge ${d.is_active?'success':'danger'}">${d.is_active?'نشط':'معطل'}</span></td>
        <td>${Auth.isAdmin()?`<button class="btn btn-ghost btn-sm" onclick="Departments.openForm('${d.id}')">✏️</button><button class="btn btn-ghost btn-sm" onclick="Departments.del('${d.id}')">🗑</button>`:''}</td>
      </tr>`).join('')}</tbody></table>`;
  },
  
  async openForm(id) {
    let d = null;
    if (id) ({data: d} = await sb.from('departments').select('*').eq('id', id).single());
    Modal.open(id?'✏️ تعديل قسم':'➕ إضافة قسم', `
      <form id="deptForm">
        <label class="field"><span>اسم القسم *</span><input name="name" required value="${esc(d?.name||'')}"></label>
        <label class="field"><span>الحالة</span><select name="is_active">
          <option value="true" ${d?.is_active!==false?'selected':''}>نشط</option>
          <option value="false" ${d?.is_active===false?'selected':''}>معطل</option>
        </select></label>
      </form>`, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="saveDept">💾 حفظ</button>`);
    
    $('#saveDept').onclick = async () => {
      const fd = new FormData($('#deptForm'));
      const payload = Object.fromEntries(fd.entries());
      payload.is_active = payload.is_active === 'true';
      const res = id ? await sb.from('departments').update(payload).eq('id', id) : await sb.from('departments').insert(payload);
      if (res.error) return toast('فشل: '+res.error.message, 'error');
      toast('✅ تم');
      Modal.close();
      Departments.load();
      await Cache.load();
    };
  },
  
  async del(id) {
    const { count } = await sb.from('employees').select('id',{count:'exact',head:true}).eq('department_id', id).is('deleted_at',null);
    if (count > 0) return toast('⚠️ يوجد موظفون في هذا القسم', 'warning');
    confirmModal('🗑 حذف قسم','متأكد؟', async () => {
      await sb.from('departments').delete().eq('id', id);
      toast('✅ تم');
      Departments.load();
      await Cache.load();
    });
  }
};

// ============================================
// Attendance
// ============================================
const Attendance = {
  async render() {
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>📅 الحضور والغياب</h1><p>ملفات الحضور اليومية</p>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Attendance.openFileForm()">➕ ملف حضور</button>
          <button class="btn btn-purple" onclick="Router.go('attendance-report')">📋 كشوف رسمية</button>
        </div>
      </div>
      <div class="table-wrap"><div class="table-scroll" id="attTable"></div></div>`;
    await this.load();
  },
  
  async load() {
    const { data } = await sb.from('attendance_files').select('*, departments(name)').order('created_at',{ascending:false});
    const wrap = $('#attTable');
    if (!data?.length) {
      wrap.innerHTML = `<div class="empty"><div class="ico">📅</div><h3>لا توجد ملفات</h3><button class="btn btn-primary" onclick="Attendance.openFileForm()">➕ إنشاء</button></div>`;
      return;
    }
    wrap.innerHTML = `<table class="data"><thead><tr><th>الاسم</th><th>من</th><th>إلى</th><th>القسم</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${data.map(f=>`<tr>
        <td><b>${esc(f.name)}</b></td>
        <td>${fmtDate(f.start_date)}</td>
        <td>${fmtDate(f.end_date)}</td>
        <td>${esc(f.departments?.name||'—')}</td>
        <td><span class="badge ${f.status==='open'?'success':'gray'}">${f.status==='open'?'مفتوح':'مغلق'}</span></td>
        <td><button class="btn btn-primary btn-sm" onclick="Attendance.openRecords('${f.id}')">📝 تسجيل</button></td>
      </tr>`).join('')}</tbody></table>`;
  },
  
  async openFileForm() {
    const opts = Cache.departments.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    Modal.open('📅 ملف حضور جديد', `
      <form id="attForm">
        <label class="field"><span>الاسم *</span><input name="name" required></label>
        <div class="form-grid">
          <label class="field"><span>من *</span><input type="date" name="start_date" required></label>
          <label class="field"><span>إلى *</span><input type="date" name="end_date" required></label>
        </div>
        <label class="field"><span>القسم *</span><select name="department_id" required><option value="">— اختر —</option>${opts}</select></label>
      </form>`, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="saveAtt">💾 إنشاء</button>`);
    
    $('#saveAtt').onclick = async () => {
      const form = $('#attForm');
      if (!form.reportValidity()) return;
      
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      
      if (!payload.department_id || payload.department_id === '') {
        return toast('⚠️ اختر القسم أولاً', 'error');
      }
      
      if (new Date(payload.start_date) > new Date(payload.end_date)) {
        return toast('⚠️ تاريخ البداية بعد النهاية', 'error');
      }
      
      payload.created_by = Auth.currentUser.id;
      
      const btn = $('#saveAtt');
      btn.disabled = true;
      btn.textContent = '⏳ جاري الإنشاء...';
      
      const res = await sb.from('attendance_files').insert(payload).select().single();
      
      if (res.error) {
        toast('❌ فشل: ' + res.error.message, 'error');
        btn.disabled = false;
        btn.textContent = '💾 إنشاء';
        return;
      }
      
      toast('✅ تم');
      Modal.close();
      Attendance.load();
      setTimeout(()=>Attendance.openRecords(res.data.id), 300);
    };
  },
  
  async openRecords(fileId) {
    const { data: file } = await sb.from('attendance_files').select('*').eq('id', fileId).single();
    const { data: emps } = await sb.from('employees').select('*').eq('department_id', file.department_id).is('deleted_at', null).eq('status','active').order('employee_number');
    const { data: recs } = await sb.from('attendance_records').select('*').eq('file_id', fileId);
    
    const dates = [];
    let d = new Date(file.start_date);
    const end = new Date(file.end_date);
    while (d <= end) { 
      dates.push(d.toISOString().slice(0,10)); 
      d.setDate(d.getDate()+1); 
    }
    
    const recMap = {};
    (recs||[]).forEach(r => { recMap[`${r.employee_id}_${r.attendance_date}`] = r; });
    
    window._attEmps = emps || [];
    window._attDates = dates;
    window._attRecMap = recMap;
    window._attFileId = fileId;
    
    const renderTable = (searchTerm = '') => {
      const search = searchTerm.toLowerCase().trim();
      let filteredEmps = window._attEmps;
      
      if (search) {
        filteredEmps = filteredEmps.filter(e => 
          (e.full_name || '').toLowerCase().includes(search) ||
          (e.employee_number || '').toLowerCase().includes(search)
        );
      }
      
      const tableBody = filteredEmps.map(e => `
        <tr>
          <td style="position:sticky;right:0;background:var(--bg-2);z-index:5;border-left:2px solid var(--border)">
            <b style="font-size:13px">${esc(e.employee_number)}</b><br>
            <small style="font-size:11px;color:var(--text-2)">${esc(e.full_name)}</small>
          </td>
          ${dates.map(dt=>{
            const r = recMap[`${e.id}_${dt}`];
            const st = r?.status || '';
            const abType = r?.absence_type || '';
            let selectValue = '';
            if (st === 'present') selectValue = 'present';
            else if (st === 'absent' && abType === 'unexcused') selectValue = 'absent_unexcused';
            else if (st === 'absent' && abType === 'excused') selectValue = 'absent_excused';
            else if (st === 'absent' && abType === 'sick') selectValue = 'absent_sick';
            
            const colorMap = { 
              '': 'var(--border)', 'present': 'var(--success)', 
              'absent_excused': 'var(--warning)', 'absent_unexcused': 'var(--danger)', 
              'absent_sick': 'var(--info)' 
            };
            
            return `<td><select data-file="${fileId}" data-emp="${e.id}" data-date="${dt}"
              style="width:100%;padding:7px 8px;border-radius:8px;border:2px solid ${colorMap[selectValue]||'var(--border)'};background:var(--bg-2);font-size:12px;font-weight:700;cursor:pointer;color:var(--text)"
              onchange="Attendance.onSelectChange(this)">
              <option value="" ${!selectValue?'selected':''}>— لم يُسجل —</option>
              <option value="present" ${selectValue==='present'?'selected':''}>🟢 حاضر</option>
              <option value="absent_excused" ${selectValue==='absent_excused'?'selected':''}>🟡 بعذر</option>
              <option value="absent_unexcused" ${selectValue==='absent_unexcused'?'selected':''}>🔴 بدون عذر</option>
              <option value="absent_sick" ${selectValue==='absent_sick'?'selected':''}>🔵 مرضي</option>
            </select></td>`;
          }).join('')}
        </tr>`).join('');
      
      const tbody = document.getElementById('attTableBody');
      if (tbody) tbody.innerHTML = tableBody;
      
      const counter = document.getElementById('attSearchCounter');
      if (counter) counter.textContent = `${filteredEmps.length} / ${window._attEmps.length} موظف`;
    };
    
    let html = `
      <div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:12px;background:var(--bg-3);border-radius:12px">
        <button class="btn btn-success btn-sm" onclick="Attendance.markAll('${fileId}','present')">✓ الكل حاضر</button>
        <button class="btn btn-danger btn-sm" onclick="Attendance.markAll('${fileId}','absent')">✗ الكل غائب</button>
        <button class="btn btn-ghost btn-sm" onclick="Attendance.markAll('${fileId}','clear')">🗑 مسح</button>
        <span style="margin-right:auto;font-size:12px;color:var(--text-2)">📊 ${dates.length} يوم | 👥 ${(emps||[]).length} موظف</span>
      </div>
      
      <div style="margin-bottom:12px;padding:12px;background:var(--primary-soft);border-radius:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span style="font-size:20px">🔎</span>
        <input type="text" id="attSearchInput" placeholder="ابحث بالاسم أو الرقم الوظيفي..."
          style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg-2);color:var(--text);font-size:14px;font-weight:600">
        <span id="attSearchCounter" style="font-size:12px;color:var(--text-2);font-weight:700;white-space:nowrap">${(emps||[]).length} / ${(emps||[]).length} موظف</span>
      </div>
      
      <div class="table-scroll"><table class="data">
        <thead><tr>
          <th style="position:sticky;right:0;background:var(--bg-3);z-index:6;min-width:180px">الموظف</th>
          ${dates.map(d=>`<th style="min-width:130px">${d.slice(5)}</th>`).join('')}
        </tr></thead>
        <tbody id="attTableBody"></tbody>
      </table></div>`;
    
    Modal.open(`📝 ${esc(file.name)}`, html, `<button class="btn btn-primary" onclick="Modal.close()">تم</button>`, {size:'lg'});
    
    renderTable();
    
    setTimeout(() => {
      const searchInput = document.getElementById('attSearchInput');
      if (searchInput) {
        searchInput.oninput = (e) => renderTable(e.target.value);
      }
    }, 100);
  },
  
  async onSelectChange(selectEl) {
    const fileId = selectEl.dataset.file;
    const empId = selectEl.dataset.emp;
    const date = selectEl.dataset.date;
    const value = selectEl.value;
    const key = `${empId}_${date}`;
    
    const colorMap = { 
      '': 'var(--border)', 'present': 'var(--success)', 
      'absent_excused': 'var(--warning)', 'absent_unexcused': 'var(--danger)', 
      'absent_sick': 'var(--info)' 
    };
    
    selectEl.style.borderColor = colorMap[value] || 'var(--border)';
    selectEl.disabled = true;
    selectEl.style.opacity = '0.6';
    
    try {
      if (value === '') {
        const rec = window._attRecMap?.[key];
        if (rec?.id) {
          const { error } = await sb.from('attendance_records').delete().eq('id', rec.id);
          if (error) throw error;
        }
        delete window._attRecMap[key];
        toast('تم المسح', 'warning');
      } else {
        let status, absence_type;
        if (value === 'present') { status = 'present'; absence_type = null; }
        else if (value === 'absent_excused') { status = 'absent'; absence_type = 'excused'; }
        else if (value === 'absent_unexcused') { status = 'absent'; absence_type = 'unexcused'; }
        else if (value === 'absent_sick') { status = 'absent'; absence_type = 'sick'; }
        
        const existing = window._attRecMap?.[key];
        
        if (existing?.id) {
          const { data, error } = await sb.from('attendance_records')
            .update({ status, absence_type })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          window._attRecMap[key] = data;
        } else {
          const { data, error } = await sb.from('attendance_records')
            .insert({
              file_id: fileId,
              employee_id: empId,
              attendance_date: date,
              status,
              absence_type
            })
            .select()
            .single();
          
          if (error) {
            if (error.code === '23505') {
              const { data: existingRec } = await sb.from('attendance_records')
                .select('id')
                .eq('file_id', fileId)
                .eq('employee_id', empId)
                .eq('attendance_date', date)
                .single();
              
              if (existingRec) {
                const { data: updated, error: updErr } = await sb.from('attendance_records')
                  .update({ status, absence_type })
                  .eq('id', existingRec.id)
                  .select()
                  .single();
                if (updErr) throw updErr;
                window._attRecMap[key] = updated;
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          } else {
            window._attRecMap[key] = data;
          }
        }
        
        if (status === 'absent' && absence_type === 'unexcused') {
          toast('🚨 غياب بدون عذر — سيُحسب في الرواتب', 'warning');
        } else {
          toast('✅ تم');
        }
      }
    } catch (err) {
      console.error('Attendance error:', err);
      toast('❌ ' + (err.message || 'حدث خطأ'), 'error');
      const rec = window._attRecMap?.[key];
      if (rec?.status === 'present') selectEl.value = 'present';
      else if (rec?.status === 'absent' && rec?.absence_type === 'unexcused') selectEl.value = 'absent_unexcused';
      else if (rec?.status === 'absent' && rec?.absence_type === 'excused') selectEl.value = 'absent_excused';
      else if (rec?.status === 'absent' && rec?.absence_type === 'sick') selectEl.value = 'absent_sick';
      else selectEl.value = '';
    } finally {
      selectEl.disabled = false;
      selectEl.style.opacity = '1';
    }
  },
  
  async markAll(fileId, status) {
    try {
      const { data: file } = await sb.from('attendance_files').select('*').eq('id', fileId).single();
      if (!file) return toast('الملف غير موجود', 'error');
      
      const { data: emps } = await sb.from('employees')
        .select('id')
        .eq('department_id', file.department_id)
        .is('deleted_at', null)
        .eq('status', 'active');
      
      if (!emps?.length) return toast('لا يوجد موظفون', 'warning');
      
      const dates = [];
      let d = new Date(file.start_date); 
      const end = new Date(file.end_date);
      while (d <= end) { 
        dates.push(d.toISOString().slice(0,10)); 
        d.setDate(d.getDate()+1); 
      }
      
      if (status === 'clear') {
        toast('⏳ جاري المسح...');
        const { error } = await sb.from('attendance_records').delete().eq('file_id', fileId);
        if (error) throw error;
        toast('✅ تم المسح');
        Modal.close();
        setTimeout(() => Attendance.openRecords(fileId), 200);
        return;
      }
      
      const rows = [];
      for (const e of emps) {
        for (const dt of dates) {
          rows.push({ 
            file_id: fileId, 
            employee_id: e.id, 
            attendance_date: dt, 
            status: status, 
            absence_type: status === 'absent' ? 'unexcused' : null 
          });
        }
      }
      
      toast(`⏳ جاري حفظ ${rows.length} سجل...`);
      
      await sb.from('attendance_records').delete().eq('file_id', fileId);
      
      const chunkSize = 500;
      let saved = 0;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await sb.from('attendance_records').insert(chunk);
        if (error) throw error;
        saved += chunk.length;
      }
      
      toast(`✅ تم حفظ ${saved} سجل بنجاح`);
      Modal.close();
      setTimeout(() => Attendance.openRecords(fileId), 200);
      
    } catch (err) {
      console.error('markAll error:', err);
      toast('❌ ' + (err.message || 'حدث خطأ'), 'error');
    }
  }
};

// ============================================
// Warnings (الإنذارات)
// ============================================
const WARNING_REASONS = {
  unexcused_absence: { label: 'غياب بدون عذر', icon: '🔴' },
  late: { label: 'تأخير متكرر', icon: '⏰' },
  misconduct: { label: 'مخالفة سلوكية', icon: '⚠️' },
  manual: { label: 'إنذار يدوي', icon: '✍️' }
};

const Warnings = {
  _cache: [],
  
  async render() {
    const maxW = Number(Cache.getSetting('max_warnings', '3'));
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>🚨 الإنذارات</h1><p>الحد الأقصى: <b>${maxW}</b></p>
        <div class="page-actions">
          <button class="btn btn-danger" onclick="Warnings.openManualForm()">➕ إنذار يدوي</button>
          <button class="btn btn-ghost" onclick="Warnings.load()">🔄 تحديث</button>
        </div>
      </div>
      <div class="grid grid-4" id="warnStats" style="margin-bottom:24px"></div>
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="grow" id="warnSearch" placeholder="🔎 ابحث بالاسم...">
          <select id="warnReasonFilter">
            <option value="">كل الأسباب</option>
            ${Object.entries(WARNING_REASONS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
          </select>
          <select id="warnStatusFilter"><option value="active">النشطة</option><option value="">الكل</option></select>
        </div>
        <div class="table-scroll" id="warnTable"></div>
      </div>
    `;
    await this.load();
    $('#warnSearch').oninput = () => this.renderTable();
    $('#warnReasonFilter').onchange = () => this.renderTable();
    $('#warnStatusFilter').onchange = () => this.renderTable();
  },
  
  async load() {
    const { data } = await sb.from('employee_warnings').select('*, employees(employee_number, full_name, warnings_count, departments(name))').order('created_at', { ascending: false });
    this._cache = data || [];
    this.renderStats();
    this.renderTable();
  },
  
  renderStats() {
    const maxW = Number(Cache.getSetting('max_warnings', '3'));
    const all = this._cache;
    const active = all.filter(w => w.is_active);
    const uniqueEmps = new Set(active.map(w => w.employee_id));
    const criticalEmps = new Set(active.filter(w => (w.employees?.warnings_count || 0) >= maxW + 1).map(w => w.employee_id));
    const atMaxEmps = new Set(active.filter(w => (w.employees?.warnings_count || 0) === maxW).map(w => w.employee_id));
    
    $('#warnStats').innerHTML = `
      ${stat('📋','إجمالي', all.length, 'warning')}
      ${stat('🚨','نشطة', active.length, 'danger')}
      ${stat('👥','موظفون', uniqueEmps.size, 'info')}
      ${stat('⛔','خطر', criticalEmps.size + atMaxEmps.size, 'danger')}
    `;
  },
  
  renderTable() {
    const search = $('#warnSearch')?.value.toLowerCase().trim() || '';
    const reason = $('#warnReasonFilter')?.value || '';
    const status = $('#warnStatusFilter')?.value ?? 'active';
    let list = this._cache;
    if (search) list = list.filter(w => (w.employees?.full_name || '').toLowerCase().includes(search));
    if (reason) list = list.filter(w => w.reason === reason);
    if (status === 'active') list = list.filter(w => w.is_active);
    
    const wrap = $('#warnTable');
    const maxW = Number(Cache.getSetting('max_warnings', '3'));
    
    if (!list.length) { 
      wrap.innerHTML = `<div class="empty"><div class="ico">✅</div><h3>لا توجد إنذارات</h3></div>`; 
      return; 
    }
    
    wrap.innerHTML = `<table class="data">
      <thead><tr><th>التاريخ</th><th>الموظف</th><th>القسم</th><th>السبب</th><th>العدد</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${list.map(w => {
        const empCount = w.employees?.warnings_count || 0;
        const lvl = getWarningLevel(empCount, maxW);
        const reasonInfo = WARNING_REASONS[w.reason] || { label: w.reason, icon: '❓' };
        return `<tr>
          <td>${fmtDate(w.warning_date)}</td>
          <td><b>${esc(w.employees?.employee_number || '—')}</b><br><small>${esc(w.employees?.full_name || '—')}</small></td>
          <td>${esc(w.employees?.departments?.name || '—')}</td>
          <td><span class="badge ${lvl.color}">${reasonInfo.icon} ${reasonInfo.label}</span></td>
          <td><b>${empCount}</b> <span class="badge ${lvl.color}">${lvl.icon}</span></td>
          <td>${w.is_active ? '<span class="badge danger">نشط</span>' : '<span class="badge gray">ملغى</span>'}</td>
          <td>${Auth.isAdmin() && w.is_active ? `<button class="btn btn-ghost btn-sm" onclick="Warnings.remove('${w.id}','${esc(w.employees?.full_name||'')}')">🗑</button>` : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },
  
  async openManualForm(preselectEmpId) {
    const { data: emps } = await sb.from('employees').select('id, employee_number, full_name').is('deleted_at', null).eq('status','active').order('employee_number');
    const opts = (emps || []).map(e => `<option value="${e.id}" ${preselectEmpId===e.id?'selected':''}>${esc(e.employee_number)} — ${esc(e.full_name)}</option>`).join('');
    const reasonOpts = Object.entries(WARNING_REASONS).filter(([k]) => k !== 'unexcused_absence').map(([k,v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('');
    
    Modal.open('➕ إنذار يدوي', `
      <form id="warningForm">
        <label class="field"><span>الموظف *</span><select name="employee_id" required><option value="">— اختر —</option>${opts}</select></label>
        <label class="field"><span>السبب *</span><select name="reason" required>${reasonOpts}</select></label>
        <label class="field"><span>التاريخ</span><input type="date" name="warning_date" value="${new Date().toISOString().slice(0,10)}"></label>
        <label class="field"><span>الوصف</span><textarea name="description" rows="3"></textarea></label>
      </form>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-danger" id="saveWarn">🚨 إضافة</button>`);
    
    $('#saveWarn').onclick = async () => {
      const form = $('#warningForm');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.added_by = Auth.currentUser.id;
      if (!payload.description) payload.description = 'إنذار يدوي';
      
      const { error } = await sb.from('employee_warnings').insert(payload);
      if (error) return toast('❌ ' + error.message, 'error');
      
      const { data: emp } = await sb.from('employees').select('warnings_count').eq('id', payload.employee_id).single();
      await sb.from('employees').update({ warnings_count: (emp?.warnings_count || 0) + 1 }).eq('id', payload.employee_id);
      
      toast('✅ تم');
      Modal.close();
      Warnings.load();
    };
  },
  
  async remove(id, empName) {
    confirmModal('🗑 إلغاء إنذار', `إلغاء إنذار <b>${esc(empName)}</b>؟`, async () => {
      const { data: w } = await sb.from('employee_warnings').select('employee_id').eq('id', id).single();
      if (!w) return;
      await sb.from('employee_warnings').delete().eq('id', id);
      const { data: emp } = await sb.from('employees').select('warnings_count').eq('id', w.employee_id).single();
      await sb.from('employees').update({ warnings_count: Math.max((emp?.warnings_count || 1) - 1, 0) }).eq('id', w.employee_id);
      toast('✅ تم');
      Warnings.load();
    });
  }
};

// ============================================
// Payroll (الرواتب) - كامل
// ============================================
const Payroll = {
  async render() {
    const deptFilter = window._payrollDeptFilter || '';
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>💵 ملفات الرواتب</h1>
        <p>إنشاء وإدارة ملفات الرواتب</p>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Payroll.openForm()">➕ إنشاء ملف</button>
          <select id="payrollDeptFilter" style="padding:10px 14px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text);font-weight:700;font-size:14px">
            <option value="">🌐 كل الأقسام</option>
            ${Cache.departments.map(d => `<option value="${d.id}" ${deptFilter===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}
          </select>
          <select id="payrollStatusFilter" style="padding:10px 14px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text);font-weight:700;font-size:14px">
            <option value="">الكل</option>
            <option value="draft">📝 مسودة</option>
            <option value="paid">💰 مدفوع</option>
          </select>
        </div>
      </div>
      <div id="payrollList"></div>
    `;
    $('#payrollDeptFilter').onchange = (e) => { window._payrollDeptFilter = e.target.value; Payroll.load(); };
    $('#payrollStatusFilter').onchange = () => Payroll.load();
    await this.load();
  },
  
  async load() {
    const deptFilter = window._payrollDeptFilter || '';
    const statusFilter = $('#payrollStatusFilter')?.value || '';
    let q = sb.from('payroll_files').select('*, departments(name)').order('created_at', {ascending: false});
    if (deptFilter) q = q.eq('department_id', deptFilter);
    if (statusFilter) q = q.eq('status', statusFilter);
    if (!Auth.isAdmin() && Auth.currentProfile?.department_id) {
      q = q.eq('department_id', Auth.currentProfile.department_id);
    }
    const { data } = await q;
    const wrap = $('#payrollList');
    
    if (!data?.length) {
      wrap.innerHTML = `<div class="empty"><div class="ico">💵</div><h3>لا توجد ملفات</h3><button class="btn btn-primary" onclick="Payroll.openForm()">➕ إنشاء</button></div>`;
      return;
    }
    wrap.innerHTML = `<div class="grid grid-3">${data.map(p => this.renderCard(p)).join('')}</div>`;
  },
  
  renderCard(p) {
    const statusInfo = { 
      draft: { label: 'مسودة', color: 'gray', icon: '📝' }, 
      approved: { label: 'معتمد', color: 'info', icon: '✅' }, 
      paid: { label: 'مدفوع', color: 'success', icon: '💰' } 
    }[p.status] || { label: p.status, color: 'gray', icon: '📄' };
    
    const days = p.period_days || Math.ceil((new Date(p.end_date) - new Date(p.start_date)) / 86400000) + 1;
    
    return `<div class="card" style="cursor:pointer;border-top:4px solid var(--${statusInfo.color})" onclick="Payroll.open('${p.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:900;margin-bottom:4px">${statusInfo.icon} ${esc(p.name)}</div>
          <div style="font-size:12px;color:var(--text-2)">🏢 ${esc(p.departments?.name || '—')}</div>
        </div>
        <span class="badge ${statusInfo.color}">${statusInfo.label}</span>
      </div>
      <div style="background:var(--bg-3);padding:10px;border-radius:8px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>📅 من:</span><b>${fmtDate(p.start_date)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>📅 إلى:</span><b>${fmtDate(p.end_date)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:12px"><span>📊 المدة:</span><b>${days} يوم</b></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border)">
        <div>
          <div style="font-size:11px;color:var(--text-2)">الصافي</div>
          <div style="font-size:18px;font-weight:900;color:var(--success)">${fmt(p.total_net)}</div>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();Payroll.open('${p.id}')">📂</button>
          ${p.status==='draft' ? `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();Payroll.del('${p.id}','${esc(p.name)}')">🗑</button>` : ''}
        </div>
      </div>
    </div>`;
  },
  
  async openForm() {
    const isDeptManager = !Auth.isAdmin();
    const myDept = Auth.currentProfile?.department_id;
    const defaultDept = window._payrollDeptFilter || (isDeptManager ? myDept : '');
    
    if (isDeptManager && !myDept) {
      return toast('⚠️ حسابك غير مرتبط بقسم. تواصل مع المدير.', 'error');
    }
    
    Modal.open('➕ ملف رواتب جديد', `
      <div style="margin-bottom:20px">
        <div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--text-2)">⚡ قالب سريع:</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
          <button type="button" class="btn btn-ghost" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="Payroll.setTemplate('monthly')">
            <div style="font-size:24px">📅</div><div style="font-weight:800">شهري</div>
          </button>
          <button type="button" class="btn btn-ghost" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="Payroll.setTemplate('weekly')">
            <div style="font-size:24px">📆</div><div style="font-weight:800">أسبوعي</div>
          </button>
          <button type="button" class="btn btn-ghost" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="Payroll.setTemplate('half')">
            <div style="font-size:24px">📊</div><div style="font-weight:800">نصفي</div>
          </button>
          <button type="button" class="btn btn-ghost" style="padding:16px;flex-direction:column;gap:6px;height:auto" onclick="Payroll.setTemplate('10days')">
            <div style="font-size:24px">📈</div><div style="font-weight:800">10 أيام</div>
          </button>
        </div>
      </div>
      <div style="text-align:center;color:var(--text-2);font-size:12px;margin:16px 0">أو اختر يدوياً</div>
      <form id="payForm" class="form-grid">
        <label class="field full"><span>اسم الملف *</span><input name="name" required id="payName"></label>
        
        ${isDeptManager ? `
          <div class="field full">
            <span>القسم</span>
            <div style="padding:11px 14px;background:var(--bg-3);border-radius:11px;font-weight:800;color:var(--primary)">
              🏢 ${esc(Cache.departments.find(d => d.id === myDept)?.name || '—')}
            </div>
            <input type="hidden" name="department_id" id="payDept" value="${myDept}">
          </div>
        ` : `
          <label class="field"><span>القسم *</span><select name="department_id" required id="payDept"><option value="">— اختر —</option>${Cache.departments.map(d => `<option value="${d.id}" ${defaultDept===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></label>
        `}
        
        <label class="field full">
          <span>🔗 ربط مع ملف حضور</span>
          <select name="attendance_file_id" id="payAtt">
            <option value="">✏️ بدون ربط (إدخال يدوي)</option>
          </select>
          <div style="font-size:11px;color:var(--text-2);margin-top:4px;padding:6px;background:var(--bg-3);border-radius:6px">
            💡 عند الربط: يُحسب خصم الغياب تلقائياً
          </div>
        </label>
        
        <label class="field"><span>من *</span><input type="date" name="start_date" required id="payStart"></label>
        <label class="field"><span>إلى *</span><input type="date" name="end_date" required id="payEnd"></label>
        <label class="field full" style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="lock_after_payment" checked style="width:auto"><span style="margin:0">🔒 قفل بعد الدفع</span></label>
      </form>
      <div id="periodPreview" style="margin-top:12px"></div>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="savePay">💾 إنشاء</button>`, {size:'lg'});
    
    const loadAttendanceFiles = async (deptId) => {
      if (!deptId) {
        $('#payAtt').innerHTML = '<option value="">✏️ بدون ربط</option>';
        return;
      }
      
      const { data: attFiles, error } = await sb.from('attendance_files')
        .select('id, name, start_date, end_date, status')
        .eq('department_id', deptId)
        .order('start_date', { ascending: false });
      
      if (error) {
        $('#payAtt').innerHTML = '<option value="">❌ خطأ في التحميل</option>';
        return;
      }
      
      if (!attFiles?.length) {
        $('#payAtt').innerHTML = '<option value="">⚠️ لا توجد ملفات حضور لهذا القسم</option>';
        return;
      }
      
      $('#payAtt').innerHTML = '<option value="">✏️ بدون ربط (إدخال يدوي)</option>' + 
        attFiles.map(a => {
          const icon = a.status === 'open' ? '🟢' : '⚫';
          return `<option value="${a.id}">${icon} ${esc(a.name)} (${fmtDate(a.start_date)} - ${fmtDate(a.end_date)})</option>`;
        }).join('');
    };
    
    if (!isDeptManager && $('#payDept')) {
      $('#payDept').onchange = (e) => loadAttendanceFiles(e.target.value);
    }
    
    if (isDeptManager && myDept) {
      setTimeout(() => loadAttendanceFiles(myDept), 100);
    }
    
    const updatePreview = () => {
      const start = $('#payStart')?.value;
      const end = $('#payEnd')?.value;
      const preview = $('#periodPreview');
      if (start && end && preview) {
        const days = Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1;
        if (days > 0) {
          preview.innerHTML = `<div style="background:var(--primary-soft);padding:14px;border-radius:10px;text-align:center"><div style="font-size:12px;color:var(--text-2);font-weight:700;margin-bottom:4px">📊 المدة</div><div style="font-size:20px;font-weight:900;color:var(--primary)">${days} يوم</div></div>`;
        }
      }
    };
    
    setTimeout(() => {
      if ($('#payStart')) $('#payStart').oninput = updatePreview;
      if ($('#payEnd')) $('#payEnd').oninput = updatePreview;
      updatePreview();
    }, 150);
    
    $('#savePay').onclick = async () => {
      const form = $('#payForm');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      
      if (isDeptManager) {
        payload.department_id = myDept;
      }
      
      payload.lock_after_payment = fd.has('lock_after_payment');
      if (!payload.attendance_file_id) payload.attendance_file_id = null;
      payload.created_by = Auth.currentUser.id;
      
      const days = Math.ceil((new Date(payload.end_date) - new Date(payload.start_date)) / 86400000) + 1;
      if (days <= 0) return toast('⚠️ تاريخ غير صحيح', 'warning');
      payload.period_days = days;
      payload.period_type = days === 1 ? 'daily' : days <= 7 ? 'weekly' : 'monthly';
      
      const btn = $('#savePay');
      btn.disabled = true;
      
      const { data, error } = await sb.from('payroll_files').insert(payload).select().single();
      if (error) { toast('❌ ' + error.message, 'error'); btn.disabled = false; return; }
      
      const { data: emps } = await sb.from('employees')
        .select('*')
        .eq('department_id', payload.department_id)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('employee_number');
      
      if (emps?.length) {
        const records = emps.map(e => ({
          payroll_file_id: data.id,
          employee_id: e.id,
          base_salary: e.base_salary || 0
        }));
        await sb.from('payroll_records').insert(records);
      }
      
      toast(`✅ تم (${emps?.length || 0} موظف)`);
      Modal.close();
      await Payroll.open(data.id);
    };
  },
  
  setTemplate(type) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    const first = `${y}-${String(m).padStart(2,'0')}-01`;
    const last = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    const names = { monthly: 'شهري', weekly: 'أسبوعي', half: 'نصفي', '10days': '10 أيام' };
    
    if (type === 'monthly') { 
      $('#payStart').value = first; 
      $('#payEnd').value = last; 
    }
    else if (type === 'weekly') { 
      const e = new Date(today); 
      e.setDate(today.getDate()+6); 
      $('#payStart').value = today.toISOString().slice(0,10); 
      $('#payEnd').value = e.toISOString().slice(0,10); 
    }
    else if (type === 'half') { 
      const e = new Date(today); 
      e.setDate(today.getDate()+14); 
      $('#payStart').value = today.toISOString().slice(0,10); 
      $('#payEnd').value = e.toISOString().slice(0,10); 
    }
    else if (type === '10days') { 
      const e = new Date(today); 
      e.setDate(today.getDate()+9); 
      $('#payStart').value = today.toISOString().slice(0,10); 
      $('#payEnd').value = e.toISOString().slice(0,10); 
    }
    
    $('#payName').value = `رواتب ${names[type]} - ${today.toLocaleDateString('ar-EG')}`;
    
    const start = $('#payStart').value; 
    const end = $('#payEnd').value;
    if (start && end) {
      const days = Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1;
      $('#periodPreview').innerHTML = `<div style="background:var(--primary-soft);padding:14px;border-radius:10px;text-align:center"><div style="font-size:12px;color:var(--text-2);font-weight:700;margin-bottom:4px">📊 المدة</div><div style="font-size:20px;font-weight:900;color:var(--primary)">${days} يوم</div></div>`;
    }
  },
  
  async open(id) {
    const { data: file } = await sb.from('payroll_files').select('*, departments(name)').eq('id', id).single();
    
    const { data: recordsData, error: recordsErr } = await sb.rpc('get_payroll_records_detailed', { p_file_id: id });
    
    if (recordsErr) {
      toast('❌ خطأ في جلب البيانات: ' + recordsErr.message, 'error');
      return;
    }
    
    const records = recordsData?.records || [];
    const paid = file.status === 'paid';
    const locked = file.is_locked;
    const days = file.period_days || Math.ceil((new Date(file.end_date) - new Date(file.start_date)) / 86400000) + 1;
    
    let html = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
        <span class="badge ${file.status==='paid'?'success':file.status==='draft'?'gray':'info'}">${file.status==='paid'?'مدفوع':file.status==='draft'?'مسودة':'معتمد'}</span>
        ${locked?`<span class="badge warning">🔒 مقفل</span>`:''}
        ${file.attendance_file_id?`<span class="badge info">🔗 مربوط بحضور</span>`:`<span class="badge gray">✏️ يدوي</span>`}
        <span>🏢 <b>${esc(file.departments?.name||'—')}</b></span>
        <span>📅 <b>${fmtDate(file.start_date)} — ${fmtDate(file.end_date)}</b></span>
        <span>📊 <b>${days} يوم</b></span>
        <span style="margin-right:auto">💰 <b style="color:var(--success);font-size:18px">${fmt(file.total_net)}</b></span>
      </div>
      ${!paid && !locked ? `
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
          <button class="btn btn-info btn-sm" onclick="Payroll.recalc('${id}')">🔄 إعادة الحساب</button>
          <button class="btn btn-purple btn-sm" onclick="Payroll.addBulkEarning('${id}')">💰 حافز جماعي</button>
          <button class="btn btn-warning btn-sm" onclick="Payroll.applyLoans('${id}')">💳 تطبيق السلف</button>
        </div>` : ''}
      
      <div style="margin-bottom:12px;padding:12px;background:var(--primary-soft);border-radius:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span style="font-size:20px">🔎</span>
        <input type="text" id="paySearchInput" placeholder="ابحث بالاسم أو الرقم الوظيفي..."
          style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg-2);color:var(--text);font-size:14px;font-weight:600">
        <span id="paySearchCounter" style="font-size:12px;color:var(--text-2);font-weight:700;white-space:nowrap">${records.length} / ${records.length} موظف</span>
      </div>
      
      <div class="table-scroll"><table class="data">
        <thead><tr>
          <th>الرقم</th><th>الموظف</th><th>الأساسي</th><th>النوع</th>
          <th style="background:var(--success-soft);color:#065f46">📅 حضور</th>
          <th style="background:var(--danger-soft);color:#991b1b">📅 غياب</th>
          <th>➕ استحقاقات</th><th>➖ استقطاعات</th><th>💰 خصم الغياب</th><th>💰 الصافي</th><th>إجراءات</th>
        </tr></thead>
        <tbody>${records.map(r => {
          const presentDays = Number(r.present_days || 0);
          const absentDays = Number(r.absent_days || 0);
          const typeMap = { 'monthly': '📅 شهري', 'weekly': '📊 أسبوعي', 'daily': '📆 يومي' };
          const typeLabel = typeMap[r.salary_type] || '📅 شهري';
          
          return `
            <tr>
              <td><b>${esc(r.employee_number)}</b></td>
              <td>${esc(r.full_name)}</td>
              <td class="num">${fmt(r.base_salary, r.currency)}</td>
              <td><span class="badge ${r.salary_type==='daily'?'info':r.salary_type==='weekly'?'purple':'primary'}">${typeLabel}</span></td>
              <td class="num" style="color:var(--success);font-weight:900;font-size:15px">🟢 ${presentDays}</td>
              <td class="num" style="color:var(--danger);font-weight:900;font-size:15px">🔴 ${absentDays}</td>
              <td class="num" style="color:var(--success)">${fmt(r.total_earnings, r.currency)}</td>
              <td class="num" style="color:var(--danger)">${fmt(r.total_deductions, r.currency)}</td>
              <td class="num" style="color:var(--warning)">${fmt(r.absence_deduction, r.currency)}</td>
              <td class="num" style="color:var(--success);font-weight:900">${fmt(r.net_salary, r.currency)}</td>
              <td>
                ${!paid && !locked ? `<button class="btn btn-info btn-sm" onclick="Payroll.details('${r.id}','${id}')" title="تفاصيل">📊</button><button class="btn btn-success btn-sm" onclick="Payroll.paySingle('${r.id}','${id}')" title="دفع">💸</button>` : (r.is_paid ? '<span class="badge success">✅</span>' : '—')}
              </td>
            </tr>
          `;
        }).join('')}</tbody>
        <tfoot><tr><td colspan="9">الإجمالي</td><td class="num" style="color:var(--success);font-size:15px">${fmt(records.reduce((s,r)=>s+Number(r.net_salary||0),0))}</td><td></td></tr></tfoot>
      </table></div>
    `;
    
    Modal.open(`💵 ${esc(file.name)}`, html, `
      <button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>
      ${!paid && !locked ? `<button class="btn btn-success" onclick="Payroll.pay('${id}')">💸 دفع الكل</button>` : ''}
      ${locked && Auth.isAdmin() ? `<button class="btn btn-warning" onclick="Payroll.unlock('${id}')">🔓 فك القفل</button>` : ''}
      <button class="btn btn-purple" onclick="Reports.payrollFile('${id}')">🖨️ طباعة الكل بالتفصيل</button>
    `, {size:'lg'});
    
    setTimeout(() => {
      const searchInput = document.getElementById('paySearchInput');
      const counter = document.getElementById('paySearchCounter');
      const table = document.querySelector('.table-scroll tbody');
      
      if (searchInput && table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        
        searchInput.oninput = (e) => {
          const term = e.target.value.toLowerCase().trim();
          let visible = 0;
          
          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = !term || text.includes(term);
            row.style.display = match ? '' : 'none';
            if (match) visible++;
          });
          
          if (counter) counter.textContent = `${visible} / ${rows.length} موظف`;
        };
      }
    }, 100);
  }
};

// ✅ إكمال Payroll بالدوال المتبقية
Object.assign(Payroll, {
  async details(recordId, fileId) {
    const calc = await calcEmployeeNet(recordId);
    if (!calc) return toast('غير موجود', 'error');
    
    const r = calc.record;
    const { data: emp } = await sb.from('employees').select('employee_number, full_name, currency').eq('id', r.employee_id).single();
    const currency = emp?.currency || 'SDG';
    const { data: fileData } = await sb.from('payroll_files').select('status, is_locked, attendance_file_id, start_date, end_date, period_days').eq('id', fileId).single();
    const isLocked = fileData?.is_locked || fileData?.status === 'paid';
    const isLinked = !!fileData?.attendance_file_id;
    
    const renderEarning = (e) => `
      <div style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--bg-2);border-radius:8px;margin-bottom:6px;border:1px solid var(--border)">
        <div style="flex:1;font-size:13.5px;font-weight:700;text-align:right">${esc(e.custom_name || e.earning_types?.name || 'بند')}</div>
        ${!isLocked ? `
          <input type="number" value="${e.amount}" step="0.01"
            style="width:130px;padding:6px 10px;border-radius:6px;border:1.5px solid var(--border);text-align:right;font-weight:800;font-size:13px;background:var(--bg-2);color:var(--text)"
            onblur="Payroll.updateEarningInline('${e.id}','${recordId}','${fileId}',this.value)">
          <button class="btn btn-danger btn-sm" onclick="Payroll.delEarning('${e.id}','${recordId}','${fileId}')" style="padding:6px 9px">🗑</button>
        ` : `<b style="font-size:14px">${fmt(e.amount, currency)}</b>`}
      </div>`;
    
    const renderDeduction = (d) => `
      <div style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--bg-2);border-radius:8px;margin-bottom:6px;border:1px solid var(--border)">
        <div style="flex:1;font-size:13.5px;font-weight:700;text-align:right">${esc(d.custom_name || d.deduction_types?.name || 'بند')}</div>
        ${!isLocked ? `
          <input type="number" value="${d.amount}" step="0.01"
            style="width:130px;padding:6px 10px;border-radius:6px;border:1.5px solid var(--border);text-align:right;font-weight:800;font-size:13px;background:var(--bg-2);color:var(--text)"
            onblur="Payroll.updateDeductionInline('${d.id}','${recordId}','${fileId}',this.value)">
          <button class="btn btn-danger btn-sm" onclick="Payroll.delDeduction('${d.id}','${recordId}','${fileId}')" style="padding:6px 9px">🗑</button>
        ` : `<b style="font-size:14px">${fmt(d.amount, currency)}</b>`}
      </div>`;
    
    const att = calc.attendance;
    const isDaily = calc.salaryType === 'daily';
    const isWeekly = calc.salaryType === 'weekly';
    
    Modal.open(`📊 تفاصيل راتب: ${esc(emp?.full_name)}`, `
      <div style="background:linear-gradient(135deg,var(--primary-soft),var(--purple-soft));padding:16px;border-radius:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:12px;color:var(--text-2);font-weight:700">الموظف</div>
          <div style="font-weight:900;font-size:16px">${esc(emp?.employee_number)} — ${esc(emp?.full_name)}</div>
        </div>
        <div style="text-align:left">
          <div style="font-size:12px;color:var(--text-2);font-weight:700">نوع الراتب</div>
          <div style="font-weight:900;font-size:16px;color:var(--primary)">${isDaily?'📆 يومي':isWeekly?'📊 أسبوعي':'📅 شهري'}</div>
        </div>
        <div style="text-align:left">
          <div style="font-size:12px;color:var(--text-2);font-weight:700">الأجر اليومي</div>
          <div style="font-weight:900;font-size:18px;color:var(--primary)">${fmt(att.dailyWage, currency)}</div>
        </div>
      </div>
      
      <div style="margin-bottom:16px;background:linear-gradient(135deg,#dbeafe,#e0e7ff);padding:16px;border-radius:12px;border:2px solid #6366f1">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <b style="color:#4338ca;font-size:15px">📅 تفاصيل الحضور خلال الفترة</b>
          ${isLinked ? `<span class="badge info">🔗 مربوط بملف حضور</span>` : `<span class="badge warning">✏️ إدخال يدوي</span>`}
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
          <div style="background:#fff;padding:10px;border-radius:8px;text-align:center">
            <div style="font-size:11px;color:#065f46;font-weight:700">🟢 حاضر</div>
            <div style="font-size:22px;font-weight:900;color:#065f46">${att.presentDays}</div>
          </div>
          <div style="background:#fff;padding:10px;border-radius:8px;text-align:center">
            <div style="font-size:11px;color:#991b1b;font-weight:700">🔴 غائب</div>
            <div style="font-size:22px;font-weight:900;color:#991b1b">${att.absenceDays}</div>
          </div>
          <div style="background:#fff;padding:10px;border-radius:8px;text-align:center">
            <div style="font-size:11px;color:#92400e;font-weight:700">🟡 بعذر</div>
            <div style="font-size:22px;font-weight:900;color:#92400e">${att.excusedDays}</div>
          </div>
          <div style="background:#fff;padding:10px;border-radius:8px;text-align:center">
            <div style="font-size:11px;color:#075985;font-weight:700">🔵 مرضي</div>
            <div style="font-size:22px;font-weight:900;color:#075985">${att.sickDays}</div>
          </div>
        </div>
        
        <div style="background:#fff;padding:12px;border-radius:8px;border-right:4px solid #dc2626">
          <div style="font-size:12px;color:var(--text-2);font-weight:700;margin-bottom:6px">💰 طريقة الحساب:</div>
          <div style="font-family:monospace;font-size:12px;color:#991b1b;background:#fef2f2;padding:10px;border-radius:6px;direction:rtl;text-align:right;line-height:1.8">
            ${isDaily ? `
              <b>عامل يومي:</b><br>
              <b>الراتب</b> = الأجر اليومي (${fmt(att.dailyWage, currency)}) × أيام الحضور (${att.presentDays}) = <b>${fmt(r.base_salary, currency)}</b>
            ` : isWeekly ? `
              <b>موظف أسبوعي:</b><br>
              <b>الأجر اليومي</b> = ${fmt(r.base_salary, currency)} ÷ 7 = <b>${fmt(att.dailyWage, currency)}</b><br>
              <b>خصم الغياب</b> = ${fmt(att.dailyWage, currency)} × ${att.unexcusedDays} أيام بدون عذر = <b>${fmt(calc.absenceDeduction, currency)}</b>
            ` : `
              <b>موظف شهري:</b><br>
              <b>الأجر اليومي</b> = ${fmt(r.base_salary, currency)} ÷ 30 = <b>${fmt(att.dailyWage, currency)}</b><br>
              <b>خصم الغياب</b> = ${fmt(att.dailyWage, currency)} × ${att.unexcusedDays} أيام بدون عذر = <b>${fmt(calc.absenceDeduction, currency)}</b>
            `}
          </div>
        </div>
      </div>
      
      <div style="margin-bottom:16px;background:var(--success-soft);padding:16px;border-radius:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <b style="color:var(--success);font-size:15px">➕ الاستحقاقات (${calc.earnings.length})</b>
          ${!isLocked ? `<button class="btn btn-success btn-sm" onclick="Payroll.addEarning('${recordId}','${fileId}')">➕ إضافة</button>` : ''}
        </div>
        <div>${calc.earnings.map(renderEarning).join('') || '<div style="text-align:center;color:var(--text-2);padding:16px;font-size:13px">لا توجد بنود</div>'}</div>
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--success);color:#fff;border-radius:8px;margin-top:10px;font-weight:900;font-size:15px">
          <span>✅ إجمالي الاستحقاقات:</span>
          <span>${fmt(calc.totalEarnings, currency)}</span>
        </div>
      </div>
      
      <div style="margin-bottom:16px;background:var(--danger-soft);padding:16px;border-radius:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <b style="color:var(--danger);font-size:15px">➖ الاستقطاعات (${calc.deductions.length})</b>
          ${!isLocked ? `<button class="btn btn-danger btn-sm" onclick="Payroll.addDeduction('${recordId}','${fileId}')">➕ إضافة</button>` : ''}
        </div>
        <div>${calc.deductions.map(renderDeduction).join('') || '<div style="text-align:center;color:var(--text-2);padding:16px;font-size:13px">لا توجد بنود</div>'}</div>
        
        ${!isDaily ? `
          <div style="padding:12px;background:#fff;border:2px dashed #dc2626;border-radius:8px;margin-top:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;font-weight:900;color:#dc2626;font-size:14px">
              <span>📅 خصم الغياب ${isLinked ? '(تلقائي)' : '(يدوي)'}:</span>
              <span>${fmt(calc.absenceDeduction, currency)}</span>
            </div>
            <div style="font-size:11px;color:var(--text-2);margin-top:4px;text-align:center">
              (${att.unexcusedDays} يوم بدون عذر × ${fmt(att.dailyWage, currency)})
            </div>
          </div>
        ` : ''}
        
        <div style="display:flex;justify-content:space-between;padding:12px;background:var(--danger);color:#fff;border-radius:8px;margin-top:10px;font-weight:900;font-size:15px">
          <span>✅ إجمالي الاستقطاعات:</span>
          <span>${fmt(calc.totalDeductions + calc.absenceDeduction, currency)}</span>
        </div>
      </div>
      
      <div style="background:linear-gradient(135deg, var(--success), var(--success-h));padding:22px;border-radius:14px;text-align:center;color:#fff;box-shadow:0 8px 20px rgba(5,150,105,.3)">
        <div style="font-size:13px;opacity:0.95;margin-bottom:6px;font-weight:700">💰 الصافي المستحق</div>
        <div style="font-size:32px;font-weight:900">${fmt(calc.net, currency)}</div>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Payroll.closeDetails('${fileId}')">إغلاق</button>
      <button class="btn btn-purple" onclick="Payroll.printSingle('${recordId}')">🖨️ كشف الطباعة</button>
      <button class="btn btn-success" onclick="Modal.close();Payroll.paySingle('${recordId}','${fileId}')">💸 دفع هذا الموظف</button>
    `, {size: 'lg'});
  },
  
  closeDetails(fileId) {
    Modal.close();
    setTimeout(() => Payroll.open(fileId), 150);
  },
  
  async updateEarningInline(id, recordId, fileId, newAmount) {
    await sb.from('payroll_earnings').update({ amount: Number(newAmount || 0) }).eq('id', id);
    await this.recalcEmployee(recordId, fileId);
    Modal.close();
    setTimeout(() => this.details(recordId, fileId), 100);
    toast('✅ تم الحفظ');
  },
  
  async updateDeductionInline(id, recordId, fileId, newAmount) {
    await sb.from('payroll_deductions').update({ amount: Number(newAmount || 0) }).eq('id', id);
    await this.recalcEmployee(recordId, fileId);
    Modal.close();
    setTimeout(() => this.details(recordId, fileId), 100);
    toast('✅ تم الحفظ');
  },
  
  async addEarning(recordId, fileId) {
    const types = Cache.earningTypes.filter(t => t.is_active);
    if (!types.length) return toast('لا توجد بنود', 'warning');
    
    Modal.open('➕ إضافة استحقاق', `
      <label class="field"><span>البند</span><select id="addEarnType">${types.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      <label class="field"><span>أو اسم مخصص</span><input id="addEarnCustom" placeholder="بدل سكن..."></label>
      <label class="field"><span>المبلغ *</span><input type="number" id="addEarnAmount" value="0" step="0.01" required></label>
    `, `<button class="btn btn-ghost" onclick="Modal.close();Payroll.details('${recordId}','${fileId}')">إلغاء</button><button class="btn btn-success" id="saveEarn">💾 إضافة</button>`);
    
    $('#saveEarn').onclick = async () => {
      const typeId = $('#addEarnType').value;
      const customName = $('#addEarnCustom').value.trim();
      const amount = Number($('#addEarnAmount').value || 0);
      if (amount <= 0) return toast('أدخل مبلغاً', 'warning');
      
      const payload = { payroll_record_id: recordId, amount, is_custom: !!customName };
      if (customName) { 
        payload.custom_name = customName; 
        payload.earning_type_id = null; 
      } else { 
        payload.earning_type_id = typeId; 
      }
      
      const { error } = await sb.from('payroll_earnings').insert(payload);
      if (error) return toast('❌ ' + error.message, 'error');
      
      await Payroll.recalcEmployee(recordId, fileId);
      toast('✅ تمت الإضافة');
      Modal.close();
      setTimeout(() => Payroll.details(recordId, fileId), 150);
    };
  },
  
  async addDeduction(recordId, fileId) {
    const types = Cache.deductionTypes.filter(t => t.is_active);
    if (!types.length) return toast('لا توجد بنود', 'warning');
    
    Modal.open('➕ إضافة استقطاع', `
      <label class="field"><span>البند</span><select id="addDedType">${types.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      <label class="field"><span>أو اسم مخصص</span><input id="addDedCustom" placeholder="جزاء..."></label>
      <label class="field"><span>المبلغ *</span><input type="number" id="addDedAmount" value="0" step="0.01" required></label>
    `, `<button class="btn btn-ghost" onclick="Modal.close();Payroll.details('${recordId}','${fileId}')">إلغاء</button><button class="btn btn-danger" id="saveDed">💾 إضافة</button>`);
    
    $('#saveDed').onclick = async () => {
      const typeId = $('#addDedType').value;
      const customName = $('#addDedCustom').value.trim();
      const amount = Number($('#addDedAmount').value || 0);
      if (amount <= 0) return toast('أدخل مبلغاً', 'warning');
      
      const payload = { payroll_record_id: recordId, amount, is_custom: !!customName };
      if (customName) { 
        payload.custom_name = customName; 
        payload.deduction_type_id = null; 
      } else { 
        payload.deduction_type_id = typeId; 
      }
      
      const { error } = await sb.from('payroll_deductions').insert(payload);
      if (error) return toast('❌ ' + error.message, 'error');
      
      await Payroll.recalcEmployee(recordId, fileId);
      toast('✅ تمت الإضافة');
      Modal.close();
      setTimeout(() => Payroll.details(recordId, fileId), 150);
    };
  },
  
  async delEarning(id, recordId, fileId) {
    if (!confirm('حذف هذا البند؟')) return;
    await sb.from('payroll_earnings').delete().eq('id', id);
    await this.recalcEmployee(recordId, fileId);
    toast('✅ تم الحذف');
    Modal.close();
    setTimeout(() => this.details(recordId, fileId), 150);
  },
  
  async delDeduction(id, recordId, fileId) {
    if (!confirm('حذف هذا البند؟')) return;
    await sb.from('payroll_deductions').delete().eq('id', id);
    await this.recalcEmployee(recordId, fileId);
    toast('✅ تم الحذف');
    Modal.close();
    setTimeout(() => this.details(recordId, fileId), 150);
  },
  
  async recalcEmployee(recordId, fileId) {
    const { data, error } = await sb.rpc('calc_employee_payroll', { p_record_id: recordId });
    if (error || !data?.success) {
      console.error('Recalc error:', error || data?.error);
      return;
    }
    
    const { data: allRecs } = await sb.from('payroll_records').select('net_salary').eq('payroll_file_id', fileId);
    const total = (allRecs||[]).reduce((s,r)=>s+Number(r.net_salary||0),0);
    await sb.from('payroll_files').update({ total_net: total }).eq('id', fileId);
  },
  
  async recalc(id) {
    toast('⏳ جاري إعادة الحساب...');
    
    const { data, error } = await sb.rpc('recalc_payroll_file', { p_file_id: id });
    
    if (error || !data?.success) {
      toast('❌ ' + (error?.message || data?.error), 'error');
      return;
    }
    
    toast(`✅ تم إعادة حساب ${data.records_updated} موظف`);
    Modal.close();
    setTimeout(() => Payroll.open(id), 200);
  },
  
  async addBulkEarning(id) {
    const types = Cache.earningTypes.filter(t=>!t.is_system);
    if (!types.length) return toast('لا توجد بنود', 'warning');
    
    Modal.open('💰 حافز جماعي', `
      <label class="field"><span>البند</span><select id="bulkType">${types.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      <label class="field"><span>المبلغ لكل موظف</span><input type="number" id="bulkAmount" value="0"></label>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="bulkSave">تطبيق</button>`);
    
    $('#bulkSave').onclick = async () => {
      const typeId = $('#bulkType').value;
      const amount = Number($('#bulkAmount').value || 0);
      if (!typeId || !amount) return toast('أدخل بيانات', 'warning');
      
      const { data: records } = await sb.from('payroll_records').select('id').eq('payroll_file_id', id);
      await sb.from('payroll_earnings').insert((records||[]).map(r=>({payroll_record_id:r.id, earning_type_id:typeId, amount})));
      
      toast('✅ تم');
      Modal.close();
      await this.recalc(id);
    };
  },
  
  async applyLoans(id) {
    const { data: records } = await sb.from('payroll_records').select('*').eq('payroll_file_id', id);
    const { data: loans } = await sb.from('loans').select('*').eq('status','active');
    const { data: loanType } = await sb.from('deduction_types').select('id').eq('name','سلفة').single();
    
    let applied = 0;
    for (const r of (records||[])) {
      const loan = (loans||[]).find(l => l.employee_id === r.employee_id && Number(l.remaining_amount) > 0);
      if (!loan || !loanType) continue;
      const amount = Math.min(Number(loan.installment_amount), Number(loan.remaining_amount));
      if (amount <= 0) continue;
      await sb.from('payroll_deductions').insert({ payroll_record_id: r.id, deduction_type_id: loanType.id, amount });
      applied++;
    }
    
    toast(`✅ تم تطبيق ${applied} سلفة`);
    await this.recalc(id);
  },
  
  async pay(id) {
    const { data: treasuries } = await sb.from('treasuries').select('*').eq('is_active', true);
    const { data: file } = await sb.from('payroll_files').select('*, departments(name)').eq('id', id).single();
    
    const { data: allRecords } = await sb.from('payroll_records').select('id, net_salary, is_paid').eq('payroll_file_id', id);
    
    const totalRecords = allRecords?.length || 0;
    const paidRecords = allRecords?.filter(r => r.is_paid) || [];
    const unpaidRecords = allRecords?.filter(r => !r.is_paid) || [];
    const unpaidTotal = unpaidRecords.reduce((s, r) => s + Number(r.net_salary || 0), 0);
    const paidTotal = paidRecords.reduce((s, r) => s + Number(r.net_salary || 0), 0);
    
    if (unpaidRecords.length === 0) {
      return toast('⚠️ جميع الموظفين مدفوعون مسبقاً', 'warning');
    }
    
    const opts = (treasuries || []).map(t => {
      const isDept = t.department_id === file.department_id;
      return `<option value="${t.id}" ${isDept ? 'selected' : ''}>${t.type==='cash'?'💵':'🏛️'} ${esc(t.name)} ${isDept?'⭐':''} — ${fmt(t.current_balance)}</option>`;
    }).join('');
    
    Modal.open('💸 تأكيد دفع الكل', `
      <div style="background:var(--primary-soft);padding:16px;border-radius:12px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>الملف:</span><b>${esc(file.name)}</b></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>إجمالي الموظفين:</span><b>${totalRecords}</b></div>
        
        ${paidRecords.length > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;color:#059669">
            <span>✅ مدفوع مسبقاً:</span>
            <b>${paidRecords.length} موظف — ${fmt(paidTotal)}</b>
          </div>
        ` : ''}
        
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;color:#dc2626">
          <span>⏳ سيتم دفعهم الآن:</span>
          <b>${unpaidRecords.length} موظف</b>
        </div>
        
        <div style="display:flex;justify-content:space-between;font-size:18px;color:var(--success);padding-top:12px;border-top:2px solid var(--border);margin-top:12px">
          <span>💰 المبلغ المطلوب:</span>
          <b>${fmt(unpaidTotal)}</b>
        </div>
      </div>
      
      ${paidRecords.length > 0 ? `
        <div style="padding:12px;background:var(--warning-soft);border-radius:10px;font-size:12.5px;color:#78350f;margin-bottom:16px">
          💡 <b>ملاحظة:</b> ${paidRecords.length} موظف مدفوعون مسبقاً. سيتم <b>تخطيهم</b> تلقائياً.
        </div>
      ` : ''}
      
      <label class="field"><span>الخزينة</span><select id="payTreasury"><option value="">— اختر —</option>${opts}</select></label>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close();Payroll.open('${id}')">إلغاء</button>
      <button class="btn btn-success" id="doPay">💸 دفع ${unpaidRecords.length} موظف</button>
    `);
    
    $('#doPay').onclick = async () => {
      const tid = $('#payTreasury').value;
      if (!tid) return toast('اختر الخزينة', 'warning');
      
      const btn = $('#doPay');
      btn.disabled = true;
      btn.textContent = '⏳ جاري الدفع...';
      
      const { data, error } = await sb.rpc('pay_payroll', { 
        p_payroll_id: id, 
        p_treasury_id: tid, 
        p_payment_method: 'cash' 
      });
      
      if (error || !data?.success) {
        toast('❌ ' + (error?.message || data?.error), 'error');
        btn.disabled = false;
        btn.textContent = '💸 دفع';
        return;
      }
      
      toast(`✅ تم دفع ${data.paid_count} موظف بمبلغ ${fmt(data.total)}`);
      await notifyUser('💸 تم دفع الرواتب', `تم دفع ${data.paid_count} موظف في ${file.name}`, 'success');
      Modal.close();
      Payroll.load();
    };
  },
  
  async paySingle(recordId, fileId) {
    const { data: r } = await sb.from('payroll_records').select('*, employees(full_name, employee_number, currency)').eq('id', recordId).single();
    if (!r) return toast('غير موجود', 'error');
    if (r.is_paid) return toast('تم دفعه مسبقاً', 'warning');
    
    const { data: treasuries } = await sb.from('treasuries').select('*').eq('is_active', true);
    const opts = (treasuries||[]).map(t => `<option value="${t.id}">${t.type==='cash'?'💵':'🏛️'} ${esc(t.name)} — ${fmt(t.current_balance)}</option>`).join('');
    
    Modal.open(`💸 دفع: ${esc(r.employees?.full_name)}`, `
      <div style="background:var(--primary-soft);padding:16px;border-radius:12px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>الموظف:</span><b>${esc(r.employees?.employee_number)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:20px;color:var(--success)"><span>الصافي:</span><b>${fmt(r.net_salary, r.employees?.currency)}</b></div>
      </div>
      <label class="field"><span>الخزينة</span><select id="paySingleTreasury"><option value="">— اختر —</option>${opts}</select></label>
    `, `<button class="btn btn-ghost" onclick="Modal.close();Payroll.open('${fileId}')">إلغاء</button><button class="btn btn-success" id="doPaySingle">💸 تأكيد</button>`);
    
    $('#doPaySingle').onclick = async () => {
      const tid = $('#paySingleTreasury').value;
      if (!tid) return toast('اختر الخزينة', 'warning');
      const btn = $('#doPaySingle');
      btn.disabled = true;
      
      const { data, error } = await sb.rpc('pay_single_employee', {
        p_payroll_record_id: recordId, 
        p_treasury_id: tid, 
        p_payment_method: 'cash', 
        p_amount: r.net_salary
      });
      
      if (error || !data?.success) { 
        toast('❌ ' + (error?.message || data?.error), 'error'); 
        btn.disabled = false; 
        return; 
      }
      
      toast('✅ تم الدفع');
      Modal.close();
      Payroll.open(fileId);
    };
  },
  
  async unlock(id) {
    confirmModal('🔓 فك القفل', 'فك القفل؟', async () => {
      await sb.from('payroll_files').update({ is_locked: false }).eq('id', id);
      toast('✅ تم');
      Payroll.open(id);
    }, false);
  },
  
  async del(id, name) {
    confirmModal('🗑 حذف ملف', `حذف "${esc(name)}"؟`, async () => {
      await sb.from('payroll_files').delete().eq('id', id);
      toast('✅ تم');
      Payroll.load();
    });
  },
  
  async printSingle(recordId) {
    const calc = await calcEmployeeNet(recordId);
    if (!calc) return toast('غير موجود', 'error');
    
    const r = calc.record;
    const { data: emp } = await sb.from('employees').select('*, departments(name)').eq('id', r.employee_id).single();
    const { data: file } = await sb.from('payroll_files').select('*').eq('id', r.payroll_file_id).single();
    const currency = emp?.currency || 'SDG';
    const factoryName = Cache.getSetting('factory_name', 'مصنع الصندل');
    const logoUrl = Cache.getSetting('factory_logo_url', '').trim();
    const att = calc.attendance;
    const isDaily = calc.salaryType === 'daily';
    const isWeekly = calc.salaryType === 'weekly';
    
    let earningsRows = `<tr style="background:#f0fdf4">
      <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:700">1. ${isDaily ? 'الأجر اليومي × أيام الحضور' : isWeekly ? 'الراتب الأسبوعي' : 'الراتب الأساسي (شهري)'}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:800">${fmt(r.base_salary, currency)}</td>
    </tr>`;
    
    calc.earnings.forEach((e, i) => {
      const name = e.custom_name || e.earning_types?.name || 'بند';
      earningsRows += `<tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;color:#059669">${i+2}. ${esc(name)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:800;color:#059669">+ ${fmt(e.amount, currency)}</td>
      </tr>`;
    });
    
    let deductionsRows = '';
    calc.deductions.forEach((d, i) => {
      const name = d.custom_name || d.deduction_types?.name || 'بند';
      deductionsRows += `<tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;color:#dc2626">${i+1}. ${esc(name)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:800;color:#dc2626">- ${fmt(d.amount, currency)}</td>
      </tr>`;
    });
    
    if (calc.absenceDeduction > 0) {
      deductionsRows += `<tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;color:#dc2626">${calc.deductions.length+1}. خصم الغياب (${att.unexcusedDays} يوم)</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:800;color:#dc2626">- ${fmt(calc.absenceDeduction, currency)}</td>
      </tr>`;
    }
    if (!deductionsRows) deductionsRows = `<tr><td colspan="2" style="padding:8px;border:1px solid #ddd;text-align:center;color:#999">لا توجد استقطاعات</td></tr>`;
    
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" style="width:80px;height:80px;object-fit:contain;margin:0 auto 8px;display:block" alt="logo">`
      : `<div style="font-size:40px">🏭</div>`;
    
    const html = `
      <div id="printArea" style="direction:rtl;font-family:Cairo,sans-serif;padding:20px;background:#fff;color:#111;max-width:800px;margin:0 auto">
        <div style="text-align:center;margin-bottom:20px;border-bottom:3px solid #6366f1;padding-bottom:14px">
          ${logoHtml}
          <h1 style="margin:4px 0;color:#4338ca;font-size:22px;font-weight:900">${esc(factoryName)}</h1>
          <h2 style="margin:8px 0;font-size:16px">كشف راتب موظف</h2>
          <div style="font-size:11px;color:#666">📅 ${fmtDate(file.start_date)} — ${fmtDate(file.end_date)}</div>
        </div>
        
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
          <tr>
            <td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;width:20%"><b>الاسم:</b></td>
            <td style="padding:8px;border:1px solid #ddd">${esc(emp?.full_name)}</td>
            <td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;width:20%"><b>الرقم:</b></td>
            <td style="padding:8px;border:1px solid #ddd">${esc(emp?.employee_number)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>القسم:</b></td>
            <td style="padding:8px;border:1px solid #ddd">${esc(emp?.departments?.name || '—')}</td>
            <td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>نوع الراتب:</b></td>
            <td style="padding:8px;border:1px solid #ddd">${isDaily?'📆 يومي':isWeekly?'📊 أسبوعي':'📅 شهري'}</td>
          </tr>
        </table>
        
        <div style="background:#eef2ff;padding:12px;border-radius:8px;margin-bottom:16px;border-right:4px solid #4338ca">
          <b style="color:#4338ca">📅 الحضور خلال الفترة:</b>
          <span style="margin-right:16px">🟢 حاضر: <b>${att.presentDays}</b></span>
          <span style="margin-right:16px">🔴 غائب: <b>${att.absenceDays}</b></span>
          <span style="margin-right:16px">🟡 بعذر: <b>${att.excusedDays}</b></span>
          <span>🔵 مرضي: <b>${att.sickDays}</b></span>
        </div>
        
        <h3 style="color:#059669;margin-bottom:6px;font-size:14px;background:#d1fae5;padding:6px 10px;border-radius:6px">💵 الاستحقاقات</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
          <thead><tr style="background:#059669;color:#fff">
            <th style="padding:8px;border:1px solid #059669;text-align:right">البند</th>
            <th style="padding:8px;border:1px solid #059669;text-align:right;width:140px">المبلغ</th>
          </tr></thead>
          <tbody>
            ${earningsRows}
            <tr style="background:#f0fdf4;font-weight:900">
              <td style="padding:10px;border:1px solid #ddd;text-align:right">✅ إجمالي الاستحقاقات</td>
              <td style="padding:10px;border:1px solid #ddd;text-align:right;color:#059669">${fmt(calc.totalEarnings, currency)}</td>
            </tr>
          </tbody>
        </table>
        
        <h3 style="color:#dc2626;margin-bottom:6px;font-size:14px;background:#fee2e2;padding:6px 10px;border-radius:6px">➖ الاستقطاعات</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
          <thead><tr style="background:#dc2626;color:#fff">
            <th style="padding:8px;border:1px solid #dc2626;text-align:right">البند</th>
            <th style="padding:8px;border:1px solid #dc2626;text-align:right;width:140px">المبلغ</th>
          </tr></thead>
          <tbody>
            ${deductionsRows}
            <tr style="background:#fef2f2;font-weight:900">
              <td style="padding:10px;border:1px solid #ddd;text-align:right">✅ إجمالي الاستقطاعات</td>
              <td style="padding:10px;border:1px solid #ddd;text-align:right;color:#dc2626">${fmt(calc.totalDeductions + calc.absenceDeduction, currency)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:18px;border-radius:12px;text-align:center;margin-bottom:24px">
          <div style="font-size:12px;margin-bottom:6px">💰 الصافي المستحق</div>
          <div style="font-size:30px;font-weight:900">${fmt(calc.net, currency)}</div>
        </div>
        
        <table style="width:100%;margin-top:40px;font-size:11px">
          <tr>
            <td style="width:50%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">توقيع الموظف</div></td>
            <td style="width:50%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">توقيع المستلم</div></td>
          </tr>
        </table>
      </div>`;
    
    Modal.open('🖨️ كشف الراتب التفصيلي', html, `
      <button class="btn btn-ghost" onclick="Modal.close();Payroll.details('${recordId}','${r.payroll_file_id}')">رجوع</button>
      <button class="btn btn-primary" onclick="Reports.print('A4')">🖨️ طباعة / PDF</button>
    `, {size: 'lg'});
  }
});

// ============================================
// Loans (السلف)
// ============================================
const Loans = {
  async render() {
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>💳 السلف</h1><p>إدارة سلف الموظفين</p>
        <div class="page-actions"><button class="btn btn-primary" onclick="Loans.openForm()">➕ سلفة جديدة</button></div>
      </div>
      <div class="table-wrap"><div class="table-scroll" id="loansTable"></div></div>`;
    await this.load();
  },
  
  async load() {
    const { data } = await sb.from('loans').select('*, employees(employee_number, full_name, currency)').order('created_at',{ascending:false});
    const wrap = $('#loansTable');
    if (!data?.length) {
      wrap.innerHTML = `<div class="empty"><div class="ico">💳</div><h3>لا توجد سلف</h3><button class="btn btn-primary" onclick="Loans.openForm()">➕ إضافة</button></div>`;
      return;
    }
    wrap.innerHTML = `<table class="data"><thead><tr>
      <th>الموظف</th><th>الإجمالي</th><th>القسط</th><th>الأقساط</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th>
    </tr></thead><tbody>${data.map(l=>`
      <tr>
        <td><b>${esc(l.employees?.employee_number)}</b> — ${esc(l.employees?.full_name)}</td>
        <td class="num">${fmt(l.total_amount, l.currency)}</td>
        <td class="num">${fmt(l.installment_amount, l.currency)}</td>
        <td>${l.installments_count}</td>
        <td class="num">${fmt(l.paid_amount, l.currency)}</td>
        <td class="num" style="color:var(--warning)">${fmt(l.remaining_amount, l.currency)}</td>
        <td><span class="badge ${l.status==='active'?'warning':l.status==='completed'?'success':'gray'}">${l.status==='active'?'نشطة':l.status==='completed'?'مكتملة':'ملغاة'}</span></td>
      </tr>`).join('')}</tbody></table>`;
  },
  
  async openForm() {
    const { data: emps } = await sb.from('employees').select('id, employee_number, full_name').is('deleted_at',null).eq('status','active').order('employee_number');
    const opts = (emps||[]).map(e=>`<option value="${e.id}">${esc(e.employee_number)} - ${esc(e.full_name)}</option>`).join('');
    
    Modal.open('💳 سلفة جديدة', `
      <form id="loanForm">
        <label class="field"><span>الموظف *</span><select name="employee_id" required><option value="">— اختر —</option>${opts}</select></label>
        <div class="form-grid">
          <label class="field"><span>المبلغ الكلي *</span><input type="number" step="0.01" name="total_amount" required></label>
          <label class="field"><span>عدد الأقساط *</span><input type="number" name="installments_count" required value="1" min="1"></label>
          <label class="field"><span>تاريخ البداية</span><input type="date" name="start_date" required></label>
          <label class="field"><span>العملة</span><select name="currency"><option value="SDG">جنيه سوداني</option><option value="USD">دولار</option></select></label>
        </div>
        <label class="field"><span>ملاحظات</span><textarea name="notes" rows="2"></textarea></label>
      </form>`,
      `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="saveLoan">💾 حفظ</button>`
    );
    
    $('#saveLoan').onclick = async () => {
      const fd = new FormData($('#loanForm'));
      const p = Object.fromEntries(fd.entries());
      p.total_amount = Number(p.total_amount);
      p.installments_count = Number(p.installments_count);
      p.installment_amount = p.total_amount / p.installments_count;
      p.remaining_amount = p.total_amount;
      p.created_by = Auth.currentUser.id;
      
      const { error } = await sb.from('loans').insert(p);
      if (error) return toast(error.message,'error');
      toast('✅ تم الإنشاء');
      Modal.close();
      Loans.load();
    };
  }
};

// ============================================
// Terminations (ترك العمل)
// ============================================
const Terminations = {
  async render() {
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>🚪 ترك العمل</h1><p>سجلات ترك العمل</p>
        <div class="page-actions"><button class="btn btn-primary" onclick="Terminations.openForm()">➕ إضافة</button></div>
      </div>
      <div class="table-wrap"><div class="table-scroll" id="termTable"></div></div>`;
    await this.load();
  },
  
  async load() {
    const { data } = await sb.from('termination_records').select('*, employees(employee_number, full_name)').order('created_at',{ascending:false});
    const wrap = $('#termTable');
    if (!data?.length) { 
      wrap.innerHTML = `<div class="empty"><h3>لا توجد سجلات</h3></div>`; 
      return; 
    }
    wrap.innerHTML = `<table class="data"><thead><tr>
      <th>الموظف</th><th>التاريخ</th><th>السبب</th><th>نهاية الخدمة</th><th>المستحقات</th>
    </tr></thead><tbody>${data.map(t=>`
      <tr>
        <td><b>${esc(t.employees?.employee_number)}</b> — ${esc(t.employees?.full_name)}</td>
        <td>${fmtDate(t.termination_date)}</td>
        <td>${t.reason==='resignation'?'استقالة':t.reason==='dismissal'?'فصل':'نهاية عقد'}</td>
        <td class="num">${fmt(t.end_of_service)}</td>
        <td class="num">${fmt(t.dues)}</td>
      </tr>`).join('')}</tbody></table>`;
  },
  
  async openForm() {
    const { data: emps } = await sb.from('employees').select('id, employee_number, full_name').is('deleted_at',null).eq('status','active');
    const opts = (emps||[]).map(e=>`<option value="${e.id}">${esc(e.employee_number)} - ${esc(e.full_name)}</option>`).join('');
    
    Modal.open('🚪 تسجيل ترك عمل', `
      <form id="termForm">
        <label class="field"><span>الموظف *</span><select name="employee_id" required>${opts}</select></label>
        <div class="form-grid">
          <label class="field"><span>تاريخ الترك *</span><input type="date" name="termination_date" required></label>
          <label class="field"><span>السبب</span><select name="reason"><option value="resignation">استقالة</option><option value="dismissal">فصل</option><option value="contract_end">نهاية عقد</option></select></label>
          <label class="field"><span>نهاية الخدمة</span><input type="number" step="0.01" name="end_of_service" value="0"></label>
          <label class="field"><span>المستحقات</span><input type="number" step="0.01" name="dues" value="0"></label>
          <label class="field full"><span>العهدة</span><input name="custody"></label>
        </div>
      </form>`,
      `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="saveTerm">💾 حفظ</button>`
    );
    
    $('#saveTerm').onclick = async () => {
      const fd = new FormData($('#termForm'));
      const p = Object.fromEntries(fd.entries());
      p.end_of_service = Number(p.end_of_service);
      p.dues = Number(p.dues);
      p.created_by = Auth.currentUser.id;
      
      const { error } = await sb.from('termination_records').insert(p);
      if (error) return toast(error.message,'error');
      
      await sb.from('employees').update({ status: 'terminated' }).eq('id', p.employee_id);
      toast('✅ تم');
      Modal.close();
      Terminations.load();
    };
  }
};

// ============================================
// Treasuries (الخزائن)
// ============================================
const Treasuries = {
  async render() {
    if (!Auth.isAdmin()) return this.renderDeptManager();
    return this.renderAdmin();
  },
  
  async renderAdmin() {
    const { data: treasuries } = await sb.from('treasuries').select('*, departments(name)').order('is_main', {ascending: false}).order('created_at');
    const mains = (treasuries || []).filter(t => t.is_main || !t.parent_treasury_id);
    const subs = (treasuries || []).filter(t => t.parent_treasury_id);
    const totalBalance = (treasuries || []).reduce((s, t) => s + Number(t.current_balance || 0), 0);
    
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>🏦 الخزائن</h1><p>إدارة الخزائن الرئيسية والفرعية</p>
        <div class="page-actions"><button class="btn btn-primary" onclick="Treasuries.openForm()">➕ خزينة جديدة</button></div>
      </div>
      <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg,var(--primary-soft),var(--purple-soft))">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;color:var(--text-2);font-weight:700">📊 إجمالي الأرصدة</div>
            <div style="font-size:32px;font-weight:900;color:var(--primary)">${fmt(totalBalance)}</div>
          </div>
          <div style="font-size:64px">💰</div>
        </div>
      </div>
      ${mains.length ? `<h2 style="font-size:18px;font-weight:900;margin-bottom:16px">🏦 الرئيسية</h2><div class="grid grid-3" style="margin-bottom:28px">${mains.map(t => this.renderMainCard(t)).join('')}</div>` : ''}
      ${subs.length ? `<h2 style="font-size:18px;font-weight:900;margin-bottom:16px">🏢 خزائن الأقسام (${subs.length})</h2><div class="grid grid-3">${subs.map(t => this.renderSubCard(t)).join('')}</div>` : ''}
      ${!treasuries?.length ? `<div class="empty"><div class="ico">🏦</div><h3>لا توجد خزائن</h3><button class="btn btn-primary" onclick="Treasuries.openForm()">➕ إنشاء</button></div>` : ''}
    `;
  },
  
  renderMainCard(t) {
    return `<div class="card" style="border-top:4px solid var(--primary)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div>
          <div style="font-size:16px;font-weight:900">💵 ${esc(t.name)}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:3px">${esc(t.departments?.name || 'رئيسية')}</div>
        </div>
        <span class="badge info">رئيسية</span>
      </div>
      <div style="font-size:12px;color:var(--text-2)">الرصيد</div>
      <div style="font-size:28px;font-weight:900;color:var(--success);margin-bottom:16px">${fmt(t.current_balance, t.currency)}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-success btn-sm" onclick="Treasuries.tx('${t.id}','deposit')">➕ تغذية</button>
        <button class="btn btn-info btn-sm" onclick="Treasuries.tx('${t.id}','transfer')">🔄 تحويل</button>
        <button class="btn btn-ghost btn-sm" onclick="Treasuries.history('${t.id}')">📜</button>
        ${Auth.isAdmin() ? `
          <button class="btn btn-warning btn-sm" onclick="Treasuries.edit('${t.id}')" title="تعديل">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="Treasuries.del('${t.id}','${esc(t.name)}')" title="حذف">🗑</button>
        ` : ''}
      </div>
    </div>`;
  },
  
  renderSubCard(t) {
    return `<div class="card" style="border-top:4px solid var(--info)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div>
          <div style="font-size:16px;font-weight:900">🏢 ${esc(t.name)}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:3px">${esc(t.departments?.name || '—')}</div>
        </div>
        <span class="badge ${t.type === 'cash' ? 'info' : 'purple'}">${t.type === 'cash' ? 'كاش' : 'بنك'}</span>
      </div>
      <div style="font-size:12px;color:var(--text-2)">الرصيد</div>
      <div style="font-size:24px;font-weight:900;color:var(--success);margin-bottom:16px">${fmt(t.current_balance, t.currency)}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-info btn-sm" onclick="Treasuries.tx('${t.id}','transfer')">🔄</button>
        <button class="btn btn-ghost btn-sm" onclick="Treasuries.history('${t.id}')">📜</button>
        ${Auth.isAdmin() ? `
          <button class="btn btn-warning btn-sm" onclick="Treasuries.edit('${t.id}')" title="تعديل">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="Treasuries.del('${t.id}','${esc(t.name)}')" title="حذف">🗑</button>
        ` : ''}
      </div>
    </div>`;
  },
  
  async renderDeptManager() {
    const myDept = Auth.currentProfile?.department_id;
    const { data: treasuries } = await sb.from('treasuries').select('*, departments(name)').or(`department_id.eq.${myDept},manager_id.eq.${Auth.currentUser.id}`);
    
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>🏦 خزينة قسمي</h1><p>عرض فقط</p></div>
      ${!treasuries?.length ? `<div class="empty"><div class="ico">🏦</div><h3>لا توجد خزينة</h3></div>` : treasuries.map(t => `
        <div class="card" style="margin-bottom:20px">
          <div style="text-align:center;padding:20px 0">
            <div style="font-size:14px;color:var(--text-2);font-weight:700;margin-bottom:8px">💰 الرصيد</div>
            <div style="font-size:44px;font-weight:900;color:var(--success)">${fmt(t.current_balance, t.currency)}</div>
            <div style="font-size:13px;color:var(--text-2);margin-top:8px">🏢 ${esc(t.departments?.name || '—')}</div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;padding-top:16px;border-top:1px solid var(--border)">
            <button class="btn btn-ghost btn-sm" onclick="Treasuries.history('${t.id}')">📜 السجل</button>
          </div>
        </div>
      `).join('')}
    `;
  },
  
  async load() { 
    if (!Auth.isAdmin()) return this.renderDeptManager(); 
    return this.renderAdmin(); 
  },
  
  async openForm() {
    const deptOpts = Cache.departments.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    const { data: mainTreasuries } = await sb.from('treasuries').select('id, name').or('is_main.eq.true,parent_treasury_id.is.null');
    const parentOpts = (mainTreasuries || []).map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
    const { data: users } = await sb.from('profiles').select('id, full_name').eq('role', 'dept_manager');
    const managerOpts = (users || []).map(u => `<option value="${u.id}">${esc(u.full_name)}</option>`).join('');
    
    Modal.open('🏦 خزينة جديدة', `
      <form id="treasForm">
        <label class="field"><span>نوع الخزينة *</span><select name="treasury_kind" id="treasuryKind" required>
          <option value="main">🏦 رئيسية</option><option value="sub">🏢 فرعية (لقسم)</option>
        </select></label>
        <label class="field"><span>الاسم *</span><input name="name" required></label>
        <div id="subOptions" style="display:none">
          <label class="field"><span>القسم</span><select name="department_id"><option value="">— اختر —</option>${deptOpts}</select></label>
          <label class="field"><span>الخزينة الأم</span><select name="parent_treasury_id"><option value="">— اختر —</option>${parentOpts}</select></label>
          <label class="field"><span>المسؤول</span><select name="manager_id"><option value="">— بدون —</option>${managerOpts}</select></label>
        </div>
        <label class="field"><span>النوع</span><select name="type"><option value="cash">💵 كاش</option><option value="bank">🏛️ بنك</option></select></label>
        <label class="field"><span>العملة</span><select name="currency"><option value="SDG">جنيه سوداني</option><option value="USD">دولار</option></select></label>
        <label class="field"><span>الرصيد الافتتاحي</span><input type="number" step="0.01" name="opening_balance" value="0"></label>
        <label class="field"><span>اسم البنك</span><input name="bank_name"></label>
      </form>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="saveTreas">💾 حفظ</button>`);
    
    $('#treasuryKind').onchange = (e) => { 
      $('#subOptions').style.display = e.target.value === 'sub' ? 'block' : 'none'; 
    };
    
    $('#saveTreas').onclick = async () => {
      const form = $('#treasForm');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.opening_balance = Number(payload.opening_balance || 0);
      payload.current_balance = payload.opening_balance;
      payload.is_main = payload.treasury_kind === 'main';
      delete payload.treasury_kind;
      if (!payload.department_id) payload.department_id = null;
      if (!payload.parent_treasury_id) payload.parent_treasury_id = null;
      if (!payload.manager_id) payload.manager_id = null;
      if (!payload.bank_name) payload.bank_name = null;
      
      const btn = $('#saveTreas');
      btn.disabled = true;
      const { error } = await sb.from('treasuries').insert(payload);
      if (error) { toast('❌ ' + error.message, 'error'); btn.disabled = false; return; }
      
      toast('✅ تم الإنشاء');
      Modal.close();
      Treasuries.load();
    };
  },
  
  async edit(id) {
    const { data: t } = await sb.from('treasuries').select('*').eq('id', id).single();
    if (!t) return toast('غير موجودة', 'error');
    
    const deptOpts = Cache.departments.map(d => 
      `<option value="${d.id}" ${t.department_id === d.id ? 'selected' : ''}>${esc(d.name)}</option>`
    ).join('');
    
    Modal.open('✏️ تعديل خزينة', `
      <form id="treasEditForm">
        <label class="field"><span>الاسم *</span><input name="name" required value="${esc(t.name)}"></label>
        <label class="field"><span>النوع</span><select name="type">
          <option value="cash" ${t.type === 'cash' ? 'selected' : ''}>💵 كاش</option>
          <option value="bank" ${t.type === 'bank' ? 'selected' : ''}>🏛️ بنك</option>
        </select></label>
        <label class="field"><span>القسم</span><select name="department_id">
          <option value="">— بدون —</option>${deptOpts}
        </select></label>
        <label class="field"><span>العملة</span><select name="currency">
          <option value="SDG" ${t.currency === 'SDG' ? 'selected' : ''}>جنيه سوداني</option>
          <option value="USD" ${t.currency === 'USD' ? 'selected' : ''}>دولار</option>
        </select></label>
        <label class="field"><span>اسم البنك</span><input name="bank_name" value="${esc(t.bank_name || '')}"></label>
        <label class="field"><span>الحالة</span><select name="is_active">
          <option value="true" ${t.is_active !== false ? 'selected' : ''}>✅ نشط</option>
          <option value="false" ${t.is_active === false ? 'selected' : ''}>🚫 معطل</option>
        </select></label>
      </form>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button>
      <button class="btn btn-primary" id="saveTreasEdit">💾 حفظ</button>
    `);
    
    $('#saveTreasEdit').onclick = async () => {
      const form = $('#treasEditForm');
      if (!form.reportValidity()) return;
      
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.is_active = payload.is_active === 'true';
      if (!payload.department_id) payload.department_id = null;
      if (!payload.bank_name) payload.bank_name = null;
      
      const btn = $('#saveTreasEdit');
      btn.disabled = true;
      
      const { error } = await sb.from('treasuries').update(payload).eq('id', id);
      if (error) { 
        toast('❌ ' + error.message, 'error'); 
        btn.disabled = false; 
        return; 
      }
      
      toast('✅ تم التعديل');
      Modal.close();
      Treasuries.load();
    };
  },
  
  async del(id, name) {
    const { count: txCount } = await sb.from('treasury_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('treasury_id', id);
    
    const { count: payrollCount } = await sb.from('payroll_files')
      .select('id', { count: 'exact', head: true })
      .eq('treasury_id', id);
    
    let message = `حذف خزينة "<b>${esc(name)}</b>"؟`;
    
    if (txCount > 0 || payrollCount > 0) {
      message = `⚠️ <b>تحذير!</b><br><br>
        هذه الخزينة لديها:<br>
        • ${txCount || 0} حركة مالية<br>
        • ${payrollCount || 0} ملف رواتب مرتبط<br><br>
        هل أنت متأكد من الحذف؟<br>
        <b style="color:#dc2626">لا يمكن التراجع!</b>`;
    }
    
    confirmModal('🗑 حذف خزينة', message, async () => {
      try {
        if (txCount > 0) {
          await sb.from('treasury_transactions').delete().eq('treasury_id', id);
        }
        
        if (payrollCount > 0) {
          await sb.from('payroll_files').update({ treasury_id: null }).eq('treasury_id', id);
        }
        
        const { error } = await sb.from('treasuries').delete().eq('id', id);
        if (error) throw error;
        
        toast('✅ تم الحذف');
        Treasuries.load();
      } catch (err) {
        console.error('Delete error:', err);
        toast('❌ ' + err.message, 'error');
      }
    });
  },
  
  async tx(treasuryId, type) {
    const { data: treasury } = await sb.from('treasuries').select('*').eq('id', treasuryId).single();
    if (!treasury) return toast('غير موجودة', 'error');
    
    let extraHtml = '';
    if (type === 'transfer') {
      let targetTreasuries;
      if (treasury.is_main || !treasury.parent_treasury_id) {
        const { data } = await sb.from('treasuries').select('id, name, current_balance').not('parent_treasury_id', 'is', null);
        targetTreasuries = data || [];
      } else {
        const { data } = await sb.from('treasuries').select('id, name, current_balance').neq('id', treasuryId);
        targetTreasuries = data || [];
      }
      extraHtml = `<label class="field"><span>إلى خزينة *</span><select id="toTreasury" required><option value="">— اختر —</option>${targetTreasuries.map(t => `<option value="${t.id}">${esc(t.name)} (${fmt(t.current_balance)})</option>`).join('')}</select></label>`;
    }
    
    Modal.open(type === 'deposit' ? '➕ تغذية' : '🔄 تحويل', `
      <div style="padding:14px;background:var(--bg-3);border-radius:10px;margin-bottom:16px">
        <div style="font-size:13px;color:var(--text-2)">الخزينة</div>
        <div style="font-weight:900;font-size:16px">${esc(treasury.name)}</div>
        <div style="font-size:13px;color:var(--text-2);margin-top:6px">الرصيد</div>
        <div style="font-weight:900;font-size:20px;color:var(--success)">${fmt(treasury.current_balance, treasury.currency)}</div>
      </div>
      <label class="field"><span>المبلغ *</span><input type="number" step="0.01" id="txAmount" required min="0.01"></label>
      ${extraHtml}
      <label class="field"><span>البيان</span><input id="txDesc"></label>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="doTx">تنفيذ</button>`);
    
    $('#doTx').onclick = async () => {
      const amount = Number($('#txAmount').value || 0);
      const desc = $('#txDesc').value.trim();
      if (amount <= 0) return toast('أدخل مبلغاً', 'warning');
      
      const before = Number(treasury.current_balance);
      let after = type === 'deposit' ? before + amount : before - amount;
      if (after < 0) return toast('⚠️ الرصيد غير كافٍ', 'error');
      
      const btn = $('#doTx');
      btn.disabled = true;
      
      const { data: txNoData } = await sb.rpc('gen_tx_no');
      const txNo = txNoData || ('TX-' + Date.now());
      
      const { error: txErr } = await sb.from('treasury_transactions').insert({
        transaction_no: txNo, 
        treasury_id: treasuryId,
        type: type === 'transfer' ? 'transfer_out' : type,
        amount, 
        balance_before: before, 
        balance_after: after,
        description: desc || '—', 
        user_id: Auth.currentUser.id
      });
      
      if (txErr) { toast('❌ ' + txErr.message, 'error'); btn.disabled = false; return; }
      await sb.from('treasuries').update({ current_balance: after }).eq('id', treasuryId);
      
      if (type === 'transfer') {
        const toId = $('#toTreasury').value;
        if (!toId) return toast('اختر الخزينة', 'warning');
        const { data: toT } = await sb.from('treasuries').select('*').eq('id', toId).single();
        const toBefore = Number(toT.current_balance);
        const toAfter = toBefore + amount;
        
        await sb.from('treasury_transactions').insert({
          transaction_no: txNo + '-IN', 
          treasury_id: toId, 
          type: 'transfer_in',
          amount, 
          balance_before: toBefore, 
          balance_after: toAfter,
          description: (desc || 'تحويل') + ' من ' + treasury.name, 
          user_id: Auth.currentUser.id
        });
        await sb.from('treasuries').update({ current_balance: toAfter }).eq('id', toId);
      }
      
      toast('✅ تم');
      Modal.close();
      Treasuries.load();
    };
  },
  
  async history(id) {
    const { data: t } = await sb.from('treasuries').select('name').eq('id', id).single();
    const { data: txs } = await sb.from('treasury_transactions').select('*').eq('treasury_id', id).order('created_at', { ascending: false }).limit(200);
    
    Modal.open(`📜 حركات ${esc(t?.name || '')}`, `
      <div class="table-scroll"><table class="data">
        <thead><tr><th>رقم</th><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>قبل</th><th>بعد</th><th>البيان</th></tr></thead>
        <tbody>${(txs || []).map(tx => `
          <tr>
            <td style="font-size:11px">${esc(tx.transaction_no)}</td>
            <td style="font-size:11px">${fmtDate(tx.created_at)}</td>
            <td>${tx.type === 'deposit' ? '➕ تغذية' : tx.type === 'withdrawal' ? '➖ خصم' : tx.type === 'transfer_in' ? '📥 داخل' : tx.type === 'transfer_out' ? '📤 خارج' : tx.type === 'salary_payment' ? '💸 راتب' : tx.type}</td>
            <td class="num">${fmt(tx.amount)}</td>
            <td class="num">${fmt(tx.balance_before)}</td>
            <td class="num">${fmt(tx.balance_after)}</td>
            <td style="font-size:12px">${esc(tx.description || '—')}</td>
          </tr>
        `).join('') || '<tr><td colspan="7" style="text-align:center;padding:20px">لا توجد حركات</td></tr>'}</tbody>
      </table></div>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>`, {size: 'lg'});
  }
};

// ============================================
// Journal (القيود اليومية)
// ============================================
const Journal = {
  async render() {
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>📒 القيود اليومية</h1><p>سجل القيود المحاسبية</p></div>
      <div class="table-wrap"><div class="table-scroll" id="journalTable"></div></div>`;
    await this.load();
  },
  
  async load() {
    const { data } = await sb.from('journal_entries').select('*, departments(name), payroll_files(name)').order('created_at',{ascending:false}).limit(200);
    const wrap = $('#journalTable');
    if (!data?.length) { 
      wrap.innerHTML = `<div class="empty"><h3>لا توجد قيود</h3></div>`; 
      return; 
    }
    wrap.innerHTML = `<table class="data"><thead><tr>
      <th>رقم</th><th>التاريخ</th><th>الملف</th><th>القسم</th><th>المبلغ</th><th>البيان</th>
    </tr></thead><tbody>${data.map(j=>`
      <tr>
        <td><b>${esc(j.entry_no)}</b></td>
        <td>${fmtDate(j.entry_date)}</td>
        <td>${esc(j.payroll_files?.name||'—')}</td>
        <td>${esc(j.departments?.name||'—')}</td>
        <td class="num">${fmt(j.total_amount)}</td>
        <td>${esc(j.description||'—')}</td>
      </tr>`).join('')}</tbody></table>`;
  }
};

// ============================================
// Notifications (الإشعارات)
// ============================================
const Notifications = {
  async render() {
    const { data } = await sb.from('notifications').select('*').eq('user_id', Auth.currentUser.id).order('created_at', {ascending: false}).limit(100);
    
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>🔔 الإشعارات</h1><p>كل الإشعارات</p>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Notifications.markAllRead()">✅ تحديد الكل</button>
          <button class="btn btn-ghost" onclick="Notifications.render()">🔄 تحديث</button>
        </div>
      </div>
      <div class="table-wrap">
        <div style="padding:20px">
          ${(data || []).length ? data.map(n => `
            <div style="padding:16px;border-bottom:1px solid var(--border);display:flex;gap:14px;align-items:flex-start;${!n.is_read ? 'background:var(--primary-soft);border-radius:10px;margin-bottom:8px' : ''}">
              <div style="font-size:26px">${n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'danger' ? '🚨' : 'ℹ️'}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:900;font-size:15px;margin-bottom:4px">${esc(n.title)}</div>
                ${n.message ? `<div style="font-size:13.5px;color:var(--text-2);margin-bottom:6px">${esc(n.message)}</div>` : ''}
                <div style="font-size:12px;color:var(--text-3)">📅 ${fmtDate(n.created_at)}</div>
              </div>
              ${!n.is_read ? `<span class="badge danger">جديد</span>` : ''}
            </div>
          `).join('') : `<div class="empty"><div class="ico">🔔</div><h3>لا توجد إشعارات</h3></div>`}
        </div>
      </div>
    `;
  },
  
  async markAllRead() {
    await sb.from('notifications').update({ is_read: true }).eq('user_id', Auth.currentUser.id);
    toast('✅ تم');
    this.render();
  }
};

// ============================================
// Users (المستخدمون)
// ============================================
const PERMISSIONS_LIST = [
  { key: 'view_employees', label: 'مشاهدة الموظفين', icon: '👁️' },
  { key: 'add_employee', label: 'إضافة موظف', icon: '➕' },
  { key: 'edit_employee', label: 'تعديل موظف', icon: '✏️' },
  { key: 'delete_employee', label: 'حذف موظف', icon: '🗑️' },
  { key: 'attendance', label: 'الحضور والغياب', icon: '📅' },
  { key: 'create_payroll', label: 'إنشاء راتب', icon: '💵' },
  { key: 'pay_payroll', label: 'دفع راتب', icon: '💸' },
  { key: 'loans', label: 'السلف', icon: '💳' },
  { key: 'treasury', label: 'الخزينة', icon: '🏦' },
  { key: 'reports', label: 'التقارير', icon: '📊' },
  { key: 'export_excel', label: 'تصدير Excel', icon: '🟣' },
  { key: 'export_pdf', label: 'طباعة PDF', icon: '🖨️' },
  { key: 'unlock_payroll', label: 'فك قفل الملفات', icon: '🔓' }
];

const Users = {
  async render() {
    if (!Auth.isAdmin()) { 
      $('#pageContent').innerHTML = `<div class="empty"><h3>🔒 للمدير فقط</h3></div>`; 
      return; 
    }
    
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>👤 المستخدمون</h1><p>إدارة المستخدمين والصلاحيات</p>
        <div class="page-actions"><button class="btn btn-primary" onclick="Users.openForm()">➕ مستخدم جديد</button></div>
      </div>
      <div class="table-wrap"><div class="table-scroll" id="usersTable"></div></div>`;
    await this.load();
  },
  
  async load() {
    const { data } = await sb.from('profiles').select('*').order('created_at', {ascending: false});
    const wrap = $('#usersTable');
    if (!data?.length) { 
      wrap.innerHTML = `<div class="empty"><h3>لا يوجد مستخدمون</h3></div>`; 
      return; 
    }
    
    const deptIds = [...new Set(data.map(u => u.department_id).filter(Boolean))];
    const { data: depts } = deptIds.length ? await sb.from('departments').select('id, name').in('id', deptIds) : { data: [] };
    const deptMap = {};
    (depts || []).forEach(d => { deptMap[d.id] = d.name; });
    
    wrap.innerHTML = `<table class="data">
      <thead><tr><th>الاسم</th><th>الدور</th><th>القسم</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${data.map(u => `
        <tr>
          <td><b>${esc(u.full_name)}</b></td>
          <td>${u.role === 'admin' ? '👑 مدير' : '👤 مسؤول قسم'}</td>
          <td>${esc(deptMap[u.department_id] || '—')}</td>
          <td><span class="badge ${u.is_active?'success':'danger'}">${u.is_active?'نشط':'معطل'}</span></td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="Users.openForm('${u.id}')">✏️</button>
            ${u.id !== Auth.currentUser.id ? `<button class="btn btn-ghost btn-sm" onclick="Users.del('${u.id}','${esc(u.full_name)}')">🗑</button>` : ''}
          </td>
        </tr>`).join('')}</tbody>
    </table>`;
  },
  
  async openForm(id) {
    let u = null;
    let userPerms = [];
    if (id) {
      const { data } = await sb.from('profiles').select('*').eq('id', id).single();
      u = data;
      const { data: perms } = await sb.from('permissions').select('permission_key').eq('profile_id', id);
      userPerms = (perms || []).map(p => p.permission_key);
    }
    
    const deptOpts = Cache.departments.map(d => `<option value="${d.id}" ${u?.department_id===d.id?'selected':''}>${esc(d.name)}</option>`).join('');
    const permCheckboxes = PERMISSIONS_LIST.map(p => `
      <label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--bg-3);border-radius:10px;cursor:pointer;font-size:13px">
        <input type="checkbox" name="perm_${p.key}" ${userPerms.includes(p.key)?'checked':''} style="width:16px;height:16px">
        <span>${p.icon} ${p.label}</span>
      </label>
    `).join('');
    
    Modal.open(id ? `✏️ تعديل: ${esc(u.full_name)}` : '➕ مستخدم جديد', `
      <form id="userForm" class="form-grid">
        <label class="field full"><span>الاسم الكامل *</span><input name="full_name" required value="${esc(u?.full_name||'')}"></label>
        ${!id ? `
          <label class="field"><span>البريد *</span><input type="email" name="email" required></label>
          <label class="field"><span>كلمة المرور *</span><input type="text" name="password" required minlength="6"></label>
        ` : `<label class="field full"><span>كلمة مرور جديدة (اختياري)</span><input type="text" name="password" minlength="6"></label>`}
        <label class="field"><span>الدور</span><select name="role" id="userRoleSelect">
          <option value="dept_manager" ${u?.role==='dept_manager'?'selected':''}>👤 مسؤول قسم</option>
          <option value="admin" ${u?.role==='admin'?'selected':''}>👑 مدير</option>
        </select></label>
        <label class="field"><span>القسم *</span><select name="department_id" id="userDeptSelect"><option value="">— اختر —</option>${deptOpts}</select></label>
        <label class="field full"><span>الحالة</span><select name="is_active">
          <option value="true" ${u?.is_active!==false?'selected':''}>✅ نشط</option>
          <option value="false" ${u?.is_active===false?'selected':''}>🚫 معطل</option>
        </select></label>
        <div class="full" id="permsSection" style="${u?.role==='admin'?'display:none':''}">
          <b style="font-size:14px">🔐 الصلاحيات</b>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-top:12px">${permCheckboxes}</div>
        </div>
      </form>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="saveUser">💾 ${id?'حفظ':'إنشاء'}</button>`, {size: 'lg'});
    
    $('#userRoleSelect').onchange = (e) => { 
      $('#permsSection').style.display = e.target.value === 'admin' ? 'none' : ''; 
    };
    
    $('#saveUser').onclick = async () => {
      const form = $('#userForm');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      
      // ✅ تحقق: مسؤول القسم يجب أن يكون له قسم
      if (payload.role === 'dept_manager' && !payload.department_id) {
        return toast('⚠️ مسؤول القسم يجب أن يكون له قسم محدد', 'error');
      }
      
      const permissions = PERMISSIONS_LIST.filter(p => fd.get(`perm_${p.key}`)).map(p => p.key);
      payload.permissions = permissions;
      if (payload.department_id === '') payload.department_id = null;
      
      const btn = $('#saveUser');
      btn.disabled = true;
      
      try {
        const { data: { session } } = await sb.auth.getSession();
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${session.access_token}`, 
            'apikey': SUPABASE_ANON_KEY 
          },
          body: JSON.stringify({
            action: id ? 'update' : 'create', 
            user_id: id, 
            email: payload.email, 
            password: payload.password,
            full_name: payload.full_name, 
            role: payload.role, 
            department_id: payload.department_id,
            is_active: payload.is_active === 'true', 
            permissions: payload.permissions
          })
        });
        
        const result = await response.json();
        if (!response.ok || result.error) { 
          toast('❌ ' + (result.error || 'فشل'), 'error'); 
          btn.disabled = false; 
          return; 
        }
        
        toast(id ? '✅ تم التحديث' : '✅ تم الإنشاء');
        Modal.close();
        Users.load();
      } catch (err) { 
        toast('❌ ' + err.message, 'error'); 
        btn.disabled = false; 
      }
    };
  },
  
  async del(id, name) {
    confirmModal('🗑 حذف مستخدم', `حذف <b>${esc(name)}</b> نهائياً؟`, async () => {
      try {
        const { data: { session } } = await sb.auth.getSession();
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${session.access_token}`, 
            'apikey': SUPABASE_ANON_KEY 
          },
          body: JSON.stringify({ action: 'delete', user_id: id })
        });
        const result = await response.json();
        if (!response.ok || result.error) return toast('❌ ' + result.error, 'error');
        toast('✅ تم الحذف');
        Users.load();
      } catch (err) { 
        toast('❌ ' + err.message, 'error'); 
      }
    });
  }
};

// ============================================
// Settings (الإعدادات)
// ============================================
const Settings = {
  async render() {
    if (!Auth.isAdmin()) { 
      $('#pageContent').innerHTML = `<div class="empty"><h3>🔒 للمدير فقط</h3></div>`; 
      return; 
    }
    
    const s = Cache.settings || {};
    const logoUrl = s.factory_logo_url || '';
    
    $('#pageContent').innerHTML = `
      <div class="page-header"><h1>⚙️ الإعدادات</h1><p>إعدادات المصنع</p></div>
      <div class="grid grid-3">
        <div class="card">
          <h3 style="margin-bottom:16px">🏭 بيانات المصنع</h3>
          <label class="field"><span>اسم المصنع</span><input id="st_factory_name" value="${esc(s.factory_name||'')}"></label>
          <label class="field"><span>الهاتف</span><input id="st_factory_phone" value="${esc(s.factory_phone||'')}"></label>
          <label class="field"><span>العنوان</span><input id="st_factory_address" value="${esc(s.factory_address||'')}"></label>
          <label class="field">
            <span>رابط الشعار (logo.png أو رابط كامل)</span>
            <input id="st_factory_logo_url" value="${esc(logoUrl)}" placeholder="مثال: logo.png أو https://...">
            <div style="font-size:11px;color:var(--text-2);margin-top:4px;padding:6px;background:var(--bg-3);border-radius:6px">
              💡 ارفع الصورة على GitHub بجانب index.html أو على Supabase Storage
            </div>
          </label>
          ${logoUrl ? `
            <div style="margin-top:12px;padding:12px;background:var(--bg-3);border-radius:10px;text-align:center">
              <div style="font-size:11px;color:var(--text-2);font-weight:700;margin-bottom:8px">معاينة الشعار:</div>
              <img src="${esc(logoUrl)}" style="max-width:120px;max-height:120px;border-radius:10px;box-shadow:var(--sh)" 
                onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚠️</text></svg>'">
              <div style="font-size:10px;color:var(--text-3);margin-top:6px">إذا ظهرت ⚠️ → الرابط خطأ</div>
            </div>
          ` : ''}
        </div>
        <div class="card">
          <h3 style="margin-bottom:16px">💰 الرواتب</h3>
          <label class="field"><span>أيام الشهر (للشهري)</span><input type="number" id="st_default_month_days" value="${s.default_month_days||30}"></label>
          <label class="field"><span>أيام الأسبوع (للأسبوعي)</span><input type="number" id="st_default_week_days" value="${s.default_week_days||7}"></label>
          <label class="field"><span>حد الإنذارات</span><input type="number" id="st_max_warnings" value="${s.max_warnings||3}"></label>
        </div>
        <div class="card">
          <h3 style="margin-bottom:16px">🏥 التأمين</h3>
          <label class="field"><span>النسبة الإجمالية %</span><input type="number" id="st_insurance_total" value="${s.insurance_total||25}"></label>
          <label class="field"><span>حصة العامل %</span><input type="number" id="st_insurance_employee" value="${s.insurance_employee||8}"></label>
          <label class="field"><span>حصة الشركة %</span><input type="number" id="st_insurance_company" value="${s.insurance_company||17}"></label>
        </div>
        <div class="card">
          <h3 style="margin-bottom:16px">🔢 الترقيم</h3>
          <label class="field"><span>بادئة الموظف</span><input id="st_employee_prefix" value="${esc(s.employee_prefix||'EMP')}"></label>
          <label class="field"><span>بادئة الإيصال</span><input id="st_receipt_prefix" value="${esc(s.receipt_prefix||'REC')}"></label>
          <label class="field"><span>بادئة القيد</span><input id="st_journal_prefix" value="${esc(s.journal_prefix||'JE')}"></label>
        </div>
      </div>
      <div style="margin-top:24px"><button class="btn btn-primary btn-lg" id="saveSettings" style="max-width:340px">💾 حفظ</button></div>
      ${Auth.isAdmin() ? this.dangerZoneHTML() : ''}
    `;
    
    $('#saveSettings').onclick = async () => {
      const keys = ['factory_name','factory_phone','factory_address','factory_logo_url','default_month_days','default_week_days','max_warnings','insurance_total','insurance_employee','insurance_company','employee_prefix','receipt_prefix','journal_prefix'];
      
      const btn = $('#saveSettings');
      btn.disabled = true;
      btn.textContent = '⏳ جاري الحفظ...';
      
      for (const k of keys) { 
        const el = $('#st_'+k);
        if (el) await sb.from('system_settings').upsert({key:k, value: el.value});
      }
      
      toast('✅ تم الحفظ');
      await Cache.load();
      
      // ✅ تحديث فوري للشعار
      updateBrandUI();
      
      // ✅ إعادة تحميل الإعدادات
      setTimeout(() => Settings.render(), 300);
    };
    
    $('#resetDataBtn')?.addEventListener('click', () => Settings.confirmReset());
  },
  
  dangerZoneHTML() {
    return `<div class="card" style="margin-top:36px;border:2px solid #ef4444;background:#fef2f2">
      <h3 style="margin-bottom:10px;color:#991b1b">⚠️ منطقة الخطر</h3>
      <p style="color:#7f1d1d;font-size:14px;margin-bottom:18px">حذف كل البيانات (ما عدا المستخدمين)</p>
      <button class="btn btn-danger" id="resetDataBtn" style="padding:16px 28px">🗑️ تصفير كل البيانات</button>
    </div>`;
  },
  
  confirmReset() {
    Modal.open('⚠️ تأكيد التصفير', `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:70px;margin-bottom:16px">⚠️</div>
        <h3 style="color:#dc2626;margin-bottom:16px">تحذير خطير!</h3>
        <p>اكتب <code style="background:#fef2f2;padding:3px 10px;border-radius:6px">تصفير</code> للتأكيد:</p>
        <input type="text" id="confirmText" style="width:100%;padding:14px;margin-top:12px;border:2px solid #fecaca;border-radius:10px;font-size:16px;text-align:center">
      </div>
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-danger" id="confirmResetBtn" disabled>🗑️ تأكيد</button>`);
    
    const ci = $('#confirmText');
    const cb = $('#confirmResetBtn');
    ci.focus();
    ci.oninput = () => { const ok = ci.value.trim() === 'تصفير'; cb.disabled = !ok; };
    
    cb.onclick = async () => {
      if (ci.value.trim() !== 'تصفير') return;
      Modal.close();
      setTimeout(async () => {
        const { data, error } = await sb.rpc('reset_all_data');
        if (error || !data?.success) return toast('❌ ' + (error?.message || data?.error), 'error');
        toast('✅ تم التصفير');
        await Cache.load();
        setTimeout(() => Router.go('dashboard'), 800);
      }, 200);
    };
  }
};

// ============================================
// Audit (سجل العمليات) — محسّن
// ============================================
const Audit = {
  _cache: [],
  
  async log(action, entityType, entityId, oldVal=null, newVal=null, description=null) {
    try { 
      await sb.from('audit_logs').insert({ 
        user_id: Auth.currentUser?.id, 
        action, 
        entity_type: entityType, 
        entity_id: entityId, 
        old_value: oldVal, 
        new_value: newVal, 
        description: description || `${action} ${entityType}` 
      }); 
    } catch(e) { console.warn('audit failed', e); }
  },
  
  async render() {
    if (!Auth.isAdmin()) { 
      $('#pageContent').innerHTML = `<div class="empty"><h3>🔒 للمدير فقط</h3></div>`; 
      return; 
    }
    
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>📝 سجل العمليات</h1>
        <p>كل العمليات الحساسة في النظام</p>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Audit.exportExcel()">📊 تصدير Excel</button>
          <button class="btn btn-ghost" onclick="Audit.load()">🔄 تحديث</button>
        </div>
      </div>
      
      <div class="card" style="margin-bottom:20px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
          <label class="field" style="margin:0">
            <span>🔍 بحث</span>
            <input id="auditSearch" placeholder="بحث في الوصف...">
          </label>
          <label class="field" style="margin:0">
            <span>📅 من تاريخ</span>
            <input type="date" id="auditFrom">
          </label>
          <label class="field" style="margin:0">
            <span>📅 إلى تاريخ</span>
            <input type="date" id="auditTo">
          </label>
          <label class="field" style="margin:0">
            <span>🎯 نوع العملية</span>
            <select id="auditAction">
              <option value="">الكل</option>
              <option value="payroll_paid">💸 دفع رواتب</option>
              <option value="single_payment">💵 دفع فردي</option>
              <option value="payroll_created">📝 إنشاء ملف</option>
              <option value="employee_added">👤 إضافة موظف</option>
              <option value="employee_deleted">🗑 حذف موظف</option>
              <option value="reset_data">⚠️ تصفير بيانات</option>
            </select>
          </label>
        </div>
        <div style="margin-top:12px;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <span id="auditCounter" style="font-size:12px;color:var(--text-2);font-weight:700">— سجل</span>
          <button class="btn btn-ghost btn-sm" onclick="Audit.clearFilters()">🗑 مسح الفلاتر</button>
        </div>
      </div>
      
      <div class="table-wrap"><div class="table-scroll" id="auditTable"></div></div>
    `;
    
    await this.load();
    
    $('#auditSearch').oninput = () => this.renderTable();
    $('#auditFrom').onchange = () => this.renderTable();
    $('#auditTo').onchange = () => this.renderTable();
    $('#auditAction').onchange = () => this.renderTable();
  },
  
  async load() {
    const { data } = await sb.from('audit_logs')
      .select('*, profiles(full_name)')
      .order('created_at', {ascending:false})
      .limit(1000);
    
    this._cache = data || [];
    this.renderTable();
  },
  
  renderTable() {
    const search = ($('#auditSearch')?.value || '').toLowerCase().trim();
    const from = $('#auditFrom')?.value;
    const to = $('#auditTo')?.value;
    const action = $('#auditAction')?.value;
    
    let list = this._cache;
    
    if (search) {
      list = list.filter(a => 
        (a.description || '').toLowerCase().includes(search) ||
        (a.action || '').toLowerCase().includes(search) ||
        (a.profiles?.full_name || '').toLowerCase().includes(search)
      );
    }
    
    if (from) list = list.filter(a => a.created_at >= from);
    if (to) list = list.filter(a => a.created_at <= to + 'T23:59:59');
    if (action) list = list.filter(a => a.action === action);
    
    const counter = $('#auditCounter');
    if (counter) counter.textContent = `${list.length} سجل من ${this._cache.length}`;
    
    const wrap = $('#auditTable');
    if (!list.length) { 
      wrap.innerHTML = `<div class="empty"><h3>لا يوجد سجل مطابق</h3></div>`; 
      return; 
    }
    
    wrap.innerHTML = `<table class="data">
      <thead><tr>
        <th>#</th>
        <th>التاريخ</th>
        <th>الوقت</th>
        <th>المستخدم</th>
        <th>العملية</th>
        <th>النوع</th>
        <th>الوصف</th>
      </tr></thead>
      <tbody>${list.map((a, i) => {
        const dt = new Date(a.created_at);
        const dateStr = dt.toLocaleDateString('ar-EG');
        const timeStr = dt.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
        
        const actionLabel = {
          'payroll_paid': '💸 دفع رواتب',
          'single_payment': '💵 دفع فردي',
          'payroll_created': '📝 إنشاء ملف',
          'employee_added': '👤 إضافة موظف',
          'employee_deleted': '🗑 حذف موظف',
          'reset_data': '⚠️ تصفير',
        }[a.action] || a.action;
        
        return `<tr>
          <td>${i + 1}</td>
          <td>${dateStr}</td>
          <td style="font-size:12px;color:var(--text-2)">${timeStr}</td>
          <td><b>${esc(a.profiles?.full_name || '—')}</b></td>
          <td><span class="badge info">${esc(actionLabel)}</span></td>
          <td style="font-size:12px">${esc(a.entity_type || '')}</td>
          <td style="font-size:12px">${esc(a.description || '')}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },
  
  clearFilters() {
    if ($('#auditSearch')) $('#auditSearch').value = '';
    if ($('#auditFrom')) $('#auditFrom').value = '';
    if ($('#auditTo')) $('#auditTo').value = '';
    if ($('#auditAction')) $('#auditAction').value = '';
    this.renderTable();
  },
  
  exportExcel() {
    const search = ($('#auditSearch')?.value || '').toLowerCase().trim();
    const from = $('#auditFrom')?.value;
    const to = $('#auditTo')?.value;
    const action = $('#auditAction')?.value;
    
    let list = this._cache;
    if (search) list = list.filter(a => (a.description || '').toLowerCase().includes(search) || (a.profiles?.full_name || '').toLowerCase().includes(search));
    if (from) list = list.filter(a => a.created_at >= from);
    if (to) list = list.filter(a => a.created_at <= to + 'T23:59:59');
    if (action) list = list.filter(a => a.action === action);
    
    const headers = ['التاريخ', 'الوقت', 'المستخدم', 'العملية', 'النوع', 'الوصف'];
    const rows = list.map(a => {
      const dt = new Date(a.created_at);
      return [
        dt.toLocaleDateString('ar-EG'),
        dt.toLocaleTimeString('ar-EG'),
        a.profiles?.full_name || '—',
        a.action,
        a.entity_type || '',
        a.description || ''
      ];
    });
    
    Reports.exportExcel('سجل_العمليات', headers, rows);
  }
};

// ============================================
// Earnings / Deductions (البنود)
// ============================================
function buildTypePage(table, title, icon) {
  return {
    async render() {
      $('#pageContent').innerHTML = `
        <div class="page-header"><h1>${icon} ${title}</h1><p>إدارة بنود ${title}</p>
        <div class="page-actions"><button class="btn btn-primary" onclick="TypeEditor.open('${table}','${title}')">➕ إضافة بند</button></div></div>
        <div class="table-wrap"><div class="table-scroll" id="typeTable_${table}"></div></div>`;
      
      const { data } = await sb.from(table).select('*').order('sort_order');
      const wrap = $(`#typeTable_${table}`);
      if (!data?.length) { 
        wrap.innerHTML = `<div class="empty"><h3>لا توجد بنود</h3></div>`; 
        return; 
      }
      
      wrap.innerHTML = `<table class="data"><thead><tr><th>الاسم</th><th>نظامي</th><th>الحالة</th><th>إجراءات</th></tr></thead>
        <tbody>${data.map(t=>`<tr>
          <td><b>${esc(t.name)}</b></td>
          <td>${t.is_system?'✅':'—'}</td>
          <td><span class="badge ${t.is_active?'success':'danger'}">${t.is_active?'نشط':'معطل'}</span></td>
          <td><button class="btn btn-ghost btn-sm" onclick="TypeEditor.open('${table}','${title}','${t.id}')">✏️</button></td>
        </tr>`).join('')}</tbody></table>`;
    }
  };
}

const Earnings = buildTypePage('earning_types', 'الاستحقاقات', '➕');
const Deductions = buildTypePage('deduction_types', 'الاستقطاعات', '➖');

const TypeEditor = {
  async open(table, title, id) {
    let t = null;
    if (id) ({data:t} = await sb.from(table).select('*').eq('id', id).single());
    
    Modal.open(id?'✏️ تعديل بند':'➕ بند جديد', `
      <form id="typeForm">
        <label class="field"><span>الاسم *</span><input name="name" required value="${esc(t?.name||'')}"></label>
        <label class="field"><span>الحالة</span><select name="is_active">
          <option value="true" ${t?.is_active!==false?'selected':''}>نشط</option>
          <option value="false" ${t?.is_active===false?'selected':''}>معطل</option>
        </select></label>
      </form>`,
      `<button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button><button class="btn btn-primary" id="saveT">💾 حفظ</button>`
    );
    
    $('#saveT').onclick = async () => {
      const fd = new FormData($('#typeForm'));
      const payload = Object.fromEntries(fd.entries());
      payload.is_active = payload.is_active === 'true';
      
      const res = id ? await sb.from(table).update(payload).eq('id',id) : await sb.from(table).insert(payload);
      if (res.error) return toast(res.error.message,'error');
      
      toast('✅ تم');
      await Cache.load();
      Modal.close();
      if (table === 'earning_types') Earnings.render();
      else Deductions.render();
    };
  }
};

// ============================================
// Router (الموجّه)
// ============================================
const Router = {
  current: 'dashboard',
  
  get pages() {
    return {
      dashboard: Dashboard, 
      employees: Employees, 
      departments: Departments,
      attendance: Attendance, 
      warnings: Warnings, 
      payroll: Payroll,
      loans: Loans, 
      treasuries: Treasuries, 
      journal: Journal,
      reports: Reports, 
      users: Users, 
      settings: Settings,
      audit: Audit, 
      notifications: Notifications,
      terminations: Terminations, 
      earnings: Earnings, 
      deductions: Deductions,
      'attendance-report': (typeof AttendanceReport !== 'undefined' ? AttendanceReport : null)
    };
  },
  
  go(page) {
    const obj = this.pages[page];
    if (!obj || typeof obj.render !== 'function') {
      console.warn('Page not found:', page);
      return;
    }
    this.current = page;
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    $('#sidebar').classList.remove('open');
    $('#overlay').classList.remove('show');
    obj.render.call(obj);
    window.scrollTo({top: 0});
  }
};

// ============================================
// Global Search (البحث السريع)
// ============================================
const GlobalSearch = {
  async search(q) {
    if (!q || q.length < 2) { Modal.close(); return; }
    
    const [emps, receipts] = await Promise.all([
      sb.from('employees').select('id, employee_number, full_name')
        .or(`full_name.ilike.%${q}%,employee_number.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(10),
      sb.from('receipts').select('receipt_no, amount, employees(full_name)')
        .ilike('receipt_no', `%${q}%`)
        .limit(10)
    ]);
    
    Modal.open(`🔎 نتائج: "${esc(q)}"`, `
      ${emps.data?.length?`<h4 style="margin-bottom:8px">👥 الموظفون</h4>
        <div class="table-scroll"><table class="data"><tbody>
          ${emps.data.map(e=>`<tr><td><b>${esc(e.employee_number)}</b></td><td>${esc(e.full_name)}</td>
            <td><button class="btn btn-primary btn-sm" onclick="Modal.close();Employees.view('${e.id}')">عرض</button></td></tr>`).join('')}
        </tbody></table></div>`:''}
      ${receipts.data?.length?`<h4 style="margin:12px 0 8px">🧾 الإيصالات</h4>
        <div class="table-scroll"><table class="data"><tbody>
          ${receipts.data.map(r=>`<tr><td>${esc(r.receipt_no)}</td><td>${esc(r.employees?.full_name||'')}</td><td class="num">${fmt(r.amount)}</td></tr>`).join('')}
        </tbody></table></div>`:''}
      ${!emps.data?.length && !receipts.data?.length ? '<div class="empty"><h3>لا نتائج</h3></div>' : ''}
    `, `<button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>`, {size:'lg'});
  }
};

// ============================================
// Boot (تشغيل النظام)
// ============================================
(async function boot() {
  try {
    Theme.init();
    const profile = await Auth.init();
    if (!profile) return;
    updateUserUI(profile);
    await Cache.load();
    
    // ✅ تحديث الشعار بعد تحميل الإعدادات
    updateBrandUI();

    $$('.nav-item[data-page]').forEach(item => {
      item.onclick = () => Router.go(item.dataset.page);
    });

    $('#logoutBtn').onclick = () => Auth.logout();
    $('#menuBtn').onclick = () => {
      $('#sidebar').classList.toggle('open');
      $('#overlay').classList.toggle('show');
    };
    $('#overlay').onclick = () => {
      $('#sidebar').classList.remove('open');
      $('#overlay').classList.remove('show');
    };
    $('#themeBtn').onclick = () => Theme.toggle();

    const checkNotifs = async () => {
      const { count } = await sb.from('notifications')
        .select('id', {count: 'exact', head: true})
        .eq('user_id', Auth.currentUser.id)
        .eq('is_read', false);
      const badge = $('#notifBadge');
      if (badge) {
        if (count > 0) { 
          badge.textContent = count; 
          badge.style.display = 'inline-block'; 
        } else {
          badge.style.display = 'none';
        }
      }
    };
    await checkNotifs();
    setInterval(checkNotifs, 60000);
    $('#notifBtn')?.addEventListener('click', () => Router.go('notifications'));

    let searchTimer;
    $('#globalSearch').oninput = (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => GlobalSearch.search(e.target.value.trim()), 400);
    };

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        $('#globalSearch').focus();
      }
    });

    Router.go('dashboard');
  } catch (err) {
    console.error('Boot error:', err);
    $('#pageContent').innerHTML = `<div class="empty"><h3>⚠️ خطأ: ${esc(err.message)}</h3></div>`;
  }
})();

// ============================================
// تحديث واجهة المستخدم
// ============================================
function updateUserUI(profile) {
  const nameEl = $('#userName');
  const roleEl = $('#userRole');
  const avatarEl = $('#userAvatar');
  if (nameEl) nameEl.textContent = profile.full_name || 'مستخدم';
  if (roleEl) roleEl.textContent = profile.role === 'admin' ? '👑 مدير النظام' : '👤 مسؤول قسم';
  if (avatarEl) avatarEl.textContent = (profile.full_name || '؟').trim().charAt(0);
}

// ============================================
// ✅ نهاية app.js
// ============================================