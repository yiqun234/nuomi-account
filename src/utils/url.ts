export function handleInitialURLParameters(): void {
  const params = new URLSearchParams(window.location.search)

  const callback = params.get('callback')
  if (callback) {
    // We use sessionStorage because this is a short-lived, one-time use value
    // that shouldn't persist across browser tabs/windows.
    sessionStorage.setItem('authCallback', callback)
  }

  const logoutCallback = params.get('callback')
  if (logoutCallback) {
    // Handle logout callback URL parameter
    sessionStorage.setItem('logoutCallback', logoutCallback)
  }

  // The 'lang' parameter will be handled automatically by i18next-browser-languagedetector,
  // so we don't need to handle it manually here.
} 