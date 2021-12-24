function testCopy() {
    let selection = window.getSelection()
    console.log(selection)
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        console.log(range)
        console.log(range.startContainer === range.endContainer)
        console.log('---')
    }
}

function markRed() {
    let selection = window.getSelection()
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        if (range.startContainer === range.endContainer) {
            if (range.commonAncestorContainer.nodeName === "#text") {
                console.log(range.commonAncestorContainer)
                let $node = $(range.commonAncestorContainer)
                let start = $node.text().substring(0, range.startOffset)
                let selected = $node.text().substring(range.startOffset, range.endOffset)
                let end = $node.text().substring(range.endOffset)
                $node.replaceWith(`${start}<mark class="red">${selected}</mark>${end}`)
            }
        }
    }
}

function walkSiblings() {
    let hadMarkTag = false
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

        console.log(currentNode)
        while (currentNode !== endNode) { // && currentNode.firstChild !== endNode) {
            if (currentNode.nextSibling) { // TODO: bug in firefox, https://bugzilla.mozilla.org/show_bug.cgi?id=1746926
                currentNode = currentNode.nextSibling
                console.log(currentNode)
            } else
                break
            if (currentNode.nodeName === "MARK")
                hadMarkTag = true
        }
    }
    return hadMarkTag
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

