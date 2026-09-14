// const express = require("express");

// const router = express.Router();

// const {
//   runPurchaseRecommendationFlow,
//   runSupplierShortfallFlow,
// } = require("../agent/orchestrator");

// // POST /api/agent/purchase-recommendation
// router.post("/purchase-recommendation", async (req, res) => {
//   try {
//     const { productId, recommendedQty } = req.body;

//     if (!productId) {
//       return res.status(400).json({
//         error: "productId is required",
//       });
//     }

//     if (!recommendedQty || recommendedQty <= 0) {
//       return res.status(400).json({
//         error: "recommendedQty must be greater than 0",
//       });
//     }

//     console.log(
//       `Starting Scenario 1 for product ${productId}, quantity ${recommendedQty}`
//     );

//     const result = await runPurchaseRecommendationFlow(
//       productId,
//       Number(recommendedQty)
//     );

//     res.json(result);
//   } catch (error) {
//     console.error("Scenario 1 error:", error);

//     res.status(500).json({
//       error: error.message || "Failed to run purchase recommendation",
//     });
//   }
// });

// // POST /api/agent/supplier-shortfall
// router.post("/supplier-shortfall", async (req, res) => {
//   try {
//     const { poId, fulfilledQty } = req.body;

//     if (!poId) {
//       return res.status(400).json({
//         error: "poId is required",
//       });
//     }

//     if (fulfilledQty == null || fulfilledQty < 0) {
//       return res.status(400).json({
//         error: "fulfilledQty must be 0 or greater",
//       });
//     }

//     console.log(
//       `Starting Scenario 2 for PO ${poId}, fulfilled quantity ${fulfilledQty}`
//     );

//     const result = await runSupplierShortfallFlow(
//       poId,
//       Number(fulfilledQty)
//     );

//     res.json(result);
//   } catch (error) {
//     console.error("Scenario 2 error:", error);

//     res.status(500).json({
//       error: error.message || "Failed to run supplier shortfall",
//     });
//   }
// });

// module.exports = router;





//====================================================================================================
// ======================== for human approval whole file needs to be changed ========================
//====================================================================================================

const express = require("express");
const axios = require("axios");

const router = express.Router();

const {
  runPurchaseRecommendationFlow,
  runSupplierShortfallFlow,
} = require("../agent/orchestrator");

const {
  validate,
  validateShortfall,
} = require("../agent/validate");

const DecisionLog = require("../models/DecisionLog");
const Supplier = require("../models/Supplier");

const BASE_URL =
  process.env.BASE_URL || "http://localhost:4000";

/*
|--------------------------------------------------------------------------
| Scenario 1
|--------------------------------------------------------------------------
| POST /api/agent/purchase-recommendation
*/
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
      error:
        error.message ||
        "Failed to run purchase recommendation",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Scenario 2
|--------------------------------------------------------------------------
| POST /api/agent/supplier-shortfall
*/
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
      error:
        error.message ||
        "Failed to run supplier shortfall",
    });
  }
});

