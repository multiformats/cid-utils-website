# IPFS CID Inspector

<img width="1117" alt="screenshot 2018-02-21 12 06 38" src="https://user-images.githubusercontent.com/58871/36479196-b6da0a28-16ff-11e8-9949-d8cb72343367.png">

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
