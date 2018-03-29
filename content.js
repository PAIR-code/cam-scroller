/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// The current timer, saved if timer cancellation is needed.
let timer = -1;

// The amount to scroll vertically by, in pixels.
let scrollAmount = 0;

// Scrolls by the currently-set scroll amount and sets a timeout to scroll
// again in 50ms.
function scroller() {
  console.log('scrolling by ' + scrollAmount);
  window.scrollBy(0, scrollAmount);
  timer = setTimeout(scroller, 50);
}

// Changes the up or down scrolling indicator as specified.
function changeIndicator(indicator, show) {
  indicator.style.visibility = show ? 'visible' : 'hidden';
  indicator.style.opacity = show ? '1' : '0';
}

// Listener for messages from the extension background page.
chrome.runtime.onMessage.addListener((request, sender) => {
  // If turning scrolling off, clear the timeout and remove any scrolling
  // indicators.
  if ('off' in request) {
    clearTimeout(timer);
    changeIndicator(camControlDown, false);
    changeIndicator(camControlUp, false);
    console.log('off');
  }
  if ('on' in request) {
    // If turning scrolling on then set the appopriate indicator and scroll
    // amount then start the scrolling process.
    if (request.on.direction == 'down') {
      changeIndicator(camControlDown, true);
      scrollAmount = 20;
    } else if (request.on.direction == 'up') {
      changeIndicator(camControlUp, true);
      scrollAmount = -20;
    }
    console.log('on');
    scroller();
  }
});

// Create up and down arrow elements for display when scrolling.
// Uses borders to create arrow shapes, transition to enable smooth animations
// of the arrows, and z-index to ensure they display on top of the page
// content.
const camControlUp = document.createElement('div');
camControlUp.style.position = 'fixed';
camControlUp.style.height = '0';
camControlUp.style.width = '0';
camControlUp.style.right = '0';
camControlUp.style.top = '0';
camControlUp.style.borderLeft = '20px solid transparent';
camControlUp.style.borderRight = '20px solid transparent';
camControlUp.style.borderBottom = '40px solid #545454';
camControlUp.style.visibility = 'hidden';
camControlUp.style.transition = 'visibility 1s, opacity 1s';
camControlUp.style.zIndex = '100000';
document.body.appendChild(camControlUp);
const camControlDown = document.createElement('div');
camControlDown.style.position = 'fixed';
camControlDown.style.width = '0';
camControlDown.style.height = '0';
camControlDown.style.right = '0';
camControlDown.style.bottom = '0';
camControlDown.style.borderLeft = '20px solid transparent';
camControlDown.style.borderRight = '20px solid transparent';
camControlDown.style.borderTop = '40px solid #545454';
camControlDown.style.visibility = 'hidden';
camControlDown.style.transition = 'visibility 1s, opacity 1s';
camControlDown.style.zIndex = '100000';
document.body.appendChild(camControlDown);