/*
|--------------------------------------------------------------------------
| HUMAN APPROVAL
|--------------------------------------------------------------------------
| POST /api/agent/approve/:logId
|
| Finds the pending decision, executes its proposed action,
| validates the result, and updates the DecisionLog.
*/
router.post("/approve/:logId", async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await DecisionLog.findById(logId);

    if (!log) {
      return res.status(404).json({
        error: "Decision log not found",
      });
    }

    if (log.finalStatus !== "awaiting_approval") {
      return res.status(400).json({
        error: `This decision is not awaiting approval. Current status: ${log.finalStatus}`,
      });
    }

    if (log.approvalStatus !== "pending") {
      return res.status(400).json({
        error: `This decision has already been ${log.approvalStatus}.`,
      });
    }

    const proposedAction = log.actionTaken;

    /*
     * Some decisions, such as an approved rejection,
     * don't create a PO.
     */
    if (!proposedAction) {
      log.approvalStatus = "approved";
      log.approvedAt = new Date();
      log.finalStatus = "completed";
      log.validationResult = {
        valid: true,
        reason:
          "Human approved the agent decision. No purchase order was required.",
        requiresRetry: false,
      };

      await log.save();

      return res.json({
        success: true,
        message: "Decision approved. No purchase order was created.",
        finalStatus: log.finalStatus,
        approvalStatus: log.approvalStatus,
        logId: log._id,
      });
    }

    if (proposedAction.type !== "create_po") {
      return res.status(400).json({
        error: "Unsupported proposed action.",
      });
    }

    const {
      productId,
      supplierId,
      quantity,
    } = proposedAction;

    if (!productId || !supplierId || !quantity) {
      return res.status(400).json({
        error:
          "Proposed action is missing productId, supplierId, or quantity.",
      });
    }

    /*
     * Resolve supplier so we can calculate delivery date.
     */
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(400).json({
        error: "Supplier associated with the proposed action was not found.",
      });
    }

    /*
     * Execute the approved PO.
     */
    const poRes = await axios.post(`${BASE_URL}/api/pos`, {
      productId,
      supplierId,
      quantityOrdered: quantity,
      quantityConfirmed: quantity,
      status: "open",
      expectedDelivery: new Date(
        Date.now() +
          supplier.leadTimeDays *
            24 *
            60 *
            60 *
            1000
      ),
    });

    const executedAction = {
      type: "create_po",
      po: poRes.data,
    };

    /*
     * Run the correct validation loop.
     */
    let validationResult;

    if (log.scenario === "scenario1_purchase_review") {
      validationResult = await validate(
        {
          actionTaken: executedAction,
          status: "executed",
          needsApproval: false,
        },
        log.evidenceGathered
      );
    } else if (
      log.scenario === "scenario2_supplier_shortfall"
    ) {
      validationResult = await validateShortfall(
        {
          actionTaken: executedAction,
          status: "executed",
          needsApproval: false,
        },
        log.evidenceGathered
      );
    } else {
      return res.status(400).json({
        error: `Unsupported scenario: ${log.scenario}`,
      });
    }

    /*
     * Update decision log.
     */
    log.approvalStatus = "approved";
    log.approvedAt = new Date();
    log.actionTaken = executedAction;
    log.validationResult = validationResult;

    log.finalStatus = validationResult.valid
      ? "completed"
      : "failed";

    await log.save();

    return res.json({
      success: true,
      message: "Purchase action approved and executed.",
      actionTaken: executedAction,
      validationResult,
      approvalStatus: log.approvalStatus,
      finalStatus: log.finalStatus,
      logId: log._id,
    });
  } catch (error) {
    console.error("Approval error:", error);

    res.status(500).json({
      error:
        error.message ||
        "Failed to approve and execute action.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| HUMAN REJECTION
|--------------------------------------------------------------------------
| POST /api/agent/reject/:logId
*/
router.post("/reject/:logId", async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await DecisionLog.findById(logId);

    if (!log) {
      return res.status(404).json({
        error: "Decision log not found",
      });
    }

    if (log.finalStatus !== "awaiting_approval") {
      return res.status(400).json({
        error: `This decision is not awaiting approval. Current status: ${log.finalStatus}`,
      });
    }

    if (log.approvalStatus !== "pending") {
      return res.status(400).json({
        error: `This decision has already been ${log.approvalStatus}.`,
      });
    }

    /*
     * IMPORTANT:
     * We do NOT create a PO here.
     */
    log.approvalStatus = "rejected";
    log.rejectedAt = new Date();
    log.finalStatus = "rejected";

    log.validationResult = {
      valid: true,
      reason:
        "Human rejected the proposed purchasing action. No purchase order was created.",
      requiresRetry: false,
      rejectedByHuman: true,
    };

    await log.save();

    return res.json({
      success: true,
      message:
        "Purchase action rejected. No purchase order was created.",
      approvalStatus: log.approvalStatus,
      finalStatus: log.finalStatus,
      logId: log._id,
    });
  } catch (error) {
    console.error("Rejection error:", error);

    res.status(500).json({
      error:
        error.message ||
        "Failed to reject action.",
    });
  }
});

module.exports = router;