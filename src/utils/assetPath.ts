// Resolves a root-relative path (as stored in the scraped dataset, e.g.
// "/images/mandals/gajuwaka.png") against Vite's configured base path, so
// assets still resolve correctly when the site is deployed under a subpath
// (e.g. GitHub Pages' https://user.github.io/repo-name/).
export function assetPath(rootRelativePath: string): string {
    return import.meta.env.BASE_URL + rootRelativePath.replace(/^\//, '')
}
