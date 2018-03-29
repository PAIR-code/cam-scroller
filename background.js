/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const math = new dl.NDArrayMathGPU();
const NUM_CLASSES = 3;
const K = 5;
const knn = new knn_image_classifier.KNNImageClassifier(NUM_CLASSES, K, math);

// Do first-time setup to gain access to webcam, if necessary.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason.search(/install/g) === -1) {
    return;
  }
  chrome.tabs.create({
    url: chrome.extension.getURL('welcome.html'),
    active: true
  });
});

// Mapping of training commands to KNN class indices. Special commands for
// turning off training and for saving training weights are given negative
// indices to signify that no training is to occur.
const optionToClassIndex = {
  'save': -2,
  'off': -1,
  'noaction': 0,
  'down': 1,
  'up': 2
};
const classIndexToDirection = [null, 'down', 'up'];

// Current class index being trained, negative means not training.
let classIndexToTrain = -1;

// True if currently in 'infer' mode, meaning that the webcam is controlling
// scrolling.
let infer = false;

// The previously-predicted class when in 'infer' mode.
let previousPredictedIndex = -1;

// Get previously-stored infer checkbox setting, if any.
chrome.storage.local.get('infer', items => {
  infer = !!items['infer'];
});

// Get previously-stored saved trained model parameters, if any.
chrome.storage.local.get('modelParams', params => {
  if ('modelParams' in params) {
    // Reshape saved model parameters to appropriate dims.
    const modelTensors = params.modelParams.map(flat => {
      if (flat.length > 0) {
        return dl.tensor2d(flat, [flat.length / 1000, 1000]);
      } else {
        return null;
      }
    });
    // Set saved model parameters on KNN classifier.
    knn.setClassLogitsMatrices(modelTensors);
    console.log('restored knn weights from storage');
  }
});

// Listener for commands from the extension popup (controller) page.
chrome.extension.onRequest.addListener((request, sender) => {
  if ('train' in request) {
    if (request.train == 'save') {
      // If given a 'save' command then save the current weights from the KNN
      // classifier to local storage.
      const tensors = knn.getClassLogitsMatrices();
      const logitsToSave = tensors.map(tensor => {
        if (tensor) {
          return Array.from(tensor.flatten().dataSync());
        } else {
          return [];
        }
      });
      chrome.storage.local.set({
        'modelParams': logitsToSave
      });
    }
    // Get the appropriate class index to train and ensure infer mode is off as
    // we are in training.
    classIndexToTrain = optionToClassIndex[request.train];
    infer = false;
  } else if ('infer' in request) {
    infer = request.infer;
    if (!infer) {
      // If infer mode is being disabled then make sure to turn off any current
      // scrolling.
      handleInfer(-1);
    }
  } else if ('reset' in request) {
    // If given a 'reset' command then clear all saved data from the KNN
    // classifier, as retraining will occur.
    for (let i = 0; i < NUM_CLASSES; i++) {
      knn.clearClass(i);
    }
  }
});

const vid = document.querySelector('#webcamVideo');

// Setup webcam, initialize the KNN classifier model and start the work loop.
async function setupCam() {
  navigator.mediaDevices.getUserMedia({
    video: true
  }).then(mediaStream => {
    vid.srcObject = mediaStream;
  }).catch((error) => {
    console.warn(error);
  });
  await knn.load();
  setTimeout(loop, 50);
}

// If cam acecss has already been granted to this extension, setup webcam.
chrome.storage.local.get('camAccess', items => {
  if (!!items['camAccess']) {
    console.log('cam access already exists');
    setupCam();
  }
});

// If cam acecss gets granted to this extension, setup webcam.
chrome.storage.onChanged.addListener((changes, namespace) => {
  if ('camAccess' in changes) {
    console.log('cam access granted');
    setupCam();
  }
});

// Work loop function performed every 50ms by the extension.
async function loop() {
  if (infer) {
    // If in infer mode then predict a class from the current webcam image
    // and take appropriate action.
    await math.scope(async (keep, track) => {
      const image = track(dl.Array3D.fromPixels(vid));
      const results = await knn.predictClass(image);
      handleInfer(results.classIndex);
    });
  } else if (classIndexToTrain >= 0) {
    // If in training mode, add the current webcam image to the current
    // class to train.
    await math.scope(async (keep, track) => {
      const image = track(dl.Array3D.fromPixels(vid));
      await knn.addImage(image, classIndexToTrain);
    });
  }
  // Rerun the loop in 50ms.
  setTimeout(loop, 50);
}

// Handles inferences from the KNN classifier.
function handleInfer(classIndex) {
  // If the currently-inferred class is the same as the previously-inferred
  // class then there is nothing to be done.
  if (classIndex != previousPredictedIndex) {
    let tabId = -1;
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      // Find the active tab in the browser.
      if (tabs.length == 0) {
        console.log('no active tab');
        return;
      }
      tabId = tabs[0].id;
      const info = {};
      // Turn off any current scrolling, as a new scroll command has been
      // inferred.
      if (previousPredictedIndex >= 1) {
        info.off = true;
      }
      previousPredictedIndex = classIndex;
      // Turn on the new scroll direction.
      if (classIndex >= 1) {
        info.on = {direction: classIndexToDirection[classIndex]};
      }
      // Send a message to the active tab indicating which scrolling actions
      // to start or end.
      chrome.tabs.sendMessage(tabId, info);
    });
  }
}
