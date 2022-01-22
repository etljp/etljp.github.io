// TODO: implement furigana hider

function repeat(func, times) {
    func();
    times && --times && repeat(func, times);
}

function removeEmpty(targetNode = null) {
    let rv = false
    let func = (el) => {
        rv = removeEmpty(el)
        if (el.textContent.trim().length === 0 && el.childNodes.length === 0 && !["BR", "#text"].includes(el.nodeName)) {
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
    let chromeOnly = ['b', 'u', 's', 'font']
    for (let target of unwanted.concat(chromeOnly)) {
        for (let el of targetNode.querySelectorAll(target)) {
            console.log(`unwrapped unneeded elements ${el.nodeName}`)
            let br = chromeOnly.includes(target) ? document.createElement('br') : ""
            el.replaceWith(br, ...el.childNodes)
        }
    }
}

function unwrapRubyIfNoRt(targetNode) {
    for (let ruby of targetNode.getElementsByTagName('ruby')) {
        if (ruby.childNodes.length === 1 && ruby.firstChild.nodeName === "#text") {
            ruby.replaceWith(...ruby.childNodes)
        }
    }
}

function removeElementStyle(targetNode) {
    for (let element of targetNode.children) {
        element.removeAttribute('style')
        removeElementStyle(element)
    }
}

function formatLyrics() {
    console.log('applying correct format to lyrics')
    while (true) {
        let lyrics = document.getElementById('lyrics')
        let before = lyrics.innerHTML
        lyrics.innerHTML = lyrics.innerHTML
            .replaceAll('class=""', '')
            .replaceAll('\xa0', ' ')
            .replaceAll('’', "'")
            .trim()

        unwrapUnneededElements(document.getElementById('lyrics'))
        removeEmpty(document.getElementById('lyrics'))
        mergeSimilar(document.getElementById('lyrics'))
        breakBrTags(document.getElementById('lyrics'))
        unwrapRubyIfNoRt(document.getElementById('lyrics'))
        removeElementStyle(document.getElementById('lyrics'))

        for (let i of lyrics.querySelectorAll('i')) {
            if (i.textContent.startsWith(' ') && i.previousSibling.nodeName === "BR") {
                i.innerHTML = i.innerHTML.substring(1)
            }
        }

        if (before === lyrics.innerHTML)
            break
    }

    if (window.location.href.includes('/songs/')){
        let lines = []
        let temp = []
        document.getElementById('lyrics').childNodes.forEach((node) => {
            if (node.nodeName === "BR"){
                lines.push(temp)
                temp = []
            } else {
                temp.push(node)
            }
        })
        if (temp.length !== 0)
            lines.push(temp)
        for (let nodes of lines){
            if (nodes.length !== 0) {
                let range = document.createRange()
                range.setStartBefore(nodes[0])
                range.setEndAfter(nodes[nodes.length - 1])
                let allText = ""
                nodes.forEach((node) => allText += node.textContent)
                if (/[^\x00-\xFF]+/g.test(allText)){
                    let span = document.createElement('span')
                    span.className = "ja"
                    range.surroundContents(span)
                }
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", formatLyrics)
