const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
    res.json({ data: dishes });
}

function bodyHasNameProperty(req, res, next) {
    const { data: {name} ={} } = req.body;
    if (name){
        res.locals.name = name;
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a name",
    });  
}
function bodyHasDescriptionProperty(req, res, next) {
    const { data: {description} ={} } = req.body;
    if (description){
        res.locals.description = description;
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a description",
    });  
}
function bodyHasPriceProperty(req, res, next) {
    const { data: {price} ={} } = req.body;
    if (price){
        res.locals.price = price;
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a price",
    });  
}
function bodyHasImageUrlProperty(req, res, next) {
    const { data: {image_url} ={} } = req.body;
    if (image_url){
        res.locals.image_url = image_url;
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a image_url",
    });  
}

function priceIsNumber(req, res, next) {
    if (Number.isFinite(res.locals.price)){
        return next();
    }
    next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0",
    })
}

function priceIsPos(req, res, next) {
    if (res.locals.price > 0 ){
        return next();
    }
    next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0",
    })
}

function create(req, res, next) {
    const {name, description, price, image_url}  = res.locals;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(({id}) => id === dishId); 
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`,
    });
}

function dishIdMatches(req, res, next) {
    const {dishId} = req.params;
    const { data: {id} = {} } = req.body;
    if (dishId === id || id === '' || !id) {
        return next();
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
}

function read(req, res, next){
    res.json({ data: res.locals.dish });
}

function update(req, res, next){
    dish = res.locals.dish;
    dish.name = res.locals.name;
    dish.description = res.locals.description;
    dish.price = res.locals.price;
    dish.image_url = res.locals.image_url;
    res.json({ data: dish });
}


module.exports = {
    list,
    create: [bodyHasNameProperty, bodyHasDescriptionProperty, bodyHasPriceProperty, bodyHasImageUrlProperty, priceIsNumber, priceIsPos, create ],
    read: [dishExists, read],
    update: [dishExists, dishIdMatches, bodyHasNameProperty, bodyHasDescriptionProperty, bodyHasPriceProperty, bodyHasImageUrlProperty, priceIsNumber, priceIsPos, update]
}