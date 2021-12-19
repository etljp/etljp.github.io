function testCopy() {
    let selection = window.getSelection()
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        console.log(range)
        console.log(range.startContainer ===  range.endContainer)
        console.log('---')
    }
    return null
}

function markRed(){
    let selection = window.getSelection()
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        if (range.startContainer ===  range.endContainer){
            if (range.commonAncestorContainer instanceof Text) {
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