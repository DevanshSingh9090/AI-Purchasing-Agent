const express = require("express");

const router = express.Router();

const {
  runPurchaseRecommendationFlow,
  runSupplierShortfallFlow,
} = require("../agent/orchestrator");

// POST /api/agent/purchase-recommendation
router.post("/purchase-recommendation", async (req, res) => {
  try {
    const { productId, recommendedQty } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: "productId is required",
      });
    }

    if (!recommendedQty || recommendedQty <= 0) {
      return res.status(400).json({
        error: "recommendedQty must be greater than 0",
      });
    }

    console.log(
      `Starting Scenario 1 for product ${productId}, quantity ${recommendedQty}`
    );

    const result = await runPurchaseRecommendationFlow(
      productId,
      Number(recommendedQty)
    );

    res.json(result);
  } catch (error) {
    console.error("Scenario 1 error:", error);

    res.status(500).json({
      error: error.message || "Failed to run purchase recommendation",
    });
  }
});

// POST /api/agent/supplier-shortfall
router.post("/supplier-shortfall", async (req, res) => {
  try {
    const { poId, fulfilledQty } = req.body;

    if (!poId) {
      return res.status(400).json({
        error: "poId is required",
      });
    }

    if (fulfilledQty == null || fulfilledQty < 0) {
      return res.status(400).json({
        error: "fulfilledQty must be 0 or greater",
      });
    }

    console.log(
      `Starting Scenario 2 for PO ${poId}, fulfilled quantity ${fulfilledQty}`
    );

    const result = await runSupplierShortfallFlow(
      poId,
      Number(fulfilledQty)
    );

    res.json(result);
  } catch (error) {
    console.error("Scenario 2 error:", error);

    res.status(500).json({
      error: error.message || "Failed to run supplier shortfall",
    });
  }
});

module.exports = router;