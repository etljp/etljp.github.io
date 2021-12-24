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

    if (startNode === endNode && range.commonAncestorContainer.nodeName !== "RUBY") {
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

function applyMark(targetColor = 'red') {
    let selection = window.getSelection()
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        createSelectionSpans(range)
        markSelectionSpans(targetColor)
        formatParagraph()
    }
}
