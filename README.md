### API version local
https://pharma-api-server.vercel.app/

#### Fix can not find module /var/task
```
git rm -r --cached .
git add --all .
git commit -a -m "Versioning untracked files"
git push origin master
```
https://stackoverflow.com/questions/62378045/how-to-fix-next-js-vercel-deployment-module-not-found-error