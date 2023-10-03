const router = require("express").Router();

// TODO: Implement the /orders routes needed to make the tests pass
const { list, create, read, update, destroy } = require("./orders.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

router.route("/").get(list).post(create).all(methodNotAllowed);
router
  .route("/:orderId")
  .get(read)
  .put(update)
  .delete(destroy)
  .all(methodNotAllowed);

module.exports = router;
