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
      // Call the confirm-payment Edge Function which uses the Supabase service
      // role key to update status = 'paid', bypassing any RLS policy gaps.
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              campaignId,
              razorpay_payment_id: response.razorpay_payment_id,
            }),
          }
        )

        const result = await res.json()

        if (!res.ok || result.error) {
          const msg = result.error || 'Could not update campaign status.'
          console.error('confirm-payment failed:', msg)
          if (onFailure) onFailure(`Payment was successful (ID: ${response.razorpay_payment_id}) but we could not update your campaign. Please contact support.`)
          return
        }
      } catch (err) {
        console.error('confirm-payment network error:', err)
        if (onFailure) onFailure(`Payment was successful (ID: ${response.razorpay_payment_id}) but we could not reach the server. Please contact support.`)
        return
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
