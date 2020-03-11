### Deploy to theme

```
sudo n 12
npx webpack --mode production
# ?? git rm -r ../petdirect-theme/assets/checkout-js
cp -r dist/ ../petdirect-theme/assets/checkout-js
```
