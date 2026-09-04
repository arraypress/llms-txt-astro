export interface LlmsTxtLink { label: string; url: string; description?: string; }
export interface LlmsTxtItem { name: string; fields?: Record<string, string>; description?: string; }
export interface LlmsTxtSection { title: string; description?: string; items?: LlmsTxtItem[]; links?: LlmsTxtLink[]; }
export interface LlmsTxtApi { method?: string; url: string; description?: string; }
export interface BuildOptions { name?: string; description?: string; sections?: LlmsTxtSection[]; apis?: LlmsTxtApi[]; meta?: Record<string, string>; }
/** Build an llms.txt string from structured data. */
export function build(options?: BuildOptions): string;
/** Create a Response object with text/plain content-type. */
export function llmsTxtResponse(content: string): Response;
export interface ParsedLlmsTxt { name: string; description: string; sections: Array<{ title: string; items: Array<{ name: string; fields: Record<string, string> }>; }>; }
/** Parse an existing llms.txt string into structured data. */
export function parse(text: string): ParsedLlmsTxt;
export interface LlmsFullDocument { title?: string; url?: string; description?: string; content?: string; }
export interface BuildFullOptions { name?: string; description?: string; meta?: Record<string, string>; documents?: LlmsFullDocument[]; }
/** Build an llms-full.txt string — the full-text companion to llms.txt. */
export function buildFull(options?: BuildFullOptions): string;
