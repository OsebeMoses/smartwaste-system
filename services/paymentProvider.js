/*
  Provider-agnostic payment/voucher client.
  Uses environment variables:
    - PAYMENT_API_URL
    - PAYMENT_API_KEY
    - PAYMENT_PROVIDER (optional label)
  Exposes redeem(payload) which returns { success, code, data }.
*/

let fetchFn = global.fetch;
try {
  if (!fetchFn) {
    // Optional dependency; only used if available
    // eslint-disable-next-line import/no-extraneous-dependencies
    fetchFn = require('node-fetch');
  }
} catch (_) {
  fetchFn = null;
}

function getConfig() {
  const { PAYMENT_API_URL, PAYMENT_API_KEY, PAYMENT_PROVIDER } = process.env;
  if (!PAYMENT_API_URL || !PAYMENT_API_KEY) {
    return null; // not configured
  }
  return { url: PAYMENT_API_URL, key: PAYMENT_API_KEY, provider: PAYMENT_PROVIDER || 'generic' };
}

async function redeem({ userId, reward, user }) {
  const cfg = getConfig();
  if (!cfg) {
    return { success: false, code: 'NOT_CONFIGURED', data: null };
  }

  if (!fetchFn) {
    return { success: false, code: 'FETCH_UNAVAILABLE', data: null };
  }

  try {
    const resp = await fetchFn(cfg.url + '/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.key}`
      },
      body: JSON.stringify({
        provider: cfg.provider,
        user: { id: userId, email: user?.email, phone: user?.phone, tier: user?.tier },
        reward: { id: String(reward._id), name: reward.name, points: reward.points, category: reward.category }
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, code: `HTTP_${resp.status}`, data: text };
    }

    const data = await resp.json();
    return { success: true, code: 'OK', data };
  } catch (err) {
    return { success: false, code: 'NETWORK_ERROR', data: err.message };
  }
}

module.exports = { redeem, getConfig };
