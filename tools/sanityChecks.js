function checkMissingItalics() {
    let rv = []
    let lyrics = document.getElementById('lyrics')
    if (lyrics) {
        for (let textNode of [...lyrics.childNodes].filter(n => n.nodeName === "#text")) {
            let hasI = false
            let currentParent = textNode.parentElement
            while (currentParent.nodeName !== "P") {
                if (currentParent.nodeName === "I") {
                    hasI = true
                    break
                }
                currentParent = currentParent.parentElement
            }
            if (hasI) continue
            // textNode is outside any <i> tags

            let content = textNode.textContent.trim()
            let groups = content.match(/([^\x00-\xFF]*)([\x41-\xFF\s]+)([^\x00-\xFF]*)/)
            if (!groups)
                continue
            if (groups[1].trim().length > 0 || groups[3].trim().length > 0) {
                // there's non-ascii text
                if (groups[2].trim().length > 0) {
                    // there's ascii text
                    rv.push(textNode)
                }
            }
        }
    }
    return rv
}

function kanjiOutsideRuby() {
    let rv = []
    let lyrics = document.getElementById('lyrics')
    if (lyrics) {
        for (let textNode of [...lyrics.childNodes].filter(n => n.nodeName === "#text")) {
            let content = textNode.textContent.trim()
            if (/\p{Ideographic}/u.test(content)){
                let hasRuby = false
                let currentParent = textNode.parentElement
                while (currentParent.nodeName !== "P") {
                    if (currentParent.nodeName === "RUBY") {
                        hasRuby = true
                        break
                    }
                    currentParent = currentParent.parentElement
                }
                if (hasRuby) continue
                rv.push(textNode)
            }
        }
    }
    return rv
}