const axios = require('axios')
var fs = require('fs');
const Epub = require("epub-gen");
const cheerio = require('cheerio');

function writeToFile(fileName, content) {
    var stream = fs.createWriteStream(fileName)
    stream.once('open', function () {
        stream.end(content);
    });
}

async function getLinks(url) {
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)
    const content = $('.entry-content')
    const links = content.find('a').map((i, element) => {
        // check if text match this pattern "Chapter any number"
        if ($(element).text().match(/Chapter\s\d+/)) {
            return {
                href: $(element).attr('href'),
                text: $(element).text()
            }
        }
    }
    ).get()
    return links
    // 'text', 'href'

}

async function saveBook(url) {
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)
    const content = $('.entry-content')

    const fileName = $('.entry-title').text().replace(',', '_').replace(/\W+/g, '')
    // remove all spaces and symbols from fileName


    // remove first 3 p and last 3 p
    content.find('p').first().remove();
    content.find('p').last().remove();
    // remove images

    content.find('script').remove();
    content.find('img').remove();

    const option = {
        title: $('.entry-title').text(), // *Required, title of the book.
        author: "ddl", // *Required, name of the author.
        publisher: "ddlwebscraper", // optional
        cover: './cover.jpg',
        content: [
            {
                data: content.html()
            }

        ]
    };

    new Epub(option, `./bin/${fileName}.epub`);
}

async function getChapter(url, from, to) {
    // get links
    const links = await getLinks(url)

    for (let i = from; i <= to; i++) {
        try {
            const current = links.find((link) => link.text === (`Chapter ${i}`))
            await saveBook(current.href)
        } catch (error) {
            console.log("No more chapters")
            break;
        }
    }

}
const myArgs = process.argv.slice(2);
let chapterStart = 0
let chapterEnd = 99999

if (!myArgs[0] && isNaN(Number(myArgs[0]))) {
    console.log("Pass Starting Chapter Number")
} else {
    chapterStart = Number(myArgs[0])
}
if (myArgs[1] && !isNaN(Number(myArgs[1]))) {
    chapterEnd = Number(myArgs[1])
}


getChapter('https://www.divinedaolibrary.com/martial-peak/', chapterStart, chapterEnd)




