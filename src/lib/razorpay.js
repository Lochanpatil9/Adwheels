import { supabase } from './supabase'

// Load Razorpay checkout script dynamically
function loadScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Open Razorpay checkout for a campaign payment.
 *
 * @param {object} opts
 * @param {number}   opts.amount       Plan price in INR (will be converted to paise)
 * @param {string}   opts.campaignId   Campaign UUID to update on success
 * @param {string}   opts.planName     Display name for the plan
 * @param {object}   opts.profile      User profile (full_name, phone, etc.)
 * @param {function} opts.onSuccess    Called with (razorpayResponse) after successful payment
 * @param {function} opts.onFailure    Called with (errorMessage) on failure or dismissal
 */
export async function openRazorpayCheckout({ amount, campaignId, planName, profile, onSuccess, onFailure }) {
  const loaded = await loadScript()
  if (!loaded) {
    if (onFailure) onFailure('Failed to load payment gateway. Please check your internet connection.')
    return
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: amount * 100, // Razorpay expects paise
    currency: 'INR',
    name: 'AdWheels',
    description: `${planName} Campaign — 1 month`,
    handler: async function (response) {
      // Step 1: mark the campaign as paid
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'paid' })
        .eq('id', campaignId)

      if (updateError) {
        console.error('Failed to mark campaign as paid:', updateError.message)
        if (onFailure) onFailure(`Payment was successful (ID: ${response.razorpay_payment_id}) but we could not update your campaign. Please contact support.`)
        return
      }

      // Step 2: auto-assign available drivers to this campaign
      const { error: rpcError } = await supabase
        .rpc('auto_assign_drivers', { campaign_id: campaignId })

      if (rpcError) {
        // Non-fatal: drivers can still be assigned manually by admin
        console.warn('auto_assign_drivers RPC error:', rpcError.message)
      }

      if (onSuccess) onSuccess(response)
    },
    prefill: {
      name: profile?.full_name || '',
      contact: profile?.phone || '',
    },
    notes: {
      campaign_id: campaignId,
    },
    theme: {
      color: '#FFD000',
    },
    modal: {
      ondismiss: function () {
        if (onFailure) onFailure('Payment cancelled.')
      },
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', function (response) {
    if (onFailure) onFailure(response.error?.description || 'Payment failed.')
  })
  rzp.open()
}
