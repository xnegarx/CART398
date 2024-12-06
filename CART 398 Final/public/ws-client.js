//  Made using the mediapipe text embedding task: https://ai.google.dev/edge/mediapipe/solutions/text/text_embedder

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

import { MDCTextField } from "https://cdn.skypack.dev/@material/textfield";
import { MDCRipple } from "https://cdn.skypack.dev/@material/ripple";
import text from "https://cdn.skypack.dev/@mediapipe/tasks-text@0.10.0";
import data from './image_embeddings.json' with { type: "json" };


const { TextEmbedder, FilesetResolver, TextEmbedderResult } = text;

const demosSection = document.getElementById("demos");

let textEmbedder;

// Before we can use TextEmbedder class we must wait for it to finish loading.
async function createEmbedder() {
  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0/wasm"
  );
  textEmbedder = await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/text_embedder/universal_sentence_encoder/float32/1/universal_sentence_encoder.tflite`
    }
  });
  demosSection.classList.remove("invisible");
}
createEmbedder();

window.onload = function () {

  console.log("client js loaded");
  //set up the client socket to connect to the socket.io server
  let io_socket = io();
  let clientSocket = io_socket.connect('http://localhost:4200');

  clientSocket.on('connect', function() {

    var isMouseDown = false
    var rawData = []
   
  
    document.onmousedown = function(e) {
      isMouseDown = true
    }
  
    document.onmouseup   = function() {
      clientSocket.emit('browser', rawData)
      rawData=[]
      isMouseDown=false;
       }
    document.onmousemove = function(e) {
      if(isMouseDown) {
        rawData.push({'x': e.clientX, 'y': e.clientY})
      }
    }
    clientSocket.on("fromServer",function(data){
      console.log(data);
    })
  })

}//load

/********************************************************************/

async function getEmbeddingResult() {

  if (!textEmbedder) {
    console.log("Wait for textEmbedder to load before embedding");
   // return;
  }

  try{
    const textInput1 = new MDCTextField(document.getElementById("textField1"));
    const text1 = textInput1.value;
    const resultText = await textEmbedder.embed(text1);
    const textEmbedding = resultText.embeddings[0].floatEmbedding.slice(0, 100);
  
    console.log("text:"+text1);
    console.log("Generated text embedding:", textEmbedding);

    return textEmbedding;
    
  } catch (error) {
    console.error("Error generating embedding:", error);
  }

}

/********************************************************************/

function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    console.error("Cannot normalize a zero-magnitude vector");
    return null;
  }
  return vector.map((val) => val / magnitude);
}

function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  let similarity = dotProduct/ magnitude;

  if (magnitude === 0) {
    console.error("One of the vectors has zero magnitude");
    return null;
  }

  return similarity // Cosine similarity
}

/********************************************************************/

async function calculateMostSimilarImageEmbedding(textEmbedding, data) {
  if (!textEmbedding || !data || Object.keys(data).length === 0) {
    console.error("Invalid input: textEmbedding or embeddingsData are missing.");
    return null;
  }
  let maxSimilarity = -Infinity; // Start with the smallest possible value
  let mostSimilarImageKey = null;

  const similarities = [];

  // Iterate through all image embeddings
  for (const [key, imageEmbedding] of Object.entries(data)) {

    // console.log(`Key: ${key}, image Embedding:`, imageEmbedding);
    // console.log('Image Embedding:', imageEmbedding);

    const normalizedTextEmbedding = normalizeVector(textEmbedding);
    const normalizedImageEmbedding = normalizeVector(imageEmbedding);

    const similarity = cosineSimilarity(normalizedTextEmbedding, normalizedImageEmbedding);
    // Store the similarity and key

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarImageKey = key; // Save the key of the most similar image
      console.log(mostSimilarImageKey);
      similarities.push({ key, similarity });
    }
  }

  // Sort by similarity in descending order
  similarities.sort((a, b) => b.similarity - a.similarity);
  // Take the top 3 results
  const topThree = similarities.slice(0, 3);

  console.log(topThree);

  const imagesContainer = document.querySelector("#images");

  // Empty the container
  imagesContainer.innerHTML = ''

  topThree.forEach((item, index) => {

    const positions = [
      { top: "450px", left: "160px" }, // Position for item 1
      { top: "500px", left: "150px" }, // Position for item 2
      { top: "450px", left: "100px" }   // Position for item 3
    ];

    const formattedKey = item.key.replace("_", " ").replace("image ", "image (");
    
    // Construct the correct image path
    const imagePath = `images/images/${formattedKey}).png`;
    console.log(imagePath);
    
    const img = document.createElement("img");
    img.src = imagePath;
    img.alt = "Most Similar Image";

    const position = positions[index]; // Get the specific position for this item
    if (position) {
      img.style.position = "absolute"; 
      img.style.top = position.top; // Use predefined top position
      img.style.left = position.left; // Use predefined left position
    }

    // Append the image to the container
    imagesContainer.appendChild(img);
  });

  console.log(`Most similar image key: ${mostSimilarImageKey}`);
  console.log(`Highest cosine similarity: ${maxSimilarity}`);

  // Return the result
  return topThree.map(item => ({
    key: item.mostSimilarImageKey,
    similarity: item.maxSimilarity,
    imageEmbedding: data[item.mostSimilarImageKey],
  }));
}

/********************************************************************/
// Call this function on button click 
document.getElementById("calculate").addEventListener("click", async () => {

  const textEmbedding = await getEmbeddingResult();

  try{
    if (!textEmbedding) {
      console.error("Failed to generate text embedding. Exiting...");
      return;
    }
    const result = await calculateMostSimilarImageEmbedding(textEmbedding,data);
    
    if (result) {
      console.log("Most similar image embedding:", result.imageEmbedding);
    } else {
      console.error("No similar image embedding found.");
    }
  } catch (error) {
    console.error("An error occurred during computation:", error);
  }

}); // End
