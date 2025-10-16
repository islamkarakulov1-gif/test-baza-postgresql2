import express from "express";
import { pool } from "./database.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());
app.post("/api/bookings/reserve", (req, res) => {
  const event_id = req.body.event_id;
  const user_id = req.body.user_id;
  pool
    .query("SELECT * FROM events WHERE id=$1", [event_id])
    .then((ev) => {
      if (ev.rows.length == 0) {
        res.json({ error: "event not found" });
      } else {
        pool
          .query("SELECT * FROM bookings WHERE event_id=$1 AND user_id=$2", [
            event_id,
            user_id,
          ])
          .then((exist) => {
            if (exist.rows.length > 0) {
              res.json({ error: "already booked" });
            } else {
              pool
                .query("SELECT COUNT(*) FROM bookings WHERE event_id=$1", [
                  event_id,
                ])
                .then((cnt) => {
                  const booked = parseInt(cnt.rows[0].count);
                  const total = ev.rows[0].total_seats;
                  if (booked >= total) {
                    res.json({ error: "no seats left" });
                  } else {
                    pool
                      .query(
                        "INSERT INTO bookings (event_id,user_id,created_at) VALUES ($1,$2,NOW())",
                        [event_id, user_id]
                      )
                      .then(() => {
                        res.json({ success: true, message: "booked" });
                      })
                      .catch((err) => {
                        console.log(err);
                        res.json({ error: "insert error" });
                      });
                  }
                });
            }
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: "db error" });
    });
});
app.get('/', (req, res) => {
  res.send('Сервер работает!');
});

app.listen(process.env.PORT, () => {
  console.log("Server started on port " + process.env.PORT);
});
