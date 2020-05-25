
// Buttons
const videoElement = document.querySelector("video");

const startBtn = document.getElementById("startBtn");
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getVideoSources;

const { desktopCapturer, remote } = require("electron"); // import Node JS module in browser
const { Menu } = remote;

// get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Change the videoSource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource : 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create new MediaRecorder
  const options = { mimeType: 'video/webm; codes=vp9' }
  mediaRecorder = new MediaRecorder(stream, options);

  // Register event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log("Video data available");
  recordedChunks.push(e.data);
}

const { dialog } = remote; // from Electron
const { writeFile } = require("fs"); // require a Node module that allows writing file

// Saves the video file on stop
async function handleStop(e) {
  console.log("Saving video");
  // Blob and Buffer are both data structure to store raw data
  // In this case, we use Blob and then convert to Buffer
  // because we want to get the data in a proper format to be played back as a video
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codes=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `electron-screen-record-${Date.now()}.webm`
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("Video saved successfully."));

}
