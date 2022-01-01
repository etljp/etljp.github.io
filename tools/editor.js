function createSelectionSpans(range) {
    if (!range) {
        range = window.getSelection().getRangeAt(0)
    }

    // TODO: bug in firefox, https://bugzilla.mozilla.org/show_bug.cgi?id=1746926
    // walk out of <rt>
    let startNode = range.startContainer
    while (startNode.nodeName !== "P" && startNode.parentNode.nodeName !== "P") {
        startNode = startNode.parentNode
        if (startNode.nodeName === "RUBY") break
    }

    let endNode = range.endContainer
    while (endNode.nodeName !== "P" && endNode.parentNode.nodeName !== "P") {
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
        } else if (range.startContainer.nodeName === "P") {
            range.insertNode(startSpan)
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
        } else if (range.endContainer.nodeName === "P") {
            let helperRange = document.createRange();
            helperRange.setStart(range.endContainer, range.endOffset)
            helperRange.insertNode(endSpan)
            helperRange.detach()
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

// TODO: method to remove italics
function unwrapMarks(targetNode) {
    targetNode.childNodes.forEach((el) => {
        if (targetNode.nodeName === "MARK" && el.nodeName === "MARK")
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
    if (
        startSpan.nextElementSibling === endSpan.previousElementSibling
        &&
        startSpan.nextElementSibling.nodeName === "MARK"
        &&
        targetColor === "italics"
    ) {
        let newMark = document.createElement('mark')
        newMark.className = startSpan.nextElementSibling.className
        let selectedElement = document.createElement('i')
        selectedElement.append(...startSpan.nextElementSibling.childNodes)
        newMark.append(selectedElement)
        startSpan.replaceWith(newMark)
        endSpan.remove()
    } else {
        let selectedElement = document.createElement('mark')
        selectedElement.className = targetColor
        selectedElement.append(...selection)
        unwrapMarks(selectedElement)
        startSpan.replaceWith(selectedElement)
        endSpan.remove()
    }

}

function availableColors() {
    let rv = ['white']
    for (let r of document.getElementById('colorSheet').sheet.cssRules) {
        rv.push(r.selectorText.substring(1))
    }
    return rv
}

function applySpecialMarks() {
    for (let white of document.querySelectorAll('mark.white')) {
        white.replaceWith(...white.childNodes)
    }
    for (let italics of document.querySelectorAll('mark.italics')) {
        let i = document.createElement('i')
        i.append(...italics.childNodes)
        italics.replaceWith(i)
    }
}

function removeItalicsIfNested(){
    for (let nested of document.querySelectorAll('i i')){
        if (nested.parentNode.children.length > 1){
            continue
        }
        nested.parentElement.replaceWith(...nested.childNodes)
    }
}

function applyMark(targetColor = 'red', checkIfValid = true) {
    if (checkIfValid && !availableColors().includes(targetColor)) {
        throw new Error(`${targetColor} is not a valid css class in colors.css`)
    }
    let selection = window.getSelection()
    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i)
        createSelectionSpans(range)
        markSelectionSpans(targetColor)
        applySpecialMarks()
        removeItalicsIfNested()
        formatParagraph()
    }
    saveLyrics()
}

function saveLyrics() {
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

        let html = document.createElement('html')
        html.innerHTML = headHtml
        let body = document.createElement('body')
        let p = document.createElement('p')
        p.id = 'lyrics'
        p.innerHTML = lyrics.innerHTML
        body.append(p)
        html.getElementsByTagName('body')[0].replaceWith(body)

        let a = document.createElement('a')
        a.download = "lyrics.html"
        a.href = `data:text/html,${encodeURIComponent(html.outerHTML)}`
        a.target = "_blank"
        a.click()
    }

    // fill editor with previous file
    let savedLyrics = localStorage.getItem('savedLyrics')
    if (!savedLyrics)
        return
    let lyrics = document.getElementById('lyrics')
    lyrics.innerHTML = savedLyrics
    formatParagraph()
    saveLyrics()

    // add event listeners
    document.getElementById('editModeButton').addEventListener('click', () => {
        let selector = document.getElementById('colorSelector')
        selector.className = selector.className === "hidden" ? "" : "hidden"
        let modeButton = document.getElementById('editModeButton')
        modeButton.className = modeButton.className === "colorButton highlighter" ? "colorButton pencil" : "colorButton highlighter"
        let lyrics = document.getElementById('lyrics')
        lyrics.className = lyrics.className === "forEditing" ? lyrics.className = "forHighlighting" : lyrics.className = "forEditing"
        window.getSelection().removeAllRanges()
    })

    // TODO: press R in highlighting mode to edit <ruby> tags

    document.addEventListener('keydown', (e) => {
        console.log(e.code)
        switch (e.code) {
            case 'KeyI':
                applyMark('italics', false)
        }
    });
})

