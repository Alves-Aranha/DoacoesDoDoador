// Utilitário para carregar o logo da instituição como data URL (base64).
// Motivo: quando o app roda em um NOVO diretório / subcaminho, caminhos
// relativos à raiz ("/logo-instituicao.png") quebram dentro dos iframes de
// impressão (base "about:blank") e no jsPDF (doc.addImage com URL).
// Carregar o PNG via fetch -> blob -> data URL torna o logo imune a isso.

let logoCache = null;
let logo01Cache = null;
let loadingPromise = null;

async function fetchAsDataUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao carregar logo: ' + url + ' (status ' + res.status + ')');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Falha ao ler logo'));
        reader.readAsDataURL(blob);
    });
}

// Retorna a URL absoluta do logo (origin + cache-buster), resolvendo corretamente
// mesmo dentro de iframes de impressão (base about:blank) e em subcaminhos.
export function getLogoUrl(filename) {
    return window.location.origin + '/' + filename + '?t=' + new Date().getTime();
}

// Carrega /logo-instituicao.png uma única vez e guarda em cache.
export async function getLogoDataUrl() {
    if (logoCache) return logoCache;
    if (!loadingPromise) {
        loadingPromise = fetchAsDataUrl(window.location.origin + '/logo-instituicao.png')
            .then(function(d) {
                logoCache = d;
                return d;
            })
            .catch(function(err) {
                loadingPromise = null; // permite nova tentativa
                throw err;
            });
    }
    return loadingPromise;
}

// Carrega /logo-instituicao01.png uma única vez e guarda em cache.
export async function getLogo01DataUrl() {
    if (logo01Cache) return logo01Cache;
    const d = await fetchAsDataUrl(window.location.origin + '/logo-instituicao01.png');
    logo01Cache = d;
    return d;
}
