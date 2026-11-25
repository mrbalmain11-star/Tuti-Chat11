export const adminSections = [
  { id: 'stats', label: 'الإحصائيات', permission: 'stats.read' },
  { id: 'users', label: 'المستخدمون', permission: 'users.manage' },
  { id: 'accountReset', label: 'تصفير حساب', permission: 'users.manage', ownerOnly: true },
  { id: 'agencies', label: 'الوكالات', permission: 'agencies.read' },
  { id: 'rooms', label: 'الغرف', permission: 'rooms.read' },
  { id: 'operations', label: 'العمليات', permission: 'operations.read', ownerOnly: true },
  { id: 'ids', label: 'الآيديات', permission: 'ids.manage' },
  { id: 'moderation', label: 'إشراف الغرف', permission: 'room.moderate' },
  { id: 'roomAppeals', label: 'اعتراضات باند الغرف', permission: 'room.appeals' },
  { id: 'customerServiceAppeals', label: 'طلبات الباند العام', permission: 'support.appeals' },
  { id: 'appBans', label: 'المحظورون من التطبيق', permission: 'app_bans.manage', superOnly: true },
  { id: 'agencyActions', label: 'إجراءات الوكالات', permission: 'agency.actions' },
  { id: 'agencyRegistrations', label: 'طلبات فتح وكالة مضيفين', permission: 'host_agency.open' },
  { id: 'reports', label: 'البلاغات', permission: 'reports.moderate' },
  { id: 'financeReports', label: 'التقارير المالية', permission: 'reports.read' },
  { id: 'agencySupplyRequests', label: 'طلبات شحن الوكالة', permission: 'recharge.manage', ownerOnly: true },
  { id: 'gamesTreasury', label: 'إدارة الألعاب', permission: 'games.manage' },
  { id: 'staff', label: 'الصلاحيات', permission: 'staff.manage', ownerOnly: true },
  { id: 'banners', label: 'البنرات', permission: 'banners.manage' },
  { id: 'decorations', label: 'إدارة الزينة والمتجر', permission: 'catalog.manage' },
  { id: 'offers', label: 'العروض', permission: 'offers.manage' },
  { id: 'dailyRewards', label: 'المكافآت اليومية', permission: 'daily_rewards.read' },
  { id: 'testerBadges', label: 'شارات المختبرين', permission: 'tester_badges.manage' },
] as const;

export const staffRoles = {
  admin: 'أدمن',
  super_admin: 'سوبر أدمن',
  customer_service: 'موظف خدمات عملاء',
} as const;
export type StaffRole = keyof typeof staffRoles;
export type AdminSection = typeof adminSections[number];

export function canAssignSection(role: StaffRole, section: AdminSection) {
  if ('ownerOnly' in section) return false;
  if ('superOnly' in section) return role === 'super_admin';
  return role !== 'customer_service' || section.id === 'customerServiceAppeals';
}
