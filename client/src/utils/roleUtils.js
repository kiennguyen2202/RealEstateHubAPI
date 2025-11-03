export function isProRole(role) {
  if (!role) return false;
  const normalized = String(role);
  return normalized === 'Pro_1' || normalized === 'Pro_3' || normalized === 'Pro_12';
}


