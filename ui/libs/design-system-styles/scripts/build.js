const fs = require("fs")
const { registerTransforms } = require('@tokens-studio/sd-transforms')
const StyleDictionary = require('style-dictionary')

registerTransforms(StyleDictionary)

const log = (obj) => console.dir(obj, { depth: null })

const includedThemes = ["dark"];
const tokenFile = "./tokens.json";

const kebabCase = str => str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .join('-')
    .toLowerCase();

function MergeRecursive(obj1, obj2) {
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}

function writeThemeTokenFiles(tokenFile) {
  const filestream = fs.readFileSync(tokenFile)
  const tokenConfig = JSON.parse(filestream)
  const themeNames = tokenConfig.$themes.map((theme) => theme.name).filter((theme => includedThemes.includes(theme)))
  const tokenSetOrder = tokenConfig.$metadata.tokenSetOrder

  log(`Processing ${tokenFile} with token set order:`)
  log(tokenSetOrder)

  for (let themeName of themeNames) {
    const themeTokenSets = tokenConfig.$themes.find((c) => c.name == themeName).selectedTokenSets
    log(themeName)
    log(themeTokenSets)

    const theme = {}
    tokenSetOrder.forEach(
      (tokenset) => {
        console.log(`Processing ${tokenset}...`)
        const enabled = themeTokenSets[tokenset]
        if (enabled && enabled[tokenset] !== 'disabled') {
          // add it
          for (let [key, value] of Object.entries(tokenConfig[tokenset])) {
            log(key)
            if (theme[key]) {
              theme[key] = MergeRecursive(theme[key], value)
            } else {
              theme[key] = value;
            }
          }
        }
      }
    );
    const tokenJSON = JSON.stringify(theme);
    fs.writeFileSync(`tokens/${kebabCase(themeName)}.json`, tokenJSON, {});
  }
  return themeNames.map(kebabCase);
}

const themeNames = writeThemeTokenFiles(tokenFile);

console.log('included theme names :>> ', themeNames);

themeNames.forEach((themeName) => {
  const sd = StyleDictionary.extend({
    source: [`tokens/${themeName}.json`],
    platforms: {
      js: {
        transformGroup: 'tokens-studio',
        prefix: "nh",
        buildPath: `src/themes/${themeName}/js/`,
        files: [
          {
            format: "javascript/module-flat",
            destination: "variables.js",
            options: {
              "outputReferences": false,
              "showFileHeader": false
            }
          },
          {
            format: "typescript/es6-declarations",
            destination: "variables.d.ts",
            options: {
              "outputReferences": false,
              "showFileHeader": false
            }
          }
        ]
      },
      css: {
        transforms: [
          'ts/descriptionToComment',
          'ts/size/px',
          'ts/opacity',
          'ts/size/lineheight',
          'ts/typography/fontWeight',
          'ts/resolveMath',
          'ts/size/css/letterspacing',
          'ts/typography/css/shorthand',
          'ts/border/css/shorthand',
          'ts/shadow/css/shorthand',
          'ts/color/css/hexrgba',
          'ts/color/modifiers',
          'name/cti/kebab',
        ],
        prefix: "nh",
        buildPath: `src/themes/${themeName}/css/`,
        files: [
          {
            destination: 'variables.css',
            format: 'css/variables',
            options: {
              "outputReferences": false,
              "showFileHeader": false
            }
          },
        ],
      },
    },
  });
  sd.cleanAllPlatforms();
  sd.buildAllPlatforms();
})

/* minify css */
function minifyCSS(content) {
  content = content.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "");
  content = content.replace(/ {2,}/g, " ");
  content = content.replace(/ ([{:}]) /g, "$1");
  content = content.replace(/([{:}]) /g, "$1");
  content = content.replace(/([;,]) /g, "$1");
  content = content.replace(/ !/g, "!");
  return content;
}