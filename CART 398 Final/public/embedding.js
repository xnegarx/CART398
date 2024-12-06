//  Made using the mediapipe image embedding task: https://ai.google.dev/edge/mediapipe/solutions/vision/image_embedder

// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  ImageEmbedder,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const demosSection = document.getElementById("demos");

let imageEmbedder;
let runningMode = "IMAGE";

function addImagesToHTML(){

for (let i = 1; i <= 316; i++) {
  let imageContainer   = document.createElement("div");
  imageContainer.classList.add("embedOnClick")
    const img = document.createElement('img');
    img.src = `images/images/image (${i}).png`; 
    img.alt = `Image ${i}`;
    imageContainer.appendChild(img);
    document.querySelector("#wrapper").appendChild(imageContainer);
    }
  }

// Before we can use ImageEmbedder class we must wait for it to finish loading.
const createImageEmbedder = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  imageEmbedder = await ImageEmbedder.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite`
    },
    runningMode: runningMode
  });
};
createImageEmbedder();

async function embedImages() {
  if (!imageEmbedder) {
    console.log("Wait for imageEmbedder to load before embedding");
    return;
  }

 // if video mode is initialized, set runningMode to image
  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await imageEmbedder.setOptions({ runningMode: runningMode });
  }

  const embeddingsData = {}; // Object to store image embeddings

  const imageContainers = document.querySelectorAll('.embedOnClick');

  for (let i = 0; i < imageContainers.length; i++) {

    const imgElement = imageContainers[i].children[0];
    const resultImg = await imageEmbedder.embed(imgElement);
    const truncatedEmbedding = resultImg.embeddings[0].floatEmbedding.slice(0, 100); // Example: take the first 10 values
    embeddingsData[`image_${i + 1}`] = truncatedEmbedding; // Use keys like "image_1", "image_2", etc.

  }

  const jsonData = JSON.stringify(embeddingsData, null, 2);

  // Create a downloadable JSON file
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Create a link element to download the file
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "image_embeddings.json"; // File name
  downloadLink.click();

}

// Ensuring embedImages() is only called after the createImageEmbedder() function completes.
// Only start embedding once the imageEmbedder is fully initialized.

window.onload = async function () {
  // Wait for the embedder to finish loading
  while (!imageEmbedder) {
    console.log("Waiting for imageEmbedder to load...");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
  }

  addImagesToHTML();
  setTimeout(async function(){
    // Now embed the images
    await embedImages();
  },10000)

};

export const embeddingsData = {};