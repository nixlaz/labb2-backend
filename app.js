const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;

const dotenv = require("dotenv");
var dotenvExpand = require("dotenv-expand");
var env = dotenv.config();
dotenvExpand.expand(env);
const CONNECTION_STRING = process.env.CONNECTION_STRING;
const PORT = process.env.PORT || 3001;

mongoose.connect(CONNECTION_STRING, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const Thread = require("./model/threads");
const Reply = require("./model/replies");
const Like = require("./model/likes");
const User = require("./model/users");
const { response } = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");

const app = express();

app.use("/healthcheck", require("./routes/healthcheck.js"));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

passport.use(
	new BasicStrategy(function (username, password, done) {
		console.log("nu hämtar vi users");
		User.findOne({ username }, function (err, user) {
			console.log("Nu har vi hämtat en user", user);
			if (err) {
				return done(err);
			}
			if (!user || password !== user.password) {
				return done(null, false);
			}
			return done(null, user);
		});
	})
);
app.use(passport.initialize());

app.get("/", (request, response) => {
	response.set("http_status", 200);
	response.set("cache-control", "no-cache");
	response.set("Content-Type", "application/json");
	body = { status: "available" };
	response.status(200).send(body);

	User.create;
});

//Hämtar alla trådar

app.get("/threads", async (request, response) => {
	const threads = Thread.find().then((threads) => {
		response.json(threads);
	});
});

//Hämtar en specifik tråd

app.get("/threads/:id", async (request, response) => {
	let thread;
	try {
		thread = await Thread.findById(request.params.id);
	} catch (e) {
		response.status(400).send("Bad Request");
	}
	if (thread) {
		response.status(200).json(thread);
	} else {
		response.status(404).send("Thread not found!");
	}
});

//Skickar en tråd

app.post(
	"/threads",
	passport.authenticate("basic", { session: false }),
	async (request, response) => {
		let thread = new Thread(request.body);
		thread.save();
		response.status(200).json(thread);
	}
);

// Uppdatera tråd

app.put(
	"/threads/:id",
	passport.authenticate("basic", { session: false }),
	async (request, response) => {
		try {
			const updateThread = await Thread.updateOne(
				{ _id: request.params.id },
				{ $set: { title: request.body.title } }
			);
			response.json(updateThread);
		} catch (err) {
			response.json({ message: err });
		}
	}
);

// Ta bort tråd

app.delete(
	"/threads/:id",
	passport.authenticate("basic", { session: false }),
	async (request, response) => {
		try {
			const removeThread = await Thread.deleteMany({ _id: request.params.id });
			response.json(removeThread);
		} catch (err) {
			response.json({ message: err });
		}
	}
);

// Hämtar ett specifikt svar

app.get("/threads/:id/replies/:id", async (request, response) => {
	let reply;
	try {
		reply = await Reply.findById(request.params.id);
	} catch (e) {
		response.status(400).send("Bad Request");
	}
	if (reply) {
		response.status(200).json(reply);
	} else {
		response.status(404).send("Reply not found!");
	}
});

// Skickar ett svar

app.post(
	"/threads/:id/replies",
	passport.authenticate("basic", { session: false }),
	async (request, response) => {
		let thread;
		try {
			thread = await Thread.findById(request.params.id);
		} catch (e) {
			response.status(400).send("Bad Request");
		}
		if (thread) {
			request.body.time = new Date();
			const reply = new Reply(request.body);
			thread.replies.push(reply);
			await reply.save();
			await thread.save();
			response.status(201).end();
		} else {
			response.status(404).send("Not found");
		}
	}
);
// Lägg till like till svar

app.post(
	"/threads/:threadId/replies/:replyId/like",
	passport.authenticate("basic", { session: false }),
	async (request, response) => {
		let replies;
		try {
			replies = await Reply.findById(request.params.replyId);
			if (replies) {
				const likes = new Like({ like: true });
				await likes.save();
				replies.likes.push(likes);
				await replies.save();
				response.status(200).send(likes);
			} else {
				response.status(404).send("Not found");
			}
		} catch (e) {
			response.status(404).send("Bad request " + e);
		}
	}
);
// Ta bort like från svar

app.delete(
	"/threads/:threadId/replies/:replyId/like/:likeId",
	passport.authenticate("basic", { session: false }),

	async (request, response) => {
		try {
			await Like.deleteOne({ _id: request.params.likeId });
			response.status(200).send("Success like deleted");
		} catch (e) {
			response.status(400).send("Bad request");
		}
		response.status(200).end();
	}
);

app.get("/users", (request, response) => {
	const users = User.find().then((users) => {
		response.json(users);
	});
});

// Hämta alla användare

app.post("/users", (request, response) => {
	console.log(request.body);
	let user = new User(request.body);
	user.save();
	response.status(200).send(request.body);
});

// Hämta en specifik användare

app.get("/users/:id", (request, response) => {
	console.log(request.params.id);
	try {
		User.findById(request.params.id, (err, user) => {
			if (err) throw error;
			if (user) {
				response.status(200).json(user);
			} else {
				response.status(404).send("Not found");
			}
		});
	} catch (e) {
		console.error(e);
		response.status(400).send("Bad request");
	}
});

app.listen(PORT, () => {
	console.log(`STARTED LISTENING ON PORT ${PORT}`);
});
