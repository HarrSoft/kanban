// Minimal type declarations for quill-rich-text-editor (JS library, no TS types)
declare module "quill" {
	import type QuillClass from "quill";
	export default QuillClass;
}

declare class Quill {
	constructor(container: HTMLElement, options?: Record<string, unknown>);
	root: { innerHTML: string };
	getText(): string;
	setContents(delta: unknown): void;
	getContents(): unknown;
	on(event: string, handler: (...args: unknown[]) => void): void;
	disable(): void;
	enable(): void;
}
