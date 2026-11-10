export function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    // firefox ignores clicks on detached links
    document.body.appendChild(a)
    a.click()
    a.remove()
    // safari reads the url after click returns, revoking now breaks the download
    setTimeout(() => URL.revokeObjectURL(url), 40_000)
}
