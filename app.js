const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect("mongodb://127.0.0.1:27017/todoListDB");
const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);
const Eat = new Item({ name: "Eat" });
const Sleep = new Item({ name: "Sleep" });
const Repeat = new Item({ name: "Repeat" });
const itemArr = [Eat, Sleep, Repeat];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  let today = new Date();
  let options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  let day = today.toLocaleString("en-US", options);
  Item.find({}, function (err, foundItems) {
    if (foundItems.length == 0) {
      Item.insertMany(itemArr, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Data inserted successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { day: day, newItems: foundItems });
    }
  });
});
app.get("/:customList", function (req, res) {
  const customListName = _.capitalize(req.params.customList);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: itemArr,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", { day: customListName, newItems: foundList.items });
      }
    }
  });
});
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  let today = new Date();
  let options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  let day = today.toLocaleString("en-US", options);
  const newItem = Item({ name: itemName });
  if (listName === day) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
app.post("/delete", function (req, res) {
  console.log(req.body.checkbox);
  let itemId = req.body.checkbox;
  let listName = req.body.listName;
  let today = new Date();
  let options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  let day = today.toLocaleString("en-US", options);
  if (listName === day) {
    Item.findByIdAndDelete(itemId, function (err) {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name : listName}, {$pull: {items: {_id: itemId}}}, function (err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
