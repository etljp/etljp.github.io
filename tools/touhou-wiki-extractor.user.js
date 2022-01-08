// ==UserScript==
// @name         Extract lyrics from touhou wiki
// @version      0.1
// @author       LittleEndu
// @updateURL    https://etljp.github.io/tools/touhou-wiki-extractor.user.js
// @match        https://en.touhouwiki.net/wiki/Lyrics:*
// @grant        none
// ==/UserScript==
// noinspection DuplicatedCode

(() => {
    let saveLyrics = function (lines, type) {
        let container = document.createElement('div')

        for (let i = 0; i < lines.length; i++) {
            container.innerHTML = container.innerHTML + '<br>' + lines[i] + '<br>'
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
        let decoded = decodeURI(window.location.href.split(':')[2])
        a.download = `${decoded}_${type}.html`
        a.href = `data:text/html,${encodeURIComponent(html.outerHTML)}`
        a.target = "_blank"
        a.click()
    }

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
        let japaneseLines = []
        let romajiLines = []
        let englishLines = []
        for (let row of document.querySelectorAll('.lyrics_row')) {
            let contents = row.querySelectorAll('td p')
            let japanese = contents[0].cloneNode(true)
            while (true){
                let rubyTags = japanese.querySelectorAll('ruby[lang]')
                let spanTags = japanese.getElementsByTagName('span')
                if (rubyTags.length === 0 && spanTags.length === 0) {
                    break
                }
                for (let ruby of rubyTags) {
                    let newRuby = document.createElement('ruby')
                    newRuby.append(ruby.firstChild.firstChild)
                    newRuby.append(ruby.childNodes[2])
                    ruby.replaceWith(newRuby)
                }
                for (let span of spanTags) {
                    let i = document.createElement('i')
                    i.textContent = span.textContent
                    span.replaceWith(i)
                }
            }
            japaneseLines.push(...japanese.innerHTML.trim().split('\n'))
            romajiLines.push(...contents[1].textContent.trim().split('\n'))
            englishLines.push(...contents[2].textContent.trim().replaceAll('’',"'").split('\n'))
        }

        saveLyrics(japaneseLines, 'jp')
        saveLyrics(romajiLines, 'romaji')
        saveLyrics(englishLines, 'en')
    }

    document.getElementById('footer').append(div)
})()