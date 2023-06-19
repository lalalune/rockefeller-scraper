const puppeteer = require('puppeteer-extra');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// read links.json into an array of links
const fs = require('fs');
const links = JSON.parse(fs.readFileSync('data/links.json', 'utf8'));

// if the user provides an arg, use that as the starting index
let i = process.argv[2] ? process.argv[2] : 0;

(async () => {
    console.log('starting search')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

    console.log('browser launched')

    // go to https://shotdeck.com/welcome/login
    const page = await browser.newPage();

    // for each link in links
    // go to the link
    // get the title

    let results = [];

    for (; i < links.length; i++) {
        console.log('i', i)
        console.log('going to link', links[i])

        await page.goto(links[i]);

        // wait for 2 seconds
        await page.waitFor(1000);

        const pageTitle = await page.title();

        // find all divs with the class et_pb_blurb_content
        let teamMembers = await page.$$('.et_pb_blurb_content');

        const teamMembersFilter = [
            "Home",
            "Our Team",
            "Our Planning Partners",
            "Our Resources",
            "Our Services",
            "Contact Us"
        ]

        // filter out any team members that are in the teamMembersFilter array
        teamMembers = teamMembers.filter(teamMember => {
            return !teamMembersFilter.includes(teamMember)
        })

        // get the inner text of all elements inside each et_pb_blurb_content div
        let teamMemberData = await Promise.all(teamMembers.map(async (teamMember) => {
            return await page.evaluate(el => el.innerText, teamMember);
        }));

        // filter out any from teamMembersFilter that are in the teamMembersFilter array
        teamMemberData = teamMemberData.filter(teamMember => {
            return !teamMembersFilter.includes(teamMember)
        })


        // add the name and descriptionText to the results array
        results.push({
            teamMemberData
        });

        // remove all tabs, then split by new line (\n), then save the outputs into an object with the properties, in order:
        // name, jobTitle, email and phone
        // the email and phone properties are joined and need to be split after .com
        const finalResult = teamMemberData.map(result => {
            // remove any <img> tags
            const resultNoImgTags = result.replace(/<img[^>]*>/g, '');

            // remove double new lines
            let resultNoDoubleNewLines = resultNoImgTags;

            // find all instances of a number that is preceded by a letter (i.e. not a space, dash or number)
            // insert a newline before the number
            resultNoDoubleNewLines = resultNoDoubleNewLines.replace(/([a-zA-Z])(\d)/g, '$1\n$2');

            // find all instances of a ( that is followed by a letter
            // insert a newline after the (
            resultNoDoubleNewLines = resultNoDoubleNewLines.replace(/(\()([a-zA-Z])/g, '$1\n$2');

            // split any instance of 'com(' or 'co(' or 'com (' and add a newline after the 'com' or 'co'
            resultNoDoubleNewLines = resultNoDoubleNewLines.replace(/(com|co)(\(|\s\()/g, '$1\n$2');

            // split by new line
            let resultSplitByNewLine = resultNoDoubleNewLines.replace('                        ', '').split('\n');

            const filter = [
                'Biography +',
                'Home',
                'Our Team',
                'Our Planning Partners',
                'Our Resources',
                'Our Services',
                'Contact Us',
            ]

            // filter out any elements that are in the filter array
            resultSplitByNewLine = resultSplitByNewLine.filter(result => {
                return !filter.includes(result)
            })

            // replace all tabs in each line
            resultSplitByNewLine = resultSplitByNewLine.map(result => {
                return result.replace(/\t/g, '')
            })

            // remove newlines
            resultSplitByNewLine = resultSplitByNewLine.map(result => {
                return result.replace(/\n/g, '')
            })

            // if any line is empty, remove it
            resultSplitByNewLine = resultSplitByNewLine.filter(result => {
                return result !== ''
            })

            // for each line, check if it has a number in it. if the line contains a number, but the number isn't the first character, the split the lines before the number
            resultSplitByNewLine = resultSplitByNewLine.map(result => {
                const numberIndex = result.search(/\d/);
                if (numberIndex > 0) {
                    const resultSplitByNumber = result.split(result[numberIndex]);
                    // splice both parts back to the array in the same position
                    resultSplitByNewLine.splice(resultSplitByNewLine.indexOf(result), 1, resultSplitByNumber[0], resultSplitByNumber[1])
                }
                return result
            })

            // for each line, check if it has a ( in it. if the line contains a ( but the ( isn't the first character, the split the lines before the (
            resultSplitByNewLine = resultSplitByNewLine.map(result => {
                const numberIndex = result.search(/\(/);
                if (numberIndex > 0) {
                    const resultSplitByNumber = result.split(result[numberIndex]);
                    // splice both parts back to the array in the same position
                    resultSplitByNewLine.splice(resultSplitByNewLine.indexOf(result), 1, resultSplitByNumber[0], resultSplitByNumber[1])
                }
                return result
            })

            // filter lines that include 'Contact Us' or only contain spaces
            resultSplitByNewLine = resultSplitByNewLine.filter(result => {
                return !result.includes('Contact Us') && result !== ' ' && result !== ''
            })

            // filter out any elements that are in the filter array
            resultSplitByNewLine = resultSplitByNewLine.filter(result => {
                // if any of the values in the filter array are in the result, then return false
                if(filter.some(filterValue => result.includes(filterValue))
                ) {
                    return false
                }

                return !filter.includes(result) 
            })

            // filter out lines that only contain spaces - some contain many spaces
            resultSplitByNewLine = resultSplitByNewLine.filter(result => {
                return result.replaceAll(' ', '') !== ''
            })
            
            if(resultSplitByNewLine.length >0) {

            // insert links[i] into the front of the array
            resultSplitByNewLine.unshift(links[i])

            // insert the page title into the front of the array
            resultSplitByNewLine.unshift(pageTitle.replace(' | Rockefeller Capital Management', '').replace(' - Rockefeller Capital Management', ''))
            }

            console.log('resultSplitByNewLine', resultSplitByNewLine)

            return resultSplitByNewLine

            // // if the array is less than 2, then return
            // if (resultSplitByNewLine.length < 2) {
            //     return;
            // }
            // let name = resultSplitByNewLine[1];

            // console.log('name', name)

            // let jobTitle
            // let emailAndPhone
            // let email
            // let phone

            // // handle edge case
            // if (hadImgTag) {
            //     if (resultSplitByNewLine.length < 5) {
            //         const emailAndPhoneSplitByCom = resultSplitByNewLine[2].split('.com');
            //         console.log('emailAndPhoneSplitByCom', emailAndPhoneSplitByCom)
            //         email = emailAndPhoneSplitByCom[0]

            //         if (!emailAndPhoneSplitByCom[1]) {
            //             // result looks like
            //             // [
            //             //     '',
            //             //     "TIMOTHY D. O'HARA",
            //             //     'Co-President, Rockefeller Global Family Office',
            //             //     'Biography +'
            //             //   ]
            //             name = resultSplitByNewLine[1];
            //             jobTitle = resultSplitByNewLine[2];
            //             phone = "";
            //             email = "";
            //         } else {
            //             phone = emailAndPhoneSplitByCom[1].split(' ').pop();

            //             // split the email by space and get the last element
            //             jobTitle = email;
            //             emailArray = email.split(' ')
            //             // get the last element
            //             email = emailArray[emailArray.length - 1]
            //             jobTitle = jobTitle.replace(email, '').trim();
            //         }

            //     }
            //     else {

            //         jobTitle = resultSplitByNewLine[2];
            //         emailAndPhone = resultSplitByNewLine[3];
            //         email = emailAndPhone.split('.com')[0] + '.com';
            //         phone = emailAndPhone.split('.com')[1];
            //     }


            // }
            // else {

            //     jobTitle = resultSplitByNewLine[2];
            //     emailAndPhone = resultSplitByNewLine[3];
            //     email = emailAndPhone.split('.com')[0] + '.com';
            //     phone = emailAndPhone.split('.com')[1];
            // }

            // console.log(
            //     'data',
            //     name,
            //     jobTitle,
            //     email,
            //     phone)

            // return {
            //     name,
            //     jobTitle,
            //     email,
            //     phone
            // }
        })
        // if the result is 2, it's just the title and link
        if(finalResult.length > 0){

            const fileToWrite = JSON.stringify(finalResult);
            // write teamMemberData to a file, data/teamMemberData[i].json
            fs.writeFile(`data/teamMemberData${i}.json`, fileToWrite, function (err) {
                if (err) throw err;
                console.log('Saved!');
            }
            );
        }
    }
    // close the browser
    await browser.close();

    // return results
    return links;
})();
