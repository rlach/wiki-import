![](https://img.shields.io/badge/Foundry-v0.8.6-informational)
<!--- Downloads @ Latest Badge -->
<!--- replace <user>/<repo> with your username/repository -->
![Latest Release Download Count](https://img.shields.io/github/downloads/rlach/wiki-import/latest/module.zip)

<!--- Forge Bazaar Install % Badge -->
<!--- replace <your-module-name> with the `name` in your manifest -->
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fwiki-import&colorB=4aa94a)

# FoundryVTT Wikipedia to Journal importer

Imports wikipedia articles as journal entries in Foundry VTT. 

The module will try to contain all the links in original article. The links will be done to JournalEntries, by name. If you have, or will create properly named entry in the future the linking will start working.

The images will be set to float on the right side of the text, except for the images in infoboxes, which will be included in the infobox.

Infoboxes won't use templates from wikipedia, instead they will be represented as simple tables with 2 columns, placed to the right of the text.

## How to use

Open journal entry you want to import wikipedia to, on top of the window you'll find `Wiki` button.
Click it, and you'll see dialog window with import settings.

There are two ways to import the content:

### Direct wiki import
Enter the full url of the page you want to import (including https)
  - If url is filled in all other fields are ignored.
  
https://user-images.githubusercontent.com/5655000/127136277-03fee9c7-ef03-480f-a31b-3a03d8815d16.mov

### Wiki source import
Enter the page source and optionally domain name to import the page
  - The domain name should NOT include https, so it should be formatted, for example `wikipedia.org`.
  - The domain name will be remembered between imports.
  - The source should be in wikipedia syntax. To find it click "edit source" or "view source" button on the wikipedia article.
  - You should use this option if importing by URL doesn't work. Usually it's caused by CORS issues.
  - The domain name is needed to properly import images from target URL.

https://user-images.githubusercontent.com/5655000/127136342-0da82547-95fb-4a3d-876c-ba93b72f6531.mov

## Quick Insert module support

If you have [Quick Insert](https://gitlab.com/fvtt-modules-lab/quick-insert) module installed the importer will try to link wikipedia links to your compedia during import.
This is rather slow currently, but will often link deities, ancestries(or races), classes, backgrounds etc. that appear in your documents to proper compedias.

Sometimes it might link not 100% accurate, for example `herbalist` can be both archetype and background in Pathfinder 2e, so it's not possible to know which you wanted to have linked.
The linker will prioritize `Item` entries, then `JournalEntry` entries, and all others, like `Actor` entries will be used last.

If you don't want to use this feature you can disable it in setting that appears only when Quick Insert is installed.

## Adding custom info boxes

Wikipedias around the world have thousands of info box templates they use. It's impossible to be able to detect and parse them all.

If you run into box that is not recognized you can add it in settings, delimited by `;` character.

For example https://www.dandwiki.com/w/index.php?title=5e_SRD:Produce_Flame has this infobox:

```
{{5e SRD Spell
|name=Produce Flame
|school=Conjuration
|lvl=cantrip
|casttime=1 action
|range=Self
|comp=V, S
|dur=10 minutes
|summary=The flame sheds {{5e|Bright Light|bright light}} in a 10-foot radius and {{5e|Dim Light|dim light}} for an additional 10 feet.
}}
```

And https://forgottenrealms.fandom.com/wiki/Zakhara has this:
```
{{Location
| type            = Continent
```

To support them in `Settings->Wiki to journal importer->Additional infoboxes` add:
```
Location;5e SRD Spell
```
It's case insensitive.

## Image downloading

You can enable image downloading, but it will work pretty much only with wikis you own and have CORS properly configured for your foundry installation.

If enabled the images will be downloaded to your user `data/wiki-import/wikipedia.domain/` folder. In case download fails for any reason it will be linked normally.

## Limitations

This module uses [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia) to parse the articles, so it has most of the limitations described on their repository. This means the articles won't be imported 100% accurate, but it will still be pretty close. Requiring very little(if any) manual fixes afterwards.

In addition: 

Image resolution might work or not depending on how given wiki stores the data. For example `fandom.org` wikis won't work. If the images is just plain link instead of File syntax it will not work.

References are not imported(those pesky numbers in square brackets that refer to original sources).

## Changelog

### 0.10.0
* Changed compatibility to Foundry v10
* Added link replacer
* Added custom title field. Now the article is imported as a new page, and can be automatically titled.

### 0.9.3
* Fixed conflict with GM notes

### 0.9.2
* Improved memorization of last domain used.
* Fixed a bug with links when the same link text is used multiple times in single sentence.

### 0.9.1
* Fixed bugs, improved UX with quick insert a bit.

### 0.9.0
* Images will be downloaded locally if set in settings
* Support for external links
* Generate links to Compendia and existing local journal entries

### 0.0.2
* Add setting to add custom infoboxes.

### 0.0.1
* Initial, basic functionality. Import the wiki article with images linked to the original site.
