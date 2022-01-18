const db = require("../../db/connection.js");

exports.selectArticles = (sort_by = "created_at", order = "desc", topic) => {
  if (!["created_at", "author", "title", "topic", "votes"].includes(sort_by)) {
    return Promise.reject({ status: 400, msg: "Invalid sort query" });
  }

  if (!["asc", "desc"].includes(order)) {
    return Promise.reject({ status: 400, msg: "Invalid order query" });
  }

  let articlesQuery = `
        SELECT 
            articles.author, articles.title, articles.article_id, 
            articles.topic, articles.created_at, articles.votes,
            COUNT(comments.*)::INTEGER AS comment_count
        FROM articles
        LEFT JOIN 
            comments ON comments.article_id = articles.article_id      
      `;

  if (topic) {
    if (!/^[A-Z]+$/i.test(topic)) {
      return Promise.reject({ status: 400, msg: "Invalid topic query" });
    }
    articlesQuery += ` WHERE articles.topic = '${topic}'`;
  }

  articlesQuery += ` GROUP BY articles.article_id ORDER BY ${sort_by} ${order};`;

  return db.query(articlesQuery).then((result) => result.rows);
};

// JOIN comments ON articles.article_id = comments.article_id;

exports.selectArticleById = (article_id) => {
  return db
    .query(
      `
            SELECT 
                *,
                (
                    SELECT COUNT(*)
                    FROM comments
                    WHERE article_id = $1
                )::INTEGER AS comment_count  
            FROM articles 
            WHERE article_id = $1;
        `,
      [article_id]
    )
    .then((result) => result.rows[0]);
};

exports.updateVotesById = (article_id, inc_votes) => {
  const votes = parseInt(inc_votes);
  if (!votes) {
    return Promise.reject({ status: 400, msg: "Invalid vote value" });
  }
  return db
    .query(
      `
          UPDATE articles 
          SET votes = votes + $1
          WHERE article_id = $2
          RETURNING *;
      `,
      [votes, article_id]
    )
    .then((result) => result.rows[0]);
};

exports.selectArticleComments = (article_id) => {
  return db
    .query(
      `
          SELECT 
              author AS username, body 
          FROM comments 
          WHERE article_id = $1;
      `,
      [article_id]
    )
    .then((result) => result.rows);
};

exports.insertArticleComment = (article_id, username, body) => {
  return db
    .query(
      `INSERT INTO comments 
        (author, article_id, body) 
      VALUES 
        ($1, $2, $3) 
      RETURNING *;`,
      [username, article_id, body]
    )
    .then(({ rows }) => rows[0]);
};
