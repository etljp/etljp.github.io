function createSelectionSpans(range) {
    if (!range) {
        range = window.getSelection().getRangeAt(0)
    }

    // walk out of <rt>
    let startNode = range.startContainer
    while (startNode.nodeName !== "P" && startNode.parentNode.nodeName !== "P") {
        console.log('walking start out of rt')
        startNode = startNode.parentNode
        if (startNode.nodeName === "RUBY") break
    }

    let endNode = range.endContainer
    while (endNode.nodeName !== "P" && endNode.parentNode.nodeName !== "P") {
        console.log('walking end out of rt')
        endNode = endNode.parentNode
        if (endNode.nodeName === "RUBY") break
    }

    let startSpan = document.createElement('span')
    startSpan.id = 'start'
    let endSpan = document.createElement('span')
    endSpan.id = 'end'


    // start
    if (startNode.nodeName === "RUBY") {
        console.log('start: ruby path')
        startNode.before(startSpan)
    } else {
        range.insertNode(startSpan)
    }

    // end
    if (endNode.nodeName === "RUBY") {
        console.log('end: ruby path')
        if (range.endOffset === 0) {
            endNode.before(endSpan)
        } else {
            endNode.after(endSpan)
        }
    } else {
        let helperRange = document.createRange();
        helperRange.setStart(range.endContainer, range.endOffset)
        helperRange.insertNode(endSpan)
        helperRange.detach()
    }

}

function makeChildOfP(targetSpan) {
    while (targetSpan.parentElement.nodeName !== "P") {
        console.log("target span isn't child of lyrics yet")
        let children = Array.from(targetSpan.parentElement.childNodes)
        let index = children.indexOf(targetSpan)
        let start = children.slice(0, index)
        let end = children.slice(index + 1)

        // get span's parent element, manually make two clones containing parent's content before and after the span
        let name = targetSpan.parentElement.nodeName
        let startElement = document.createElement(name)
        startElement.className = targetSpan.parentElement.className
        startElement.append(...start)
        let endElement = document.createElement(name)
        endElement.className = targetSpan.parentElement.className
        endElement.append(...end)

        // replace parent with clones
        targetSpan.parentElement.replaceWith(startElement, targetSpan, endElement)
    }
    console.log('target span is child of lyrics (now)')
}

function unwrapMarks(targetNode) {
    for (let nested of targetNode.querySelectorAll('mark mark')) {
        nested.replaceWith(...nested.childNodes)
        console.log('un-nested a mark')
    }
}

/**
 * @description adds a <mark> element between start and end <span>s
 */
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
        // we are adding italics inside a mark tag
        // make sure we don't lose highlighting
        console.log('making italics inside a mark')
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
        console.log('applied whiteout')
    }
    for (let italics of document.querySelectorAll('mark.italics')) {
        let i = document.createElement('i')
        i.append(...italics.childNodes)
        italics.replaceWith(i)
        console.log('applied italics')
    }
}

function removeItalicsIfNested() {
    for (let nested of document.querySelectorAll('i i')) {
        let theParentI = nested.parentElement
        while (theParentI && theParentI.nodeName !== "I") {
            theParentI = theParentI.parentElement
        }
        if (!theParentI)
            continue
        for (let childI of theParentI.querySelectorAll('i')) {
            childI.replaceWith(...childI.childNodes)
        }
        theParentI.replaceWith(...theParentI.childNodes)
        console.log('found and removed nested italics')
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
        formatLyrics()
    }
    saveLyrics()
}

