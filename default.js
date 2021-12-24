// TODO: implement furigana hider

function repeat(func, times) {
    func();
    times && --times && repeat(func, times);
}

function removeEmpty(targetNode = null) {
    targetNode.childNodes.forEach((el) => {
        removeEmpty(el)
        if (el.textContent === "" && el.childNodes.length === 0 && el.nodeName !== "BR") {
            el.remove()
        }
    })
}

function mergeSimilar(targetNode) {
    if (!targetNode) return
    if (targetNode.nodeName === "#text") return;


    while (targetNode.nextSibling
    && targetNode.nodeName === targetNode.nextSibling.nodeName
    && targetNode.className === targetNode.nextSibling.className) {
        targetNode.append(...targetNode.nextSibling.childNodes)
        targetNode.nextSibling.remove()
    }


    for (let c of targetNode.children) {
        mergeSimilar(c)
    }
}

function formatParagraph() {
    repeat(() => {
        let p = document.getElementById('lyrics')
        p.innerHTML = p.innerHTML
            .replaceAll(/\n\s*/g, '')
            .replaceAll('<br>', '<br>\n')
        removeEmpty(document.getElementById('lyrics'))
        mergeSimilar(document.getElementById('lyrics'))
    }, 2)
}

document.addEventListener("DOMContentLoaded", formatParagraph)