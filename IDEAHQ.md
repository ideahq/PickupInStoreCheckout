### Deploy to theme

```
sudo n 12
npx webpack --mode production
cd ../petdirect-theme
git rm -r assets/checkout-js
cd ../checkout-js
cp -r dist/ ../petdirect-theme/assets/checkout-js
```
