const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//list all orders
function list(req, res, next) {
  res.json({ data: orders });
}

//middleware: check if orderId from params currently exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(({ id }) => id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}


//list specific order
function read(req, res) {
  res.json({ data: res.locals.order });
}

//middleware: check if request provides deliverTo property
function bodyHasDeliverToProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo",
  });
}

//middleware: check if request contains mobileNumber property
function bodyHasMobileNumberProperty(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber",
  });
}

//middleware: check if request contains dishes property
function bodyHasDishesProperty(req, res, next) {
  const { data: { dishes } = [] } = req.body;
  if (dishes) {
    res.locals.dishes = dishes;
    return next();
  }
  next({
    status: 400,
    message: "Order must include a dish",
  });
}
//middleware: make sure this is at least on dish in the order
function dishesAreValid(req, res, next) {
  const { dishes } = res.locals;
  if (dishes[0] && Array.isArray(dishes)) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish",
  });
}

//middleware: check that the request has a status property
function bodyHasStatusProperty(req, res, next) {
  const { data: { status } = [] } = req.body;
  if (status) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

//middleware: check that the status is a valid option
function statusIsValid(req, res, next) {
  const { status } = res.locals;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

//middleware: make sure status is not delivered
function statusIsNotDelivered(req, res, next) {
  const { status } = res.locals.order;
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

//middleware: check that each dish in the request contains a quantity
function dishesHaveQuantity(req, res, next) {
  const { dishes } = res.locals;
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (!Number.isInteger(dish.quantity)) {
      next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}
//middleware: check that each dish's quantity is a pos integer
function dishesQuantityIsPos(req, res, next) {
  const { dishes } = res.locals;
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (dish.quantity < 1) {
      next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

//middleware: check that the id in params matches the id in the body
function orderIdMatches(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (orderId === id || id === "" || !id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

// create a new order
function create(req, res, next) {
  const { deliverTo, mobileNumber, dishes } = res.locals;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes: [...dishes],
    status: "pending",
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//update an order
function update(req, res, next) {
  order = res.locals.order;
  order.deliverTo = res.locals.deliverTo;
  order.mobileNumber = res.locals.mobileNumber;
  order.dishes = [...res.locals.dishes];
  order.status = res.locals.status;
  res.json({ data: order });
}

//middleware: check that the order's current status is pending
function orderIsPending(req, res, next) {
  const { status } = res.locals.order;
  if (status === "pending") {
    next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

//delete an order
function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyHasDeliverToProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    dishesAreValid,
    dishesHaveQuantity,
    dishesQuantityIsPos,
    create,
  ],
  update: [
    orderExists,
    orderIdMatches,
    bodyHasDeliverToProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    dishesAreValid,
    bodyHasStatusProperty,
    statusIsValid,
    dishesHaveQuantity,
    dishesQuantityIsPos,
    statusIsNotDelivered,
    update,
  ],
  delete: [orderExists, orderIsPending, destroy],
};
