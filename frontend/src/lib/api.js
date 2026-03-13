const API_BASE = import.meta.env.VITE_API_URL || ''

export async function submitEnterpriseLead(data) {
  const res = await fetch(`${API_BASE}/api/leads/enterprise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to submit')
  return res.json()
}

export async function submitRegistration(data) {
  const res = await fetch(`${API_BASE}/api/leads/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to register')
  return res.json()
}
