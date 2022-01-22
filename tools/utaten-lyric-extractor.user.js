// ==UserScript==
// @name         Extract lyrics from utaten
// @version      0.2.1
// @author       LittleEndu
// @updateURL    https://etljp.github.io/tools/utaten-lyric-extractor.user.js
// @match        https://utaten.com/lyric/*
// @grant        none
// ==/UserScript==
// noinspection DuplicatedCode

(() => {
    let div = document.createElement('div')
    div.innerHTML = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="file-lines" class="svg-inline--fa fa-file-lines" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width:100%;height: 100%"><path fill="currentColor" d="M256 0v128h128L256 0zM224 128L224 0H48C21.49 0 0 21.49 0 48v416C0 490.5 21.49 512 48 512h288c26.51 0 48-21.49 48-48V160h-127.1C238.3 160 224 145.7 224 128zM272 416h-160C103.2 416 96 408.8 96 400C96 391.2 103.2 384 112 384h160c8.836 0 16 7.162 16 16C288 408.8 280.8 416 272 416zM272 352h-160C103.2 352 96 344.8 96 336C96 327.2 103.2 320 112 320h160c8.836 0 16 7.162 16 16C288 344.8 280.8 352 272 352zM288 272C288 280.8 280.8 288 272 288h-160C103.2 288 96 280.8 96 272C96 263.2 103.2 256 112 256h160C280.8 256 288 263.2 288 272z"></path></svg>`
    div.style.position = "fixed"
    div.style.bottom = "1em"
    div.style.left = "1em"
    div.style.width = "4em"
    div.style.height = "4em"
    div.style.userSelect = "none"
    div.onclick = () => {
        // get lyrics
        let container = document.createElement('div')
        for (let hiragana of document.getElementsByClassName('hiragana')) {
            container.innerHTML = hiragana.innerHTML
        }
        for (let ruby of container.querySelectorAll('span.ruby')) {
            let newRuby = document.createElement('ruby')
            newRuby.innerHTML = ruby.innerHTML
            ruby.replaceWith(newRuby)
        }
        for (let rb of container.querySelectorAll('span.rb')) {
            rb.replaceWith(rb.innerHTML)
        }
        for (let rt of container.querySelectorAll('span.rt')) {
            let newRt = document.createElement('rt')
            newRt.innerHTML = rt.innerHTML
            rt.replaceWith(newRt)
        }

        let captureReplace = (content) => {
            let groups = content.match(/([^[\x20-\x2F\x3A-\xFF\s]*)([\x20-\x2F\x3A-\xFF\s]+)(.*)/)
            if (groups && groups[2].trim().length > 0) {
                let firstHTML = groups[1]
                let secondHTML = `<i>${groups[2].trim()}</i>`
                let thirdHTML = captureReplace(groups[3])
                return firstHTML + ' ' + secondHTML + ' ' + thirdHTML
            } else {
                return content
            }
        }

        for (let textNode of [...container.childNodes].filter(n => n.nodeName === "#text")) {
            let content = textNode.textContent.trim()
            let capturedContent = captureReplace(content)
            if (content !== capturedContent) {
                let tempEl = document.createElement('span')
                tempEl.innerHTML = capturedContent
                textNode.replaceWith(...tempEl.childNodes)
            }
        }

        // save lyrics
        let html = document.createElement('html')
        let body = document.createElement('body')
        let p = document.createElement('p')
        p.id = 'lyrics'
        p.innerHTML = container.innerHTML
        body.append(p)
        html.append(body)

        let a = document.createElement('a')
        a.download = `${window.location.href.split('/')[4]}.html`
        a.href = `data:text/html,${encodeURIComponent(html.outerHTML)}`
        a.target = "_blank"
        a.click()
    }

    document.getElementById('container').append(div)
    document.getElementById('JP_uta_pc_lyric_footeroverlay').remove()
})()
