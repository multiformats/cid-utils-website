const CID = require('cids')

function decodeCID (inputCid) {
  const decoded = new CID(inputCid)
  return decoded.toJSON()
}

function setOutput (output, value) {
  window.location.hash = value
  try {
    output.innerText = JSON.stringify(decodeCID(value), null, 2)
  } catch (err) {
    output.innerText = err
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const output = document.querySelector('#output')
  const input = document.querySelector('#input-cid')
  if (input.value) {
    setOutput(output, input.value.trim())
  }
  if (window.location.hash !== "") {
    setOutput(output, window.location.hash.substr(1))
    input.value = window.location.hash.substr(1)
  }
  input.addEventListener('keyup', (ev) => {
    setOutput(output, ev.target.value.trim())
  })
})
