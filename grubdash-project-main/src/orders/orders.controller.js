const path = require("path");

// Using the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Using this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// Validation Functions for POST and PUT requests:
function validateDeliverToProperty(req, res, next) {
  const { data = {} } = req.body;

  if (!data.deliverTo) {
    next({
      status: 400,
      message: "Order must include a deliverTo property.",
    });
  }
  // Passing the request body data to the next middleware/handler functions using "response.locals"
  res.locals.reqBody = data;
  return next();
}

function validateMobileNumProperty(req, res, next) {
  const reqBody = res.locals.reqBody;

  if (!reqBody.mobileNumber) {
    next({
      status: 400,
      message: "Order must include a mobileNumber property.",
    });
  }

  return next();
}

function validateDishesProperty(req, res, next) {
  const reqBody = res.locals.reqBody;

  if (
    !reqBody.dishes ||
    !reqBody.dishes.length ||
    !Array.isArray(reqBody.dishes)
  ) {
    next({
      status: 400,
      message: "Order must include at least one dish.",
    });
  }

  return next();
}

function validateDishQuantityProperty(req, res, next) {
  const dishes = res.locals.reqBody.dishes;

  const indexesOfDishesWithoutQuantityProperty = dishes.reduce(
    (acc, dish, index) => {
      if (
        !dish.quantity ||
        !dish.quantity > 0 ||
        typeof dish.quantity !== "number"
      ) {
        acc.push(index);
        return acc;
      }
      return acc;
    },
    []
  );

  if (!indexesOfDishesWithoutQuantityProperty.length) {
    return next();
  }

  // If there are dishes without the right quantity property, the following code will run:
  if (indexesOfDishesWithoutQuantityProperty.length > 1) {
    const stringOfDishIndex = indexesOfDishesWithoutQuantityProperty.join(", ");

    next({
      status: 400,
      message: `Dishes ${stringOfDishIndex} must have a quantity that is an integer greater than 0.`,
    });
  }

  next({
    status: 400,
    message: `Dish ${indexesOfDishesWithoutQuantityProperty} must have a quantity that is an integer greater than 0.`,
  });
}

// Validation Function for Read, Update, and Delete functions:
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    // Passing the req route parameter, :orderId, to the next middleware/handler functions using "response.locals"
    res.locals.orderId = orderId;
    return next();
  }

  next({
    status: 404,
    message: `No matching order is found for orderId ${orderId}.`,
  });
}

// Validation Functions for PUT request/Update function:
function bodyIdMatchesRouteId(req, res, next) {
  const orderId = res.locals.orderId;
  const reqBody = res.locals.reqBody;

  //  but if it is present it must match :orderId from the route
  if (reqBody.id) {
    if (reqBody.id === orderId) {
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${reqBody.id}, Route: ${orderId}`,
    });
  }

  return next();
}

function validateStatusProperty(req, res, next) {
  const reqBody = res.locals.reqBody;

  if (!reqBody.status || reqBody.status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, or delivered.",
    });
  }

  if (reqBody.status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed.",
    });
  }

  return next();
}

// Validation Function for Delete request:
function orderStatusIsPending(req, res, next) {
  const order = res.locals.order;

  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }

  return next();
}

// Route Handlers:
function destroy(req, res) {
  const orderId = res.locals.orderId;
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  orders.splice(orderIndex, 1);
  res.sendStatus(204);
}

function update(req, res) {
  const reqBody = res.locals.reqBody;
  const order = res.locals.order;

  // Creating array of property names
  const existingOrderProperties = Object.getOwnPropertyNames(order);

  for (let i = 0; i < existingOrderProperties.length; i++) {
    // Accessing each order object key within the array
    let propName = existingOrderProperties[i];
    // Updating each value if there is a difference between the existing order and the req body order
    if (propName !== "id" && order[propName] !== reqBody[propName]) {
      order[propName] = reqBody[propName];
    }
  }
  res.json({ data: order });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res) {
  const reqBody = res.locals.reqBody;
  const newOrder = {
    ...reqBody,
    id: nextId(),
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function list(req, res) {
  res.json({ data: orders });
}
const propertyValidations = [
  validateDeliverToProperty,
  validateMobileNumProperty,
  validateDishesProperty,
  validateDishQuantityProperty,
];

module.exports = {
  create: [ ...propertyValidations, create],
  read: [orderExists, read],
  update: [
    orderExists,
    ...propertyValidations,
    bodyIdMatchesRouteId,
    validateStatusProperty,
    update,
  ],
  destroy: [orderExists, orderStatusIsPending, destroy],
  list,
};
