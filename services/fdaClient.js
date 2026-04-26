const FDA_BASE_URL = 'https://api.fda.gov';

async function fdaFetch(path) {
    const res = await fetch(`${FDA_BASE_URL}${path}`);
    return res.json();
}

async function getRecallsByUPC(upc) {
    const data = await fdaFetch(`/food/enforcement.json?search=product_description:%22${upc}%22&limit=10`);
    return data.results || [];
}

async function getRecallCountSince(date) {
    const from = date.toISOString().slice(0, 10).replace(/-/g, '');
    const to = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const data = await fdaFetch(`/food/enforcement.json?search=report_date:[${from}+TO+${to}]&limit=1`);
    return data.meta?.results?.total || 0;
}

async function getRecallCountAllTime() {
    const data = await fdaFetch('/food/enforcement.json?limit=1');
    return data.meta?.results?.total || 0;
}

module.exports = { getRecallsByUPC, getRecallCountSince, getRecallCountAllTime };
