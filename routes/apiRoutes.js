const request = require("request");
const mongoose = require('mongoose');
const cheerio = require("cheerio");
const db = require("../models");

module.exports = function (app) {

    app.get('/articles', function (req, res) {
        request("https://www.nytimes.com/topic/subject/gardens-and-gardening", function(error, response, html) {

            const $ = cheerio.load(html);

            const results = [];
            
            $("a.story-link").each(function(i, element) {

                const link = $(element).attr("href");
                const title = $($(element).find("h2.headline")[0]).text().trim();
                const summary = $($(element).find("p.summary")[0]).text().trim();
                results.push({
                link: link,
                title: title,
                summary: summary
                });
            });

            db.Article.create(results)
                .then(function(dbArticle) {
                })
                .catch(function(err) {
                return res.json(err);
                });
                
            db.Article.find({}).then(function(dbData){
                console.log("DB DATA --------------------, ", dbData)
                res.json(dbData);
            });
        });

    });

    app.put("/save-article/:articleId", function(req, res) {
        db.Article.findByIdAndUpdate(req.params.articleId, {    $set: { saved: true }
        }).then(function(data) {
            res.json(data);
        });
    });

    app.get("/display-saved/", function(req, res) {
        db.Article.find( 
            { saved: true }
        ).then(function(data) {
            res.json(data);
        });
    });

    app.put("/delete-from-saved/:articleId", function(req, res) {
        db.Article.findByIdAndUpdate(req.params.articleId, {    $set: { saved: false }
        }).then(function(data) {
            res.json(data);
        });
    });

    app.post("/create-note/:articleId", function(req, res) {
        console.log(req.body);
        console.log("apiRoutes line 66 ");
        db.Note.create(req.body)
            .then(function(dbNote) {
                console.log(dbNote._id)
                // return db.Article.findOneAndUpdate({ _id: req.params.articleId }, { note: dbNote._id }, { new: true });
                return db.Article.findOneAndUpdate({_id: req.params.articleId}, { $push: { note: dbNote._id } },{ new: true });
            }).then(function(dbArticle) {
                // If we were able to successfully update an Article, send it back to the client
                res.json(dbArticle);
            }).catch(function(err) {
                // If an error occurred, send it to the client
                res.json(err);
        });
    });

    app.get("/show-article-notes/:articleId", function(req, res) {
        db.Article.findById(req.params.articleId)
          // ..and populate all of the notes associated with it
          .populate("note")
          .then(function(dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      
      });

};

