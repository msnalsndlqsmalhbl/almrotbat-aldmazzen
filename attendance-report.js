// ============================================
// 🏭 مصنع الصندل - Attendance Report Module
// كشف تفصيلي للحضور والغياب (فردي + جماعي + ملخص)
// ============================================

const AttendanceReport = {
  
  async render() {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    
    $('#pageContent').innerHTML = `
      <div class="page-header">
        <h1>📋 كشوف الحضور الرسمية</h1>
        <p>وثائق معتمدة — مقبولة لمكتب العمل</p>
      </div>
      
      <div class="grid grid-3" style="margin-bottom:24px">
        <div class="card" style="cursor:pointer;border-top:4px solid var(--primary);text-align:center;padding:32px 20px" onclick="AttendanceReport.openSingleForm()">
          <div style="font-size:56px;margin-bottom:12px">👤</div>
          <h3 style="color:var(--primary);margin-bottom:8px">كشف موظف واحد</h3>
          <p style="font-size:13px;color:var(--text-2)">تفاصيل كل يوم (تاريخ + حالة + نوع)</p>
        </div>
        
        <div class="card" style="cursor:pointer;border-top:4px solid var(--success);text-align:center;padding:32px 20px" onclick="AttendanceReport.openBulkForm()">
          <div style="font-size:56px;margin-bottom:12px">👥</div>
          <h3 style="color:var(--success);margin-bottom:8px">كشف جماعي</h3>
          <p style="font-size:13px;color:var(--text-2)">كل الموظفين في جدول واحد</p>
        </div>
        
        <div class="card" style="cursor:pointer;border-top:4px solid var(--warning);text-align:center;padding:32px 20px" onclick="AttendanceReport.openSummaryForm()">
          <div style="font-size:56px;margin-bottom:12px">📊</div>
          <h3 style="color:var(--warning);margin-bottom:8px">ملخص إحصائي</h3>
          <p style="font-size:13px;color:var(--text-2)">إحصائيات مجمّعة بالقسم</p>
        </div>
      </div>
      
      <div class="card" style="background:linear-gradient(135deg,var(--primary-soft),var(--purple-soft));border:2px solid var(--primary)">
        <h3 style="margin-bottom:12px">💡 استخدامات هذا الكشف</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;font-size:13.5px">
          <div>✅ تقديم لمكتب العمل في حالة نزاع</div>
          <div>✅ إثبات الغياب المتكرر قبل الفصل</div>
          <div>✅ توثيق الحضور الشهري</div>
          <div>✅ مستند رسمي لتسوية نهاية الخدمة</div>
          <div>✅ دليل على الالتزام بالدوام</div>
          <div>✅ مرجع للإنذارات الصادرة</div>
        </div>
      </div>
    `;
  },
  
  async openSingleForm() {
    const { data: emps } = await sb.from('employees')
      .select('id, employee_number, full_name, departments(name)')
      .is('deleted_at', null)
      .eq('status', 'active')
      .order('employee_number');
    
    const empOpts = (emps || []).map(e => 
      `<option value="${e.id}">${esc(e.employee_number)} — ${esc(e.full_name)} (${esc(e.departments?.name || '—')})</option>`
    ).join('');
    
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    
    Modal.open('👤 كشف موظف واحد', `
      <div class="form-grid">
        <label class="field full">
          <span>الموظف *</span>
          <select id="arEmp" required>
            <option value="">— اختر موظفاً —</option>
            ${empOpts}
          </select>
        </label>
        <label class="field">
          <span>من تاريخ *</span>
          <input type="date" id="arFrom" value="${monthStart}" required>
        </label>
        <label class="field">
          <span>إلى تاريخ *</span>
          <input type="date" id="arTo" value="${today}" required>
        </label>
        <label class="field full">
          <span>تصفية الحضور</span>
          <select id="arFilter">
            <option value="all">📋 كل السجلات</option>
            <option value="absent_only">🔴 الغياب فقط</option>
            <option value="present_only">🟢 الحضور فقط</option>
            <option value="unexcused_only">⛔ بدون عذر فقط</option>
          </select>
        </label>
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--bg-3);border-radius:10px;font-size:12.5px;color:var(--text-2)">
        💡 اختر "الغياب فقط" للحصول على وثيقة مركّزة — مثالية لمكتب العمل
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button>
      <button class="btn btn-primary" id="arShow">📋 عرض الكشف</button>
    `);
    
    $('#arShow').onclick = () => {
      const empId = $('#arEmp').value;
      const from = $('#arFrom').value;
      const to = $('#arTo').value;
      const filter = $('#arFilter').value;
      if (!empId) return toast('اختر موظفاً', 'warning');
      if (!from || !to) return toast('حدد التواريخ', 'warning');
      if (new Date(from) > new Date(to)) return toast('تاريخ البداية بعد النهاية', 'warning');
      Modal.close();
      setTimeout(() => AttendanceReport.showSingle(empId, from, to, filter), 150);
    };
  },
  
  async showSingle(empId, from, to, filter) {
    toast('⏳ جاري تحضير الكشف...');
    
    const { data: emp } = await sb.from('employees')
      .select('*, departments(name), employee_types(name)')
      .eq('id', empId)
      .single();
    if (!emp) return toast('الموظف غير موجود', 'error');
    
    const { data: records } = await sb.from('attendance_records')
      .select('*, attendance_files(name)')
      .eq('employee_id', empId)
      .gte('attendance_date', from)
      .lte('attendance_date', to)
      .order('attendance_date');
    
    const allRecords = records || [];
    let filtered = allRecords;
    if (filter === 'absent_only') filtered = allRecords.filter(r => r.status === 'absent');
    else if (filter === 'present_only') filtered = allRecords.filter(r => r.status === 'present');
    else if (filter === 'unexcused_only') filtered = allRecords.filter(r => r.status === 'absent' && r.absence_type === 'unexcused');
    
    const stats = {
      total: allRecords.length,
      present: allRecords.filter(r => r.status === 'present').length,
      absent: allRecords.filter(r => r.status === 'absent').length,
      unexcused: allRecords.filter(r => r.status === 'absent' && r.absence_type === 'unexcused').length,
      excused: allRecords.filter(r => r.status === 'absent' && r.absence_type === 'excused').length,
      sick: allRecords.filter(r => r.status === 'absent' && r.absence_type === 'sick').length
    };
    
    const factoryName = Cache.getSetting('factory_name', 'مصنع الصندل');
    const factoryPhone = Cache.getSetting('factory_phone', '');
    const factoryAddress = Cache.getSetting('factory_address', '');
    
    const statusLabel = { present: '🟢 حاضر', absent: '🔴 غائب' };
    const absenceLabel = { 
      unexcused: '<span style="color:#b91c1c;font-weight:900">⛔ بدون عذر</span>', 
      excused: '<span style="color:#b45309;font-weight:900">🟡 بعذر</span>', 
      sick: '<span style="color:#0369a1;font-weight:900">🔵 مرضي</span>' 
    };
    
    const rowsHTML = filtered.map((r, idx) => {
      const d = new Date(r.attendance_date);
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
      const isAbsent = r.status === 'absent';
      return `
        <tr style="background:${isAbsent ? '#fef2f2' : (idx % 2 ? '#f9fafb' : '#fff')};page-break-inside:avoid">
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:900;background:#eef2ff;color:#4338ca">${idx + 1}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:800">${r.attendance_date}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;color:#666">${dayName}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:900;color:${isAbsent ? '#dc2626' : '#059669'}">${statusLabel[r.status] || r.status}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center">${isAbsent ? (absenceLabel[r.absence_type] || '—') : '<span style="color:#999">—</span>'}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:11px;color:#666">${esc(r.attendance_files?.name || '—')}</td>
        </tr>`;
    }).join('');
    
    const html = `
      <div id="printArea" style="direction:rtl;font-family:Cairo,sans-serif;padding:14px;background:#fff;color:#111">
        <div style="text-align:center;margin-bottom:14px;border-bottom:3px solid #6366f1;padding-bottom:10px">
          <div style="font-size:32px;margin-bottom:2px">🏭</div>
          <h1 style="margin:0;color:#4338ca;font-size:22px;font-weight:900">${esc(factoryName)}</h1>
          ${factoryPhone || factoryAddress ? `
            <div style="font-size:11px;color:#666">
              ${factoryPhone ? `📞 ${esc(factoryPhone)}` : ''}
              ${factoryPhone && factoryAddress ? ' &nbsp;|&nbsp; ' : ''}
              ${factoryAddress ? `📍 ${esc(factoryAddress)}` : ''}
            </div>
          ` : ''}
          <h2 style="margin:8px 0 4px;font-size:16px;font-weight:800">كشف حضور وغياب تفصيلي</h2>
          <div style="font-size:11px;color:#666">
            📅 الفترة: من <b>${from}</b> إلى <b>${to}</b> &nbsp;|&nbsp; 
            🗓️ تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}
          </div>
        </div>
        
        <div style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-radius:10px;padding:14px;margin-bottom:14px;border-right:5px solid #4338ca">
          <table style="width:100%;font-size:12px;border-collapse:collapse">
            <tr>
              <td style="padding:4px"><b>الاسم:</b> ${esc(emp.full_name)}</td>
              <td style="padding:4px"><b>الرقم الوظيفي:</b> ${esc(emp.employee_number)}</td>
            </tr>
            <tr>
              <td style="padding:4px"><b>القسم:</b> ${esc(emp.departments?.name || '—')}</td>
              <td style="padding:4px"><b>المسمى:</b> ${esc(emp.job_title || '—')}</td>
            </tr>
            <tr>
              <td style="padding:4px"><b>نوع الموظف:</b> ${esc(emp.employee_types?.name || '—')}</td>
              <td style="padding:4px"><b>تاريخ التعيين:</b> ${fmtDate(emp.hire_date)}</td>
            </tr>
            <tr>
              <td style="padding:4px"><b>الراتب الأساسي:</b> ${fmt(emp.base_salary, emp.currency)}</td>
              <td style="padding:4px"><b>عدد الإنذارات النشطة:</b> <span style="color:#dc2626;font-weight:900">${emp.warnings_count || 0}</span></td>
            </tr>
          </table>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px;page-break-inside:avoid">
          <div style="background:#eef2ff;padding:10px;border-radius:8px;text-align:center;border:2px solid #6366f1">
            <div style="font-size:10px;color:#4338ca;font-weight:800">📊 إجمالي الأيام</div>
            <div style="font-size:20px;font-weight:900;color:#4338ca">${stats.total}</div>
          </div>
          <div style="background:#d1fae5;padding:10px;border-radius:8px;text-align:center;border:2px solid #86efac">
            <div style="font-size:10px;color:#065f46;font-weight:800">🟢 حاضر</div>
            <div style="font-size:20px;font-weight:900;color:#065f46">${stats.present}</div>
          </div>
          <div style="background:#fee2e2;padding:10px;border-radius:8px;text-align:center;border:2px solid #fca5a5">
            <div style="font-size:10px;color:#991b1b;font-weight:800">🔴 غائب</div>
            <div style="font-size:20px;font-weight:900;color:#991b1b">${stats.absent}</div>
          </div>
          <div style="background:#fecaca;padding:10px;border-radius:8px;text-align:center;border:2px solid #f87171">
            <div style="font-size:10px;color:#7f1d1d;font-weight:800">⛔ بدون عذر</div>
            <div style="font-size:20px;font-weight:900;color:#7f1d1d">${stats.unexcused}</div>
          </div>
          <div style="background:#fef3c7;padding:10px;border-radius:8px;text-align:center;border:2px solid #fcd34d">
            <div style="font-size:10px;color:#78350f;font-weight:800">🟡 بعذر</div>
            <div style="font-size:20px;font-weight:900;color:#78350f">${stats.excused}</div>
          </div>
          <div style="background:#dbeafe;padding:10px;border-radius:8px;text-align:center;border:2px solid #93c5fd">
            <div style="font-size:10px;color:#1e3a8a;font-weight:800">🔵 مرضي</div>
            <div style="font-size:20px;font-weight:900;color:#1e3a8a">${stats.sick}</div>
          </div>
        </div>
        
        <h3 style="font-size:13px;color:#4338ca;margin-bottom:8px;background:#eef2ff;padding:6px 10px;border-radius:6px">
          📋 تفاصيل السجلات (${filtered.length} سجل)
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">
              <th style="padding:8px;border:1px solid #4338ca;width:36px">#</th>
              <th style="padding:8px;border:1px solid #4338ca;width:100px">التاريخ</th>
              <th style="padding:8px;border:1px solid #4338ca;width:80px">اليوم</th>
              <th style="padding:8px;border:1px solid #4338ca;width:100px">الحالة</th>
              <th style="padding:8px;border:1px solid #4338ca;width:120px">نوع الغياب</th>
              <th style="padding:8px;border:1px solid #4338ca">ملف الحضور</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">لا توجد سجلات في هذه الفترة</td></tr>`}
          </tbody>
        </table>
        
        ${stats.unexcused > 0 ? `
          <div style="margin-top:14px;padding:12px;background:#fef2f2;border:2px solid #dc2626;border-radius:10px;page-break-inside:avoid">
            <div style="font-size:12px;color:#7f1d1d;line-height:1.8">
              <b>⚠️ ملاحظة قانونية:</b><br>
              بلغ عدد أيام الغياب <b>بدون عذر مقبول</b> خلال هذه الفترة <b style="color:#dc2626;font-size:14px">${stats.unexcused}</b> يوم.<br>
              هذا الكشف يُعدّ مستنداً رسمياً يمكن تقديمه للجهات المختصة (مكتب العمل) لإثبات الالتزام بإجراءات الإنذار.
            </div>
          </div>
        ` : ''}
        
        <table style="width:100%;margin-top:30px;font-size:11px">
          <tr>
            <td style="width:33%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">✍️ توقيع الموظف</div></td>
            <td style="width:33%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">✍️ توقيع المدير</div></td>
            <td style="width:33%;text-align:center"><div style="border-top:2px solid #333;padding-top:6px">🔖 ختم المصنع</div></td>
          </tr>
        </table>
        
        <div style="text-align:center;font-size:10px;color:#888;margin-top:16px;padding-top:8px;border-top:1px solid #eee">
          © ${new Date().getFullYear()} ${esc(factoryName)} — وثيقة رسمية معتمدة
        </div>
      </div>`;
    
    Modal.open(`📋 كشف: ${esc(emp.full_name)}`, html, `
      <button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>
      <button class="btn btn-info" onclick="AttendanceReport.exportSingleExcel('${empId}','${from}','${to}','${filter}')">📊 Excel</button>
      <button class="btn btn-primary" onclick="Reports.print('A4')">🖨️ طباعة / PDF</button>
    `, { size: 'lg' });
  },
  
  async openBulkForm() {
    const deptOpts = Cache.departments.map(d => 
      `<option value="${d.id}">${esc(d.name)}</option>`
    ).join('');
    
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    
    Modal.open('👥 كشف جماعي', `
      <div class="form-grid">
        <label class="field">
          <span>القسم</span>
          <select id="arBulkDept">
            <option value="">🌐 كل الأقسام</option>
            ${deptOpts}
          </select>
        </label>
        <label class="field">
          <span>تصفية</span>
          <select id="arBulkFilter">
            <option value="all">📋 كل الموظفين</option>
            <option value="has_absence">🔴 الذين لديهم غياب</option>
            <option value="has_unexcused">⛔ الذين لديهم غياب بدون عذر</option>
          </select>
        </label>
        <label class="field">
          <span>من تاريخ *</span>
          <input type="date" id="arBulkFrom" value="${monthStart}" required>
        </label>
        <label class="field">
          <span>إلى تاريخ *</span>
          <input type="date" id="arBulkTo" value="${today}" required>
        </label>
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--bg-3);border-radius:10px;font-size:12.5px;color:var(--text-2)">
        💡 اختر "الذين لديهم غياب بدون عذر" للحصول على قائمة الموظفين المعرّضين للمساءلة
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button>
      <button class="btn btn-primary" id="arBulkShow">📋 عرض الكشف</button>
    `);
    
    $('#arBulkShow').onclick = () => {
      const deptId = $('#arBulkDept').value;
      const from = $('#arBulkFrom').value;
      const to = $('#arBulkTo').value;
      const filter = $('#arBulkFilter').value;
      if (!from || !to) return toast('حدد التواريخ', 'warning');
      if (new Date(from) > new Date(to)) return toast('تاريخ البداية بعد النهاية', 'warning');
      Modal.close();
      setTimeout(() => AttendanceReport.showBulk(deptId, from, to, filter), 150);
    };
  },
  
  async showBulk(deptId, from, to, filter) {
    toast('⏳ جاري تحضير الكشف...');
    
    let empQuery = sb.from('employees')
      .select('*, departments(name)')
      .is('deleted_at', null)
      .order('employee_number');
    
    if (deptId) empQuery = empQuery.eq('department_id', deptId);
    else if (!Auth.isAdmin() && Auth.currentProfile?.department_id) {
      empQuery = empQuery.eq('department_id', Auth.currentProfile.department_id);
    }
    
    const { data: emps } = await empQuery;
    if (!emps?.length) return toast('لا يوجد موظفون', 'warning');
    
    const empIds = emps.map(e => e.id);
    const { data: allRecords } = await sb.from('attendance_records')
      .select('employee_id, status, absence_type')
      .in('employee_id', empIds)
      .gte('attendance_date', from)
      .lte('attendance_date', to);
    
    const statsMap = {};
    empIds.forEach(id => {
      statsMap[id] = { present: 0, absent: 0, unexcused: 0, excused: 0, sick: 0, total: 0 };
    });
    
    (allRecords || []).forEach(r => {
      if (!statsMap[r.employee_id]) return;
      statsMap[r.employee_id].total++;
      if (r.status === 'present') statsMap[r.employee_id].present++;
      else if (r.status === 'absent') {
        statsMap[r.employee_id].absent++;
        if (r.absence_type === 'unexcused') statsMap[r.employee_id].unexcused++;
        else if (r.absence_type === 'excused') statsMap[r.employee_id].excused++;
        else if (r.absence_type === 'sick') statsMap[r.employee_id].sick++;
      }
    });
    
    let filteredEmps = emps;
    if (filter === 'has_absence') {
      filteredEmps = emps.filter(e => statsMap[e.id].absent > 0);
    } else if (filter === 'has_unexcused') {
      filteredEmps = emps.filter(e => statsMap[e.id].unexcused > 0);
    }
    
    if (!filteredEmps.length) return toast('لا توجد بيانات مطابقة', 'warning');
    
    const grand = { present: 0, absent: 0, unexcused: 0, excused: 0, sick: 0, total: 0 };
    filteredEmps.forEach(e => {
      const s = statsMap[e.id];
      grand.present += s.present;
      grand.absent += s.absent;
      grand.unexcused += s.unexcused;
      grand.excused += s.excused;
      grand.sick += s.sick;
      grand.total += s.total;
    });
    
    const factoryName = Cache.getSetting('factory_name', 'مصنع الصندل');
    const factoryPhone = Cache.getSetting('factory_phone', '');
    const factoryAddress = Cache.getSetting('factory_address', '');
    const deptName = deptId ? Cache.departments.find(d => d.id === deptId)?.name : 'كل الأقسام';
    
    const rowsHTML = filteredEmps.map((e, idx) => {
      const s = statsMap[e.id];
      const hasProblem = s.unexcused > 0;
      return `
        <tr style="background:${hasProblem ? '#fef2f2' : (idx % 2 ? '#f9fafb' : '#fff')};page-break-inside:avoid">
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:900;background:#eef2ff;color:#4338ca">${idx + 1}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;font-size:11px;white-space:nowrap">
            <b>${esc(e.employee_number)}</b><br>
            <small style="color:#666">${esc(e.full_name)}</small>
          </td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:10.5px;color:#666">${esc(e.departments?.name || '—')}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:900;background:#d1fae5;color:#059669">${s.present}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:900;background:#fee2e2;color:#dc2626">${s.absent}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:900;color:#b91c1c">${s.unexcused}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:800;color:#b45309">${s.excused}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:800;color:#0369a1">${s.sick}</td>
          <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-weight:900;color:${hasProblem ? '#dc2626' : '#059669'}">${s.total}</td>
        </tr>`;
    }).join('');
    
    const html = `
      <div id="printArea" style="direction:rtl;font-family:Cairo,sans-serif;padding:14px;background:#fff;color:#111">
        <div style="text-align:center;margin-bottom:14px;border-bottom:3px solid #6366f1;padding-bottom:10px">
          <div style="font-size:32px;margin-bottom:2px">🏭</div>
          <h1 style="margin:0;color:#4338ca;font-size:22px;font-weight:900">${esc(factoryName)}</h1>
          ${factoryPhone || factoryAddress ? `
            <div style="font-size:11px;color:#666">
              ${factoryPhone ? `📞 ${esc(factoryPhone)}` : ''}
              ${factoryPhone && factoryAddress ? ' &nbsp;|&nbsp; ' : ''}
              ${factoryAddress ? `📍 ${esc(factoryAddress)}` : ''}
            </div>
          ` : ''}
          <h2 style="margin:8px 0 4px;font-size:16px;font-weight:800">كشف حضور وغياب جماعي</h2>
          <div style="font-size:11px;color:#666">
            🏢 <b>القسم:</b> ${esc(deptName)} &nbsp;|&nbsp;
            📅 <b>من:</b> ${from} &nbsp;|&nbsp; 
            📅 <b>إلى:</b> ${to} &nbsp;|&nbsp;
            👥 <b>عدد الموظفين:</b> ${filteredEmps.length}
          </div>
          <div style="font-size:10.5px;color:#888;margin-top:4px">
            🗓️ تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px;page-break-inside:avoid">
          <div style="background:#eef2ff;padding:10px;border-radius:8px;text-align:center;border:2px solid #6366f1">
            <div style="font-size:10px;color:#4338ca;font-weight:800">📊 إجمالي السجلات</div>
            <div style="font-size:20px;font-weight:900;color:#4338ca">${grand.total}</div>
          </div>
          <div style="background:#d1fae5;padding:10px;border-radius:8px;text-align:center;border:2px solid #86efac">
            <div style="font-size:10px;color:#065f46;font-weight:800">🟢 حاضر</div>
            <div style="font-size:20px;font-weight:900;color:#065f46">${grand.present}</div>
          </div>
          <div style="background:#fee2e2;padding:10px;border-radius:8px;text-align:center;border:2px solid #fca5a5">
            <div style="font-size:10px;color:#991b1b;font-weight:800">🔴 غائب</div>
            <div style="font-size:20px;font-weight:900;color:#991b1b">${grand.absent}</div>
          </div>
          <div style="background:#fecaca;padding:10px;border-radius:8px;text-align:center;border:2px solid #f87171">
            <div style="font-size:10px;color:#7f1d1d;font-weight:800">⛔ بدون عذر</div>
            <div style="font-size:20px;font-weight:900;color:#7f1d1d">${grand.unexcused}</div>
          </div>
          <div style="background:#fef3c7;padding:10px;border-radius:8px;text-align:center;border:2px solid #fcd34d">
            <div style="font-size:10px;color:#78350f;font-weight:800">🟡 بعذر</div>
            <div style="font-size:20px;font-weight:900;color:#78350f">${grand.excused}</div>
          </div>
          <div style="background:#dbeafe;padding:10px;border-radius:8px;text-align:center;border:2px solid #93c5fd">
            <div style="font-size:10px;color:#1e3a8a;font-weight:800">🔵 مرضي</div>
            <div style="font-size:20px;font-weight:900;color:#1e3a8a">${grand.sick}</div>
          </div>
        </div>
        
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">
              <th style="padding:8px;border:1px solid #4338ca;width:36px">#</th>
              <th style="padding:8px;border:1px solid #4338ca;width:150px">الموظف</th>
              <th style="padding:8px;border:1px solid #4338ca;width:90px">القسم</th>
              <th style="padding:8px;border:1px solid #4338ca;width:70px;background:#059669">🟢 حاضر</th>
              <th style="padding:8px;border:1px solid #4338ca;width:70px;background:#dc2626">🔴 غائب</th>
              <th style="padding:8px;border:1px solid #4338ca;width:90px;background:#b91c1c">⛔ بدون عذر</th>
              <th style="padding:8px;border:1px solid #4338ca;width:70px;background:#b45309">🟡 بعذر</th>
              <th style="padding:8px;border:1px solid #4338ca;width:70px;background:#0369a1">🔵 مرضي</th>
              <th style="padding:8px;border:1px solid #4338ca;width:70px">📊 الإجمالي</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
          <tfoot>
            <tr style="background:#eef2ff;font-weight:900;font-size:11.5px">
              <td colspan="3" style="border:1px solid #4338ca;padding:8px;text-align:right;color:#4338ca">📊 الإجمالي العام</td>
              <td style="border:1px solid #4338ca;padding:8px;text-align:center;background:#d1fae5;color:#059669">${grand.present}</td>
              <td style="border:1px solid #4338ca;padding:8px;text-align:center;background:#fee2e2;color:#dc2626">${grand.absent}</td>
              <td style="border:1px solid #4338ca;padding:8px;text-align:center;color:#b91c1c">${grand.unexcused}</td>
              <td style="border:1px solid #4338ca;padding:8px;text-align:center;color:#b45309">${grand.excused}</td>
              <td style="border:1px solid #4338ca;padding:8px;text-align:center;color:#0369a1">${grand.sick}</td>
              <td style="border:1px solid #4338ca;padding:8px;text-align:center;color:#4338ca">${grand.total}</td>
            </tr>
          </tfoot>
        </table>
        
        ${grand.unexcused > 0 ? `
          <div style="margin-top:14px;padding:12px;background:#fef2f2;border:2px solid #dc2626;border-radius:10px;page-break-inside:avoid">
            <div style="font-size:11.5px;color:#7f1d1d;line-height:1.8">
              <b>⚠️ ملاحظة قانونية:</b> يوجد <b style="color:#dc2626">${filteredEmps.filter(e => statsMap[e.id].unexcused > 0).length}</b> موظف لديهم غياب بدون عذر مقبول خلال هذه الفترة.
            </div>
          </div>
        ` : ''}
        
        <table style="width:100%;margin-top:30px;font-size:11px">
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
    
    Modal.open(`👥 الكشف الجماعي (${filteredEmps.length} موظف)`, html, `
      <button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>
      <button class="btn btn-primary" onclick="Reports.print('A3')">🖨️ طباعة / PDF</button>
    `, { size: 'lg' });
  },
  
  async openSummaryForm() {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    
    Modal.open('📊 ملخص إحصائي', `
      <div class="form-grid">
        <label class="field">
          <span>من تاريخ *</span>
          <input type="date" id="arSumFrom" value="${monthStart}" required>
        </label>
        <label class="field">
          <span>إلى تاريخ *</span>
          <input type="date" id="arSumTo" value="${today}" required>
        </label>
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--bg-3);border-radius:10px;font-size:12.5px;color:var(--text-2)">
        💡 ملخص شامل بالأقسام — مناسب لتقارير الإدارة العليا
      </div>
    `, `
      <button class="btn btn-ghost" onclick="Modal.close()">إلغاء</button>
      <button class="btn btn-primary" id="arSumShow">📊 عرض الملخص</button>
    `);
    
    $('#arSumShow').onclick = () => {
      const from = $('#arSumFrom').value;
      const to = $('#arSumTo').value;
      if (!from || !to) return toast('حدد التواريخ', 'warning');
      if (new Date(from) > new Date(to)) return toast('تاريخ البداية بعد النهاية', 'warning');
      Modal.close();
      setTimeout(() => AttendanceReport.showSummary(from, to), 150);
    };
  },
  
  async showSummary(from, to) {
    toast('⏳ جاري التحضير...');
    
    let empQuery = sb.from('employees')
      .select('id, department_id, departments(name)')
      .is('deleted_at', null)
      .eq('status', 'active');
    
    if (!Auth.isAdmin() && Auth.currentProfile?.department_id) {
      empQuery = empQuery.eq('department_id', Auth.currentProfile.department_id);
    }
    
    const { data: emps } = await empQuery;
    if (!emps?.length) return toast('لا يوجد موظفون', 'warning');
    
    const empIds = emps.map(e => e.id);
    const { data: allRecords } = await sb.from('attendance_records')
      .select('employee_id, status, absence_type')
      .in('employee_id', empIds)
      .gte('attendance_date', from)
      .lte('attendance_date', to);
    
    const deptMap = {};
    emps.forEach(e => {
      const deptId = e.department_id || 'none';
      const deptName = e.departments?.name || 'بدون قسم';
      if (!deptMap[deptId]) {
        deptMap[deptId] = {
          name: deptName, empIds: new Set(),
          present: 0, absent: 0, unexcused: 0, excused: 0, sick: 0, total: 0
        };
      }
      deptMap[deptId].empIds.add(e.id);
    });
    
    (allRecords || []).forEach(r => {
      const emp = emps.find(e => e.id === r.employee_id);
      if (!emp) return;
      const deptId = emp.department_id || 'none';
      const d = deptMap[deptId];
      if (!d) return;
      d.total++;
      if (r.status === 'present') d.present++;
      else if (r.status === 'absent') {
        d.absent++;
        if (r.absence_type === 'unexcused') d.unexcused++;
        else if (r.absence_type === 'excused') d.excused++;
        else if (r.absence_type === 'sick') d.sick++;
      }
    });
    
    const deptArray = Object.values(deptMap);
    const grand = { empCount: new Set(emps.map(e => e.id)).size, present: 0, absent: 0, unexcused: 0, excused: 0, sick: 0, total: 0 };
    deptArray.forEach(d => {
      grand.present += d.present;
      grand.absent += d.absent;
      grand.unexcused += d.unexcused;
      grand.excused += d.excused;
      grand.sick += d.sick;
      grand.total += d.total;
    });
    
    const factoryName = Cache.getSetting('factory_name', 'مصنع الصندل');
    
    const rowsHTML = deptArray.map((d, idx) => {
      const rate = d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : '0';
      return `
        <tr style="background:${idx % 2 ? '#f9fafb' : '#fff'};page-break-inside:avoid">
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:900;background:#eef2ff;color:#4338ca">${idx + 1}</td>
          <td style="border:1px solid #ccc;padding:8px;font-weight:800">${esc(d.name)}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:800">${d.empIds.size}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:900;background:#d1fae5;color:#059669">${d.present}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:900;background:#fee2e2;color:#dc2626">${d.absent}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:900;color:#b91c1c">${d.unexcused}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:800;color:#b45309">${d.excused}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:800;color:#0369a1">${d.sick}</td>
          <td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:900;color:${rate >= 90 ? '#059669' : rate >= 75 ? '#b45309' : '#dc2626'}">${rate}%</td>
        </tr>`;
    }).join('');
    
    const html = `
      <div id="printArea" style="direction:rtl;font-family:Cairo,sans-serif;padding:14px;background:#fff;color:#111">
        <div style="text-align:center;margin-bottom:14px;border-bottom:3px solid #6366f1;padding-bottom:10px">
          <div style="font-size:32px;margin-bottom:2px">🏭</div>
          <h1 style="margin:0;color:#4338ca;font-size:22px;font-weight:900">${esc(factoryName)}</h1>
          <h2 style="margin:8px 0 4px;font-size:16px;font-weight:800">📊 ملخص إحصائي للحضور والغياب</h2>
          <div style="font-size:11px;color:#666">
            📅 <b>الفترة:</b> من ${from} إلى ${to} &nbsp;|&nbsp;
            🗓️ <b>تاريخ الطباعة:</b> ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;page-break-inside:avoid">
          <div style="background:linear-gradient(135deg,#eef2ff,#c7d2fe);padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#4338ca;font-weight:800">👥 إجمالي الموظفين</div>
            <div style="font-size:28px;font-weight:900;color:#4338ca">${grand.empCount}</div>
          </div>
          <div style="background:linear-gradient(135deg,#d1fae5,#a7f3d0);padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#065f46;font-weight:800">🟢 إجمالي الحضور</div>
            <div style="font-size:28px;font-weight:900;color:#065f46">${grand.present}</div>
          </div>
          <div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#991b1b;font-weight:800">🔴 إجمالي الغياب</div>
            <div style="font-size:28px;font-weight:900;color:#991b1b">${grand.absent}</div>
          </div>
          <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:11px;color:#78350f;font-weight:800">📊 نسبة الحضور العام</div>
            <div style="font-size:28px;font-weight:900;color:#78350f">${grand.total > 0 ? ((grand.present / grand.total) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>
        
        <table style="width:100%;border-collapse:collapse;font-size:11.5px">
          <thead>
            <tr style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">
              <th style="padding:10px;border:1px solid #4338ca;width:36px">#</th>
              <th style="padding:10px;border:1px solid #4338ca">القسم</th>
              <th style="padding:10px;border:1px solid #4338ca;width:80px">👥 موظفون</th>
              <th style="padding:10px;border:1px solid #4338ca;width:80px;background:#059669">🟢 حاضر</th>
              <th style="padding:10px;border:1px solid #4338ca;width:80px;background:#dc2626">🔴 غائب</th>
              <th style="padding:10px;border:1px solid #4338ca;width:90px;background:#b91c1c">⛔ بدون عذر</th>
              <th style="padding:10px;border:1px solid #4338ca;width:80px;background:#b45309">🟡 بعذر</th>
              <th style="padding:10px;border:1px solid #4338ca;width:80px;background:#0369a1">🔵 مرضي</th>
              <th style="padding:10px;border:1px solid #4338ca;width:90px">📊 نسبة الحضور</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
          <tfoot>
            <tr style="background:#eef2ff;font-weight:900;font-size:12px">
              <td colspan="2" style="border:1px solid #4338ca;padding:10px;text-align:right;color:#4338ca">📊 الإجمالي العام</td>
              <td style="border:1px solid #4338ca;padding:10px;text-align:center">${grand.empCount}</td>
              <td style="border:1px solid #4338ca;padding:10px;text-align:center;background:#d1fae5;color:#059669">${grand.present}</td>
              <td style="border:1px solid #4338ca;padding:10px;text-align:center;background:#fee2e2;color:#dc2626">${grand.absent}</td>
              <td style="border:1px solid #4338ca;padding:10px;text-align:center;color:#b91c1c">${grand.unexcused}</td>
              <td style="border:1px solid #4338ca;padding:10px;text-align:center;color:#b45309">${grand.excused}</td>
              <td style="border:1px solid #4338ca;padding:10px;text-align:center;color:#0369a1">${grand.sick}</td>
              <td style="border:1px solid #4338ca;padding:10px;text-align:center;color:#4338ca">${grand.total > 0 ? ((grand.present / grand.total) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tfoot>
        </table>
        
        <table style="width:100%;margin-top:30px;font-size:11px">
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
    
    Modal.open('📊 الملخص الإحصائي', html, `
      <button class="btn btn-ghost" onclick="Modal.close()">إغلاق</button>
      <button class="btn btn-primary" onclick="Reports.print('A3')">🖨️ طباعة / PDF</button>
    `, { size: 'lg' });
  },
  
  async exportSingleExcel(empId, from, to, filter) {
    toast('⏳ جاري التحضير...');
    
    const { data: emp } = await sb.from('employees')
      .select('*, departments(name)')
      .eq('id', empId)
      .single();
    
    const { data: records } = await sb.from('attendance_records')
      .select('*')
      .eq('employee_id', empId)
      .gte('attendance_date', from)
      .lte('attendance_date', to)
      .order('attendance_date');
    
    let filtered = records || [];
    if (filter === 'absent_only') filtered = filtered.filter(r => r.status === 'absent');
    else if (filter === 'present_only') filtered = filtered.filter(r => r.status === 'present');
    else if (filter === 'unexcused_only') filtered = filtered.filter(r => r.status === 'absent' && r.absence_type === 'unexcused');
    
    const statusLabel = { present: 'حاضر', absent: 'غائب' };
    const absenceLabel = { unexcused: 'بدون عذر', excused: 'بعذر', sick: 'مرضي' };
    
    const headers = ['#', 'التاريخ', 'اليوم', 'الحالة', 'نوع الغياب'];
    const rows = filtered.map((r, i) => {
      const d = new Date(r.attendance_date);
      return [
        i + 1,
        r.attendance_date,
        d.toLocaleDateString('ar-EG', { weekday: 'long' }),
        statusLabel[r.status] || r.status,
        r.status === 'absent' ? (absenceLabel[r.absence_type] || '—') : '—'
      ];
    });
    
    const title = `كشف_حضور_${emp.full_name}_${from}_${to}`;
    await Reports.exportExcel(title, headers, rows);
  }
};