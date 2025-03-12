import { CID } from 'multiformats/cid'
import { bases } from 'multiformats/basics'
import PeerId from 'peer-id'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import runes from 'runes2'
import codecs from './codecs.json'
import './telemetry.js'

// Label's max length in DNS (https://tools.ietf.org/html/rfc1034#page-7)
const dnsLabelMaxLength = 63

const basesByPrefix = Object.keys(bases).reduce((acc, curr) => {
  acc[bases[curr].prefix] = bases[curr]
  return acc
}, {})


// cidv0 ::= <multihash-content-address>
// QmRds34t1KFiatDY6yJFj8U9VPTLvSMsR63y7qdUV3RMmT
// <cidv1> ::= <multibase-prefix><cid-version><multicodec-content-type><multihash-content-address>
// zb2rhiVd5G2DSpnbYtty8NhYHeDvNkPxjSqA7YbDPuhdihj9L
function decodeCID (value) {
  const prefix = runes.substr(value, 0, 1)
  const base = basesByPrefix[prefix]
  const cid = CID.parse(value, base)

  return {
    cid,
    multibase: cid.version === 0 ? bases.base58btc : base,
    multicodec: codecs[cid.code],
    multihash: {
      ...cid.multihash,
      name: codecs[cid.multihash.code].name
    }
  }
}

// Function to visualize CID segments
function visualizeCIDSegments(cidData) {
  if (!cidData || !cidData.cid) return ''

  const segments = []
  const cid = cidData.cid
  const multibase = cidData.multibase

  // For CIDv0, we only have a hash
  if (cid.version === 0) {
    // CIDv0 is just a multihash in base58btc
    const multihashDigestInHex = uint8ArrayToString(cidData.multihash.digest, 'base16').toUpperCase()

    segments.push({
      value: cid.toString(),
      class: 'segment-multihash-digest',
      tooltip: `CIDv0 Multihash (${cidData.multihash.name}): ${multihashDigestInHex}`
    })

    return segments
  }

  // For CIDv1, we need to work with the binary representation
  // and then map it back to the encoded string

  // The multibase prefix is just the first character in the string representation
  const cidStr = cid.toString()
  const prefix = cidStr.charAt(0)

  segments.push({
    value: prefix,
    class: 'segment-multibase',
    tooltip: `Multibase prefix: ${multibase.name}`
  })

  // The rest of the segments need to be mapped from binary positions to string positions
  // This is complex because different multibase encodings have different character lengths

  // For simplicity, it uses the following approach:
  // 1. Decode the CID string (without prefix) to get the binary
  // 2. Identify the binary segments
  // 3. Re-encode each binary segment with the same multibase

  // The version is always a single byte (varint encoded)
  segments.push({
    value: cidStr.charAt(1),
    class: 'segment-version',
    tooltip: `CID Version: ${cid.version}`
  })

  // For the remaining segments, we'll use approximate positions
  // This is not 100% accurate for all encodings, but works for demonstration

  // Calculate approximate positions based on the codec and multihash
  const codecLength = getApproximateEncodedLength(cidData.multicodec.code, multibase)
  const startPos = 2 // After prefix and version

  segments.push({
    value: cidStr.substring(startPos, startPos + codecLength),
    class: 'segment-codec',
    tooltip: `Codec: ${cidData.multicodec.name} (${paddedCodeHex(cidData.multicodec.code)})`
  })

  // Multihash has three parts: function code, digest length, and digest
  const multihashStartPos = startPos + codecLength
  const multihashFnLength = getApproximateEncodedLength(cidData.multihash.code, multibase)

  segments.push({
    value: cidStr.substring(multihashStartPos, multihashStartPos + multihashFnLength),
    class: 'segment-multihash-fn',
    tooltip: `Multihash function: ${cidData.multihash.name} (${paddedCodeHex(cidData.multihash.code)})`
  })

  // Multihash length
  const multihashLenPos = multihashStartPos + multihashFnLength
  const multihashLenLength = 1 // Usually just one character in the encoded form

  segments.push({
    value: cidStr.substring(multihashLenPos, multihashLenPos + multihashLenLength),
    class: 'segment-multihash-len',
    tooltip: `Multihash length: ${cidData.multihash.size} bytes`
  })

  // Multihash digest (the rest of the string)
  const digestPos = multihashLenPos + multihashLenLength
  const multihashDigestInHex = uint8ArrayToString(cidData.multihash.digest, 'base16').toUpperCase()

  segments.push({
    value: cidStr.substring(digestPos),
    class: 'segment-multihash-digest',
    tooltip: `Multihash digest: ${multihashDigestInHex} (${cidData.multihash.size} bytes)`
  })

  return segments
}

