import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

const app = express();
const port = 5000;

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors()); // include before other routes
app.listen(port, "0.0.0.0");

const wordleCheck = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const expected = "masse";

  let guess = "";

  console.log(request.body, request.params);
  if (request.body && request.body.guess) {
    console.log("body");
    guess = request.body.guess;
  } else if (request.query && request.query.guess) {
    console.log("params");
    guess = request.query.guess.toString();
  }
  console.log(guess);

  if (!guess) {
    response.status(400).json({
      detail: 'must pass field named "guess" containing guessed word',
    });
    return;
  }
  if (guess.length !== 5) {
    response.status(400).json({
      detail: "guess must be 5 letters",
    });
  }

  const out = guess.split("").map((l, i) => {
    if (l == expected[i]) {
      return "+";
    } else if (expected.includes(l)) {
      return "-";
    } else {
      return " ";
    }
  });

  response.status(200).json(out.join(""));
};

// app.get("/wordle/check", wordleCheck);
app.all("/wordle/check", wordleCheck);
