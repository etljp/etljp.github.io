// TODO: implement furigana hider

function repeat(func, times) {
    func();
    times && --times && repeat(func, times);
}

function removeEmpty(targetNode = null) {
    let rv = false
    let func = (el) => {
        rv = removeEmpty(el)
        if (el.textContent.trim().length === 0 && el.childNodes.length === 0 && el.nodeName !== "BR") {
            el.remove()
            rv = true
        }
    }

    if (targetNode.children)
        for (let el of targetNode.children) {
            func(el)
        }
    for (let el of targetNode.childNodes) {
        func(el)
    }

    if (rv) {
        console.log('removed empty elements')
    }
    return rv
}

function mergeSimilar(targetNode) {
    let rv = false
    if (!targetNode) return
    if (targetNode.nodeName === "#text") return
    if (targetNode.nodeName === "BR") return
    if (targetNode.nodeName === "RUBY") return // special case anyway so should be fine

    if (targetNode.nodeName === targetNode.parentNode.nodeName) {
        targetNode.replaceWith(...targetNode.childNodes)
        return true
    }

    // @formatter:off
    while (
        targetNode.nextSibling
        &&
        targetNode.nodeName === targetNode.nextSibling.nodeName
        &&
        targetNode.className === targetNode.nextSibling.className
    ) {
        targetNode.append(...targetNode.nextSibling.childNodes)
        targetNode.nextSibling.remove()
        rv = true
    }
    // @formatter:on


    for (let c of targetNode.children) {
        rv = mergeSimilar(c) || rv
    }

    if (rv) {
        console.log(`merged similar elements ${targetNode.nodeName}`)
    }
    return rv
}

function breakBrTags(targetNode) {
    let rv = false
    if (targetNode.nodeName === "P") {
        for (let child of targetNode.children) {
            rv = breakBrTags(child) || rv
        }
        return rv
    }
    if (targetNode.getElementsByTagName('br').length > 0) {
        let classProp = targetNode.className ? `class="${targetNode.className}"` : ''
        let startTag = `<${targetNode.nodeName.toLowerCase()} ${classProp}>`
        let endTag = `</${targetNode.nodeName.toLowerCase()}>`
        let content = targetNode.innerHTML.replaceAll("<br>", endTag + "<br>\n" + startTag)
        targetNode.outerHTML = startTag + content + endTag
    }
    if (rv) {
        console.log('broke up <br> tags')
    }
    return rv
}

function unwrapUnneededElements(targetNode) {
    let unwanted = ['div', 'span']
    let chromeOnly = ['b', 'u', 's']
    for (let target of unwanted.concat(chromeOnly)) {
        for (let el of targetNode.querySelectorAll(target)) {
            console.log(`unwrapped unneeded elements ${el.nodeName}`)
            let br = chromeOnly.includes(target) ? document.createElement('br') : ""
            el.replaceWith(br, ...el.childNodes)
        }
    }
}

function formatParagraph() {
    console.log('applying correct format to lyrics')
    while (true) {
        let p = document.getElementById('lyrics')
        let before = p.innerHTML
        p.innerHTML = p.innerHTML
            .replaceAll('class=""', '')
            .replaceAll(/\n\s*/g, ' ') // get rid of new lines, replacing them with just whitespace
            .replaceAll('<br><br><br>', '<br><br>')
            .replaceAll('<br>', '<br>\n') // only add new lines to where <br> tags are
            .replaceAll(/\n\s/g, '\n') // remove whitespace from start of lines
            .trim() // from start of very first line too

        unwrapUnneededElements(document.getElementById('lyrics'))
        removeEmpty(document.getElementById('lyrics'))
        mergeSimilar(document.getElementById('lyrics'))
        breakBrTags(document.getElementById('lyrics'))

        if (before === p.innerHTML)
            break
    }
}

document.addEventListener("DOMContentLoaded", formatParagraph)