function saveLyrics() {
    console.log('saving lyrics to localStorage')
    let lyrics = document.getElementById('lyrics')
    localStorage.setItem('undoStep', localStorage.getItem('savedLyrics'))
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
        formatLyrics()
        let lyrics = document.getElementById('lyrics')

        let html = document.createElement('html')
        html.innerHTML = headHtml
        let body = document.createElement('body')
        let p = document.createElement('p')
        p.id = 'lyrics'
        p.innerHTML = '\n' +
            lyrics.innerHTML
                .replaceAll(/\n\s*/g, ' ') // get rid of new lines, replacing them with just whitespace
                .replaceAll('<br>', '<br>\n') // only add new lines to where <br> tags are
                .replaceAll(/\n\s/g, '\n') // remove whitespace from start of lines
                .replaceAll(' <br>', '<br>') // remove whitespace from end of lines
        body.append(p)
        html.getElementsByTagName('body')[0].replaceWith(body)

        let a = document.createElement('a')
        a.download = "lyrics.html"
        a.href = `data:text/html,${encodeURIComponent(html.outerHTML)}`
        a.target = "_blank"
        a.click()
        console.log('downloaded lyrics')
    }

    // fill editor with previous file
    let savedLyrics = localStorage.getItem('savedLyrics')
    if (!savedLyrics)
        return
    let lyrics = document.getElementById('lyrics')
    lyrics.innerHTML = savedLyrics
    formatLyrics()
    saveLyrics()

    let saveID
    let timeoutHelper = () => {
        if (saveID) {
            clearTimeout(saveID)
        }
        saveID = setTimeout(() => {
            saveLyrics()
            console.log('autosaved')
            saveID = null
        }, 2000)
    }

    // add event listeners
    lyrics.addEventListener('input', () => {
        timeoutHelper()
    })

    let currentlyEditing = true
    document.getElementById('editModeButton').addEventListener('click', () => {
        currentlyEditing = !currentlyEditing

        let selector = document.getElementById('colorSelector')
        selector.className = selector.className === "hidden" ? "" : "hidden"
        let modeButton = document.getElementById('editModeButton')
        modeButton.className = modeButton.className === "colorButton highlighter" ? "colorButton pencil" : "colorButton highlighter"
        let lyrics = document.getElementById('lyrics')
        lyrics.contentEditable = currentlyEditing.toString()
        window.getSelection().removeAllRanges()
        formatLyrics()
    })

    // TODO: press R in highlighting mode to edit <ruby> tags

    document.addEventListener('keydown', (e) => {
        if (saveID) {
            timeoutHelper()
        }
        switch (e.code) {
            case 'KeyI':
                if (!currentlyEditing) {
                    // chrome can do it anyway, this is for firefox which doesn't have ctrl+i
                    applyMark('italics', false)
                }
                break
            case 'KeyZ':
                if (!currentlyEditing) {
                    if (e.ctrlKey) {
                        console.log("undo")
                        let savedLyrics = localStorage.getItem('undoStep')
                        if (!savedLyrics)
                            return
                        let lyrics = document.getElementById('lyrics')
                        lyrics.innerHTML = savedLyrics
                        localStorage.setItem('undoStep', localStorage.getItem('savedLyrics'))
                        saveLyrics()
                    }
                }
                break
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

        fileQueue.push(...e.dataTransfer.files)
        if (!currentFile)
            nextFile()

        filePrompt.style.opacity = '1'
        filePrompt.style.visibility = 'visible'
        filePrompt.style.background = 'rgba(0, 0, 0, 0.5)'

        hasFocusNow = document.hasFocus()
    }

    let getFileContent = (fileData, isHtml) => {
        let rv

        if (isHtml) {
            let html = (new DOMParser()).parseFromString(fileData, 'text/html')
            let newLyrics = html.getElementById('lyrics')
            if (!newLyrics) {
                for (let body of html.getElementsByTagName('body')) {
                    rv = body.innerHTML
                }
            } else {
                rv = newLyrics.innerHTML
            }
        } else {
            rv = fileData
        }

        return rv
    }

    document.getElementById('replace').addEventListener('click', () => {
        let isHtml = currentFile.name.toLowerCase().endsWith('.html')
        currentFile.text().then((data) => {
            let lyrics = document.getElementById('lyrics')
            lyrics.innerHTML = getFileContent(data, isHtml)
            formatLyrics()
            nextFile()
        })
    })
    document.getElementById('interlace').addEventListener('click', () => {
        let isHtml = currentFile.name.toLowerCase().endsWith('.html')
        currentFile.text().then((data) => {
            let lyrics = document.getElementById('lyrics')
            let oldString = lyrics.innerHTML
            let newString = getFileContent(data, isHtml)
            let oldLines = oldString.split('<br>')
            let newLines = newString.split(isHtml ? '<br>' : '\n')
            let oldTotal = oldLines.length
            let newTotal = newLines.length
            let interlacedLines = [oldLines.shift()]

            while (oldLines.length > 0 || newLines.length > 0) {
                if (oldLines.length / oldTotal >= newLines.length / newTotal) {
                    interlacedLines.push(oldLines.shift())
                } else {
                    interlacedLines.push(newLines.shift())
                }
            }

            lyrics.innerHTML = interlacedLines.join('<br>')

            formatLyrics()
            nextFile()
        })
    })
    document.getElementById('append').addEventListener('click', () => {
        let isHtml = currentFile.name.toLowerCase().endsWith('.html')
        currentFile.text().then((data) => {
            let lyrics = document.getElementById('lyrics')
            let newString = getFileContent(data, isHtml)

            lyrics.innerHTML = lyrics.innerHTML + "<br>" + newString
            formatLyrics()
            nextFile()
        })
    })

    window.addEventListener('dragenter', () => {
        document.getElementById('dropzone').style.visibility = "visible"
    })
})