// Helper function to estimate string length based on the code and multibase
function getApproximateEncodedLength(code, multibase) {
  // This is a rough approximation

  // For small codes (0-127), most encodings use 1-2 characters
  if (code < 128) {
    if (multibase.name === 'base16') return 2
    if (multibase.name === 'base32') return 1
    if (multibase.name === 'base58btc') return 1
    if (multibase.name === 'base64') return 1
    return 1
  }

  // For larger codes, the length increases
  if (multibase.name === 'base16') return 4
  if (multibase.name === 'base32') return 2
  if (multibase.name === 'base58btc') return 2
  if (multibase.name === 'base64') return 2
  return 2
}

function toDNSPrefix(cid) {
  const cidb32 = cid.toV1().toString(bases.base32)
  if (cidb32.length <= dnsLabelMaxLength) return cidb32
  const cidb36 = cid.toV1().toString(bases.base36)
  if (cidb36.length <= dnsLabelMaxLength) return cidb36
  return 'CID incompatible with DNS label length limit of 63'
}

// Converts number to format of 'code' column
// at https://github.com/multiformats/multicodec/blob/master/table.csv
function paddedCodeHex (code) {
  let n = code
  if (typeof code !== 'number') {
    n = Number(code)
    if (isNaN(n)) return code // eg. 'implicit' in CIDv0
  }
  let hex = n.toString(16)
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`
  }
  return `0x${hex}`
}

function normalizeUrl() {
  // normalize to .tech tld:
  // https://github.com/protocol/bifrost-infra/issues/2018#issue-1319432302
  const { href } = window.location
  if (href.includes('cid.ipfs.io')) {
    window.location.replace(href.replace('cid.ipfs.io', 'cid.ipfs.tech'))
  }
  if (href.includes('cid-ipfs-io')) {
    window.location.replace(href.replace('cid-ipfs-io', 'cid-ipfs-tech'))
  }

}

// Function to render CID segments visualization
function renderCIDSegments(segments, container) {
  if (!segments || !segments.length) {
    container.innerHTML = '<div class="pa3 gray i">Enter a valid CID to visualize its segments</div>'
    return
  }

  const segmentsContainer = document.createElement('div')
  segmentsContainer.className = 'flex flex-wrap justify-start items-center'

  segments.forEach(segment => {
    const segmentEl = document.createElement('div')
    segmentEl.className = `cid-segment ${segment.class}`
    segmentEl.textContent = segment.value

    // Add a data attribute for the segment type to help with styling
    segmentEl.setAttribute('data-segment-type', segment.class.replace('segment-', ''))

    const tooltip = document.createElement('div')
    tooltip.className = 'segment-tooltip'
    tooltip.textContent = segment.tooltip

    segmentEl.appendChild(tooltip)
    segmentsContainer.appendChild(segmentEl)

    // For multihash digest segments, add a special class but don't truncate
    if (segment.class === 'segment-multihash-digest') {
      segmentEl.classList.add('full-width-digest');
    }
  })

  container.innerHTML = ''
  container.appendChild(segmentsContainer)
}

// Function to convert a byte to hex string representation
function byteToHex(byte) {
  return byte.toString(16).padStart(2, '0')
}

document.addEventListener('DOMContentLoaded', () => {
  const output = document.querySelector('#cid')
  const details = document.querySelector('#outputs')
  const input = document.querySelector('#input-cid')
  const multihashOutput = document.querySelector('#multihash')
  const multicodecOutput = document.querySelector('#multicodec')
  const multibaseOutput = document.querySelector('#multibase')
  const base32CidV1Output = document.querySelector('#base32cidv1')
  const cidByteLengthBinOutput = document.querySelector('#cidbytelengthbin')
  const cidByteLengthBase32Output = document.querySelector('#cidbytelengthbase32')
  const inputByteLengthContainer = document.querySelector("#cid-input-byte-length")
  const inputByteLengthLabel = document.querySelector('#cid-base-label')
  const inputByteLength = document.querySelector('#cidbytelength-input')
  const dns = document.querySelector('#dns')
  const dnsCidV1Output = document.querySelector('#dnscidv1')
  const humanReadableCidOutput = document.querySelector('#hr-cid')
  const errorOutput = document.querySelector('#input-error')

  // New UI elements
  const cidSegmentsContainer = document.querySelector('#cid-segments')

  let currentCidData = null

  function clearErrorOutput () {
    errorOutput.innerText = ''
    errorOutput.style.opacity = 0
  }

  function setOutput (output, value) {
    window.location.hash = value
    try {
      const data = decodeCID(value.trim())
      console.log(data)
      currentCidData = data

      const multihashDigestInHex = uint8ArrayToString(data.multihash.digest, 'base16').toUpperCase()
      const hrCid = `${data.multibase.name} - cidv${data.cid.version} - ${data.multicodec.name} - (${data.multihash.name} : ${data.multihash.size * 8} : ${multihashDigestInHex})`
      humanReadableCidOutput.innerText = hrCid

      multibaseOutput.innerHTML = toDefinitionList({
        prefix: data.cid.version == 0 ? 'implicit' : data.multibase.prefix,
        name: data.multibase.name
      })

      multicodecOutput.innerHTML = toDefinitionList({
        code: paddedCodeHex(data.multicodec.code),
        name: data.multicodec.name, description:
        data.multicodec.description
      })

      multihashOutput.innerHTML = toDefinitionList({
        code: paddedCodeHex(data.multihash.code),
        name: data.multihash.name,
        bits: data.multihash.size * 8,
        [`digest (${data.multibase.name} multibase)`]: data.multibase.encode(data.multihash.bytes),
        'digest (hex)': multihashDigestInHex
      })

      const cidb32 = data.cid.toV1().toString()
      base32CidV1Output.innerHTML = cidb32
      cidByteLengthBinOutput.innerHTML = data.cid.byteLength
      cidByteLengthBase32Output.innerHTML = new Blob([data.cid.toString()]).size

      // Display the byte length of the input and hide if it's base32 (since it will always show)
      inputByteLengthContainer.style.display = (data.multibase.name === 'base32') ? 'none' : 'block'
      inputByteLengthLabel.innerHTML = "As " + data.multibase.name + " string (Bytes)"
      inputByteLength.innerHTML = new Blob([value.trim()]).size

      const dnsPrefix = toDNSPrefix(data.cid)
      dns.style.display = cidb32 !== dnsPrefix ? '' : 'none'
      dnsCidV1Output.innerHTML = dnsPrefix

      // Update CID segment visualization
      const segments = visualizeCIDSegments(data)
      renderCIDSegments(segments, cidSegmentsContainer)

      clearErrorOutput()
      details.style.opacity = 1
    } catch (err) {
      details.style.opacity = 0
      if (!value) {
        clearErrorOutput()
      } else {
        try {
          const peerId = PeerId.createFromB58String(value)
          const { cid } = decodeCID(peerId.toString())
          const peerIdCid = cid.toV1().toString(bases.base32)
          err = new Error(`The value is a Peer ID. Try using its CID representation: ${peerIdCid}`)
        } catch (_) {  }
        console.error(err.message || err)
        errorOutput.innerText = err.message || err
        errorOutput.style.opacity = 1
      }
    }
  }

  if (input.value) {
    setOutput(output, input.value.trim())
  }
  if (window.location.hash !== '') {
    const value = decodeURIComponent(window.location.hash.substring(1))
    setOutput(output, value)
    input.value = value
  }
  input.addEventListener('keyup', (ev) => {
    setOutput(output, ev.target.value.trim())
  })
  normalizeUrl()
})

function toDefinitionList (obj) {
  const keys = Object.keys(obj)
  const html = `
    <dl class='tl ma0 pa0'>
      ${ keys.map(k => `
        <div class='pb1'>
          <dt class='dib pr2 sans-serif charcoal-muted ttu f7 tracked'>${k}:</dt>
          <dd class='dib ma0 pa0 fw5 overflow-x-auto overflow-y-hidden w-100'>${obj[k]}</dd>
        </div>`).join('') }
    </dl>
  `
  return html
}
