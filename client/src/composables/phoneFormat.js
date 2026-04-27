export function formatPhone(raw) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  // Force first digit to always be 8
  const d = '8' + digits.slice(1)
  let out = d[0]
  if (d.length > 1) out += ' ' + d.slice(1, 4)
  if (d.length > 4) out += ' ' + d.slice(4, 7)
  if (d.length > 7) out += ' ' + d.slice(7, 9)
  if (d.length > 9) out += ' ' + d.slice(9, 11)
  return out
}
