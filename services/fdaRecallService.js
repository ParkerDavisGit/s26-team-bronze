const prisma = require('../db');

class FDARecallService {
    constructor() {
        this.lastChecked = null;
    }

    async fetchRecentRecalls(days = 30, fromDate = null) {
        if (!fromDate) {
            fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);
        }

        const from = fromDate.toISOString().slice(0, 10).replace(/-/g, '');
        const to = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const res = await fetch(`https://api.fda.gov/food/enforcement.json?search=report_date:[${from}+TO+${to}]&limit=100&sort=report_date:desc`);
        const data = await res.json();
        return this.parseRecallData(data);
    }

    parseRecallData(fdaResponse) {
        if (!fdaResponse.results) return [];

        return fdaResponse.results.map(r => ({
            classification: r.classification,
            reason_for_recall: r.reason_for_recall || 'No description provided',
            recall_date: this.parseDate(r.recall_initiation_date || r.report_date),
            report_date: this.parseDate(r.report_date),
            recall_number: r.recall_number || null,
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
            /(\d(\s*|-)\d{4,5}(\s*|-)\d{4,5}(\s*|-)\d+)/gi,
            /(\d{5}\s*\d{5}\s*\d+)/gi,
            /(\d\s*\d{5}\s*\d{5}\s*\d+)/gi,
            /(\d{11,14})/gi,
            /(\d{11,14})/gi,
            /(\d{5}\s*\d{5}\s*\d+)/gi,
            /(\d-\d{5}-\d{5}-\d+)/gi,
            /(\d{5}-\d{5}-\d+)/gi,
            /(\d{5}-\d{5}-\d+)/gi,
            /(\d-\d{5}-\d{5}-\d+)/gi,
            /\b(\d{11,14})\b/g
        ];

        const upcs = [];
        for (const pattern of patterns) {
            for (const match of productDescription.matchAll(pattern)) {
                const upc = match[0].replaceAll(/\s/g, '').replaceAll('-', '');
                if (upc.length >= 11 && upc.length <= 14) upcs.push(upc);
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
                    where: { reason_for_recall: recallData.reason_for_recall, company: recallData.company, recall_date: recallData.recall_date }
                });

                if (!existing) {
                    let productId = await this.findMatchingProduct(recallData);
                    if (!productId) productId = await this.createGenericProduct(recallData);

                    const newRecall = await prisma.recalls.create({
                        data: {
                            product_id: productId,
                            is_active: recallData.isActive,
                            reason_for_recall: recallData.reason_for_recall,
                            recall_date: recallData.recall_date,
                            report_date: recallData.report_date,
                            recall_number: recallData.recall_number,
                            company: recallData.company,
                            regions: recallData.regions.join(', '),
                            amount_sick: recallData.amountSick,
                            amount_dead: recallData.amountDead,
                            product_keywords: recallData.productKeywords,
                            classification: recallData.classification
                        }
                    });
                    newRecalls.push(newRecall);
                    console.log(`Added new recall: ${newRecall.reason_for_recall}`);
                }
                else {

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

        // if (recallData.recallingFirm) {
        //     const brandKeywords = recallData.recallingFirm.toLowerCase().split(/[\s,&]+/);
        //     const matches = await prisma.products.findMany({
        //         where: { OR: brandKeywords.filter(kw => kw.length > 2).map(kw => ({ brand: { contains: kw } })) }
        //     });
        //     if (matches.length > 0) return matches[0].product_id;
        // }

        // const keywords = recallData.productKeywords.split(' ').filter(k => k.length > 3);
        // if (keywords.length === 0) return null;

        // const matches = await prisma.products.findMany({
        //     where: { OR: keywords.map(kw => ({ OR: [{ product_name: { contains: kw } }, { brand: { contains: kw } }] })) }
        // });
        return null;
    }

    async createGenericProduct(recallData) {
        // Product does not exist. Create a new one
        let apiData = null;
        for(const potentialUpc of recallData.extractedUPCs) {
            const apiUrl = `https://world.openfoodfacts.net/api/v2/product/${potentialUpc}.json`;
            const response = await fetch(apiUrl)
            apiData = await response.json();

            if (apiData.status === 1) {
                break;
            }
        }
        
        // If the api cannot find any valid upcs at all, create a generic product
        if (!apiData || apiData.status === 0) {
            console.log("Recalled product code cannot be found, creating generic Product.");
            const product = await prisma.products.create({
                data: { upc: recallData.extractedUPCs[0] || '0', product_name: recallData.productDescription, brand: recallData.company, image_link: null }
            });
            return product.product_id;
        }


        // Status 1 means the product was found in the external database
        // Extract product details, provide fallback strings if null
        const upc = apiData.code;
        const newProductName = apiData.product.product_name || "Unknown Product";
        const newBrand = apiData.product.brands || "Unknown Brand";
        const imageLink = apiData.product.image_front_url || apiData.product.image_url || null;
        const allergens = (apiData.product.allergens_tags || [])
            .map(a => a.replace('en:', ''))
            .join(', ') || null;

        // Manually calculate the next product_id (Auto-increment workaround)
        // const lastProduct = await prisma.products.findFirst({
        //     orderBy: { product_id: 'desc' }
        // });
        // const nextProductId = lastProduct ? lastProduct.product_id + 1 : 1;

        // Save this new product to the local Products table
        let existingProduct = await prisma.products.create({
            data: {
                upc: String(upc),
                product_name: newProductName,
                brand: newBrand,
                image_link: imageLink,
                allergens: allergens
            }
        });
        
        console.log("New product successfully saved to local database!");
        

        
        console.log("New item added to pantry successfully:", upc);



        return existingProduct.product_id;
    }

    async checkForNewRecalls(days = 30) {
        console.log(`Starting FDA recall check (past ${days} days)...`);
        const recalls = await this.fetchRecentRecalls(days);
        console.log(`Found ${recalls.length} recent recalls from FDA`);
        const newRecalls = await this.saveRecalls(recalls);
        console.log(`Added ${newRecalls.length} new recalls to database`);
        this.lastChecked = new Date();
        return newRecalls;
    }
}

module.exports = FDARecallService;
