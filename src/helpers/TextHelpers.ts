export function getTextDimension(text: string, font: string) {
    const divEl = document.createElement('div')
    divEl.style.position = 'absolute';
    divEl.style.left = '-9999px';
    divEl.style.top = '-9999px';
    divEl.style.font = font;
    
    divEl.innerText = text;
    
    document.body.appendChild(divEl)
    
    const cRect = divEl.getBoundingClientRect()
    
    document.body.removeChild(divEl)
    return {
        width: cRect.width,
        height: cRect.height
    }
}