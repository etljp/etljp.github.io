// TODO: implement furigana hider

function repeat(func, times) {
    func();
    times && --times && repeat(func, times);
}

function removeEmpty(targetNode = null) {
    let rv = false
    targetNode.childNodes.forEach((el) => {
        rv = removeEmpty(el)
        if (el.textContent === "" && el.childNodes.length === 0 && el.nodeName !== "BR") {
            el.remove()
            rv = true
        }
    })
    return rv
}

function mergeSimilar(targetNode) {
    let rv = false
    if (!targetNode) return
    if (targetNode.nodeName === "#text") return;
    if (targetNode.nodeName === "RUBY") return; // special case anyway so should be fine

    while (targetNode.nextSibling
    && targetNode.nodeName === targetNode.nextSibling.nodeName
    && targetNode.className === targetNode.nextSibling.className) {
        targetNode.append(...targetNode.nextSibling.childNodes)
        targetNode.nextSibling.remove()
        rv = true
    }


    for (let c of targetNode.children) {
        rv = mergeSimilar(c) || rv
    }
    return rv
}

function formatParagraph() {
    while (true) {
        let p = document.getElementById('lyrics')
        p.innerHTML = p.innerHTML
            .replaceAll(/\n\s*/g, '')
            .replaceAll('<br>', '<br>\n')
        if (
            removeEmpty(document.getElementById('lyrics')) ||
            mergeSimilar(document.getElementById('lyrics'))
        ) continue

        break
    }
}

document.addEventListener("DOMContentLoaded", formatParagraph)