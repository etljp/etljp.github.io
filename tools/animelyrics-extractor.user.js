// ==UserScript==
// @name         Extract lyrics from animelyrics
// @version      0.1
// @author       LittleEndu
// @updateURL    https://etljp.github.io/tools/animelyrics-extractor.user.js
// @match        https://www.animelyrics.com/anime/*/*.*
// @match        https://www.animelyrics.com/jpop/*/*.*
// @match        https://www.animelyrics.com/game/*/*.*
// @match        https://www.animelyrics.com/dance/*/*.*
// @match        https://www.animelyrics.com/dancecd/*/*.*
// @match        https://www.animelyrics.com/doujin/*/*.*
// @grant        none
// ==/UserScript==
// noinspection DuplicatedCode

(() => {
    let saveLyrics = function (lines, type) {
        let container = document.createElement('div')

        for (let i = 0; i < lines.length; i++) {
            container.innerHTML = container.innerHTML + '<br>' + lines[i].trim() + '<br>'
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
        let source = window.location.href.split('/')[4]
        let song = window.location.href.split('/')[5].split('.')[0]
        a.download = `${source}_${song}_${type}.html`
        a.href = `data:text/html,${encodeURIComponent(html.outerHTML)}`
        a.target = "_blank"
        a.click()
    }

    /**
     * @param {Document} givenDocument
     */
    let copyTranslation = function (givenDocument) {
        let englishLines = []
        let romajiLines = []
        for (let lyrics of givenDocument.querySelectorAll('td.translation span.lyrics')) {
            lyrics.firstChild.remove()
            englishLines.push(...lyrics.textContent.replaceAll('\xa0', ' ').trim().split('\n'))
            englishLines.push('\n')
        }
        for (let lyrics of givenDocument.querySelectorAll('td.romaji span.lyrics')) {
            lyrics.firstChild.remove()
            romajiLines.push(...lyrics.textContent.replaceAll('\xa0', ' ').trim().split('\n'))
            romajiLines.push('\n')
        }
        saveLyrics(englishLines, 'en')
        saveLyrics(romajiLines, 'romaji')
    }

    /**
     * @param {Document} givenDocument
     */
    let copyKanji = function (givenDocument) {
        let kanji = givenDocument.getElementById('kanji')
        if (kanji)
            saveLyrics(kanji.textContent.trim().split('\n'), 'jp')
    }


    let div = document.createElement('div')
    div.innerHTML = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="file-lines" class="svg-inline--fa fa-file-lines" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width:100%;height: 100%"><path fill="currentColor" d="M256 0v128h128L256 0zM224 128L224 0H48C21.49 0 0 21.49 0 48v416C0 490.5 21.49 512 48 512h288c26.51 0 48-21.49 48-48V160h-127.1C238.3 160 224 145.7 224 128zM272 416h-160C103.2 416 96 408.8 96 400C96 391.2 103.2 384 112 384h160c8.836 0 16 7.162 16 16C288 408.8 280.8 416 272 416zM272 352h-160C103.2 352 96 344.8 96 336C96 327.2 103.2 320 112 320h160c8.836 0 16 7.162 16 16C288 344.8 280.8 352 272 352zM288 272C288 280.8 280.8 288 272 288h-160C103.2 288 96 280.8 96 272C96 263.2 103.2 256 112 256h160C280.8 256 288 263.2 288 272z"></path></svg>`
    div.style.position = "fixed"
    div.style.bottom = "1em"
    div.style.right = "1em"
    div.style.width = "4em"
    div.style.height = "4em"
    div.style.userSelect = "none"
    div.onclick = () => {
        if (window.location.href.endsWith('.jis')) {
            copyKanji(document);
            (async () => {
                let url = window.location.href
                url = url.substring(0, url.length-4)
                let response = await fetch(url + '.htm')
                if (!response.ok)
                    return
                let data = await response.text()
                let parsedDocument = (new DOMParser()).parseFromString(data, 'text/html')
                copyTranslation(parsedDocument)
            })()
        } else {
            copyTranslation(document);
            (async () => {
                let url = window.location.href
                url = url.substring(0, url.length-4)
                let response = await fetch(url + '.jis')
                if (!response.ok)
                    return
                let data = await response.text()
                let parsedDocument = (new DOMParser()).parseFromString(data, 'text/html')
                copyKanji(parsedDocument)
            })()
        }
    }

    document.getElementById('evolve_footer').append(div)
})();