const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

export const MOD = isMac ? '⌘' : 'Ctrl'
export const SHIFT = isMac ? '⇧' : 'Shift'

// ⌘⇧] on mac, Ctrl+Shift+] elsewhere
export const formatKeys = (keys: string[]) => keys.join(isMac ? '' : '+')
