const mongoose = require("mongoose");

const Reply = mongoose.model(
	"reply",
	new mongoose.Schema({
		name: String,
		answerContent: String,
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "like",
			},
		],
	})
);

module.exports = Reply;
