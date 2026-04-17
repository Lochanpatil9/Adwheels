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
  if (!amount || amount <= 0) throw new Error('Invalid payment amount')
  const amountInPaise = Math.round(amount * 100)
  const res = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, amount: amountInPaise, currency: 'INR' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create order')
  }
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

export async function cancelCampaign(campaignId) {
  const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to cancel campaign')
  }
  return res.json()
}

export async function getCampaignStats(campaignId) {
  const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/stats`)
  if (!res.ok) throw new Error('Failed to fetch campaign stats')
  return res.json()
}

export async function triggerExpiryCheck() {
  const res = await fetch(`${API_BASE}/api/campaigns/expiry-check`)
  if (!res.ok) throw new Error('Failed to trigger expiry check')
  return res.json()
}

export async function sendNotification({ userId, type, title, message }) {
  const res = await fetch(`${API_BASE}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type, title, message }),
  })
  if (!res.ok) throw new Error('Failed to send notification')
  return res.json()
}

export async function autoAssignNewDriver(driverId) {
  const res = await fetch(`${API_BASE}/api/drivers/on-verified`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId }),
  })
  if (!res.ok) throw new Error('Failed to auto-assign driver')
  return res.json()
}

export async function autoAssignAll() {
  const res = await fetch(`${API_BASE}/api/drivers/auto-assign-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to bulk auto-assign')
  return res.json()
}

