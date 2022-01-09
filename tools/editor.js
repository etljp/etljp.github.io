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
}

function scrollToTextNode(textNode) {
    let alert = document.getElementById('alert')
    let html = document.getElementsByTagName('html')[0]
    let range = document.createRange();
    range.selectNodeContents(textNode);
    let temp = document.createElement('span')
    temp.className = "alert"
    range.insertNode(temp)
    temp.scrollIntoView({block: "center"})
    alert.style.top = (temp.offsetTop - html.scrollTop).toString() + "px"
    alert.style.left = temp.offsetLeft.toString() + "px"
    alert.style.transition = ""
    alert.style.opacity = "1"
    setTimeout(() => {
        alert.style.transition = "opacity 2s ease"
        alert.style.opacity = "0"
    }, 5)
    temp.remove()
}


function breakRuby(){
    let lyrics = document.getElementById('lyrics')
    for (let ruby of lyrics.querySelectorAll('ruby')){
        let textNode = ruby.firstChild
        if (textNode.nodeName === "#text") {
            let match = textNode.textContent.match(/(.+)\s(.+)/)
            if (match){
                let before = match[1]
                let after = match[2]
                let newRuby = document.createElement('ruby')
                newRuby.textContent = before
                textNode.textContent = after
                ruby.before(newRuby)
            }
        }
    }
}

/**
 * @param {function} errorFunction
 * @param {string} errorId
 * @param {string} errorText
 */
function addAnError(errorFunction, errorId, errorText) {
    let errors = errorFunction()
    if (errors.length > 0) {
        let anchor = document.getElementById(errorId) || document.createElement('a')
        anchor.id = errorId
        anchor.textContent = errorText
        anchor.onclick = () => scrollToTextNode(errors[0])
        document.getElementById('sanityErrors').append(anchor)
        return true
    } else {
        let anchor = document.getElementById(errorId)
        if (anchor)
            anchor.remove()
        return false
    }
}

let currentlyEditing = true

