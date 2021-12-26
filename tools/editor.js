function walkSiblings(callback = (cur) => console.log(cur)) {
    let selection = window.getSelection()
    console.log(selection)
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        console.log(range)

        // selection checking should start from an element that has <p> as its parent
        let endNode = range.endContainer
        while (endNode.parentNode.nodeName !== "P")
            endNode = endNode.parentNode

        let currentNode = range.startContainer
        while (currentNode.parentNode.nodeName !== "P")
            currentNode = currentNode.parentNode

        callback(currentNode)
        while (currentNode !== endNode) {
            if (currentNode.nextSibling) {
                currentNode = currentNode.nextSibling
                callback(currentNode)
            } else
                break
        }
    }
}

function createSelectionSpans(range) {
    if (!range) {
        range = window.getSelection().getRangeAt(0)
    }

    // TODO: bug in firefox, https://bugzilla.mozilla.org/show_bug.cgi?id=1746926
    // walk out of <rt>
    let startNode = range.startContainer
    while (startNode.parentNode.nodeName !== "P") {
        startNode = startNode.parentNode
        if (startNode.nodeName === "RUBY") break
    }

    let endNode = range.endContainer
    while (endNode.parentNode.nodeName !== "P") {
        endNode = endNode.parentNode
        if (endNode.nodeName === "RUBY") break
    }

    let startSpan = document.createElement('span')
    startSpan.id = 'start'
    let endSpan = document.createElement('span')
    endSpan.id = 'end'

    if (startNode === endNode && startNode.nodeName !== "RUBY" && endNode.nodeName !== "RUBY") {
        console.log('fast-path')
        let node = range.commonAncestorContainer
        let start = node.textContent.substring(0, range.startOffset)
        let selected = node.textContent.substring(range.startOffset, range.endOffset)
        let end = node.textContent.substring(range.endOffset)
        node.replaceWith(start, startSpan, selected, endSpan, end)
    } else {
        // start
        if (startNode.nodeName === "RUBY") {
            startNode.before(startSpan)
        } else if (range.startContainer.nodeName === "#text") {
            let node = range.startContainer
            let start = node.textContent.substring(0, range.startOffset)
            let selected = node.textContent.substring(range.startOffset)
            node.replaceWith(start, startSpan, selected)
        } else {
            console.error("can't create start span")
        }

        // end
        if (endNode.nodeName === "RUBY") {
            endNode.after(endSpan)
        } else if (range.endContainer.nodeName === "#text") {
            let node = range.endContainer
            let selected = node.textContent.substring(0, range.endOffset)
            let end = node.textContent.substring(range.endOffset)
            node.replaceWith(selected, endSpan, end)
        } else {
            console.error("can't create end span")
            startSpan.remove()
        }
    }
}

function makeChildOfP(targetSpan) {
    while (targetSpan.parentElement.nodeName !== "P") {
        let children = Array.from(targetSpan.parentElement.childNodes)
        let index = children.indexOf(targetSpan)
        let start = children.slice(0, index)
        let end = children.slice(index + 1)

        let name = targetSpan.parentElement.nodeName
        let startElement = document.createElement(name)
        startElement.className = targetSpan.parentElement.className
        startElement.append(...start)
        let endElement = document.createElement(name)
        endElement.className = targetSpan.parentElement.className
        endElement.append(...end)

        targetSpan.parentElement.replaceWith(startElement, targetSpan, endElement)
    }
}

function unwrapMarks(targetNode) {
    targetNode.childNodes.forEach((el) => {
        if (el.nodeName === "MARK")
            el.replaceWith(...el.childNodes)
        unwrapMarks(el)
    })
}

function markSelectionSpans(targetColor) {
    let startSpan = document.getElementById('start')
    let endSpan = document.getElementById('end')

    makeChildOfP(startSpan)
    makeChildOfP(endSpan)
    let children = Array.from(startSpan.parentElement.childNodes)
    let startIndex = children.indexOf(startSpan)
    let endIndex = children.indexOf(endSpan)
    let selection = children.slice(startIndex + 1, endIndex)
    let selectedElement = document.createElement('mark')
    selectedElement.className = targetColor
    selectedElement.append(...selection)
    unwrapMarks(selectedElement)
    startSpan.replaceWith(selectedElement)
    endSpan.remove()
}

function availableColors() {
    let rv = ['white']
    for (let r of document.getElementById('colorSheet').sheet.cssRules) {
        rv.push(r.selectorText.substring(1))
    }
    return rv
}

function removeWhiteMarks(){
    for (let white of document.querySelectorAll('mark.white')){
        white.replaceWith(...white.childNodes)
    }
}

function applyMark(targetColor = 'red') {
    if (!availableColors().includes(targetColor)) {
        throw new Error(`${targetColor} is not a valid css class in colors.css`)
    }
    let selection = window.getSelection()
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        createSelectionSpans(range)
        markSelectionSpans(targetColor)
        removeWhiteMarks()
        formatParagraph()
    }
    saveLyrics()
}

function saveLyrics(){
    let lyrics = document.getElementById('lyrics')
    localStorage.setItem('savedLyrics', lyrics.innerHTML)
}


document.addEventListener("DOMContentLoaded", () => {
    // fill color selector with colors from css
    let colorSelector = document.getElementById('colorSelector')
    for (let color of availableColors()) {
        let button = document.createElement('div')
        button.className = "colorButton " + color
        button.onclick = () => applyMark(color)
        colorSelector.append(button)
    }

    // download button
    let button = document.getElementById('downloadButton')
    button.onclick = () => {
        let lyrics = document.getElementById('lyrics')

        let iframe = document.createElement('iframe')
        let html = document.createElement('html')
        html.innerHTML = headHtml
        let body = document.createElement('body')
        let p = document.createElement('p')
        p.id = 'lyrics'
        p.innerHTML = lyrics.innerHTML
        body.append(p)
        html.append(body)
        iframe.append(html)

        let a = document.createElement('a')
        a.download = "lyrics.html"
        a.href = `data:text/html,${encodeURIComponent(iframe.innerHTML)}`
        a.target = "_blank"
        a.click()
        a.remove()
    }

    // fill editor with previous file
    let savedLyrics = localStorage.getItem('savedLyrics')
    if (!savedLyrics)
        return
    let lyrics = document.getElementById('lyrics')
    lyrics.innerHTML = savedLyrics
})