export function isError(e: unknown): e is Error {
	return typeof e === "object" && e !== null && "message" in e;
}

export const makeDelay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));
