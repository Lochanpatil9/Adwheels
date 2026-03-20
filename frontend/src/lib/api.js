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

export async function createRazorpayOrder(campaignId, amount) {
  const res = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, amount, currency: 'INR' }),
  })
  if (!res.ok) throw new Error('Failed to create order')
  return res.json()
}

export async function verifyPayment(data) {
  const res = await fetch(`${API_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Payment verification failed')
  return res.json()
}
