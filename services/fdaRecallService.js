const prisma = require('../db');
const { getRecallsByUPC } = require('./fdaClient');

class FDARecallService {
    constructor() {
        this.lastChecked = null;
    }

    async fetchRecentRecalls(fromDate = null) {
        if (!fromDate) {
            fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 365);
        }

        const from = fromDate.toISOString().slice(0, 10).replace(/-/g, '');
        const to = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const res = await fetch(`https://api.fda.gov/food/enforcement.json?search=report_date:[${from}+TO+${to}]&limit=100`);
        const data = await res.json();
        return this.parseRecallData(data);
    }

    parseRecallData(fdaResponse) {
        if (!fdaResponse.results) return [];

        return fdaResponse.results.map(r => ({
            classification: r.classification,
            description: r.reason_for_recall || 'No description provided',
            recall_date: this.parseDate(r.report_date),
            company: r.recalling_firm,
            regions: r.state ? [r.state] : [],
            productDescription: r.product_description,
            isActive: true,
            amountSick: 0,
            amountDead: 0,
            productKeywords: this.extractKeywords(r.product_description, r.reason_for_recall),
            extractedUPCs: this.extractUPCs(r.product_description),
            recallingFirm: r.recalling_firm
        }));
    }

    extractUPCs(productDescription) {
        if (!productDescription) return [];

        const patterns = [
            /UPC\s*:?\s*(\d{5}\s*\d{5}\s*\d+)/gi,
            /UPC\s*:?\s*(\d{12,14})/gi,
            /UPC\s*#?\s*(\d{5}\s*\d{5}\s*\d+)/gi,
            /\b(\d{12,14})\b/g
        ];

        const upcs = [];
        for (const pattern of patterns) {
            for (const match of productDescription.matchAll(pattern)) {
                const upc = match[1].replace(/\s/g, '');
                if (upc.length >= 12 && upc.length <= 14) upcs.push(upc);
            }
        }
        return [...new Set(upcs)];
    }

    extractKeywords(productDescription = '', recallReason = '') {
        const text = `${productDescription} ${recallReason}`.toLowerCase();
        const keywords = text.match(/\b(chicken|beef|pork|fish|milk|cheese|bread|rice|pasta|sauce|salad|frozen|canned|organic|gluten|dairy|nuts|eggs|soy|wheat)\b/g) || [];
        return [...new Set(keywords)].join(' ');
    }

    parseDate(str) {
        if (!str || str.length !== 8) return new Date();
        return new Date(str.substring(0, 4), str.substring(4, 6) - 1, str.substring(6, 8));
    }

    async saveRecalls(recalls) {
        const newRecalls = [];
        for (const recallData of recalls) {
            try {
                const existing = await prisma.recalls.findFirst({
                    where: { description: recallData.description, company: recallData.company, recall_date: recallData.recall_date }
                });

                if (!existing) {
                    let productId = await this.findMatchingProduct(recallData);
                    if (!productId) productId = await this.createGenericProduct(recallData);

                    const newRecall = await prisma.recalls.create({
                        data: {
                            product_id: productId,
                            is_active: recallData.isActive,
                            description: recallData.description,
                            recall_date: recallData.recall_date,
                            company: recallData.company,
                            regions: recallData.regions.join(', '),
                            amount_sick: recallData.amountSick,
                            amount_dead: recallData.amountDead,
                            product_keywords: recallData.productKeywords,
                            classification: recallData.classification
                        }
                    });
                    newRecalls.push(newRecall);
                    console.log(`Added new recall: ${newRecall.description}`);
                }
            } catch (error) {
                console.error('Error saving recall:', error);
            }
        }
        return newRecalls;
    }

    async findMatchingProduct(recallData) {
        if (recallData.extractedUPCs?.length > 0) {
            for (const upc of recallData.extractedUPCs) {
                const normalized = upc.replace(/^0+/, '') || '0';
                const product = await prisma.products.findFirst({
                    where: { OR: [{ upc }, { upc: normalized }] }
                });
                if (product) return product.product_id;
            }
        }

        if (recallData.recallingFirm) {
            const brandKeywords = recallData.recallingFirm.toLowerCase().split(/[\s,&]+/);
            const matches = await prisma.products.findMany({
                where: { OR: brandKeywords.filter(kw => kw.length > 2).map(kw => ({ brand: { contains: kw } })) }
            });
            if (matches.length > 0) return matches[0].product_id;
        }

        const keywords = recallData.productKeywords.split(' ').filter(k => k.length > 3);
        if (keywords.length === 0) return null;

        const matches = await prisma.products.findMany({
            where: { OR: keywords.map(kw => ({ OR: [{ product_name: { contains: kw } }, { brand: { contains: kw } }] })) }
        });
        return matches.length > 0 ? matches[0].product_id : null;
    }

    async createGenericProduct(recallData) {
        const product = await prisma.products.create({
            data: { upc: '0', product_name: recallData.productDescription.substring(0, 100), brand: recallData.company, image_link: null }
        });
        return product.product_id;
    }

    async checkRecallsByUPC(upc, productId) {
        const results = await getRecallsByUPC(upc);
        let count = 0;
        for (const r of results) {
            const existing = await prisma.recalls.findFirst({
                where: { description: r.reason_for_recall, company: r.recalling_firm }
            });
            if (existing) continue;

            await prisma.recalls.create({
                data: {
                    product_id: productId,
                    is_active: true,
                    description: r.reason_for_recall || 'No description provided',
                    recall_date: this.parseDate(r.report_date),
                    company: r.recalling_firm,
                    regions: r.state || '',
                    classification: r.classification || ''
                }
            });
            count++;
        }
        return count;
    }

    async checkForNewRecalls() {
        console.log('Starting FDA recall check...');
        const recalls = await this.fetchRecentRecalls();
        console.log(`Found ${recalls.length} recent recalls from FDA`);
        const newRecalls = await this.saveRecalls(recalls);
        console.log(`Added ${newRecalls.length} new recalls to database`);
        this.lastChecked = new Date();
        return newRecalls;
    }
}

module.exports = FDARecallService;
