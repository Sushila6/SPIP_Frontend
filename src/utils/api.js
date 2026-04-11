const getToken = () => localStorage.getItem('sp_token')

export async function api(url, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    let msg = 'Something went wrong.'
    try {
      const body = await res.json()
      msg = body.message || Object.values(body)[0] || msg
    } catch { msg = `Error ${res.status}` }
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function apiBlob(url) {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.blob()
}

export const fmt = {
  currency: v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v)),
  compactCurrency: v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(Number(v)),
  date: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  datetime: v => v ? new Date(v).toLocaleString('en-IN') : '—',
}
