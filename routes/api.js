"use strict";

var expect      = require("chai").expect;
var MongoClient = require("mongodb").MongoClient;
var ObjectId    = require("mongodb").ObjectId;
var mongoose    = require("mongoose");
var shortid     = require("shortid");

mongoose.set("useFindAndModify", false);

module.exports = function(app) {
  mongoose.connect(
    process.env.DATABASE,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
    (err, client) => {
      if (err) {
        console.log("Database error: " + err);
      } else {
        console.log("Successful database connection");
      }
    }
  );

  // Set up schema
  const Schema = mongoose.Schema;
  const booksSchema = new Schema({
    title: { type: String, required: true },
    comments: [{ type: String }],
    _id: { type: String, default: shortid.generate }
  });
  var Model = mongoose.model("Books", booksSchema);

  app
    .route("/api/books")
  
    .get(function(req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      var getBooks = function() {
        Model.find({}, function(err, data) {
          if (err) console.log(err);
          var array = [];
          data.forEach(function(elm) {
            array.push({_id: elm._id, title: elm.title, commentcount: elm.comments.length});
          });
          res.json(array);
        });
      };
      getBooks();
    })

    .post(function(req, res) {
      //response will contain new book object including atleast _id and title
      var createBook = function(title) {
        var newBook = new Model({
          title: title
        });
        newBook.save(function(err, data) {
          if (err) console.log(err);
          res.json({
            title: data.title,
            _id: data._id
          });
        });
      };
      createBook(req.body.title);
    })

    .delete(function(req, res) {
      //if successful response will be 'complete delete successful'
      var deleteAll = function() {
        Model.deleteMany({}, function(err, data) {
          if (err) {
            console.log(err);
            return res.send("delete all error");
          } else {
            return res.send("complete delete successful");
          }
        });
      };
      deleteAll();
    });

  app
    .route("/api/books/:id")
  
    .get(function(req, res) {
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      var getBook = function(id) {
        Model.findById(id, function(err, data) {
          if (err) console.log(err);
          res.json({
            _id: data._id,
            title: data.title,
            comments: data.comments
          });
        });
      };
      getBook(req.params.id);
    })

    .post(function(req, res) {
      //json res format same as .get
      var addComment = function(id, comment) {
        Model.findByIdAndUpdate(
          id,
          { $push: { comments: comment } },
          { new: true },
          function(err, data) {
          if (err) return console.log(err);
            res.json({
              _id: data._id,
              title: data.title,
              comments: data.comments
            });
          }
        );
      };
      addComment(req.params.id, req.body.comment);
    })

    .delete(function(req, res) {
      //if successful response will be 'delete successful'
      var deleteBook = function(id) {
        Model.findByIdAndRemove(id, function(err, data) {
          if (err) {
            console.log(err);
            return res.send("delete book error");
          } else {
            return res.send("delete successful");
          }
        });
      };
      deleteBook(req.params.id);
    });
};