function onLyricsMutation() {
    // split ruby tags if there's whitespace in it
    breakRuby()
    // save lyrics
    console.log('saving lyrics to localStorage')
    let lyrics = document.getElementById('lyrics')
    let savedLyrics = localStorage.getItem('savedLyrics')
    if (lyrics.innerHTML !== savedLyrics) {
        localStorage.setItem('undoStep', savedLyrics)
        localStorage.setItem('savedLyrics', lyrics.innerHTML)
    }

    // check for errors
    let hasErrors = false
    let errorGenerators = [
        () => addAnError(checkMissingItalics, 'italicsError', "On a line with non-Latin characters found Latin characters not in italics!"),
        () => addAnError(
            kanjiOutsideRuby,
            'kanjiError',
            `Found a kanji that's not in a ruby tag! ${currentlyEditing ? '(Go to highlight mode and hold R to fix)' : '(Hold R to create and fill with a guess)'}`
        )
    ]
    for (let callable of errorGenerators) {
        hasErrors = callable() || hasErrors
    }

    let errorDiv = document.getElementById('sanityErrors')
    errorDiv.className = hasErrors ? "" : "hidden"
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
                .replaceAll('\xa0', ' ') // replace non-breaking spaces with breaking ones
        body.append(p)
        html.getElementsByTagName('body')[0].replaceWith(body)

        let a = document.createElement('a')
        a.download = "lyrics.html"
        a.href = `data:text/html,${encodeURIComponent(html.outerHTML)}`
        a.target = "_blank"
        a.click()
        console.log('downloaded lyrics')
    }
    
    // edit mode button
    document.getElementById('editModeButton').onclick = () => {
        currentlyEditing = !currentlyEditing

        let selector = document.getElementById('colorSelector')
        selector.className = selector.className === "hidden" ? "" : "hidden"
        let modeButton = document.getElementById('editModeButton')
        modeButton.className = modeButton.className === "colorButton highlighter" ? "colorButton pencil" : "colorButton highlighter"
        let lyrics = document.getElementById('lyrics')
        lyrics.contentEditable = currentlyEditing.toString()
        window.getSelection().removeAllRanges()
        formatLyrics()
    }

    // fill editor with previous file
    let savedLyrics = localStorage.getItem('savedLyrics')
    if (!savedLyrics)
        return
    let lyrics = document.getElementById('lyrics')
    lyrics.innerHTML = savedLyrics
    formatLyrics()

    let saveID
    let timeoutHelper = () => {
        if (saveID) {
            clearTimeout(saveID)
        }
        saveID = setTimeout(() => {
            onLyricsMutation()
            console.log('autosaved')
            saveID = null
        }, 1000)
    }

    // add mutation observer for saving and sanity checks
    const observer = new MutationObserver(timeoutHelper)
    lyrics.oninput = timeoutHelper
    observer.observe(lyrics, {attributes: true, childList: true, subtree: true})
    onLyricsMutation()

    // add event listeners
    let holdingR = false
    document.onkeyup = (e) => {
        switch (e.code) {
            case 'KeyR':
                holdingR = false
                break
        }
    }

    document.onkeydown = (e) => {
        // TODO: convert romaji in <rt> to hiragana
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
                        let previousLyrics = localStorage.getItem('undoStep')
                        if (!previousLyrics)
                            return
                        let lyrics = document.getElementById('lyrics')
                        lyrics.innerHTML = previousLyrics
                        setTimeout(() => {
                            clearTimeout(saveID)
                            onLyricsMutation()
                        }, 5)
                    }
                }
                break
            case 'KeyR':
                if (holdingR || currentlyEditing)
                    break
                holdingR = true

                let nodesThatNeedRubyTags = []
                let fillTheArray = () => {
                    for (let textNode of [...document.getElementById('lyrics').childNodes].filter(n => n.nodeName === "#text")) {
                        if (/\p{Ideographic}/u.test(textNode.textContent)) {
                            nodesThatNeedRubyTags.push(textNode)
                        }
                    }
                }

                (async () => {
                    fillTheArray()
                    let amountBefore = nodesThatNeedRubyTags.length
                    while (holdingR && nodesThatNeedRubyTags.length > 0) {
                        let textNode = nodesThatNeedRubyTags.shift()
                        let match = textNode.textContent.match(/(\P{Ideographic}*)(\p{Ideographic}+)(.*)/u)
                        let kanji = match[2]
                        let afterText = match[3]
                        let rubyTag = document.createElement('ruby')
                        let rtTag = document.createElement('rt')
                        let response = await fetch(`https://kanjiapi.dev/v1/words/${kanji[0]}`)
                        if (!response.ok)
                            return
                        let data = await response.json()

                        let matches = []
                        // match compound words (like 未来宇宙)
                        let searchAmount = kanji.length + 1
                        let reKanji = kanji
                        while (matches.length === 0) {
                            searchAmount--
                            reKanji = kanji.substr(0, searchAmount)
                            if (!reKanji)
                                break
                            let re = new RegExp(`^${reKanji}\\P{Ideographic}*$`, 'u')
                            matches = data.filter(el => el["variants"][0]["written"].match(re))
                        }

                        if (!reKanji)
                            continue
                        rubyTag.innerHTML = reKanji
                        if (kanji.length !== searchAmount)
                            afterText = kanji.substr(-(kanji.length - searchAmount)) + afterText

                        let getPriorities = (el) => el["variants"][0]["priorities"].length
                        let candidate = matches.sort((el1, el2) => {
                            return getPriorities(el2) - getPriorities(el1)
                        })[0]["variants"][0]
                        let writing = candidate["written"]
                        let pronunciation = candidate["pronounced"]
                        while (writing.slice(-1) === pronunciation.slice(-1)) {
                            writing = writing.substr(0, writing.length - 1)
                            pronunciation = pronunciation.substr(0, pronunciation.length - 1)
                        }
                        rtTag.innerHTML = pronunciation
                        rubyTag.append(rtTag)
                        textNode.replaceWith(match[1], rubyTag, afterText)
                        rubyTag.scrollIntoView({block: "center"})
                        if (nodesThatNeedRubyTags.length === 0) {
                            fillTheArray()
                            if (amountBefore === nodesThatNeedRubyTags.length){
                                return
                            }
                            amountBefore = nodesThatNeedRubyTags.length
                        }
                    }
                })()
                break
        }
    }
})

window.addEventListener('load', () => {
    // setup dropzone
    let fileQueue = []
    /** @type {File} */
    let currentFile
    let fileName = document.getElementById('fileName')
    let hasFocusNow = document.hasFocus()
    window.onblur = () => {
        hasFocusNow = false
    }

    let allowDrag = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = e.dataTransfer.types.includes('Files') ? 'move' : 'none';
    }

    let nextFile = () => {
        formatLyrics()
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
            if (newLyrics) {
                rv = newLyrics.innerHTML
            } else {
                for (let body of html.getElementsByTagName('body')) {
                    rv = body.innerHTML
                }
            }
        } else {
            rv = fileData.replaceAll("\n","<br>")
        }

        return rv
    }

    document.getElementById('replace').addEventListener('click', () => {
        let isHtml = currentFile.name.toLowerCase().endsWith('.html')
        currentFile.text().then((data) => {
            let lyrics = document.getElementById('lyrics')
            lyrics.innerHTML = getFileContent(data, isHtml)
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
            let newLines = newString.split('<br>')
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

            nextFile()
        })
    })
    document.getElementById('append').addEventListener('click', () => {
        let isHtml = currentFile.name.toLowerCase().endsWith('.html')
        currentFile.text().then((data) => {
            let lyrics = document.getElementById('lyrics')
            let newString = getFileContent(data, isHtml)

            lyrics.innerHTML = lyrics.innerHTML + "<br>" + newString
            nextFile()
        })
    })

    window.addEventListener('dragenter', () => {
        document.getElementById('dropzone').style.visibility = "visible"
    })
})

