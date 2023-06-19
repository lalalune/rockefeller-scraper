const puppeteer = require("puppeteer-extra");

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

(async () => {
  console.log("starting search");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  console.log("browser launched");

  const page = await browser.newPage();

  await page.goto(
    "https://rcm.rockco.com/our-people/#our-people-office-locations"
  );
  console.log("page loaded");

  // print out the first page title
  const title = await page.title();
  console.log("title", title);

  // wait five seconds
  await page.waitFor(1000);
  // get all links on the page
  let links = (await page.$$eval("a", (as) => as.map((a) => a.href)))
    // remove any null or "" links
    .filter((link) => link !== null && link !== "")
    // remove any duplicates
    .filter((link, index, self) => self.indexOf(link) === index)
    // remove any that dont contain rcm.rockco.com in the string
    .filter((link) => link.includes("rcm.rockco.com"))
    // filter any links that contain #
    .filter((link) => !link.includes("#"));

  console.log("links", links);

  const ignore = [
    "https://rcm.rockco.com/",
    "https://rcm.rockco.com/contact-us/",
    "https://rcm.rockco.com/cybersecurity/",
    "https://rcm.rockco.com/global-family-office/",
    "https://rcm.rockco.com/importantlegalinformation/",
    "https://rcm.rockco.com/media-center/",
    "https://rcm.rockco.com/our-insights/",
    "https://rcm.rockco.com/our-people/",
    "https://rcm.rockco.com/our-services/",
    "https://rcm.rockco.com/privacy-policy/",
    "https://rcm.rockco.com/ram/",
    "https://rcm.rockco.com/rockefeller-strategic-advisory/",
    "https://rcm.rockco.com/sustainable-investing/",
    "https://rcm.rockco.com/terms-of-use/",
    "https://rcm.rockco.com/the-client-experience/",
    "https://rcm.rockco.com/why-rockefeller/",
  ];

  const alsoIgnore = "insights_item";

  links = links.filter(
    (link) => !ignore.includes(link) && !link.includes(alsoIgnore)
  );

  // save the links to links.json
  const fs = require("fs");
  fs.writeFile("data/links.json", JSON.stringify(links), function (err) {
    if (err) throw err;
    console.log("Saved!");
  });

  // close the browser
  await browser.close();

  // return results
  return links;
})();
