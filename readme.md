# IPFS CID Inspector

<img alt="CID Inspector screenshot" src="https://gateway.ipfs.io/ipfs/QmfEXQC3RktNYZt1YAo91Vse5S3DWQ7AS9BbsZ9Y5ruqmp">

A website for decoding CIDs

- dev: `npm start`
- build: `npm run build`
- add to ipfs: `npm run deploy`

Linux users: If you see `Error: ENOSPC: no space left on device` errors, crank up your max inotify watches:

```
sysctl -w fs.inotify.max_user_watches=524288
echo "fs.inotify.max_user_watches=524288" >>/etc/sysctl.conf
```

---

License MIT 2018
