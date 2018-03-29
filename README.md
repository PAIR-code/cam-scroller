# Cam Scroller

Cam Scroller is an open-source Chrome extension that uses your webcam and
[deeplearn.js](https://deeplearnjs.org) to enable scrolling through webpages
using custom gestures that you define.

The Chrome extension can be found in the Chrome web store [here](https://chrome.google.com/webstore/detail/cam-scroller/egljnginfcbpehnpfojpbogiopdgjjak).

It makes use of the deeplearn.js [KNN image classifier](https://github.com/PAIR-code/deeplearnjs/blob/master/models/knn_image_classifier/knn_image_classifier.ts)
in the same manner as [Teachable Machine](https://teachablemachine.withgoogle.com/)
and [Cam Arcade](https://deeplearnjs.org/demos/teachable_gaming/).

In doing so, your webcam images are processed locally on your machine and at no
time is any information collected or sent externally.

This simple Chrome extension is meant to show, through a minimal example, the
types of experiences that can be enabled through the use of browser-based
machine learning.

![GIF showing training process](https://gist.githubusercontent.com/jameswex/d9506ffef04976e37d577e2907cac276/raw/38ef1cd3a60e0f3a4db56b93c87470a51c3eda45/CamScrollerTraining.gif)

## Usage

### How to install and configure the extension

1. Install the extension from the Chrome store.
1. Upon initial installation, the extension will ask for permission to access
the webcam. After granting permission, you can close the welcome page.
   * Note that the extension keeps your webcam open, but at no point is any
   information from the webcam ever sent anywhere. All processing happens local
   to your machine.
1. Click the Cam Scroller browser action icon next to the address bar. In the
popup, you should see a display of what your webcam is seeing. Click the "Create
scrolling gestures" button and follow the on-screen instructions to create your
custom scrolling gestures.
   * You will be asked to train three different poses: one for scrolling down,
   one for scrolling up, and one for the steady state of not scrolling at all.

From this point on, for any new tab/page you load, scrolling can be
controlled by the gestures you trained. You will see a visual scrolling
indicator on the right side of the page when scrolling is being controlled by
your gestures.

The KNN image classifier weights for the trained gestures are stored in
Chrome local storage, so the gestures do not have to be retrained when you
close and then relaunch Chrome.

### Controls available in the extension

If you want to temporarily turn off the Cam Scrolling capability,
uncheck the checkbox in the Cam Scroller browser action popup.

If at any time you wish to retrain the gestures, just click the "Create
scrolling gestures" button again in the extension popup.

## Code breakdown

welcome.[html/js] - Page launched on initial extension installation which
requests webcam access for the extension.

popup.[html/js] - Browser action popup page. Displays the webcam and has
controls for training the scrolling gestures and enabling/disabling scrolling.
Passes messages to the background page to do the actual processing.

background.[html/js] - Contains all the machine learning logic for the
extension. Trains the KNN image classifier when in training mode, infers which
scrolling gestures are being performed when in inference mode, and sends
messages to the content script to perform scrolling.

content.js - Content script running with webpages loaded in Chrome. Calls
window.scrollBy to scroll webpages and places visual indicators on the page when
scrolling.

## Notice

This is not an officially supported Google product.
