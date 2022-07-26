import { CID } from 'multiformats/cid'
import { hashes, bases } from 'multiformats/basics'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import runes from 'runes2'

// Label's max length in DNS (https://tools.ietf.org/html/rfc1034#page-7)
const dnsLabelMaxLength = 63

const hashesCodeToName = Object.keys(hashes).reduce((acc, curr) => {
  acc[hashes[curr].code] = hashes[curr].name
  return acc
}, {})

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
    multibase: cid.version === 0 ? {
      name: 'base58btc',
      prefix: 'implicit'
    } : basesByPrefix[prefix],
    multicodec: {
      name: 'TODO: Get Name From Code',
      code: cid.code
    },
    multihash: {
      ...cid.multihash,
      name: hashesCodeToName[cid.multihash.code]
    }
  }
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

document.addEventListener('DOMContentLoaded', () => {
  const output = document.querySelector('#cid')
  const details = document.querySelector('#outputs')
  const input = document.querySelector('#input-cid')
  const multihashOutput = document.querySelector('#multihash')
  const multicodecOutput = document.querySelector('#multicodec')
  const multibaseOutput = document.querySelector('#multibase')
  const base32CidV1Output = document.querySelector('#base32cidv1')
  const dns = document.querySelector('#dns')
  const dnsCidV1Output = document.querySelector('#dnscidv1')
  const humanReadableCidOutput = document.querySelector('#hr-cid')
  const errorOutput = document.querySelector('#input-error')

  function clearErrorOutput () {
    errorOutput.innerText = ''
    errorOutput.style.opacity = 0
  }

  function setOutput (output, value) {
    window.location.hash = value
    try {
      const data = decodeCID(value.trim())
      console.log(data)
      const multihashDigestInHex = uint8ArrayToString(data.multihash.digest, 'base16').toUpperCase()
      const hrCid = `${data.multibase.name} - cidv${data.cid.version} - ${data.cid.code /* TODO:NAME */} - (${data.multihash.name} : ${data.multihash.size * 8} : ${multihashDigestInHex})`
      humanReadableCidOutput.innerText = hrCid
      multibaseOutput.innerHTML = toDefinitionList({prefix: data.multibase.prefix, name: data.multibase.name})
      multicodecOutput.innerHTML = toDefinitionList({code: paddedCodeHex(data.multicodec.code), name: data.multicodec.name})
      multihashOutput.innerHTML = toDefinitionList({code: paddedCodeHex(data.multihash.code), name: data.multihash.name, bits: data.multihash.size * 8, 'digest (hex)': multihashDigestInHex})

      const cidb32 = data.cid.toV1().toString()
      base32CidV1Output.innerHTML = cidb32
      const dnsPrefix = toDNSPrefix(data.cid)
      dns.style.visibility = cidb32 !== dnsPrefix ? 'visible' : 'hidden'
      dnsCidV1Output.innerHTML = dnsPrefix

      clearErrorOutput()
      details.style.opacity = 1
    } catch (err) {
      details.style.opacity = 0
      if (!value) {
        clearErrorOutput()
      } else {
        console.log(err.message || err)
        errorOutput.innerText = err.message || err
        errorOutput.style.opacity = 1
      }
    }
  }
  if (input.value) {
    setOutput(output, input.value.trim())
  }
  if (window.location.hash !== '') {
    setOutput(output, decodeURIComponent(window.location.hash.substring(1)))
    input.value = decodeURIComponent(window.location.hash.substring(1))
  }
  input.addEventListener('keyup', (ev) => {
    setOutput(output, ev.target.value.trim())
  })
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
