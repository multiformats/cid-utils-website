import fetch from 'node-fetch'
import fs from 'fs'

(async () => {
  const req = await fetch('https://raw.githubusercontent.com/multiformats/multicodec/master/table.csv')
  const table = await req.text()

  const codes = table.split('\n')
    .slice(1)
    .map(r => r.trim())
    .filter(r => r !== '')
    .map(row => {
      const [name, tag, code, status, description] = row.split(',')
      return {
        name: name.trim(),
        tag: tag.trim(),
        status: status.trim(),
        description: description.trim(),
        code: parseInt(code.trim(), 16)
      }
    })
    .reduce((acc, curr) => {
      acc[curr.code] = curr
      return acc
    }, {})

  fs.writeFileSync('./codecs.json', JSON.stringify(codes, null, '  '))
})();
