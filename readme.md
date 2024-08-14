# IPFS CID Inspector

<!-- TODO fix img alt="CID Inspector screenshot" src="https://ipfs.io/ipfs/QmehVjDE5yAZC8TjqcqrQYpYj2hoBMFVCFUNKe21jEMY3Z" -->

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
