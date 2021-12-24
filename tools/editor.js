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

// TODO: bug in firefox, https://bugzilla.mozilla.org/show_bug.cgi?id=1746926
function applyMark(targetColor = 'red') {
    let selection = window.getSelection()
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)

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
            } else {
                let node = range.startContainer
                let start = node.textContent.substring(0, range.startOffset)
                let selected = node.textContent.substring(range.startOffset)
                node.replaceWith(start, startSpan, selected)
            }

            // end
            if (endNode.nodeName === "RUBY") {
                endNode.after(endSpan)
            } else {
                let node = range.endContainer
                let selected = node.textContent.substring(0, range.endOffset)
                let end = node.textContent.substring(range.endOffset)
                node.replaceWith(selected, endSpan, end)
            }
        }
    }
}

// you can check parentNode.nodeName === "MARK" (this is no longer true, use currentNode.nodeName === "MARK")
// you can use nextSibling to walk from start to end, to check if any of them are "MARK"
// if neither just replace startContainer with ${start}<mark class="red">${a} and endContainer with ${b}</mark>${end}

// you can just remove (unwrap with jquery?) any MARKs you encounter while walking from start to end
// that is if neither start nor end are themselves inside a MARK

// if partially inside a MARK, move the end tag to start or vice-versa

// if inside another tag, you need to make the part that's selected in the tag MARK and then one of the tag limits MARK
// </ruby><mark class="red> for end, </mark><ruby> for start
// need to do this for both the start and end of selection

function formatParagraph() {
    let paragraphs = document.getElementsByTagName('p')
    for (let p of paragraphs) {
        p.innerHTML = p.innerHTML
            .replaceAll(/\n\s*/g, '')
            .replaceAll('<br>', '<br>\n')
    }
}

