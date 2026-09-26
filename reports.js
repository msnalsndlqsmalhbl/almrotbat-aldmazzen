// ============================================
// 🏭 مصنع الصندل - Reports Module (الإصدار 3.3)
// مع دعم الشعار والراتب الأسبوعي
// ============================================

const Reports = {
  async render() {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>📊 التقارير</h1>
        <p>تقارير شاملة قابلة للفلترة والطباعة</p>
      </div>
      
      <div class="card" style="margin-bottom:24px">
        <h3 style="margin-bottom:16px;font-size:16px">🎯 فلاتر التقرير</h3>
        
        <div class="form-grid">
          <label class="field">
            <span>نوع التقرير</span>
            <select id="repType">
              <option value="daily">📆 يومي</option>
              <option value="weekly">📅 أسبوعي</option>
              <option value="monthly" selected>🗓️ شهري</option>
              <option value="yearly">📊 سنوي</option>
            </select>
          </label>
          
          <label class="field">
            <span>القسم</span>
            <select id="repDept">
              <option value="">🌐 كل الأقسام</option>
              ${Cache.departments.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}
            </select>
          </label>
          
          <label class="field">
            <span>من تاريخ</span>
            <input type="date" id="repFrom" value="${monthStart}">
          </label>
          
          <label class="field">
            <span>إلى تاريخ</span>
            <input type="date" id="repTo" value="${today}">
          </label>
        </div>
        
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
          <button class="btn btn-primary" onclick="Reports.generate()">🔍 عرض التقرير</button>
          <button class="btn btn-ghost" onclick="Reports.quickToday()">📆 اليوم</button>
          <button class="btn btn-ghost" onclick="Reports.quickWeek()">📅 الأسبوع</button>
          <button class="btn btn-ghost" onclick="Reports.quickMonth()">🗓️ الشهر</button>
          <button class="btn btn-ghost" onclick="Reports.quickYear()">📊 السنة</button>
        </div>
      </div>
      
      <div id="repResults">
        <div class="empty">
          <div class="ico">📊</div>
          <h3>اختر الفلاتر واضغط "عرض التقرير"</h3>
        </div>
      </div>
    `;
  },

  quickToday() {
    const t = new Date().toISOString().slice(0, 10);
    $('#repType').value = 'daily';
    $('#repFrom').value = t;
    $('#repTo').value = t;
    this.generate();
  },
  
  quickWeek() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    $('#repType').value = 'weekly';
    $('#repFrom').value = start.toISOString().slice(0, 10);
    $('#repTo').value = today.toISOString().slice(0, 10);
    this.generate();
  },
  
  quickMonth() {
    const today = new Date();
    $('#repType').value = 'monthly';
    $('#repFrom').value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    $('#repTo').value = today.toISOString().slice(0, 10);
    this.generate();
  },
  
  quickYear() {
    const today = new Date();
    $('#repType').value = 'yearly';
    $('#repFrom').value = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    $('#repTo').value = today.toISOString().slice(0, 10);
    this.generate();
  },

  async generate() {
    const from = $('#repFrom').value;
    const to = $('#repTo').value;
    const deptId = $('#repDept').value;
    if (!from || !to) return toast('حدد التواريخ', 'warning');
    
    const results = $('#repResults');
    results.innerHTML = '<div class="empty"><h3>جاري التحميل...</h3></div>';
    
    let q = sb.from('payroll_files')
      .select('*, departments(name)')
      .gte('start_date', from)
      .lte('end_date', to)
      .order('start_date', { ascending: false });
    if (deptId) q = q.eq('department_id', deptId);
    if (!Auth.isAdmin() && Auth.currentProfile?.department_id) q = q.eq('department_id', Auth.currentProfile.department_id);
    
    const { data: files } = await q;
    if (!files?.length) {
      results.innerHTML = `<div class="empty"><div class="ico">📊</div><h3>لا توجد بيانات</h3></div>`;
      return;
    }
    
    const fileIds = files.map(f => f.id);
    const { data: recs } = await sb.from('payroll_records')
      .select('*, employees(employee_number, full_name, departments(name)), payroll_files(name, start_date, end_date, status)')
      .in('payroll_file_id', fileIds);
    
    const totalNet = (recs || []).reduce((s, r) => s + Number(r.net_salary || 0), 0);
    const totalEarn = (recs || []).reduce((s, r) => s + Number(r.total_earnings || 0), 0);
    const totalDed = (recs || []).reduce((s, r) => s + Number(r.total_deductions || 0), 0);
    
    results.innerHTML = `
      <div class="page-header" style="margin-bottom:16px">
        <h2 style="font-size:20px;font-weight:900">تقرير — ${fmtDate(from)} إلى ${fmtDate(to)}</h2>
      </div>
      <div class="grid grid-4" style="margin-bottom:20px">
        ${stat('💰','إجمالي الصافي', fmt(totalNet), 'success')}
        ${stat('➕','الاستحقاقات', fmt(totalEarn), 'info')}
        ${stat('➖','الاستقطاعات', fmt(totalDed), 'danger')}
        ${stat('📁','عدد الملفات', files.length, 'primary')}
      </div>
      <div class="table-wrap">
        <div class="table-scroll">
          <table class="data">
            <thead>
              <tr>
                <th>#</th><th>الملف</th><th>الفترة</th><th>الموظف</th><th>القسم</th>
                <th>الأساسي</th><th>الاستحقاقات</th><th>الاستقطاعات</th><th>الصافي</th>
              </tr>
            </thead>
            <tbody>
              ${(recs || []).map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${esc(r.payroll_files?.name || '—')}</td>
                  <td>${fmtDate(r.payroll_files?.start_date)} - ${fmtDate(r.payroll_files?.end_date)}</td>
                  <td><b>${esc(r.employees?.employee_number)}</b> — ${esc(r.employees?.full_name)}</td>
                  <td>${esc(r.employees?.departments?.name || '—')}</td>
                  <td class="num">${fmt(r.base_salary)}</td>
                  <td class="num" style="color:var(--success)">${fmt(r.total_earnings)}</td>
                  <td class="num" style="color:var(--danger)">${fmt(r.total_deductions)}</td>
                  <td class="num" style="color:var(--success);font-weight:900">${fmt(r.net_salary)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align:right">الإجمالي</td>
                <td class="num">${fmt((recs||[]).reduce((s,r)=>s+Number(r.base_salary||0),0))}</td>
                <td class="num">${fmt(totalEarn)}</td>
                <td class="num">${fmt(totalDed)}</td>
                <td class="num" style="color:var(--success);font-size:15px">${fmt(totalNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  },

  // ============================================
  // ✅ الطباعة الاحترافية مع الشعار
  // ============================================
  async payrollFile(id) {
    const { data: file } = await sb.from('payroll_files').select('*, departments(name)').eq('id', id).single();
    const { data: records } = await sb.from('payroll_records')
      .select('*, employees(employee_number, full_name, currency)')
      .eq('payroll_file_id', id)
      .order('employee_id');
    
    if (!records?.length) return toast('لا توجد بيانات', 'warning');
    
    const recIds = records.map(r => r.id);
    const [earns, deds] = await Promise.all([
      sb.from('payroll_earnings').select('*, earning_types(name)').in('payroll_record_id', recIds),
      sb.from('payroll_deductions').select('*, deduction_types(name)').in('payroll_record_id', recIds)
    ]);
    
    const earnMap = {};
    (earns.data || []).forEach(e => { (earnMap[e.payroll_record_id] ||= []).push(e); });
    const dedMap = {};
    (deds.data || []).forEach(d => { (dedMap[d.payroll_record_id] ||= []).push(d); });
    
    Modal.open('🖨️ اختر نوع الطباعة', `
      <div style="padding:10px 0">
        <p style="margin-bottom:20px;color:var(--text-2);text-align:center">عدد الموظفين: <b style="color:var(--primary);font-size:18px">${records.length}</b></p>
        
        <div style="display:grid;gap:12px">
          <button class="btn btn-ghost" style="padding:20px;flex-direction:column;gap:8px;height:auto;text-align:center" onclick="Reports.renderPrint('${id}', 'A4')">
            <div style="font-size:32px">📄</div>
            <div style="font-weight:900;font-size:16px">A4 عمودي</div>
            <div style="font-size:12px;color:var(--text-2)">حتى 20 موظف — خط 10pt</div>
          </button>
          
          <button class="btn btn-ghost" style="padding:20px;flex-direction:column;gap:8px;height:auto;text-align:center" onclick="Reports.renderPrint('${id}', 'A3')">
            <div style="font-size:32px">📋</div>
            <div style="font-weight:900;font-size:16px">A3 عمودي</div>
            <div style="font-size:12px;color:var(--text-2)">حتى 70 موظف — خط 11pt</div>
          </button>
          
          <button class="btn btn-primary" style="padding:20px;flex-direction:column;gap:8px;height:auto;text-align:center" onclick="Reports.renderPrint('${id}', 'AUTO')">
            <div style="font-size:32px">🤖</div>
            <div style="font-weight:900;font-size:16px">تلقائي</div>
            <div style="font-size:12px;opacity:0.9">يختار النظام الحجم المناسب</div>
          </button>
        </div>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button>
    `);
    
    window._printPayrollId = id;
    window._printPayrollFile = file;
    window._printPayrollRecords = records;
    window._printPayrollEarnMap = earnMap;
    window._printPayrollDedMap = dedMap;
  },

  async renderPrint(id, paperSize) {
    Modal.close();
    setTimeout(async () => {
      const file = window._printPayrollFile;
      const records = window._printPayrollRecords;
      const earnMap = window._printPayrollEarnMap;
      const dedMap = window._printPayrollDedMap;
      
      if (paperSize === 'AUTO') {
        paperSize = records.length <= 20 ? 'A4' : 'A3';
      }
      
      // ✅ جلب سجلات الحضور مع تفصيل أنواع الغياب
      let attMap = {};
      if (file.attendance_file_id) {
        const { data: attRecords } = await sb.from('attendance_records')
          .select('employee_id, status, absence_type')
          .eq('file_id', file.attendance_file_id);
        
        (attRecords || []).forEach(a => {
          if (!attMap[a.employee_id]) {
            attMap[a.employee_id] = { present: 0, absent: 0, unexcused: 0, excused: 0, sick: 0 };
          }
          if (a.status === 'present') {
            attMap[a.employee_id].present++;
          } else if (a.status === 'absent') {
            attMap[a.employee_id].absent++;
            if (a.absence_type === 'unexcused') attMap[a.employee_id].unexcused++;
            else if (a.absence_type === 'excused') attMap[a.employee_id].excused++;
            else if (a.absence_type === 'sick') attMap[a.employee_id].sick++;
          }
        });
      }
      
      const factoryName = Cache.getSetting('factory_name', 'مصنع الصندل');
      const factoryPhone = Cache.getSetting('factory_phone', '');
      const factoryAddress = Cache.getSetting('factory_address', '');
      const logoUrl = Cache.getSetting('factory_logo_url', '').trim();
      const days = file.period_days || Math.ceil((new Date(file.end_date) - new Date(file.start_date)) / 86400000) + 1;
      
      // ✅ حساب المسار الكامل للشعار
      let fullLogoUrl = logoUrl;
      if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
        const basePath = window.location.pathname.replace(/\/[^\/]*$/, '');
        fullLogoUrl = basePath + '/' + logoUrl.replace(/^\//, '');
      }
      
      const isA3 = paperSize === 'A3';
      const fontSize = isA3 ? '11px' : '9px';
      const padding = isA3 ? '8px 10px' : '6px 8px';
      
      let totalEarnAll = 0, totalDedAll = 0, totalNetAll = 0;
      let totalPresentAll = 0, totalAbsentAll = 0;
      let totalUnexcusedAll = 0, totalExcusedAll = 0, totalSickAll = 0;
      
      const earningTotals = {};
      const deductionTotals = {};
      
      const rowsHTML = records.map((r, idx) => {
        const emp = r.employees;
        const empEarns = earnMap[r.id] || [];
        const empDeds = dedMap[r.id] || [];
        const absDed = Number(r.absence_deduction || 0);
        const earnSum = empEarns.reduce((s,e)=>s+Number(e.amount||0), 0);
        const dedSum = empDeds.reduce((s,d)=>s+Number(d.amount||0), 0);
        const totalEarning = Number(r.base_salary || 0) + earnSum;
        const net = totalEarning - dedSum - absDed;
        
        const att = attMap[r.employee_id] || { present: 0, absent: 0, unexcused: 0, excused: 0, sick: 0 };
        totalPresentAll += att.present;
        totalAbsentAll += att.absent;
        totalUnexcusedAll += att.unexcused;
        totalExcusedAll += att.excused;
        totalSickAll += att.sick;
        
        totalEarnAll += totalEarning;
        totalDedAll += dedSum + absDed;
        totalNetAll += net;
        
        earningTotals['الرواتب الأساسية'] = (earningTotals['الرواتب الأساسية'] || 0) + Number(r.base_salary || 0);
        
        let earnStr = `<span style="color:#059669;font-weight:800">أساسي</span>: <b>${Number(r.base_salary).toLocaleString('en-US')}</b>`;
        empEarns.forEach(e => {
          const name = e.custom_name || e.earning_types?.name || 'بند';
          earningTotals[name] = (earningTotals[name] || 0) + Number(e.amount || 0);
          earnStr += ` <span style="color:#059669;margin-right:6px">|</span> <span style="color:#059669">${esc(name)}</span>: <b style="color:#059669">+${Number(e.amount).toLocaleString('en-US')}</b>`;
        });
        
        let dedStr = '';
        empDeds.forEach(d => {
          const name = d.custom_name || d.deduction_types?.name || 'بند';
          deductionTotals[name] = (deductionTotals[name] || 0) + Number(d.amount || 0);
          if (dedStr) dedStr += ` <span style="color:#dc2626;margin-right:6px">|</span>`;
          dedStr += ` <span style="color:#dc2626">${esc(name)}</span>: <b style="color:#dc2626">-${Number(d.amount).toLocaleString('en-US')}</b>`;
        });
        if (absDed > 0) {
          deductionTotals['خصم الغياب'] = (deductionTotals['خصم الغياب'] || 0) + absDed;
          if (dedStr) dedStr += ` <span style="color:#dc2626;margin-right:6px">|</span>`;
          dedStr += ` <span style="color:#dc2626">غياب</span>: <b style="color:#dc2626">-${Number(absDed).toLocaleString('en-US')}</b>`;
        }
        if (!dedStr) dedStr = `<span style="color:#999">لا توجد</span>`;
        
        return `
          <tr style="background:${idx % 2 ? '#f9fafb' : '#fff'};page-break-inside:avoid">
            <td style="border:1px solid #ccc;padding:${padding};text-align:center;font-weight:900;background:#eef2ff;color:#4338ca;font-size:${fontSize}">${idx + 1}</td>
            <td style="border:1px solid #ccc;padding:${padding};font-size:${fontSize};white-space:nowrap">
              <b>${esc(emp?.employee_number)}</b><br>
              <small style="color:#666">${esc(emp?.full_name)}</small>
            </td>
            <td style="border:1px solid #ccc;padding:${padding};background:#f8fafc;font-size:${fontSize};line-height:1.5;white-space:nowrap">
              <div style="display:grid;grid-template-columns:auto auto;gap:2px 8px;font-weight:800">
                <span style="color:#059669">🟢 حاضر:</span>
                <span style="color:#059669;text-align:left">${att.present}</span>
                <span style="color:#dc2626">🔴 غائب:</span>
                <span style="color:#dc2626;text-align:left">${att.absent}</span>
                <span style="color:#b91c1c;padding-right:6px;font-size:calc(${fontSize} - 1px)">↳ بدون عذر:</span>
                <span style="color:#b91c1c;text-align:left;font-size:calc(${fontSize} - 1px)">${att.unexcused}</span>
                <span style="color:#b45309;padding-right:6px;font-size:calc(${fontSize} - 1px)">↳ بعذر:</span>
                <span style="color:#b45309;text-align:left;font-size:calc(${fontSize} - 1px)">${att.excused}</span>
                <span style="color:#0369a1;padding-right:6px;font-size:calc(${fontSize} - 1px)">↳ مرضي:</span>
                <span style="color:#0369a1;text-align:left;font-size:calc(${fontSize} - 1px)">${att.sick}</span>
              </div>
            </td>
            <td style="border:1px solid #ccc;padding:${padding};font-size:${fontSize};background:#f0fdf4;line-height:1.6">
              ${earnStr}
            </td>
            <td style="border:1px solid #ccc;padding:${padding};font-size:${fontSize};background:#fef2f2;line-height:1.6">
              ${dedStr}
            </td>
            <td style="border:1px solid #ccc;padding:${padding};text-align:center;font-weight:900;background:#d1fae5;color:#059669;font-size:calc(${fontSize} + 1px);white-space:nowrap">
              ${Number(net).toLocaleString('en-US')}
            </td>
            <td style="border:1px solid #ccc;padding:${padding};font-size:${fontSize};text-align:center;min-width:80px">
              <div style="border-bottom:1px solid #999;height:28px"></div>
            </td>
          </tr>
        `;
      }).join('');
      
      const earningRows = Object.entries(earningTotals)
        .filter(([k, v]) => v > 0)
        .map(([name, amount]) => `
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:${isA3 ? '12px' : '11px'};border-bottom:1px dashed #86efac">
            <span style="color:#059669">• ${esc(name)}:</span>
            <b style="color:#059669">${amount.toLocaleString('en-US')}</b>
          </div>
        `).join('') || `<div style="text-align:center;color:#999;padding:8px;font-size:${fontSize}">لا توجد</div>`;
      
      const deductionRows = Object.entries(deductionTotals)
        .filter(([k, v]) => v > 0)
        .map(([name, amount]) => `
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:${isA3 ? '12px' : '11px'};border-bottom:1px dashed #fca5a5">
            <span style="color:#dc2626">• ${esc(name)}:</span>
            <b style="color:#dc2626">${amount.toLocaleString('en-US')}</b>
          </div>
        `).join('') || `<div style="text-align:center;color:#999;padding:8px;font-size:${fontSize}">لا توجد</div>`;
      
      // ✅ HTML الشعار
      const logoHtml = fullLogoUrl 
        ? `<img src="${fullLogoUrl}" style="width:${isA3 ? '90px' : '70px'};height:${isA3 ? '90px' : '70px'};object-fit:contain;margin:0 auto 6px;display:block" alt="logo">`
        : `<div style="font-size:${isA3 ? '36px' : '30px'};margin-bottom:2px">🏭</div>`;
      
      const html = `
        <div id="printArea" style="direction:rtl;font-family:Cairo,sans-serif;padding:14px;background:#fff;color:#111">
          
          <div style="text-align:center;margin-bottom:14px;border-bottom:3px solid #6366f1;padding-bottom:10px">
            ${logoHtml}
            <h1 style="margin:0;color:#4338ca;font-size:${isA3 ? '24px' : '20px'};font-weight:900">${esc(factoryName)}</h1>
            ${factoryPhone || factoryAddress ? `
              <div style="font-size:${fontSize};color:#666">
                ${factoryPhone ? `📞 ${esc(factoryPhone)}` : ''}
                ${factoryPhone && factoryAddress ? ' &nbsp;|&nbsp; ' : ''}
                ${factoryAddress ? `📍 ${esc(factoryAddress)}` : ''}
              </div>
            ` : ''}
            <h2 style="margin:6px 0 4px;font-size:${isA3 ? '16px' : '14px'};font-weight:800">كشف رواتب تفصيلي — ${esc(file.name)}</h2>
            <div style="font-size:${fontSize};color:#666;margin-top:4px">
              <b>🏢 القسم:</b> ${esc(file.departments?.name || '—')} &nbsp;|&nbsp;
              <b>📅 من:</b> ${fmtDate(file.start_date)} &nbsp;|&nbsp;
              <b>📅 إلى:</b> ${fmtDate(file.end_date)} &nbsp;|&nbsp;
              <b>📊 المدة:</b> ${days} يوم &nbsp;|&nbsp;
              <b>👥 عدد الموظفين:</b> ${records.length} &nbsp;|&nbsp;
              <b>📄 الحجم:</b> ${paperSize}
            </div>
            <div style="font-size:${fontSize};color:#888;margin-top:4px">
              🗓️ تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}
            </div>
          </div>
          
          <table style="width:100%;border-collapse:collapse;font-size:${fontSize};margin-bottom:16px">
            <thead>
              <tr style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">
                <th style="padding:${padding};border:1px solid #4338ca;width:32px">#</th>
                <th style="padding:${padding};border:1px solid #4338ca;width:140px">الموظف</th>
                <th style="padding:${padding};border:1px solid #4338ca;width:110px">📅 تفصيل الحضور</th>
                <th style="padding:${padding};border:1px solid #4338ca">➕ الاستحقاقات</th>
                <th style="padding:${padding};border:1px solid #4338ca">➖ الاستقطاعات</th>
                <th style="padding:${padding};border:1px solid #4338ca;width:100px">💰 الصافي</th>
                <th style="padding:${padding};border:1px solid #4338ca;width:100px">✍️ التوقيع</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
            <tfoot>
              <tr style="background:#eef2ff;font-weight:900;font-size:${isA3 ? '13px' : '12px'}">
                <td colspan="2" style="border:1px solid #4338ca;padding:${padding};text-align:right;color:#4338ca">📊 الإجمالي العام</td>
                <td style="border:1px solid #4338ca;padding:${padding};background:#f8fafc;font-size:${fontSize};line-height:1.5;white-space:nowrap">
                  <div style="display:grid;grid-template-columns:auto auto;gap:2px 8px;font-weight:900">
                    <span style="color:#059669">🟢 حاضر:</span>
                    <span style="color:#059669;text-align:left">${totalPresentAll}</span>
                    <span style="color:#dc2626">🔴 غائب:</span>
                    <span style="color:#dc2626;text-align:left">${totalAbsentAll}</span>
                    <span style="color:#b91c1c;padding-right:6px;font-size:calc(${fontSize} - 1px)">↳ بدون عذر:</span>
                    <span style="color:#b91c1c;text-align:left;font-size:calc(${fontSize} - 1px)">${totalUnexcusedAll}</span>
                    <span style="color:#b45309;padding-right:6px;font-size:calc(${fontSize} - 1px)">↳ بعذر:</span>
                    <span style="color:#b45309;text-align:left;font-size:calc(${fontSize} - 1px)">${totalExcusedAll}</span>
                    <span style="color:#0369a1;padding-right:6px;font-size:calc(${fontSize} - 1px)">↳ مرضي:</span>
                    <span style="color:#0369a1;text-align:left;font-size:calc(${fontSize} - 1px)">${totalSickAll}</span>
                  </div>
                </td>
                <td style="border:1px solid #4338ca;padding:${padding};text-align:center;color:#059669">${totalEarnAll.toLocaleString('en-US')}</td>
                <td style="border:1px solid #4338ca;padding:${padding};text-align:center;color:#dc2626">${totalDedAll.toLocaleString('en-US')}</td>
                <td style="border:1px solid #4338ca;padding:${padding};text-align:center;color:#059669;background:#d1fae5;font-size:${isA3 ? '15px' : '14px'}">${totalNetAll.toLocaleString('en-US')}</td>
                <td style="border:1px solid #4338ca;padding:${padding}"></td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#f8fafc,#eef2ff);border:2px solid #6366f1;border-radius:10px;page-break-inside:avoid">
            <div style="font-weight:900;color:#4338ca;font-size:${isA3 ? '14px' : '12px'};margin-bottom:10px;text-align:center">
              📊 ملخص الحضور والغياب الإجمالي
            </div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;font-size:${isA3 ? '12px' : '11px'};text-align:center">
              <div style="background:#d1fae5;padding:8px;border-radius:8px;border:1px solid #86efac">
                <div style="color:#065f46;font-weight:800">🟢 حاضر</div>
                <div style="color:#065f46;font-size:${isA3 ? '18px' : '16px'};font-weight:900">${totalPresentAll}</div>
              </div>
              <div style="background:#fee2e2;padding:8px;border-radius:8px;border:1px solid #fca5a5">
                <div style="color:#991b1b;font-weight:800">🔴 غائب (كل الأنواع)</div>
                <div style="color:#991b1b;font-size:${isA3 ? '18px' : '16px'};font-weight:900">${totalAbsentAll}</div>
              </div>
              <div style="background:#fecaca;padding:8px;border-radius:8px;border:1px solid #f87171">
                <div style="color:#7f1d1d;font-weight:800">↳ بدون عذر</div>
                <div style="color:#7f1d1d;font-size:${isA3 ? '18px' : '16px'};font-weight:900">${totalUnexcusedAll}</div>
              </div>
              <div style="background:#fef3c7;padding:8px;border-radius:8px;border:1px solid #fcd34d">
                <div style="color:#78350f;font-weight:800">↳ بعذر</div>
                <div style="color:#78350f;font-size:${isA3 ? '18px' : '16px'};font-weight:900">${totalExcusedAll}</div>
              </div>
              <div style="background:#dbeafe;padding:8px;border-radius:8px;border:1px solid #93c5fd">
                <div style="color:#1e3a8a;font-weight:800">↳ مرضي</div>
                <div style="color:#1e3a8a;font-size:${isA3 ? '18px' : '16px'};font-weight:900">${totalSickAll}</div>
              </div>
            </div>
          </div>
          
          <div style="margin-top:20px;padding:14px;background:#f8fafc;border:2px solid #6366f1;border-radius:12px;page-break-inside:avoid">
            <h3 style="text-align:center;margin:0 0 14px;font-size:${isA3 ? '16px' : '14px'};color:#4338ca;font-weight:900">📊 الإجماليات المُفصّلة</h3>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
              <div style="background:#f0fdf4;padding:12px;border-radius:10px;border:2px solid #86efac">
                <div style="text-align:center;font-weight:900;color:#059669;font-size:${isA3 ? '14px' : '12px'};padding-bottom:8px;margin-bottom:8px;border-bottom:2px solid #86efac">
                  ➕ إجمالي الاستحقاقات
                </div>
                ${earningRows}
                <div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:8px;border-top:2px solid #86efac;font-weight:900;font-size:${isA3 ? '14px' : '13px'}">
                  <span style="color:#059669">💰 الإجمالي:</span>
                  <span style="color:#059669">${totalEarnAll.toLocaleString('en-US')}</span>
                </div>
              </div>
              
              <div style="background:#fef2f2;padding:12px;border-radius:10px;border:2px solid #fca5a5">
                <div style="text-align:center;font-weight:900;color:#dc2626;font-size:${isA3 ? '14px' : '12px'};padding-bottom:8px;margin-bottom:8px;border-bottom:2px solid #fca5a5">
                  ➖ إجمالي الاستقطاعات
                </div>
                ${deductionRows}
                <div style="display:flex;justify-content:space-between;padding-top:8px;margin-top:8px;border-top:2px solid #fca5a5;font-weight:900;font-size:${isA3 ? '14px' : '13px'}">
                  <span style="color:#dc2626">💰 الإجمالي:</span>
                  <span style="color:#dc2626">${totalDedAll.toLocaleString('en-US')}</span>
                </div>
              </div>
            </div>
            
            <div style="margin-top:14px;padding:14px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;border-radius:10px;text-align:center">
              <div style="font-size:${isA3 ? '13px' : '11px'};opacity:0.95;margin-bottom:4px;font-weight:700">🟢 الصافي النهائي</div>
              <div style="font-size:${isA3 ? '28px' : '24px'};font-weight:900">${totalNetAll.toLocaleString('en-US')} ج.س</div>
            </div>
          </div>
          
          <table style="width:100%;margin-top:30px;font-size:${fontSize}">
            <tr>
              <td style="width:33%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">✍️ توقيع المحاسب</div></td>
              <td style="width:33%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">✍️ توقيع المدير</div></td>
              <td style="width:33%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">🔖 ختم المصنع</div></td>
            </tr>
          </table>
          
          <div style="text-align:center;font-size:10px;color:#888;margin-top:16px;padding-top:8px;border-top:1px solid #eee">
            © ${new Date().getFullYear()} ${esc(factoryName)} — وثيقة رسمية معتمدة
          </div>
        </div>`;
      
      Modal.open(`🖨️ معاينة الطباعة (${paperSize})`, html, `
        <button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>
        <button class="btn btn-primary" onclick="Reports.print('${paperSize}')">🖨️ طباعة / PDF</button>
      `, { size: 'lg' });
    }, 150);
  },

  // ============================================
  // طباعة
  // ============================================
  print(paperSize = 'A4') {
    const content = $('#printArea')?.innerHTML;
    if (!content) return toast('لا يوجد محتوى', 'warning');
    
    const size = paperSize === 'A3' ? 'A3' : 'A4';
    
    const w = window.open('', '_blank');
    w.document.write(`
      <html dir="rtl"><head>
      <meta charset="utf-8"><title>طباعة ${size}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; padding: 10px; margin: 0; background: #fff; }
        table { width: 100%; border-collapse: collapse; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { page-break-inside: avoid; }
        img { max-width: 100%; }
        @media print {
          @page { size: ${size} portrait; margin: 8mm; }
          body { padding: 0; }
        }
      </style>
      </head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 600);
  },

  // ============================================
  // كشف الموظف
  // ============================================
  async employeeStatement(id) {
    const { data: e } = await sb.from('employees').select('*, departments(name), employee_types(name)').eq('id', id).single();
    const { data: pays } = await sb.from('payroll_records').select('*, payroll_files(name, start_date, end_date, status)').eq('employee_id', id);
    const { data: loans } = await sb.from('loans').select('*').eq('employee_id', id);
    const { data: att } = await sb.from('attendance_records').select('*').eq('employee_id', id);
    const { data: warns } = await sb.from('employee_warnings').select('*').eq('employee_id', id).order('warning_date', { ascending: false });
    
    const present = (att || []).filter(a => a.status === 'present').length;
    const absent = (att || []).filter(a => a.status === 'absent').length;
    const unexcused = (att || []).filter(a => a.status === 'absent' && a.absence_type === 'unexcused').length;
    const totalReceived = (pays || []).filter(p => p.is_paid).reduce((s, p) => s + Number(p.net_salary || 0), 0);
    const totalLoans = (loans || []).reduce((s, l) => s + Number(l.total_amount || 0), 0);
    const remLoans = (loans || []).reduce((s, l) => s + Number(l.remaining_amount || 0), 0);
    const factoryName = Cache.getSetting('factory_name', 'مصنع الصندل');
    const logoUrl = Cache.getSetting('factory_logo_url', '').trim();
    
    let fullLogoUrl = logoUrl;
    if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
      const basePath = window.location.pathname.replace(/\/[^\/]*$/, '');
      fullLogoUrl = basePath + '/' + logoUrl.replace(/^\//, '');
    }
    
    const logoHtml = fullLogoUrl 
      ? `<img src="${fullLogoUrl}" style="width:80px;height:80px;object-fit:contain;margin:0 auto 8px;display:block" alt="logo">`
      : `<div style="font-size:40px">🏭</div>`;
    
    const html = `
      <div id="printArea" style="direction:rtl;font-family:Cairo,sans-serif;padding:20px;background:#fff;color:#111">
        <div style="text-align:center;border-bottom:3px solid #6366f1;padding-bottom:14px;margin-bottom:20px">
          ${logoHtml}
          <h1 style="margin:6px 0;color:#4338ca">${esc(factoryName)}</h1>
          <h2 style="margin:6px 0;color:#333">كشف حساب موظف</h2>
        </div>
        <div style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-radius:12px;padding:18px;margin-bottom:20px">
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr>
              <td style="padding:6px"><b>الاسم:</b> ${esc(e.full_name)}</td>
              <td style="padding:6px"><b>الرقم:</b> ${esc(e.employee_number)}</td>
              <td style="padding:6px"><b>القسم:</b> ${esc(e.departments?.name || '-')}</td>
            </tr>
            <tr>
              <td style="padding:6px"><b>المسمى:</b> ${esc(e.job_title || '-')}</td>
              <td style="padding:6px"><b>الأساسي:</b> ${fmt(e.base_salary, e.currency)}</td>
              <td style="padding:6px"><b>التعيين:</b> ${fmtDate(e.hire_date)}</td>
            </tr>
          </table>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">
          <div style="background:#d1fae5;padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#065f46;font-weight:700">حضور</div>
            <div style="font-size:22px;font-weight:900;color:#065f46">${present}</div>
          </div>
          <div style="background:#fee2e2;padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#991b1b;font-weight:700">غياب</div>
            <div style="font-size:22px;font-weight:900;color:#991b1b">${absent}</div>
          </div>
          <div style="background:#fef3c7;padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#92400e;font-weight:700">بدون عذر</div>
            <div style="font-size:22px;font-weight:900;color:#92400e">${unexcused}</div>
          </div>
          <div style="background:#fee2e2;padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#991b1b;font-weight:700">إنذارات</div>
            <div style="font-size:22px;font-weight:900;color:#991b1b">${e.warnings_count || 0}</div>
          </div>
        </div>
        <h3 style="color:#4338ca">💵 الرواتب (${(pays || []).length})</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
          <thead>
            <tr style="background:#eef2ff">
              <th style="border:1px solid #ddd;padding:8px;text-align:right">الملف</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right">الفترة</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right">الصافي</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right">مدفوع</th>
            </tr>
          </thead>
          <tbody>
            ${(pays || []).length ? (pays || []).map(p => `<tr>
              <td style="border:1px solid #e5e7eb;padding:7px">${esc(p.payroll_files?.name || '-')}</td>
              <td style="border:1px solid #e5e7eb;padding:7px">${fmtDate(p.payroll_files?.start_date)} - ${fmtDate(p.payroll_files?.end_date)}</td>
              <td style="border:1px solid #e5e7eb;padding:7px">${fmt(p.net_salary, e.currency)}</td>
              <td style="border:1px solid #e5e7eb;padding:7px">${p.is_paid ? '✅' : '⏳'}</td>
            </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:12px;color:#999">لا يوجد</td></tr>'}
          </tbody>
        </table>
        <h3 style="color:#92400e">💳 السلف (${(loans || []).length})</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
          <thead>
            <tr style="background:#fef3c7">
              <th style="border:1px solid #ddd;padding:8px;text-align:right">الإجمالي</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right">القسط</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right">المدفوع</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right">المتبقي</th>
            </tr>
          </thead>
          <tbody>
            ${(loans || []).length ? (loans || []).map(l => `<tr>
              <td style="border:1px solid #e5e7eb;padding:7px">${fmt(l.total_amount, l.currency)}</td>
              <td style="border:1px solid #e5e7eb;padding:7px">${fmt(l.installment_amount, l.currency)}</td>
              <td style="border:1px solid #e5e7eb;padding:7px">${fmt(l.paid_amount, l.currency)}</td>
              <td style="border:1px solid #e5e7eb;padding:7px">${fmt(l.remaining_amount, l.currency)}</td>
            </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:12px;color:#999">لا يوجد</td></tr>'}
          </tbody>
        </table>
        <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);padding:18px;border-radius:12px;border-right:5px solid #10b981">
          <b style="font-size:15px;color:#065f46">📊 الملخص</b><br><br>
          <div style="display:flex;justify-content:space-between;padding:6px 0"><span>إجمالي المستلم:</span><b>${fmt(totalReceived, e.currency)}</b></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0"><span>إجمالي السلف:</span><b>${fmt(totalLoans, e.currency)}</b></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;color:#991b1b"><span>المتبقي من السلف:</span><b>${fmt(remLoans, e.currency)}</b></div>
        </div>
      </div>`;
    
    Modal.open('🖨 كشف الموظف — ' + esc(e.full_name), html, `
      <button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>
      <button class="btn btn-primary" onclick="Reports.print('A4')">🖨️ طباعة / PDF</button>
    `, { size: 'lg' });
  },

  async exportExcel(title, headers, rows) {
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(c => `"${String(c).replace(/"/g, '""').replace(/<[^>]*>/g, '')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('✅ تم تصدير Excel');
  }
};

// ============================================
// ✅ نهاية reports.js
// ============================================