window.addEventListener('load', () => {
    // setup dropzone
    let fileQueue = []
    /** @type {File} */
    let currentFile
    let fileName = document.getElementById('fileName')
    let hasFocusNow = document.hasFocus()
    window.addEventListener("blur", () => {
        hasFocusNow = false
    })

    let allowDrag = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = e.dataTransfer.types.includes('Files') ? 'move' : 'none';
    }

    let nextFile = () => {
        saveLyrics()
        if (fileQueue.length) {
            currentFile = fileQueue.shift()
            fileName.textContent = currentFile.name
        } else {
            filePrompt.style.opacity = '0'
            filePrompt.style.visibility = 'hidden'
            filePrompt.style.background = 'rgba(0, 0, 0, 0)'
            currentFile = null
        }
    }

    let filePrompt = document.getElementById('filePrompt')
    filePrompt.onclick = () => {
        if (!hasFocusNow) {
            hasFocusNow = document.hasFocus()
            return
        }
        nextFile()
    }

    let dropzone = document.getElementById('dropzone')
    dropzone.draggable = true
    dropzone.ondragleave = () => {
        dropzone.style.visibility = "hidden"
    }
    dropzone.ondragenter = allowDrag
    dropzone.ondragover = allowDrag
    dropzone.ondrop = (e) => {
        e.preventDefault()
        dropzone.style.visibility = "hidden"

        for (let file of e.dataTransfer.files) {
            file.text().then((data) => {
                //
            })
            fileQueue.push(file)
        }
        if (!currentFile)
            nextFile()

        filePrompt.style.opacity = '1'
        filePrompt.style.visibility = 'visible'
        filePrompt.style.background = 'rgba(0, 0, 0, 0.5)'

        hasFocusNow = document.hasFocus()
    }

    document.getElementById('replace').addEventListener('click', () => {
        currentFile.text().then((data) => {
            let lyrics = document.getElementById('lyrics')
            lyrics.innerHTML = data
            formatParagraph()
            nextFile()
        })
    })
    document.getElementById('interlace').addEventListener('click', () => {
        console.log(currentFile)
        console.log('interlace')
    })
    document.getElementById('append').addEventListener('click', () => {
        let isHtml = currentFile.name.toLowerCase().endsWith('.html')
        currentFile.text().then((data) => {
            let lyrics = document.getElementById('lyrics')
            let newString

            if (isHtml) {
                let html = (new DOMParser()).parseFromString(data, 'text/html')
                let newLyrics = html.getElementById('lyrics')
                if (!newLyrics) {
                    for (let body of html.getElementsByTagName('body')) {
                        newString = body.innerHTML
                    }
                } else {
                    newString = newLyrics.innerHTML
                }
            } else {
                newString = data
            }
            console.log(newString)
            lyrics.innerHTML = lyrics.innerHTML + "<br>" + newString
            formatParagraph()
            nextFile()
        })
    })

    window.addEventListener('dragenter', () => {
        document.getElementById('dropzone').style.visibility = "visible"
    })
})

