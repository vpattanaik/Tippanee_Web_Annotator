# Tippanee Web Annotator &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

The Tippanee web annotator allows it's users to weave textual web contents and applications by hooking up to existing web pages - independent of ownership!

The platform allows its user to hook up notes to web components. Tippanee has a minimalistic design and doesn’t hamper user experience. It’s sidebar design neatly embeds into any webpage and can be easily hidden if required. Save multiple notes on different webpages and switch between them with a few clicks.

[Download](https://chrome.google.com/webstore/detail/tippanee-weave-your-own-w/ccfghgegoegbjgloocplalkhfimgaccb?hl=en) from Google Web Store.

![social-preview](/social-preview/tippanee_social-preview.png)

---

## Getting Started Guide

### Introduction

The following guide is meant to enable users to install and start creating annotations with Tippanee. The primary features and user-interface components of the annotation tool are demonstrated through screenshots captured on a Windows machine.

### Installing Tippanee

To begin, we will need to first install Tippanee's browser extension on the Google Chrome browser.

1. Start by opening the Google Chrome browser on your system, and then go to the **Chrome Web Store**.  To get to the **Chrome Web Store**, type the URL ([https://chrome.google.com/webstore/category/extensions](https://chrome.google.com/webstore/category/extensions)) in the address bar of the browser, and hit the **Enter** key.

2. Once on the **Chrome Web Store**, type the word "Tippanee" on the search bar on the left, and hit the **Enter** key.

![Screenshot_1](/docs/screenshots/Screenshot_1.png)

3. The Tippanee browser extension should now be visible at the center of screen. Click on the extension description, to get to the extension's page.

![Screenshot_2](/docs/screenshots/Screenshot_2.png)

4. The extension's page should have an **Add to Chrome** button on the right side of the page. Click on the button to install the extension on to your browser.
    
![Screenshot_3](/docs/screenshots/Screenshot_3.png)
    
5. You will be prompted with the permissions required by the extension. Click the **Add extension** button to go ahead with the installation.
    
![Screenshot_4](/docs/screenshots/Screenshot_4.png)
    
6. You will be prompted, once the extension is installed. Now, to view the extension shortcut on your browser, click on the puzzle-like logo at the top-right corner of the browser window. This **Extension** button allows users to pin extensions to the browser UI.
    
7. Click on the pin, to the right of the extension "Tippanee - Weave your own Web".
    
![Screenshot_5](/docs/screenshots/Screenshot_5.png)

The Tippanee extension should now be ready for use, and the extension's shortcut should be visible in the top-right area of the browser window.

![Screenshot_5](/docs/screenshots/Screenshot_6.png)

To enable or disable the extension on any web page, click on the extension shortcut once. If Tippanee's extension logo turns to gray-scale, this means the extension is disabled. While if the extension logo is colored (i.e., black, blue and white), this implies the extension is active. Please note, that if the extension takes to long to load on a page, or doesn't seem to work, you should disable and re-enable the extension.

### Creating Annotations

To create an annotation on Tippanee, simply visit the web you would like to annotate, verify whether the extension is enabled on the web page, and then follow these steps:\\

***Please note that we demonstrate these steps by creating annotations on the Wikipedia home page ([https://en.wikipedia.org/wiki/Main\_Page](https://en.wikipedia.org/wiki/Main_Page)).***

1. Select the text you would like to annotate, by clicking and dragging the mouse over the text. Once the text is selected you should see Tippanee's logo to the bottom-right of the selected text.

2. Click on the Tippanee logo to annotate the selected text.

![Screenshot_7](/docs/screenshots/Screenshot_7.png)


Once the text is annotated, you should see a light-blue box around the previously selected text. The box indicates the HTML DOM element that the annotated text belongs to. The Tippanee shortcut in the top-right area of the browser indicates the number of annotations of the current web page.

![Screenshot_8](/docs/screenshots/Screenshot_8.png)
\clearpage
### Viewing Annotations and Adding Comments

To view the annotations previously created on a web page, click the left/right-facing arrow on the right side of the browser. By default the dashboard of the extension is hidden. However clicking on the left-facing arrow, should make the dashboard visible on the right side of the browser window.

To add comments to an annotation, click on the text box with the message "Add a note...". Then type in comment you would like to add, and hit the **Enter** key.

![Screenshot_9](/docs/screenshots/Screenshot_9.png)

To view an annotation on the web page, click on the annotation within the dashboard. Doing so, should highlight the exact annotated text in yellow, and the annotated element in pink.

![Screenshot_10](/docs/screenshots/Screenshot_10.png)

To view all annotations you have created so far, click on the **Browse all annotations** button, indicated by two overlapping squares, inside the annotation tool's dashboard.

![Screenshot_15](/docs/screenshots/Screenshot_15.png)

### User Interface and System Features

If a user visits a previously annotated web page, the Tippanee extension uses its novel anchoring anchoring algorithm and attempts to reattach the annotations to their correct locations. In doing so, the extension generates a **similarity index** for each of the page's annotations. The **similarity index** of the reattached annotation can be found on the bottom-left of the corresponding annotation, inside the annotation tool's dashboard. To the right of the **similarity index** indicator, are the buttons: **Reconstruct annotation**, **Link annotations**, **Transclude annotation**, **Describe annotation**, and **Delete annotation**.

To create links between annotations, first click on the **Link annotations** button. A list of all annotations created by the user should appear under the annotation. By clicking on **Add link** button, indicated by the link logo, a user can create a uni-direction link between the original annotation and the annotation being linked. By clicking on the same logo again user can unlink the annotations (i.e., **Remove link**).

![Screenshot_11](/docs/screenshots/Screenshot_11.png)

\clearpage
To add semantic descriptions to annotated contents, users can use the **Describe annotation** button. On clicking the button, users should be able to see the **Describe Annotation** window, under the original annotation. The new window contains a drop-down menu titled "What is the annotation about?". Users can choose between a few pre-defined semantic classes and properties, that they can then use to describe the context of the annotation. Once the users have added information into the (semantic metadata) text boxes, they are required to click on the **Add** button to store the added metadata. For now, this information is used to retrieve annotations, when users are searching for a specific annotation, using the **Search annotations** feature.

![Screenshot_12](/docs/screenshots/Screenshot_12.png)

![Screenshot_13](/docs/screenshots/Screenshot_13.png)

Using Tippanee's **Reconstruct annotation** feature, users can view created annotations in their original forms. The feature works by showing users how the annotation looked like when it was first created. Also, it allows users to see both the annotated content and its surrounding context, given the annotation is part of a larger DOM element. The annotated text is made visible with a green highlight, while its surrounding text has no highlight.

![Screenshot_14](/docs/screenshots/Screenshot_14.png)

Users can view linked annotations by using the **Visualize annotations** feature. Activated by using the tree-like logo in the top-right area of the annotation tool dashboard, the feature allows users to visualize the annotations and their links. Through the feature, annotations are visualized as a node, while their links are visualized as edges. It should be noted that the size of each node indicates the number of comments the annotation has. By hovering the mouse over a node, users can view the node's corresponding annotation text, while double-clicking on the node redirects users to the corresponding annotation's web page.

![Screenshot_16](/docs/screenshots/Screenshot_16.png)

---

## Licence

This project is licensed under the MIT License - see the [LICENSE.md](/docs/LICENSE.md) file for details.

## Citation
* [Vishwajeet Pattanaik](https://github.com/vpattanaik), Shweta Suran, and Dirk Draheim. 2019. Enabling Social Information Exchange via Dynamically Robust Annotations. In The 21st International Conference on Information Integration and Web-based Applications & Services (iiWAS2019), December 2–4, 2019, Munich, Germany. ACM, New York, NY, USA, 9 pages. [https://doi.org/10.1145/3366030.3366060](https://doi.org/10.1145/3366030.3366060)

```
Copyright (c) 2020 Vishwajeet Pattanaik
```
