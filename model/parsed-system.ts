import type { ParsedConcept } from "./parsed-concept";

export interface ParsedSystem {
    uri: string;
    codes: ParsedConcept[];
}