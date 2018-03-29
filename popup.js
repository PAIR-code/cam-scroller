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

function turnOffInferring() {
  document.getElementById('infer').checked = false;
  chrome.storage.local.set({
    'infer': false
  }, () => {});
  chrome.extension.sendRequest({
    infer: false
  });
}

function prepareNoActionTrain() {
  chrome.extension.sendRequest({
    train: 'off'
  });
  chrome.extension.sendRequest({
    reset: true
  });
  document.querySelector('#traintext').innerHTML =
    'Training no action in 2 seconds';
  setTimeout(startNoActionTrain, 2000);
}

function startNoActionTrain() {
  document.querySelector('#traintext').innerHTML =
    'Training no action for 5 seconds';
  chrome.extension.sendRequest({
    train: 'noaction'
  });
  setTimeout(prepareScrollDownTrain, 5000);
}

function prepareScrollDownTrain() {
  chrome.extension.sendRequest({
    train: 'off'
  });
  document.querySelector('#traintext').innerHTML =
    'Training scroll down in 2 seconds';
  setTimeout(startScrollDownTrain, 2000);
}

function startScrollDownTrain() {
  document.querySelector('#traintext').innerHTML =
    'Training scroll down for 5 seconds';
  chrome.extension.sendRequest({
    train: 'down'
  });
  setTimeout(prepareScrollUpTrain, 5000);
}

function prepareScrollUpTrain() {
  chrome.extension.sendRequest({
    train: 'off'
  });
  document.querySelector('#traintext').innerHTML =
    'Training scroll up in 2 seconds';
  setTimeout(startScrollUpTrain, 2000);
}

function startScrollUpTrain() {
  document.querySelector('#traintext').innerHTML =
    'Training scroll up for 5 seconds';
  chrome.extension.sendRequest({
    train: 'up'
  });
  setTimeout(finishTraining, 5000);
}

function finishTraining() {
  document.querySelector('#traintext').innerHTML = '';
  chrome.extension.sendRequest({
    train: 'save'
  });
  document.getElementById('infer').checked = true;
  chrome.storage.local.set({
    'infer': true
  }, () => {});
  chrome.extension.sendRequest({
    infer: true
  });
}

function inferButtonClicked() {
  const inferSetting = this.checked;
  chrome.storage.local.set({
    'infer': inferSetting
  }, () => {});
  chrome.extension.sendRequest({
    infer: inferSetting
  });
}

function trainClicked() {
  turnOffInferring();
  prepareNoActionTrain();
}

function setupCam() {
  navigator.mediaDevices.getUserMedia({
    video: true
  }).then(mediaStream => {
    document.querySelector('#webcamVideo').srcObject = mediaStream;
  }).catch((error) => {
    console.warn(error);
  });
}

setupCam();

// Setup checkbox with correct initial value.
chrome.storage.local.get('infer', items =>
  document.getElementById('infer').checked = !!items['infer']);

document.getElementById('infer').onclick = inferButtonClicked;
document.getElementById('train').onclick = trainClicked;
