![](https://img.shields.io/badge/Foundry-v0.8.6-informational)
<!--- Downloads @ Latest Badge -->
<!--- replace <user>/<repo> with your username/repository -->
<!--- ![Latest Release Download Count](https://img.shields.io/github/downloads/rlach/wiki-import/latest/module.zip) -->

<!--- Forge Bazaar Install % Badge -->
<!--- replace <your-module-name> with the `name` in your manifest -->
<!--- ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwiki-import&colorB=4aa94a) -->

# FoundryVTT Module

Imports wikipedia articles as journal entries in Foundry VTT. 

The module will try to contain all the links in original article. The links will be done to JournalEntries, by name. If you have, or will create properly named entry in the future the linking will start working.

The images will be set to float on the right side of the text, except for the images in infoboxes, which will be included in the infobox.

Infoboxes won't use templates from wikipedia, instead they will be represented as simple tables with 2 columns, placed to the right of the text.

## How to use

There are two ways to import the conent:

* Enter the full url of the page you want to import (including https)
  - If url is filled in all other fields are ignored.
* Enter the page source and optionally domain name to import the page
  - The domain name should NOT include https, so it should be formatted, for example `wikipedia.org`.
  - The domain name will be remembered between imports.
  - The source should be in wikipedia syntax. To find it click "edit source" or "view source" button on the wikipedia article.
  - You should use this option if importing by URL doesn't work. Usually it's caused by CORS issues.
  - The domain name is needed to properly import images from target URL.

## Limitations

This module uses [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia) to parse the articles, so it has most of the limitations described on their repository. This means the articles won't be imported 100% accurate, but it will still be pretty close. Requiring very little(if any) manual fixes afterwards.

## Changelog
### 0.0.1
* Initial, basic functionality. Import the wiki article with images linked to the original site.