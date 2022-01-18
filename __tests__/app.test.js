const request = require("supertest");
const app = require("../app/app.js");
const db = require("../db/connection.js");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe("0. GET /notARoute", () => {
  it("responds with status: 404 for invalid route", () => {
    return request(app)
      .get("/notARoute")
      .expect(404)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            msg: "Invalid URL",
          })
        );
      });
  });
});

describe("1. GET /api/topics", () => {
  test("status:200, responds with an array of topics objects", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body }) => {
        const { topics } = body;
        topics.forEach((topic) => {
          expect(topic).toEqual(
            expect.objectContaining({
              description: expect.any(String),
              slug: expect.any(String),
            })
          );
        });
      });
  });
});

describe("2. GET /api/articles/:article_id", () => {
  test("status:200, responds with a single matching article", () => {
    const article_id = 1;
    return request(app)
      .get(`/api/articles/${article_id}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.article).toEqual({
          author: expect.any(String),
          title: expect.any(String),
          article_id: article_id,
          body: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          comment_count: expect.any(Number),
        });
      });
  });
});

describe("3. PATCH /api/articles", () => {
  test("status:200, responds with article with increased vote count", () => {
    const article = {
      inc_votes: 1,
    };
    return request(app)
      .patch("/api/articles/1")
      .send(article)
      .expect(200)
      .then(({ body }) => {
        expect(body.article.votes).toEqual(101);
      });
  });
  test("status:200, responds with article with decreased vote count", () => {
    const article = {
      inc_votes: -50,
    };
    return request(app)
      .patch("/api/articles/1")
      .send(article)
      .expect(200)
      .then(({ body }) => {
        expect(body.article.votes).toEqual(50);
      });
  });
  test("status:400, responds with error for invalid vote", () => {
    const article = {
      inc_votes: "not_number",
    };
    return request(app)
      .patch("/api/articles/1")
      .send(article)
      .expect(400)
      .then(({ body }) => {
        console.log(body);
        expect(body.msg).toEqual("Invalid vote value");
      });
  });
});

describe("4. GET /api/articles", () => {
  it("responds with status: 200 and a json object containing all articles with comment count", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8")
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            articles: expect.any(Array),
          })
        );
        expect(res.body.articles[0]).toEqual({
          author: expect.any(String),
          title: expect.any(String),
          article_id: expect.any(Number),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          comment_count: expect.any(Number),
        });
      });
  });

  it("responds with status: 400 for invalid sort query", () => {
    return request(app)
      .get("/api/articles?sort_by=INVALID")
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            msg: "Invalid sort query",
          })
        );
      });
  });

  it("responds with status: 400 for invalid sort order", () => {
    return request(app)
      .get("/api/articles?order=INVALID")
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            msg: "Invalid order query",
          })
        );
      });
  });

  it("responds with status: 400 for invalid topics query", () => {
    return request(app)
      .get("/api/articles?topic=INVALID;")
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            msg: "Invalid topic query",
          })
        );
      });
  });

  it("responds with status: 200 and a json object containing articles sorted by votes", () => {
    return request(app)
      .get("/api/articles?sort_by=votes")
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8")
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            articles: expect.any(Array),
          })
        );
      });
  });

  it("responds with status: 200 and a json object containing articles sorted descending", () => {
    return request(app)
      .get("/api/articles?order=desc")
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8")
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            articles: expect.any(Array),
          })
        );
      });
  });

  it('responds with status: 200 and a object containing "cats" topic', () => {
    return request(app)
      .get("/api/articles?topic=cats")
      .expect(200)
      .expect("Content-Type", "application/json; charset=utf-8")
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            articles: expect.any(Array),
          })
        );
        expect(
          res.body.articles.every((article) => article.topic === "cats")
        ).toBe(true);
      });
  });
});
