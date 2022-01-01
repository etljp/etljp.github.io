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
    if (rv){
        console.log('removed empty elements')
    }
    return rv
}

function mergeSimilar(targetNode) {
    let rv = false
    if (!targetNode) return
    if (targetNode.nodeName === "#text") return
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

    if (rv){
        console.log('merged similar elements')
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
        let content = targetNode.innerHTML.replaceAll("<br>", endTag + "<br>" + startTag)
        targetNode.outerHTML = startTag + content + endTag
    }
    if (rv){
        console.log('broke up <br> tags')
    }
    return rv
}

function formatParagraph() {
    console.log('applying correct format to lyrics')
    while (true) {
        let p = document.getElementById('lyrics')
        p.innerHTML = p.innerHTML
            .replaceAll('class=""', '')
            .replaceAll(/\n\s*/g, ' ') // get rid of new lines, replacing them with just whitespace
            .replaceAll('<br><br>','<br>') // remove all duplicated <br> tags
            .replaceAll('<br>', '<br>\n') // only add new lines to where <br> tags are
            .replaceAll(/\n\s/g, '\n') // remove whitespace from start of lines
            .trim() // from start of very first line too
        if (
            removeEmpty(document.getElementById('lyrics'))
            ||
            mergeSimilar(document.getElementById('lyrics'))
            ||
            breakBrTags(document.getElementById('lyrics'))
        ) continue

        break
    }
}

document.addEventListener("DOMContentLoaded", formatParagraph)