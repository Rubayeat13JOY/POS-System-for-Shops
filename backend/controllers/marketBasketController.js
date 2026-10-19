const Sale = require('../models/Sale');
const SaleDetail = require('../models/SaleDetail');
const Product = require('../models/Product');

exports.analyzeMarketBasket = async (req, res) => {
  try {
    // Configurable thresholds (can be passed as query params)
    const MIN_SUPPORT = parseFloat(req.query.min_support) || 0.01;
    const MIN_CONFIDENCE = parseFloat(req.query.min_confidence) || 0.1;

    // Step 1: Get all sales with their product IDs
    const sales = await Sale.findAll({
      include: [{ model: SaleDetail, attributes: ['product_id'] }]
    });

    const totalInvoices = sales.length;

    if (totalInvoices === 0) {
      return res.status(200).json({
        message: 'No sales data available yet',
        total_invoices_analyzed: 0,
        pairs_found: 0,
        pairs: []
      });
    }

    // Step 2: Build baskets (list of product IDs per invoice)
    const baskets = sales.map(sale =>
      [...new Set(sale.SaleDetails.map(d => d.product_id))]
    );

    // Step 3: Count how many invoices contain each individual product
    const itemCount = {};
    baskets.forEach(basket => {
      basket.forEach(item => {
        itemCount[item] = (itemCount[item] || 0) + 1;
      });
    });

    // Step 4: Count how many invoices contain each PAIR of products
    const pairCount = {};
    baskets.forEach(basket => {
      for (let i = 0; i < basket.length; i++) {
        for (let j = i + 1; j < basket.length; j++) {
          // Always sort the pair so [1,3] and [3,1] are treated as the same pair
          const pairKey = [basket[i], basket[j]].sort((a, b) => a - b).join('-');
          pairCount[pairKey] = (pairCount[pairKey] || 0) + 1;
        }
      }
    });

    // Step 5: Calculate support and confidence for each pair
    const results = [];

    for (const pairKey in pairCount) {
      const [productA, productB] = pairKey.split('-').map(Number);
      const pairFrequency = pairCount[pairKey];

      // Support = how often this pair appears across ALL invoices
      const support = pairFrequency / totalInvoices;
      if (support < MIN_SUPPORT) continue;

      // Confidence A→B = when A is bought, how often is B also bought?
      const confidenceAtoB = pairFrequency / itemCount[productA];
      // Confidence B→A = when B is bought, how often is A also bought?
      const confidenceBtoA = pairFrequency / itemCount[productB];

      if (confidenceAtoB < MIN_CONFIDENCE && confidenceBtoA < MIN_CONFIDENCE) continue;

      results.push({
        product_a_id: productA,
        product_b_id: productB,
        times_bought_together: pairFrequency,
        support_percent: parseFloat((support * 100).toFixed(2)),
        confidence_a_to_b_percent: parseFloat((confidenceAtoB * 100).toFixed(2)),
        confidence_b_to_a_percent: parseFloat((confidenceBtoA * 100).toFixed(2))
      });
    }

    // Step 6: Sort by highest confidence first
    results.sort((a, b) =>
      Math.max(b.confidence_a_to_b_percent, b.confidence_b_to_a_percent) -
      Math.max(a.confidence_a_to_b_percent, a.confidence_b_to_a_percent)
    );

    // Step 7: Attach product names for readability
    const productIds = [...new Set(results.flatMap(r => [r.product_a_id, r.product_b_id]))];
    const products = await Product.findAll({ where: { id: productIds }, attributes: ['id', 'product_name'] });
    const productMap = {};
    products.forEach(p => productMap[p.id] = p.product_name);

    const finalResults = results.map(r => ({
      ...r,
      product_a_name: productMap[r.product_a_id] || 'Unknown',
      product_b_name: productMap[r.product_b_id] || 'Unknown',
      insight: `When "${productMap[r.product_a_id]}" is bought, "${productMap[r.product_b_id]}" is also bought ${r.confidence_a_to_b_percent}% of the time`
    }));

    res.status(200).json({
      total_invoices_analyzed: totalInvoices,
      pairs_found: finalResults.length,
      min_support_used: MIN_SUPPORT,
      min_confidence_used: MIN_CONFIDENCE,
      pairs: finalResults
    });

  } catch (error) {
    res.status(500).json({ message: 'Market basket analysis failed', error: error.message });
  }
};