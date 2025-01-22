import { Hono } from "hono";
import fs from "node:fs/promises";
import path from "node:path";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { streamText } from "hono/streaming";
import { bodySchema } from "./schema";
import { parseArgsString } from "./utils";
import config from "./tsreplace-hook.jsonc";

const app = new Hono();

app.post("/", zValidator("json", bodySchema), async (c) => {
	const body = c.req.valid("json");

	if (!body) {
		console.log("Request doesn't contain body.");
		throw new HTTPException(400, { message: "Please include record info to request body." });
	} else if (body.FileName === "--") {
		console.log("Request is not PostRecEnd webhook. Skipping.");
		return c.status(200);
	}

	const macro = {
		...body,
		Codec: config.tsreplace.encoderCodec,
	};

	const filePath = path.join(config.edcbRecordFileDir, `${body.FileName}.ts`);

	if (await fs.exists(filePath)) {
		const newFilename = Object.entries(macro).reduce((filename, [key, value]) => filename.replace(`%${key}%`, value), config.replacedFileName);

		return streamText(c, async (stream) => {
			const proc = Bun.spawn([
				config.tsreplace.path,
				"-i",
				filePath,
				"-o",
				path.join(config.replacedFileDir, newFilename),
				...parseArgsString(config.tsreplace.params),
				"-e",
				config.tsreplace.encoder,
				"-i",
				"-",
				"-c",
				config.tsreplace.encoderCodec,
				...parseArgsString(config.tsreplace.encoderParams),
				"-o",
				"-",
			]);
			await stream.pipe(proc.stdout);
			await proc.exited;

			if (proc.exitCode !== 0) {
				console.log(`Failed with code ${proc.exitCode}`);
				console.log(proc.stdout.toString());
				console.log(proc.stderr);
			} else if (config.removeAfterReplace) {
				await fs.unlink(filePath);
			}
		});
	} else {
		console.log(`Recorded TS file "${filePath}" not found.`);
		throw new HTTPException(404, { message: `Recorded TS file "${filePath}" not found.` });
	}
});

export default {
	port: config.port,
	fetch: app.fetch,
};
