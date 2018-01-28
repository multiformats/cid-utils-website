const CID = require('cids')
const multihash = require('multihashes')
// const multibase = require('multibase')
const multibases = require('multibase/src/constants')

function decodeCID (inputCid) {
  const decoded = new CID(inputCid)
  return decoded.toJSON()
}

document.addEventListener('DOMContentLoaded', () => {
  const output = document.querySelector('#cid')
  const input = document.querySelector('#input-cid')
  const multihashOutput = document.querySelector('#multihash')
  const multibaseOutput = document.querySelector('#multibase')

  function setOutput (output, value) {
    window.location.hash = value
    try {
      const cid = decodeCID(value)
      // cidv0 ::= <multihash-content-address>
      // QmRds34t1KFiatDY6yJFj8U9VPTLvSMsR63y7qdUV3RMmT
      // <cidv1> ::= <multibase-prefix><cid-version><multicodec-packed-content-type><multihash-content-address>
      // zb2rhiVd5G2DSpnbYtty8NhYHeDvNkPxjSqA7YbDPuhdihj9L
      if (cid.version === 0) {
        multibaseOutput.innerText = `Multibase: base58btc`
      }
      if (cid.version === 1) {
        const code = value.substring(0, 1)
        const multibaseCode = multibases.codes[code]
        multibaseOutput.innerText = `Multibase: ${multibaseCode.name}`
      }
      const mh = multihash.decode(cid.hash)
      output.innerText = `Codec: ${cid.codec} Version: ${cid.version}`
      multihashOutput.innerText = `Code: ${mh.code} Hash Function: ${mh.name} Length: ${mh.length}`
    } catch (err) {
      output.innerText = err
    }
  }

  if (input.value) {
    setOutput(output, input.value.trim())
  }
  if (window.location.hash !== '') {
    setOutput(output, window.location.hash.substr(1))
    input.value = window.location.hash.substr(1)
  }
  input.addEventListener('keyup', (ev) => {
    setOutput(output, ev.target.value.trim())
  })
})
