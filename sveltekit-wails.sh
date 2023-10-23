manager=$1
project=$2
brand=$3
wails init -n $project -t svelte
cd $project
sed -i "s|npm|$manager|g" wails.json
sed -i 's|"auto",|"auto",\n  "wailsjsdir": "./frontend/src/lib",|' wails.json
sed -i "s|all:frontend/dist|all:frontend/build|" main.go
if [[ -n $brand ]]; then
    mv frontend/src/App.svelte +page.svelte
    sed -i "s|'./assets|'\$lib/assets|" +page.svelte
    sed -i "s|'../wails|'\$lib/wails|" +page.svelte
    mv frontend/src/assets .
fi
rm -r frontend
$manager create svelte@latest frontend
if [[ -n $brand ]]; then
    mv +page.svelte frontend/src/routes/+page.svelte
    mkdir frontend/src/lib
    mv assets frontend/src/lib/
fi
cd frontend
$manager i
$manager uninstall @sveltejs/adapter-auto
$manager i -D @sveltejs/adapter-static
echo -e "export const prerender = true\nexport const ssr = false" >src/routes/+layout.ts
sed -i "s|-auto';|-static';|" svelte.config.js
cd ..
wails dev
