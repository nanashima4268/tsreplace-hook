// https://stackoverflow.com/a/39304272
export const parseArgsString = (argsStr: string) => {
	const nextArgRegex = /^\s*((?:(?:"(?:\\.|[^"])*")|(?:'[^']*')|\\.|\S)+)\s*(.*)$/;
	let nextArg: string[] | RegExpExecArray | null = ["", "", argsStr];
	let args = [];
	while ((nextArg = nextArgRegex.exec(nextArg[2]))) {
		let quotedArg = nextArg[1];
		let unquotedArg = "";
		while (quotedArg.length > 0) {
			if (/^"/.test(quotedArg)) {
				let quotedPart = /^"((?:\\.|[^"])*)"(.*)$/.exec(quotedArg);
				unquotedArg += quotedPart?.[1].replace(/\\(.)/g, "$1");
				quotedArg = quotedPart?.[2] ?? "";
			} else if (/^'/.test(quotedArg)) {
				let quotedPart = /^'([^']*)'(.*)$/.exec(quotedArg);
				unquotedArg += quotedPart?.[1];
				quotedArg = quotedPart?.[2] ?? "";
			} else if (/^\\/.test(quotedArg)) {
				unquotedArg += quotedArg[1];
				quotedArg = quotedArg.substring(2);
			} else {
				unquotedArg += quotedArg[0];
				quotedArg = quotedArg.substring(1);
			}
		}
		args[args.length] = unquotedArg;
	}
	return args;
};
