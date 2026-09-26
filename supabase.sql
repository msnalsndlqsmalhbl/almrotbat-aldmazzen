-- ============================================
-- 🏭 مصنع الصندل - نظام المرتبات 2026
-- Database Schema + RLS + Functions + Triggers
-- ============================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- 1. TABLES
-- ============================================

-- Profiles (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'dept_manager' check (role in ('admin','dept_manager')),
  department_id uuid,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Departments
create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  manager_id uuid references profiles(id) on delete set null,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles
  add constraint fk_profiles_dept
  foreign key (department_id) references departments(id) on delete set null;

-- Employee types
create table if not exists employee_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Employee number sequence
create sequence if not exists employee_number_seq start 1;

create or replace function generate_employee_number()
returns text language plpgsql as $$
declare
  next_val bigint;
  prefix text;
begin
  select coalesce(value,'EMP') into prefix from system_settings where key='employee_prefix' limit 1;
  if prefix is null then prefix := 'EMP'; end if;
  next_val := nextval('employee_number_seq');
  return prefix || '-' || lpad(next_val::text, 4, '0');
end $$;

-- Employees
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  employee_number text not null unique,
  full_name text not null,
  job_title text,
  phone text,
  residence text,
  hire_date date,
  contract_status text default 'active' check (contract_status in ('active','expired','pending')),
  contract_image_url text,
  employee_type_id uuid references employee_types(id),
  department_id uuid references departments(id),
  base_salary numeric(14,2) default 0,
  currency text default 'SDG' check (currency in ('SDG','USD')),
  status text default 'active' check (status in ('active','terminated','suspended')),
  warnings_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists idx_employees_dept on employees(department_id) where deleted_at is null;
create index if not exists idx_employees_status on employees(status) where deleted_at is null;
create index if not exists idx_employees_name on employees using gin(to_tsvector('simple', full_name));

-- Custom fields
create table if not exists employee_custom_fields (
  id uuid primary key default uuid_generate_v4(),
  field_name text not null unique,
  field_type text not null check (field_type in ('text','number','date','image')),
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists employee_custom_values (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  field_id uuid references employee_custom_fields(id) on delete cascade,
  value text,
  unique(employee_id, field_id)
);

-- Attendance
create table if not exists attendance_files (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date not null,
  end_date date not null,
  department_id uuid references departments(id),
  status text default 'open' check (status in ('open','closed')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists attendance_records (
  id uuid primary key default uuid_generate_v4(),
  file_id uuid references attendance_files(id) on delete cascade,
  employee_id uuid references employees(id),
  attendance_date date not null,
  status text not null check (status in ('present','absent')),
  absence_type text check (absence_type in ('excused','unexcused','sick')),
  notes text,
  created_at timestamptz default now(),
  unique(file_id, employee_id, attendance_date)
);

create index if not exists idx_att_records_file on attendance_records(file_id);
create index if not exists idx_att_records_emp on attendance_records(employee_id);

-- Earning / Deduction types
create table if not exists earning_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  is_system boolean default false,
  is_active boolean default true,
  sort_order int default 0
);

create table if not exists deduction_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  is_system boolean default false,
  is_active boolean default true,
  sort_order int default 0
);

-- Payroll
create table if not exists payroll_files (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  period_type text not null check (period_type in ('daily','weekly','monthly')),
  start_date date not null,
  end_date date not null,
  department_id uuid references departments(id),
  attendance_file_id uuid references attendance_files(id),
  status text default 'draft' check (status in ('draft','approved','paid','cancelled')),
  is_locked boolean default false,
  lock_after_payment boolean default true,
  total_net numeric(14,2) default 0,
  payment_method text check (payment_method in ('cash','bank')),
  treasury_id uuid,
  paid_at timestamptz,
  paid_by uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payroll_records (
  id uuid primary key default uuid_generate_v4(),
  payroll_file_id uuid references payroll_files(id) on delete cascade,
  employee_id uuid references employees(id),
  base_salary numeric(14,2) default 0,
  total_earnings numeric(14,2) default 0,
  total_deductions numeric(14,2) default 0,
  absence_deduction numeric(14,2) default 0,
  net_salary numeric(14,2) default 0,
  payment_method text check (payment_method in ('cash','bank')),
  bank_name text,
  transaction_no text,
  is_paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique(payroll_file_id, employee_id)
);

create table if not exists payroll_earnings (
  id uuid primary key default uuid_generate_v4(),
  payroll_record_id uuid references payroll_records(id) on delete cascade,
  earning_type_id uuid references earning_types(id),
  amount numeric(14,2) default 0
);

create table if not exists payroll_deductions (
  id uuid primary key default uuid_generate_v4(),
  payroll_record_id uuid references payroll_records(id) on delete cascade,
  deduction_type_id uuid references deduction_types(id),
  amount numeric(14,2) default 0
);

-- Loans
create table if not exists loans (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id),
  total_amount numeric(14,2) not null,
  installments_count int not null check (installments_count > 0),
  installment_amount numeric(14,2) not null,
  paid_amount numeric(14,2) default 0,
  remaining_amount numeric(14,2) not null,
  start_date date not null,
  currency text default 'SDG' check (currency in ('SDG','USD')),
  status text default 'active' check (status in ('active','completed','cancelled')),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists loan_payments (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid references loans(id) on delete cascade,
  payroll_record_id uuid references payroll_records(id),
  amount numeric(14,2) not null,
  payment_date date default current_date,
  created_at timestamptz default now()
);

-- Terminations
create table if not exists termination_records (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id),
  termination_date date not null,
  reason text check (reason in ('resignation','dismissal','contract_end')),
  warnings_count int default 0,
  end_of_service numeric(14,2) default 0,
  dues numeric(14,2) default 0,
  custody text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Treasuries
create table if not exists treasuries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('cash','bank')),
  department_id uuid references departments(id),
  manager_id uuid references profiles(id),
  opening_balance numeric(14,2) default 0,
  current_balance numeric(14,2) default 0,
  currency text default 'SDG' check (currency in ('SDG','USD')),
  bank_name text,
  account_number text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table payroll_files
  add constraint fk_payroll_treasury
  foreign key (treasury_id) references treasuries(id);

create table if not exists treasury_transactions (
  id uuid primary key default uuid_generate_v4(),
  transaction_no text unique,
  treasury_id uuid references treasuries(id),
  type text not null check (type in ('deposit','withdrawal','transfer_in','transfer_out','salary_payment')),
  amount numeric(14,2) not null,
  balance_before numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  related_treasury_id uuid references treasuries(id),
  payroll_file_id uuid references payroll_files(id),
  description text,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

create sequence if not exists treasury_tx_seq start 1;

-- Journal
create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  entry_no text unique not null,
  entry_date date default current_date,
  payroll_file_id uuid references payroll_files(id),
  department_id uuid references departments(id),
  total_amount numeric(14,2) not null,
  description text,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists journal_entry_lines (
  id uuid primary key default uuid_generate_v4(),
  journal_entry_id uuid references journal_entries(id) on delete cascade,
  account_name text not null,
  debit numeric(14,2) default 0,
  credit numeric(14,2) default 0
);

create sequence if not exists journal_entry_seq start 1;

-- Receipts
create table if not exists receipts (
  id uuid primary key default uuid_generate_v4(),
  receipt_no text unique not null,
  payroll_record_id uuid references payroll_records(id),
  employee_id uuid references employees(id),
  amount numeric(14,2) not null,
  payment_method text,
  bank_name text,
  transaction_no text,
  issued_at timestamptz default now()
);

create sequence if not exists receipt_seq start 1;

-- Permissions
create table if not exists permissions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  permission_key text not null,
  granted boolean default false,
  unique(profile_id, permission_key)
);

-- Audit logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_created on audit_logs(created_at desc);

-- System settings
create table if not exists system_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

insert into system_settings (key, value) values
  ('factory_name','مصنع الصندل'),
  ('factory_phone',''),
  ('factory_address',''),
  ('factory_logo_url',''),
  ('employee_prefix','EMP'),
  ('receipt_prefix','REC'),
  ('journal_prefix','JE'),
  ('default_month_days','30'),
  ('insurance_total','25'),
  ('insurance_employee','8'),
  ('insurance_company','17'),
  ('end_of_service_formula','day_wage * 15 * years'),
  ('max_warnings','3'),
  ('currency_default','SDG')
on conflict (key) do nothing;

-- Seed default data
insert into departments (name) values ('قسم الأكياس'), ('قسم الحبال')
on conflict (name) do nothing;

insert into employee_types (name) values ('موظف دائم'), ('عامل'), ('عامل مؤقت باليومية')
on conflict (name) do nothing;

insert into earning_types (name, is_system, sort_order) values
  ('الراتب الأساسي', true, 1),
  ('حوافز', false, 2),
  ('عمل إضافي', false, 3),
  ('بدل ترحيل', false, 4),
  ('بدل وجبة', false, 5)
on conflict (name) do nothing;

insert into deduction_types (name, is_system, sort_order) values
  ('التأمين الاجتماعي', true, 1),
  ('ضريبة الدخل', true, 2),
  ('خصومات', false, 3),
  ('جزاءات', false, 4),
  ('سلفة', true, 5),
  ('خصم الغياب', true, 6)
on conflict (name) do nothing;

-- ============================================
-- 2. TRIGGERS
-- ============================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_upd on profiles;
create trigger trg_profiles_upd before update on profiles
  for each row execute function update_updated_at();

drop trigger if exists trg_employees_upd on employees;
create trigger trg_employees_upd before update on employees
  for each row execute function update_updated_at();

drop trigger if exists trg_payroll_files_upd on payroll_files;
create trigger trg_payroll_files_upd before update on payroll_files
  for each row execute function update_updated_at();

-- Auto employee number
create or replace function set_employee_number()
returns trigger language plpgsql as $$
begin
  if new.employee_number is null or new.employee_number = '' then
    new.employee_number := generate_employee_number();
  end if;
  return new;
end $$;

drop trigger if exists trg_emp_num on employees;
create trigger trg_emp_num before insert on employees
  for each row execute function set_employee_number();

-- ============================================
-- 3. CORE FUNCTIONS
-- ============================================

-- Check if current user is admin
create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- Get current user's department
create or replace function current_dept()
returns uuid language sql stable security definer as $$
  select department_id from profiles where id = auth.uid();
$$;

-- ============================================
-- 4. ATOMIC PAYROLL PAYMENT
-- ============================================

create or replace function pay_payroll(
  p_payroll_id uuid,
  p_treasury_id uuid,
  p_payment_method text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_payroll record;
  v_treasury record;
  v_total numeric(14,2) := 0;
  v_rec record;
  v_receipt_no text;
  v_entry_no text;
  v_entry_id uuid;
  v_new_balance numeric(14,2);
begin
  -- Lock payroll row
  select * into v_payroll from payroll_files where id = p_payroll_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'ملف الرواتب غير موجود');
  end if;

  if v_payroll.status = 'paid' then
    return jsonb_build_object('success', false, 'error', 'تم دفع هذا الملف مسبقاً');
  end if;

  if v_payroll.status = 'cancelled' then
    return jsonb_build_object('success', false, 'error', 'الملف ملغي');
  end if;

  -- Lock treasury
  select * into v_treasury from treasuries where id = p_treasury_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'الخزينة غير موجودة');
  end if;

  -- Calculate total
  select coalesce(sum(net_salary),0) into v_total
    from payroll_records where payroll_file_id = p_payroll_id;

  if v_total <= 0 then
    return jsonb_build_object('success', false, 'error', 'لا توجد مبالغ للدفع');
  end if;

  if v_treasury.current_balance < v_total then
    return jsonb_build_object('success', false,
      'error', 'الرصيد غير كافٍ. الرصيد الحالي: ' || v_treasury.current_balance);
  end if;

  -- Update treasury balance
  v_new_balance := v_treasury.current_balance - v_total;

  insert into treasury_transactions(
    transaction_no, treasury_id, type, amount,
    balance_before, balance_after, payroll_file_id, description, user_id
  ) values (
    'TX-' || to_char(now(),'YYYY') || '-' || lpad(nextval('treasury_tx_seq')::text, 6, '0'),
    p_treasury_id, 'salary_payment', v_total,
    v_treasury.current_balance, v_new_balance,
    p_payroll_id,
    'دفع رواتب: ' || v_payroll.name,
    auth.uid()
  );

  update treasuries set current_balance = v_new_balance where id = p_treasury_id;

  -- Create receipts for each record
  for v_rec in
    select pr.*, e.full_name as emp_name
    from payroll_records pr
    join employees e on e.id = pr.employee_id
    where pr.payroll_file_id = p_payroll_id
  loop
    v_receipt_no := 'REC-' || to_char(now(),'YYYY') || '-' ||
                    lpad(nextval('receipt_seq')::text, 6, '0');

    insert into receipts(receipt_no, payroll_record_id, employee_id, amount,
                        payment_method, bank_name, transaction_no)
    values (v_receipt_no, v_rec.id, v_rec.employee_id, v_rec.net_salary,
            p_payment_method, v_rec.bank_name, v_rec.transaction_no);

    update payroll_records set is_paid = true, paid_at = now(),
           payment_method = p_payment_method
      where id = v_rec.id;
  end loop;

  -- Journal entry
  v_entry_no := 'JE-' || to_char(now(),'YYYY') || '-' ||
                lpad(nextval('journal_entry_seq')::text, 6, '0');

  insert into journal_entries(entry_no, entry_date, payroll_file_id,
                              department_id, total_amount, description, user_id)
  values (v_entry_no, current_date, p_payroll_id, v_payroll.department_id,
          v_total, 'قيد رواتب: ' || v_payroll.name, auth.uid())
  returning id into v_entry_id;

  insert into journal_entry_lines(journal_entry_id, account_name, debit, credit) values
    (v_entry_id, 'مصروف رواتب - ' || coalesce((select name from departments where id = v_payroll.department_id),''),
     v_total, 0),
    (v_entry_id, 'خزينة - ' || v_treasury.name, 0, v_total);

  -- Update payroll status
  update payroll_files set
    status = 'paid',
    paid_at = now(),
    paid_by = auth.uid(),
    payment_method = p_payment_method,
    treasury_id = p_treasury_id,
    is_locked = case when lock_after_payment then true else is_locked end
  where id = p_payroll_id;

  -- Audit
  insert into audit_logs(user_id, action, entity_type, entity_id, description)
  values (auth.uid(), 'payroll_paid', 'payroll_files', p_payroll_id,
          'دفع رواتب: ' || v_payroll.name || ' بمبلغ ' || v_total);

  return jsonb_build_object('success', true, 'total', v_total,
                            'entry_no', v_entry_no);
end $$;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

alter table profiles enable row level security;
alter table departments enable row level security;
alter table employees enable row level security;
alter table attendance_files enable row level security;
alter table attendance_records enable row level security;
alter table payroll_files enable row level security;
alter table payroll_records enable row level security;
alter table loans enable row level security;
alter table loan_payments enable row level security;
alter table treasuries enable row level security;
alter table treasury_transactions enable row level security;
alter table journal_entries enable row level security;
alter table journal_entry_lines enable row level security;
alter table receipts enable row level security;
alter table audit_logs enable row level security;
alter table system_settings enable row level security;
alter table employee_types enable row level security;
alter table earning_types enable row level security;
alter table deduction_types enable row level security;
alter table employee_custom_fields enable row level security;
alter table employee_custom_values enable row level security;
alter table termination_records enable row level security;
alter table permissions enable row level security;
alter table payroll_earnings enable row level security;
alter table payroll_deductions enable row level security;

-- Profiles
create policy p_profiles_self on profiles for select using (id = auth.uid() or is_admin());
create policy p_profiles_admin on profiles for all using (is_admin());

-- Departments
create policy p_dept_read on departments for select
  using (is_admin() or id = current_dept());
create policy p_dept_admin on departments for all using (is_admin());

-- Employees
create policy p_emp_read on employees for select
  using (is_admin() or department_id = current_dept());
create policy p_emp_admin on employees for all using (is_admin());
create policy p_emp_dept_ins on employees for insert
  with check (not is_admin() and department_id = current_dept());

-- Attendance
create policy p_att_files on attendance_files for all
  using (is_admin() or department_id = current_dept());
create policy p_att_rec on attendance_records for all using (
  is_admin() or exists(
    select 1 from attendance_files f where f.id = file_id and f.department_id = current_dept()
  )
);

-- Payroll
create policy p_pay_files on payroll_files for all
  using (is_admin() or department_id = current_dept());
create policy p_pay_rec on payroll_records for all using (
  is_admin() or exists(
    select 1 from payroll_files f where f.id = payroll_file_id and f.department_id = current_dept()
  )
);
create policy p_pay_earn on payroll_earnings for all using (
  is_admin() or exists(
    select 1 from payroll_records pr
    join payroll_files f on f.id = pr.payroll_file_id
    where pr.id = payroll_record_id and f.department_id = current_dept()
  )
);
create policy p_pay_ded on payroll_deductions for all using (
  is_admin() or exists(
    select 1 from payroll_records pr
    join payroll_files f on f.id = pr.payroll_file_id
    where pr.id = payroll_record_id and f.department_id = current_dept()
  )
);

-- Loans
create policy p_loans on loans for all using (
  is_admin() or exists(select 1 from employees e where e.id = employee_id and e.department_id = current_dept())
);
create policy p_loan_pay on loan_payments for all using (
  is_admin() or exists(
    select 1 from loans l join employees e on e.id = l.employee_id
    where l.id = loan_id and e.department_id = current_dept()
  )
);

-- Treasuries
create policy p_treas on treasuries for all
  using (is_admin() or department_id = current_dept());
create policy p_treas_tx on treasury_transactions for all using (
  is_admin() or exists(
    select 1 from treasuries t where t.id = treasury_id and t.department_id = current_dept()
  )
);

-- Journal
create policy p_journal on journal_entries for all
  using (is_admin() or department_id = current_dept());
create policy p_journal_lines on journal_entry_lines for all using (
  is_admin() or exists(
    select 1 from journal_entries j where j.id = journal_entry_id and j.department_id = current_dept()
  )
);

-- Receipts
create policy p_receipts on receipts for all using (
  is_admin() or exists(
    select 1 from employees e where e.id = employee_id and e.department_id = current_dept()
  )
);

-- Audit
create policy p_audit_read on audit_logs for select using (is_admin());
create policy p_audit_ins on audit_logs for insert with check (auth.uid() = user_id);

-- Settings
create policy p_settings_read on system_settings for select using (true);
create policy p_settings_admin on system_settings for all using (is_admin());

-- Types
create policy p_emptypes on employee_types for all using (true);
create policy p_earntypes on earning_types for all using (true);
create policy p_dedtypes on deduction_types for all using (true);

-- Custom fields
create policy p_cf on employee_custom_fields for all using (is_admin() or auth.uid() is not null);
create policy p_cv on employee_custom_values for all using (
  is_admin() or exists(
    select 1 from employees e where e.id = employee_id and e.department_id = current_dept()
  )
);

-- Terminations
create policy p_term on termination_records for all using (
  is_admin() or exists(
    select 1 from employees e where e.id = employee_id and e.department_id = current_dept()
  )
);

-- Permissions
create policy p_perm on permissions for all using (is_admin() or profile_id = auth.uid());

-- ============================================
-- 6. STORAGE BUCKETS (run manually if needed)
-- ============================================
-- insert into storage.buckets (id, name, public) values ('contracts','contracts',true)
--   on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('factory','factory',true)
--   on conflict do nothing;

-- ✅ END