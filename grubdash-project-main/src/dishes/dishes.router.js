const router = require("express").Router();

// TODO: Implement the /dishes routes needed to make the tests pass
const { list, create, read, update } = require("./dishes.controller") 
const methodNotAllowed = require("../errors/methodNotAllowed")

router.route("/").get(list).post(create).all(methodNotAllowed)
router.route("/:dishId").get(read).put(update).all(methodNotAllowed)

module.exports = router;
